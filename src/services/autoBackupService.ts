import { getSupabase, isSupabaseEnabled } from './cloudSync';

const APP_ID = 'cs';

export interface BackupMetadata {
  id: string;
  timestamp: string;
  version: string;
  dataHash: string;
  recordCount: Record<string, number>;
  size: number;
  createdAt: string;
}

interface BackupSnapshot {
  id: string;
  timestamp: string;
  version: string;
  dataHash: string;
  recordCount: Record<string, number>;
  size: number;
  data: Record<string, any[]>;
}

class AutoBackupService {
  private isBackupInProgress = false;
  private readonly lockKey = `${APP_ID}_backup_lock`;
  private readonly lastCheckKey = `${APP_ID}_last_backup_check`;

  private isProduction(): boolean {
    return !(import.meta as any).env?.DEV;
  }

  private async generateDataHash(data: Record<string, any[]>): Promise<string> {
    const normalized = Object.fromEntries(
      Object.entries(data).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [
        k, [...v].sort((a, b) => (a.id < b.id ? -1 : 1)),
      ])
    );
    const encoder = new TextEncoder();
    const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(normalized)));
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async checkLock(): Promise<boolean> {
    if (!isSupabaseEnabled()) return false;
    try {
      const supabase = getSupabase();
      if (!supabase) return false;
      const { data, error } = await supabase
        .from('backup_locks').select('locked_at').eq('lock_key', this.lockKey).maybeSingle();
      if (error || !data) return false;
      return (Date.now() - new Date(data.locked_at).getTime()) < 5 * 60 * 1000;
    } catch { return false; }
  }

  private async createLock(): Promise<void> {
    try {
      const supabase = getSupabase();
      await supabase?.from('backup_locks').upsert({
        lock_key: this.lockKey, locked_at: new Date().toISOString(), locked_by: `${APP_ID}-auto-backup`
      });
    } catch { /* ignore */ }
  }

  private async releaseLock(): Promise<void> {
    try {
      const supabase = getSupabase();
      await supabase?.from('backup_locks').delete().eq('lock_key', this.lockKey);
    } catch { /* ignore */ }
  }

  private async getLastBackup(): Promise<BackupMetadata | null> {
    if (!isSupabaseEnabled()) return null;
    try {
      const supabase = getSupabase();
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('backup_history')
        .select('id,timestamp,version,data_hash,record_count,size,created_at')
        .eq('app_id', APP_ID)
        .order('created_at', { ascending: false })
        .limit(1).maybeSingle();
      if (error || !data) return null;
      return { id: data.id, timestamp: data.timestamp, version: data.version, dataHash: data.data_hash, recordCount: data.record_count, size: data.size, createdAt: data.created_at };
    } catch { return null; }
  }

  async listBackups(): Promise<BackupMetadata[]> {
    if (!isSupabaseEnabled()) return [];
    try {
      const supabase = getSupabase();
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('backup_history')
        .select('id,timestamp,version,data_hash,record_count,size,created_at')
        .eq('app_id', APP_ID)
        .order('created_at', { ascending: false });
      if (error || !data) return [];
      return data.map((item: any) => ({ id: item.id, timestamp: item.timestamp, version: item.version, dataHash: item.data_hash, recordCount: item.record_count, size: item.size, createdAt: item.created_at }));
    } catch { return []; }
  }

  private async readCurrentData(): Promise<Record<string, any[]> | null> {
    try {
      const supabase = getSupabase();
      if (!supabase) return null;

      const [emRes, mrRes, vpRes, vsRes, apRes] = await Promise.all([
        supabase.from('employees').select('*'),
        supabase.from('monthly_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('vacation_periods').select('*'),
        supabase.from('vacation_summary').select('*'),
        supabase.from('acquisition_periods').select('*'),
      ]);

      if (mrRes.error) {
        console.error('[AutoBackup] Erro ao ler monthly_requests:', mrRes.error);
        return null;
      }

      const usersRes = await supabase
        .from('app_users')
        .select('id,name,email,role,department,status,createdAt,must_change_password');
      const users = usersRes.error ? [] : (usersRes.data ?? []);
      if (usersRes.error) console.info('[AutoBackup] app_users bloqueado por RLS — continuando sem usuários');

      const monthlyRequests = mrRes.data ?? [];
      const lastBackup = await this.getLastBackup();
      if (lastBackup && monthlyRequests.length < (lastBackup.recordCount.monthlyRequests ?? 0) * 0.8) {
        throw new Error(
          `Proteção de dados: Queda de ${Math.round((1 - monthlyRequests.length / (lastBackup.recordCount.monthlyRequests ?? 1)) * 100)}% em monthlyRequests. Backup cancelado.`
        );
      }

      return {
        users,
        employees: emRes.data ?? [],
        monthlyRequests,
        vacationPeriods: vpRes.data ?? [],
        vacationSummary: vsRes.data ?? [],
        acquisitionPeriods: apRes.data ?? [],
      };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Proteção de dados')) throw error;
      console.error('[AutoBackup] Erro ao ler dados:', error);
      return null;
    }
  }

  private async saveBackup(snapshot: BackupSnapshot): Promise<boolean> {
    try {
      const supabase = getSupabase();
      if (!supabase) return false;
      const { error } = await supabase.from('backup_history').insert({
        id: snapshot.id, app_id: APP_ID, timestamp: snapshot.timestamp,
        version: snapshot.version, data_hash: snapshot.dataHash,
        record_count: snapshot.recordCount, size: snapshot.size,
        backup_data: snapshot.data, created_at: new Date().toISOString()
      });
      return !error;
    } catch { return false; }
  }

  private async pruneOldBackups(keepLast = 30): Promise<void> {
    try {
      const supabase = getSupabase();
      if (!supabase) return;
      const { data } = await supabase
        .from('backup_history').select('id,created_at')
        .eq('app_id', APP_ID).order('created_at', { ascending: false }).range(keepLast, 9999);
      if (data && data.length > 0) {
        await supabase.from('backup_history').delete().in('id', data.map((b: any) => b.id));
        console.log(`[AutoBackup] Limpeza: ${data.length} backup(s) antigo(s) removido(s)`);
      }
    } catch { /* ignore */ }
  }

  async executeAutoBackup(): Promise<{ success: boolean; message: string; backupCreated: boolean }> {
    if (!this.isProduction()) return { success: true, message: 'Backup desabilitado em desenvolvimento', backupCreated: false };
    if (!isSupabaseEnabled()) return { success: false, message: 'Supabase não configurado', backupCreated: false };
    if (this.isBackupInProgress) return { success: false, message: 'Backup já em andamento', backupCreated: false };
    if (await this.checkLock()) return { success: false, message: 'Lock ativo', backupCreated: false };

    try {
      this.isBackupInProgress = true;
      await this.createLock();

      const currentData = await this.readCurrentData();
      if (!currentData) throw new Error('Falha ao ler dados do Supabase');

      const currentHash = await this.generateDataHash(currentData);
      const lastBackup = await this.getLastBackup();
      if (lastBackup && lastBackup.dataHash === currentHash) {
        return { success: true, message: 'Nenhuma alteração detectada', backupCreated: false };
      }

      const snapshot: BackupSnapshot = {
        id: `${APP_ID}-${Date.now()}`, timestamp: new Date().toISOString(), version: '2.0.0',
        dataHash: currentHash,
        recordCount: Object.fromEntries(Object.entries(currentData).map(([k, v]) => [k, v.length])),
        size: JSON.stringify(currentData).length, data: currentData
      };

      const saved = await this.saveBackup(snapshot);
      if (!saved) throw new Error('Falha ao salvar backup');

      await this.pruneOldBackups(30);
      const total = Object.values(currentData).reduce((s, a) => s + a.length, 0);
      return { success: true, message: `Backup criado: ${total} registros`, backupCreated: true };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Erro desconhecido', backupCreated: false };
    } finally {
      await this.releaseLock();
      this.isBackupInProgress = false;
    }
  }

  shouldExecuteBackup(): boolean {
    const lastCheck = localStorage.getItem(this.lastCheckKey);
    if (!lastCheck) return true;
    return (Date.now() - new Date(lastCheck).getTime()) > 5 * 60 * 1000;
  }

  markBackupChecked(): void {
    localStorage.setItem(this.lastCheckKey, new Date().toISOString());
  }
}

export const autoBackupService = new AutoBackupService();
