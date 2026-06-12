const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/backup-export?app=cs`;

export interface BackupData {
  timestamp: string;
  date: string;
  app: string;
  users: any[];
  employees: any[];
  monthlyRequests: any[];
  vacationPeriods: any[];
  vacationSummary: any[];
  acquisitionPeriods: any[];
  version: string;
  recordCount: Record<string, number>;
}

class BackupService {
  async exportSupabaseBackup(): Promise<void> {
    const rawToken = localStorage.getItem('portal_auth');
    if (!rawToken) throw new Error('Sessão não encontrada. Faça login novamente.');

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'GET',
      headers: { Authorization: `Bearer ${btoa(rawToken)}` },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(err.error || `Erro HTTP ${response.status}`);
    }

    const backup: BackupData = await response.json();
    const dataStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_cs_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`[Backup] Exportado via Edge Function: ${JSON.stringify(backup.recordCount)}`);
  }

  async importBackupToSupabase(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const backup = JSON.parse(e.target?.result as string) as BackupData;
          if (!backup.timestamp) throw new Error('Arquivo de backup inválido');

          const { getSupabase } = await import('./cloudSync');
          const supabase = getSupabase();
          if (!supabase) throw new Error('Supabase não está configurado');

          const totalRecords = Object.values(backup.recordCount ?? {}).reduce((a, b) => a + b, 0);
          const confirmed = confirm(
            `Importar backup do CS de ${backup.date}?\n\n` +
            `${totalRecords} registros no total\n\nDuplicatas serão atualizadas.`
          );
          if (!confirmed) { resolve(); return; }

          const upsert = (table: string, rows: any[]) =>
            supabase.from(table as any).upsert(rows, { onConflict: 'id' }) as unknown as Promise<{ error: any }>;

          const ops: Array<Promise<{ error: any }>> = [];
          if (backup.employees?.length) ops.push(upsert('employees', backup.employees));
          if (backup.monthlyRequests?.length) ops.push(upsert('monthly_requests', backup.monthlyRequests));
          if (backup.vacationPeriods?.length) ops.push(upsert('vacation_periods', backup.vacationPeriods));
          if (backup.vacationSummary?.length) ops.push(upsert('vacation_summary', backup.vacationSummary));
          if (backup.acquisitionPeriods?.length) ops.push(upsert('acquisition_periods', backup.acquisitionPeriods));
          if (backup.users?.length) ops.push(upsert('app_users',
            backup.users.map((u: any) => { const { password, ...rest } = u; return rest; })
          ));

          const results = await Promise.all(ops);
          const errors = results.filter(r => r.error).map(r => r.error.message);
          if (errors.length) throw new Error(`Erros na importação: ${errors.join(', ')}`);

          if (confirm('Importação concluída! Deseja recarregar a página?')) window.location.reload();
          resolve();
        } catch (error) {
          console.error('[Backup] Erro ao importar:', error);
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file);
    });
  }
}

export const backupService = new BackupService();
