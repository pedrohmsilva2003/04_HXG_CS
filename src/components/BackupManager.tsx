import React, { useState, useEffect } from 'react';
import type { BackupMetadata } from '../services/autoBackupService';
import { autoBackupService } from '../services/autoBackupService';
import { backupService } from '../services/backupService';
import { Database, Upload, AlertCircle, CheckCircle, X, Clock, HardDrive, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const BackupManager: React.FC<Props> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(true);
  const [showManualTools, setShowManualTools] = useState(false);

  // Carrega lista de backups ao abrir
  useEffect(() => {
    loadBackupsList();
  }, []);

  const loadBackupsList = async () => {
    setLoadingBackups(true);
    try {
      const list = await autoBackupService.listBackups();
      setBackups(list);
    } catch (error) {
      console.error('Erro ao carregar backups:', error);
    } finally {
      setLoadingBackups(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleExportSupabase = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await backupService.exportSupabaseBackup();
      setMessage({ type: 'success', text: '✓ Backup do Supabase exportado com sucesso!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: `Erro ao exportar: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);
    try {
      await backupService.importBackupToSupabase(file);
      setMessage({ type: 'success', text: '✓ Backup importado com sucesso!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: `Erro ao importar: ${error.message}` });
    } finally {
      setLoading(false);
      // Reset input para permitir reimport do mesmo arquivo
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-hex-sky-dark to-hex-sky p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Backup do Supabase</h2>
              <p className="text-blue-100 text-sm mt-1">Exportar e importar dados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mx-6 mt-6 p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`text-sm font-medium ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                {message.text}
              </span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-8 max-h-[70vh] overflow-y-auto">
          <div className="space-y-6">
            
            {/* Lista de Backups Automáticos - DESTAQUE */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 rounded-xl p-6 shadow-lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-3 rounded-lg shadow-md">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">📋 Histórico de Backups</h3>
                  <p className="text-sm text-slate-600">
                    Backups automáticos com versionamento inteligente • Criados apenas quando há alterações
                  </p>
                </div>
              </div>

              {loadingBackups ? (
                <div className="text-center py-8 text-slate-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                  <p>Carregando backups...</p>
                </div>
              ) : backups.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-white rounded-lg border border-dashed border-slate-300">
                  <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">Nenhum backup disponível</p>
                  <p className="text-xs mt-1">Backups são criados automaticamente em produção</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {backups.map((backup, index) => (
                    <div key={backup.id} className="bg-white border-2 border-purple-200 rounded-lg p-5 hover:shadow-xl hover:border-purple-400 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <FileText className="w-5 h-5 text-purple-600" />
                            <span className="text-lg font-bold text-slate-800">
                              Versão #{backups.length - index}
                            </span>
                            {index === 0 && (
                              <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                ✓ Atual
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-slate-600 space-y-2">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-purple-500" />
                              <span className="font-medium">{formatDate(backup.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <HardDrive className="w-4 h-4 text-blue-500" />
                                <span className="font-semibold">{formatSize(backup.size)}</span>
                              </div>
                              <div className="bg-slate-100 px-3 py-1 rounded-md">
                                <span className="font-medium text-slate-700">
                                  {Object.entries(backup.recordCount).map(([k, v]) => `${v} ${k}`).join(' • ')}
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded">
                              ID: {backup.dataHash.substring(0, 12)}...
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ferramentas Manuais - Recolhível */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowManualTools(!showManualTools)}
                className="w-full bg-slate-50 hover:bg-slate-100 p-4 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-slate-600" />
                  <span className="font-semibold text-slate-700">Ferramentas Manuais (Exportar/Importar)</span>
                </div>
                {showManualTools ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>

              {showManualTools && (
                <div className="p-6 space-y-4 bg-white">
                  {/* Exportar - Compacto */}
                  <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <Database className="w-10 h-10 text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 mb-1">Exportar Dados</h4>
                      <p className="text-xs text-slate-600">Baixar arquivo JSON com todos os dados</p>
                    </div>
                    <button
                      onClick={handleExportSupabase}
                      disabled={loading}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
                    >
                      {loading ? 'Exportando...' : '⬇️ Exportar'}
                    </button>
                  </div>

                  {/* Importar - Compacto */}
                  <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <Upload className="w-10 h-10 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 mb-1">Importar Dados</h4>
                      <p className="text-xs text-slate-600">Carregar arquivo JSON para o Supabase</p>
                    </div>
                    <label className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors cursor-pointer text-sm whitespace-nowrap">
                      ⬆️ Importar
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        disabled={loading}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Info - Compacto */}
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      <strong>Importação:</strong> Adiciona/atualiza dados sem remover existentes
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackupManager;
