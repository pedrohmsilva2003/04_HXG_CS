
import React, { useState, useMemo, useEffect } from 'react';
import type { TravelRequestHistoryItem } from '../types';
import { STATUS_CONFIG } from '../constants';
import { Plus, Search, Calendar, MapPin, FileText, Trash2, User, Calculator, Check, Eye } from 'lucide-react';

interface Props {
  history: TravelRequestHistoryItem[];
  onNewRequest: () => void;
  onSelectRequest: (item: TravelRequestHistoryItem) => void;
  onDeleteRequest: (id: string) => void;
  onOpenQuoteModal: (item: TravelRequestHistoryItem) => void;
  onApproveRequest: (id: string) => void;
  currentUser: any; // Usuário logado para verificar permissões
}

const Dashboard: React.FC<Props> = ({ 
  history, 
  onNewRequest, 
  onSelectRequest, 
  onDeleteRequest, 
  onOpenQuoteModal,
  onApproveRequest,
  currentUser 
}) => {
  const [localHistory, setLocalHistory] = useState<TravelRequestHistoryItem[]>(history);
  const [searchTerm, setSearchTerm] = useState('');

  // Mantém o estado local sincronizado
  useEffect(() => {
    setLocalHistory(history);
  }, [history]);

  const filteredHistory = useMemo(() => {
    if (!Array.isArray(localHistory)) return [];

        return localHistory.filter(item => {
            // Proteção contra item undefined
            if (!item) return false;

            const searchLower = searchTerm.toLowerCase();
            // Proteção no acesso a arrays e objetos que podem não existir em dados antigos
            const passengerName = item.passengers?.[0]?.name?.toLowerCase() || '';
            const protocol = item.protocol?.toLowerCase() || '';
            const client = item.client?.toLowerCase() || '';
            const reason = item.reason?.toLowerCase() || '';
            const destination = item.destination?.toLowerCase() || '';
            const manager = item.managerName?.toLowerCase() || '';
      
            return (
                client.includes(searchLower) ||
                reason.includes(searchLower) ||
                destination.includes(searchLower) ||
                manager.includes(searchLower) ||
                protocol.includes(searchLower) ||
                passengerName.includes(searchLower)
            );
        }).sort((a, b) => {
                const tA = new Date(a.startDate || a.createdAt || 0).getTime();
                const tB = new Date(b.startDate || b.createdAt || 0).getTime();
                return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA); // decrescente: mais nova/futura primeiro
        });
  }, [localHistory, searchTerm]);

  // Safe Date Formatter (Prevents RangeError Crash)
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '-';
        return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    } catch {
        return '-';
    }
  };

    const getDayAndMonth = (dateStr?: string) => {
    try {
        const date = new Date(dateStr || new Date());
        if (isNaN(date.getTime())) return { day: '-', month: '-' };
        return {
            day: date.getDate(),
            month: date.toLocaleString('default', { month: 'short' }).replace('.', '')
        };
    } catch {
        return { day: '-', month: '-' };
    }
  };

  const getDisplayName = (fullName?: string) => {
      if (!fullName) return 'Passageiro';
      const parts = fullName.trim().split(/\s+/);
      if (parts.length > 1) {
          return `${parts[0]} ${parts[parts.length - 1]}`;
      }
      return parts[0];
  };

  const handleItemClick = (item: TravelRequestHistoryItem) => {
      onSelectRequest(item);
  };

  const handleApproveClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      onApproveRequest(id);
  };

  const handleQuoteClick = (e: React.MouseEvent, item: TravelRequestHistoryItem) => {
      e.stopPropagation();
      onOpenQuoteModal(item); // Abre modal sempre (readOnly é controlado no App.tsx)
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      onDeleteRequest(id);
  };

  return (
    <div className="animate-fade-in space-y-8">
      
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
                <p className="text-slate-500 text-sm font-medium">Total de Solicitações</p>
                <h3 className="text-3xl font-bold text-hex-sky-dark">{history?.length || 0}</h3>
            </div>
            <div className="w-12 h-12 bg-hex-sky/10 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-hex-sky" />
            </div>
        </div>
        
        {/* New Request CTA */}
        <button 
            onClick={onNewRequest}
            className="md:col-span-2 bg-gradient-to-r from-hex-sky-dark to-hex-sky text-white p-6 rounded-2xl shadow-lg shadow-hex-sky/20 flex items-center justify-between group hover:shadow-hex-sky/40 transition-all"
        >
            <div className="text-left">
                <h3 className="text-xl font-bold mb-1">Nova Solicitação de Viagem</h3>
                <p className="text-hex-sea text-sm font-medium opacity-90">Preencher formulário para gerar e-mail</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform backdrop-blur-sm">
                <Plus className="w-6 h-6 text-white" />
            </div>
        </button>
      </div>

      {/* History Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[400px]">
          {/* Header & Search */}
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  Histórico Recente
              </h2>
              <div className="relative w-full md:w-72">
                  <input 
                    type="text" 
                    placeholder="Buscar protocolo, cliente, passageiro..." 
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-hex-sky focus:ring-1 focus:ring-hex-sky outline-none text-sm transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
             {filteredHistory.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
                     <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                         <FileText className="w-8 h-8 opacity-20" />
                     </div>
                     <p>Nenhuma solicitação encontrada.</p>
                     {history?.length === 0 && (
                         <button onClick={onNewRequest} className="mt-2 text-hex-sky font-medium hover:underline text-sm">
                             Criar sua primeira solicitação
                         </button>
                     )}
                 </div>
             ) : (
                 <div className="divide-y divide-slate-50">
                     {filteredHistory.map((item) => {
                         // FALLBACK DE SEGURANÇA: Se o status não existir no STATUS_CONFIG, usa 'draft'
                         const status = item.status || 'draft';
                         const statusConfig = STATUS_CONFIG[status as 'draft' | 'requested' | 'options_received' | 'approval_requested' | 'approved' | 'cancelled'] || STATUS_CONFIG['draft'];
                         
                         const isApproved = status === 'approved';
                         
                         // Regra de Exibição do Botão:
                         // Mostra se NÃO for Cancelado e NÃO for Aprovado.
                         const showAction = !['cancelled', 'approved'].includes(status);

                         // Cálculo do Custo Total
                         const totalCost = item.costs ? (
                            (item.costs.flightPrice || 0) +
                            (item.costs.hotelPrice || 0) +
                            (item.costs.carPrice || 0) +
                            (item.costs.foodPrice || 0) +
                            (item.costs.otherPrice || 0)
                         ) : 0;

                         // Safe Date
                         const dateInfo = getDayAndMonth(item.createdAt);

                         return (
                            <div 
                                key={item.id} 
                                className={`p-3 transition-colors group flex items-center gap-4 relative ${isApproved ? 'bg-slate-50 opacity-100' : 'hover:bg-slate-50'}`}
                            >
                                {/* ÁREA CLICÁVEL (ESQUERDA) - Abre Edição/Visualização */}
                                <div 
                                    className="flex-1 flex items-center gap-4 min-w-0 cursor-pointer"
                                    onClick={() => handleItemClick(item)}
                                >
                                    {/* Date Icon Box */}
                                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex flex-col items-center justify-center text-slate-500 shrink-0 border border-slate-200 group-hover:border-hex-sky/30 group-hover:bg-hex-sky/5 transition-colors">
                                        <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-400 group-hover:text-hex-sky">{dateInfo.month}</span>
                                        <span className="text-lg font-black leading-none text-slate-700 group-hover:text-hex-sky-dark">{dateInfo.day}</span>
                                    </div>

                                    {/* Content Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                                        <div className="flex items-center gap-x-2 gap-y-1 w-full flex-wrap">
                                            <div className="flex items-center gap-1.5 text-slate-800">
                                                <User className="w-3.5 h-3.5 text-hex-sky" strokeWidth={2.5} />
                                                <span className="font-bold text-sm truncate">
                                                    {getDisplayName(item.passengers?.[0]?.name)}
                                                </span>
                                            </div>

                                            <span className="text-slate-300 text-xs hidden sm:inline">•</span>

                                            <span className="text-sm font-medium text-slate-500 truncate" title={item.client}>
                                                {item.client || 'Cliente não inf.'}
                                            </span>

                                            <span className="text-slate-300 text-xs hidden sm:inline">•</span>

                                            {/* Motivo Adicionado */}
                                            <span className="text-sm text-slate-500 truncate" title={item.reason}>
                                                {item.reason || 'Motivo N/A'}
                                            </span>

                                            <span className="text-slate-300 text-xs hidden sm:inline">•</span>

                                            {/* Badge de Status (Apenas Visual) */}
                                            <span 
                                                className={`
                                                    ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border 
                                                    ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} 
                                                `}
                                            >
                                                {statusConfig.label}
                                            </span>

                                            {item.protocol && (
                                                <span className="ml-auto font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                                                    {item.protocol}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-slate-400">
                                            <div className="flex items-center gap-1" title="Cidade de Destino">
                                                <MapPin className="w-3 h-3 text-slate-400" />
                                                <span className="truncate font-medium">{item.destination || 'N/A'}</span>
                                            </div>
                                            
                                            <div className="w-px h-3 bg-slate-200"></div>
                                            
                                            <div className="flex items-center gap-1" title="Início da Viagem">
                                                <Calendar className="w-3 h-3 text-slate-400" />
                                                <span className="font-medium">{formatDate(item.startDate || '')}</span>
                                            </div>

                                            {totalCost > 0 && (
                                               <span className="text-green-600 font-bold ml-2 hidden sm:inline">
                                                 R$ {totalCost.toFixed(2)}
                                               </span>
                                            )}
                                            
                                            {isApproved && (
                                                <span className="text-slate-400 flex items-center gap-1 ml-auto sm:ml-2">
                                                    <Eye className="w-3 h-3" /> Visualizar
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ÁREA DE AÇÕES (DIREITA) - Isolada do clique principal */}
                                {/* Container com stopPropagation para garantir isolamento total */}
                                <div 
                                    className="flex items-center gap-2 pl-2 relative z-20"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    
{/* Quote Button - Sempre habilitado, mas modo consulta se aprovado */}
                    <button 
                        type="button"
                        onClick={(e) => handleQuoteClick(e, item)}
                        className={`p-2 rounded-full transition-colors border ${isApproved ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border-blue-200'}`}
                        title={isApproved ? "📋 Consultar Cotação (Somente Leitura)" : "Gerenciar Cotação & Aprovação"}
                    >
                        {isApproved ? <Eye className="w-4 h-4" /> : <Calculator className="w-4 h-4" />}
                                    </button>

                                    {/* BOTÃO DE CHECK/CONCLUIR */}
                                    {showAction && (
                                        <button
                                            type="button"
                                            onClick={(e) => handleApproveClick(e, item.id)}
                                            className="p-2 rounded-full border bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border-green-200 hover:border-green-600 transition-all shadow-sm hover:shadow-md animate-fade-in"
                                            title="Concluir: Marcar como Emitido"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}

                                    {/* Delete Button - Mostrado se NÃO aprovado OU se usuário tem permissão especial */}
                                    {(!isApproved || currentUser?.canDeleteApproved) && (
                                        <button 
                                            type="button"
                                            onClick={(e) => handleDeleteClick(e, item.id)}
                                            className={`p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100`}
                                            title={isApproved ? "Excluir solicitação emitida (Permissão Especial)" : "Excluir do histórico"}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                         );
                     })}
                 </div>
             )}
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
