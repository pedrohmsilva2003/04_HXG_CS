
import React, { useState, useEffect } from 'react';
import type { TravelRequestData, TravelRequestHistoryItem, ToastType, RequestStatus, User } from '../types';
import { generatePreview } from '../services/previewService';
import { validateForm } from '../utils/Validation';
import type { ValidationError } from '../utils/Validation';
import { Mail, ExternalLink, Copy, ArrowLeft, Briefcase, User as UserIcon, Users, Package, Hash, Download, CheckCircle, Lock } from 'lucide-react';
import { resolveManagerFor, resolveApproverFor } from '../utils/managerMapping';
import SectionContainer from './Form/SectionContainer';
import BasicInfoSection from './Form/BasicInfoSection';
import ManagerSection from './Form/ManagerSection';
import PassengerSection from './Form/PassengerSection';
import ServicesSection from './Form/ServicesSection';
import DuplicateWarningModal from './DuplicateWarningModal'; // Importar o novo modal

interface Props {
    currentUser: User;
  data: TravelRequestData;
  history: TravelRequestHistoryItem[]; 
  onChange: (data: TravelRequestData) => void;
  onSubmit: (updateId?: string | null) => void;
    onSave: (dataOverride?: TravelRequestData, forceNew?: boolean) => Promise<string>; // Retorna o ID do item
  onUpdate: (id: string, data: TravelRequestData) => void;
  onBack: () => void;
  onSelectRequest: (item: TravelRequestHistoryItem) => void; // Prop para trocar para modo edição
  isLoading: boolean;
  addToast: (msg: string, type: ToastType) => void;
  isAiEnabled: boolean;
  editingId: string | null;
  isManager: boolean; // Nova prop
}

const InputForm: React.FC<Props> = ({ data, history, onChange, onSubmit, onSave, onUpdate, onBack, onSelectRequest, isLoading, addToast, isAiEnabled, editingId, isManager, currentUser }) => {
  const [activeSection, setActiveSection] = useState<string>('basic');
  const [errors, setErrors] = useState<ValidationError>({});
  const [isMobile, setIsMobile] = useState(false);
  
  // Estado para controlar o modal de duplicidade
  const [duplicateItem, setDuplicateItem] = useState<TravelRequestHistoryItem | null>(null);
  
  // Estado para controlar o modal de sucesso (Cópia Inteligente)
  const [showCopyModal, setShowCopyModal] = useState(false);

  // Verifica se é Read-Only (Aprovado)
  const isReadOnly = data.status === 'approved';

    // Preencher automaticamente gestor e aprovador baseado no departamento do usuário
    useEffect(() => {
        if (!editingId && currentUser?.department) {
            const manager = resolveManagerFor(currentUser.department);
            const approver = resolveApproverFor(currentUser.department);
      
            if (manager && (!data.managerName || !data.managerEmail)) {
                onChange({
                    ...data,
                    managerName: manager.name,
                    managerEmail: manager.email,
                    approverName: approver.name,
                    approverEmail: approver.email
                });
            }
        }
    }, [currentUser?.department, editingId]);

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === 'undefined') return;
      const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
      const isAndroid = /android/i.test(ua);
      const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
      setIsMobile(isIOS || isAndroid || isIPadOS);
    };
    checkMobile();
  }, []);

  // Sincronização inteligente de campos
  useEffect(() => {
    if (isReadOnly) return; // Não sincroniza se for readonly

    let updates: Partial<TravelRequestData> = {};
    let hasUpdates = false;

    if (data.origin && data.origin !== data.flightOrigin) { updates.flightOrigin = data.origin; hasUpdates = true; }
    if (data.origin && data.origin !== data.busOrigin) { updates.busOrigin = data.origin; hasUpdates = true; }

    if (data.destination) {
        if (data.destination !== data.flightDestination) { updates.flightDestination = data.destination; hasUpdates = true; }
        if (data.destination !== data.busDestination) { updates.busDestination = data.destination; hasUpdates = true; }
        if (data.destination !== data.hotelCity) { updates.hotelCity = data.destination; hasUpdates = true; }
    }

    if (data.startDate) {
        if (data.startDate !== data.departureDate) { updates.departureDate = data.startDate; hasUpdates = true; }
        if (data.startDate !== data.busDepartureDate) { updates.busDepartureDate = data.startDate; hasUpdates = true; }
        if (data.startDate !== data.checkIn) { updates.checkIn = data.startDate; hasUpdates = true; }
    }

    if (data.endDate) {
        if (data.endDate !== data.returnDate) { updates.returnDate = data.endDate; hasUpdates = true; }
        if (data.endDate !== data.busReturnDate) { updates.busReturnDate = data.endDate; hasUpdates = true; }
        if (data.endDate !== data.checkOut) { updates.checkOut = data.endDate; hasUpdates = true; }
    }

    if (hasUpdates) {
        onChange({ ...data, ...updates });
    }
  }, [data.origin, data.destination, data.startDate, data.endDate, isReadOnly]);


  const handleChange = (field: keyof TravelRequestData, value: any) => {
    if (isReadOnly) return;
    onChange({ ...data, [field]: value });
    if (errors[field]) {
        const newErrors = { ...errors };
        delete newErrors[field];
        setErrors(newErrors);
    }
  };

  const handleBulkChange = (updates: Partial<TravelRequestData>) => {
      if (isReadOnly) return;
      onChange({ ...data, ...updates });
      if (Object.keys(errors).length > 0) {
          const newErrors = { ...errors };
          let hasErrorUpdates = false;
          Object.keys(updates).forEach((k) => {
              if (newErrors[k]) {
                  delete newErrors[k];
                  hasErrorUpdates = true;
              }
          });
          if (hasErrorUpdates) setErrors(newErrors);
      }
  };

  const checkDuplicate = (): TravelRequestHistoryItem | undefined => {
      // Se já estamos editando, não verifica duplicidade
      if (editingId) return undefined;

      return history.find(item => {
          const isSameClient = item.client?.trim().toLowerCase() === data.client?.trim().toLowerCase();
          const isSameReason = item.reason === data.reason;
          const isSameDates = item.startDate === data.startDate && item.endDate === data.endDate;
          
          const isSameDestination = item.destination?.trim().toLowerCase() === data.destination?.trim().toLowerCase();
          
          const currentPassengers = JSON.stringify(data.passengers.map(p => ({ n: p.name.trim() })));
          const itemPassengers = JSON.stringify(item.passengers.map(p => ({ n: p.name.trim() })));
          const isSamePassengers = currentPassengers === itemPassengers;

          return isSameClient && isSameReason && isSameDates && isSameDestination && isSamePassengers;
      });
  };

  const validateAndSubmit = (force = false) => {
      if (isReadOnly) return;

      if (!isAiEnabled) {
          addToast("Funcionalidade indisponível: API Key não configurada.", 'error');
          return;
      }

      const validationErrors = validateForm(data);
      if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          
          if (validationErrors.reason || validationErrors.client || validationErrors.startDate) setActiveSection('basic');
          else if (validationErrors.managerName) setActiveSection('manager');
          else if (Object.keys(validationErrors).some(k => k.startsWith('passenger'))) setActiveSection('passengers');
          else setActiveSection('services');

          addToast("Preencha os campos obrigatórios marcados em vermelho.", 'error');
          return;
      }
      
      // Checa duplicidade SOMENTE se não estiver editando e não estiver forçando
      if (!editingId && !force) {
          const duplicate = checkDuplicate();
          if (duplicate) {
              setDuplicateItem(duplicate);
              return;
          }
      }

      // Lógica de Update vs Save
      if (editingId && !force) {
        const shouldUpdate = window.confirm(`Deseja sobrescrever a solicitação existente (${data.protocol})?`);
        if (shouldUpdate) {
            onUpdate(editingId, data); 
            onSubmit(editingId); // Usa o ID existente
            return;
        }
        return;
      }

      onSubmit(); // Gera novo (AI)
  };

  const handleLoadDuplicate = () => {
    if (duplicateItem) {
        onSelectRequest(duplicateItem);
        setDuplicateItem(null);
        addToast(`Entrando em modo de edição da solicitação ${duplicateItem.protocol}.`, 'info');
    }
  };

  const handleIgnoreDuplicate = () => {
      setDuplicateItem(null);
      validateAndSubmit(true); // Força o envio
  };

  const getRecipients = (separator: string) => {
    const recipient = "aereo4@turismodklassen.com.br";
    const fixedCCs = ['carla.eiras@leica-geosystems.com', 'viagens.br.geo@leica-geosystems.com'];
    const dynamicCCs = [data.requesterEmail, data.managerEmail, data.approverEmail];
    const allCCs = [...new Set([...fixedCCs, ...dynamicCCs])].filter(email => email && email.includes('@')).join(separator);
    return { recipient, allCCs };
  };

  const handleDownloadEml = async () => {
    // Em modo Read-Only, permite baixar mas não valida (assume que já foi validado ao aprovar)
    if (!isReadOnly) {
        const validationErrors = validateForm(data);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            addToast("Preencha todos os dados obrigatórios antes de baixar.", 'error');
            return;
        }
        
        const dataWithStatus = { ...data, status: 'requested' as RequestStatus };
        if (editingId) {
            onUpdate(editingId, dataWithStatus);
        } else {
            onChange(dataWithStatus);
            await onSave(dataWithStatus);
        }
    }

    const preview = generatePreview(data);
    const { recipient, allCCs } = getRecipients('; ');

    const emlContent = `To: ${recipient}
Cc: ${allCCs}
Subject: ${preview.subject}
Content-Type: text/plain; charset=utf-8

${preview.body}`;

    const blob = new Blob([emlContent], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Solicitacao_${data.protocol || 'Viagem'}.eml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    addToast('Arquivo de e-mail (.eml) baixado com sucesso!', 'success');
  };

  const getMailtoLink = (protocol: 'mailto' | 'ms-outlook', usePlaceholderBody = false) => {
    const preview = generatePreview(data);
    const separator = (protocol === 'ms-outlook' || isMobile) ? ',' : ';';
    const { recipient, allCCs } = getRecipients(separator);

    // Se usar corpo placeholder (para Smart Copy), usa mensagem curta
    let bodyToUse = "";
    if (usePlaceholderBody) {
        bodyToUse = "\n\n[O TEXTO FOI COPIADO PARA A ÁREA DE TRANSFERÊNCIA]\n[POR FAVOR, CLIQUE AQUI E PRESSIONE CTRL+V PARA COLAR O TEXTO]";
    } else {
        // OTIMIZAÇÃO DE TAMANHO PARA URL:
        bodyToUse = preview.body
            .replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2700}-\u{27BF}]/gu, '')
            .replace(/•/g, '-')
            .replace(/  +/g, ' ');
    }


    const subjectEncoded = encodeURIComponent(preview.subject);
    const bodyEncoded = encodeURIComponent(bodyToUse);
    const ccEncoded = encodeURIComponent(allCCs);

    if (protocol === 'ms-outlook') {
        return `ms-outlook://compose?to=${recipient}&subject=${subjectEncoded}&body=${bodyEncoded}&cc=${ccEncoded}`;
    }
    return `mailto:${recipient}?subject=${subjectEncoded}&body=${bodyEncoded}&cc=${ccEncoded}`;
  };

  const handleQuickOutlook = async () => {
      // Bloqueado em Read-Only (não deve poder enviar novamente como solicitado se já está aprovado)
      if (isReadOnly) return;

      const validationErrors = validateForm(data);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        addToast("Preencha todos os dados obrigatórios antes de gerar o e-mail.", 'error');
        return;
      }

      if (!editingId && !duplicateItem) {
          const duplicate = checkDuplicate();
          if (duplicate) {
              setDuplicateItem(duplicate);
              return;
          }
      }

      const dataWithStatus = { ...data, status: 'requested' as RequestStatus };
      
      // CRÍTICO: Garantir que o status seja salvo corretamente
      if (editingId) {
          onUpdate(editingId, dataWithStatus);
      } else {
          const newId = await onSave(dataWithStatus); 
          onUpdate(newId, dataWithStatus);
      }

      // Gera o link padrão para testar tamanho
      const protocol = isMobile ? 'ms-outlook' : 'mailto';
      let mailtoLink = getMailtoLink(protocol, false);
      
      // Armazena se é Smart Copy ANTES de alterar o link
      const isSmartCopy = mailtoLink.length > 1600;

      // Verificação de Segurança de Tamanho de URL (Smart Copy)
      // Se for maior que 1600 caracteres, ativa o modo de cópia automática
      if (isSmartCopy) {
          // 1. Copia o corpo original COMPLETO (bonito) para o clipboard
          handleCopyText(true); // true = silent copy
          
          // 2. Gera link com placeholder curto
          mailtoLink = getMailtoLink(protocol, true);
          
          // 3. Salva o mailto link para usar após o modal
          (window as any).pendingMailtoLink = mailtoLink;
          
          // 4. Mostra o Modal - Outlook só abrirá quando clicar OK
          setShowCopyModal(true);
          return; // Não abre o Outlook ainda
      } else {
          addToast('Abrindo Outlook e salvando histórico...', 'success');
      }

      const link = document.createElement('a');
      link.href = mailtoLink;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      try {
          link.click();
      } catch (err) {
          console.error("Falha ao abrir mailto", err);
          handleCopyText();
          alert("Não foi possível abrir o cliente de e-mail automaticamente. O texto foi copiado.");
      } finally {
          document.body.removeChild(link);
          
          // Lógica corrigida: Só volta automaticamente se NÃO for Smart Copy.
          // Se for Smart Copy, o usuário deve clicar no botão do modal.
          if (!isSmartCopy) {
            setTimeout(() => {
                onBack();
            }, 1500);
          }
      }
  };

  const handleCopyText = (silent = false) => {
    const preview = generatePreview(data);
    navigator.clipboard.writeText(preview.body);
    if (!silent) {
        addToast('Corpo do e-mail copiado para a área de transferência!', 'success');
    }
  };

  const toggleSection = (id: string) => {
      setActiveSection(activeSection === id ? '' : id);
  }

  const isBasicComplete = !!(data.reason && data.client && data.startDate && data.endDate);
  const isManagerComplete = !!(data.managerName);
  const isPassengerComplete = data.passengers.every(p => p.name);
  
  const hasBasicError = !!(errors.reason || errors.client || errors.startDate || errors.endDate);
  const hasManagerError = !!(errors.managerName);

  return (
    <>
      <DuplicateWarningModal 
        isOpen={!!duplicateItem} 
        protocol={duplicateItem?.protocol || 'Desconhecido'} 
        onClose={() => setDuplicateItem(null)} 
        onLoad={handleLoadDuplicate}
        onIgnore={handleIgnoreDuplicate}
      />

      {/* Modal de Instrução para Email */}
      {showCopyModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform animate-[scale-in_0.2s_ease-out]">
                <div className="text-center">
                   <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-12 h-12 text-green-600" />
                   </div>
                   
                   <h2 className="text-2xl font-bold text-slate-800 mb-4">
                       ✅ PRONTO!
                   </h2>
                   
                   <div className="text-left bg-slate-50 rounded-lg p-5 mb-6 space-y-3">
                       <p className="text-slate-700 font-medium">
                           📋 O conteúdo formatado foi copiado
                       </p>
                       <p className="text-slate-700 font-medium">
                           📧 O Outlook será aberto
                       </p>
                       <p className="text-slate-700 font-medium">
                           ⌨️ Clique no corpo do email e pressione <kbd className="px-2 py-1 bg-white rounded border border-slate-300 font-mono text-sm">CTRL+V</kbd>
                       </p>
                   </div>
                   
                   <button
                       onClick={() => {
                           setShowCopyModal(false);
                           // Abre o Outlook após fechar o modal
                           const mailtoLink = (window as any).pendingMailtoLink;
                           if (mailtoLink) {
                               const link = document.createElement('a');
                               link.href = mailtoLink;
                               link.style.display = 'none';
                               document.body.appendChild(link);
                               try {
                                   link.click();
                               } catch (err) {
                                   console.error("Falha ao abrir mailto", err);
                               }
                               document.body.removeChild(link);
                           }
                           onBack();
                       }}
                       className="w-full bg-hex-sky-dark hover:bg-hex-sky text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-lg"
                   >
                       OK, Entendi
                   </button>
                </div>
             </div>
          </div>
      )}

      <div className="h-full space-y-6 bg-white p-6 md:p-8 rounded-2xl shadow-lg shadow-slate-200/50 border border-white flex flex-col relative">
        
        {/* Banner Read-Only */}
        {isReadOnly && (
            <div className="bg-green-50 border-b border-green-100 p-3 -mx-6 -mt-6 md:-mx-8 md:-mt-8 mb-6 rounded-t-2xl flex items-center justify-center gap-2 text-green-800 text-sm font-bold shadow-sm">
                <Lock className="w-4 h-4" />
                <span>Solicitação Aprovada / Emitida - Modo de Visualização</span>
            </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-2">
              <button 
                  onClick={onBack}
                  className="p-2 -ml-2 text-slate-400 hover:text-hex-sky hover:bg-slate-50 rounded-full transition-colors"
                  title="Voltar para o Painel"
              >
                  <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold text-slate-700">
                  {editingId ? (isReadOnly ? 'Visualizar Solicitação' : 'Editando Solicitação') : 'Detalhes da Viagem'}
              </h2>
           </div>
           
           {data.protocol && (
               <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${editingId ? 'bg-amber-50 border-amber-200' : 'bg-slate-100 border-slate-200'}`} title="Número do Protocolo">
                   <Hash className={`w-3.5 h-3.5 ${editingId ? 'text-amber-500' : 'text-slate-400'}`} />
                   <span className={`text-xs font-mono font-bold ${editingId ? 'text-amber-700' : 'text-slate-600'}`}>{data.protocol}</span>
               </div>
           )}
        </div>

        <div className="flex-1 space-y-4">
          
          <SectionContainer 
              title="Informações Básicas" 
              icon={Briefcase} 
              isOpen={activeSection === 'basic'} 
              onToggle={() => toggleSection('basic')}
              isCompleted={isBasicComplete}
              hasError={hasBasicError}
          >
              <BasicInfoSection 
                data={data} 
                onChange={handleChange} 
                errors={errors} 
                disabled={isReadOnly}
                isManager={isManager} // Passa para bloquear campo email
              />
              {!isReadOnly && (
                <div className="mt-4 flex justify-end">
                    <button onClick={() => setActiveSection('manager')} className="text-sm font-bold text-hex-sky hover:underline">
                        Próximo: Gestão
                    </button>
                </div>
              )}
          </SectionContainer>

          <SectionContainer 
              title="Gestão e Aprovação" 
              icon={Users} 
              isOpen={activeSection === 'manager'} 
              onToggle={() => toggleSection('manager')}
              isCompleted={isManagerComplete}
              hasError={hasManagerError}
          >
              <ManagerSection data={data} onChange={handleBulkChange} errors={errors} disabled={isReadOnly} />
              {!isReadOnly && (
                <div className="mt-4 flex justify-end">
                    <button onClick={() => setActiveSection('passengers')} className="text-sm font-bold text-hex-sky hover:underline">
                        Próximo: Passageiros
                    </button>
                </div>
              )}
          </SectionContainer>

          <SectionContainer 
              title="Passageiros" 
              icon={UserIcon} 
              isOpen={activeSection === 'passengers'} 
              onToggle={() => toggleSection('passengers')}
              isCompleted={isPassengerComplete}
          >
              <PassengerSection data={data} onChange={(p) => handleChange('passengers', p)} errors={errors} disabled={isReadOnly} />
               {!isReadOnly && (
                <div className="mt-4 flex justify-end">
                    <button onClick={() => setActiveSection('services')} className="text-sm font-bold text-hex-sky hover:underline">
                        Próximo: Serviços
                    </button>
                </div>
               )}
          </SectionContainer>

          <SectionContainer 
              title="Serviços Solicitados" 
              icon={Package} 
              isOpen={activeSection === 'services'} 
              onToggle={() => toggleSection('services')}
              isCompleted={data.services.length > 0}
          >
              <ServicesSection data={data} onChange={onChange} errors={errors} disabled={isReadOnly} />
          </SectionContainer>

        </div>

        {/* Actions */}
        <div className="pt-4 mt-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* Botão de Copiar (Sempre disponível) */}
          <button
            onClick={() => handleCopyText(false)}
            className="border-2 border-slate-200 hover:border-hex-sky hover:text-hex-sky text-slate-600 font-bold py-3 px-4 rounded-xl transition-all flex flex-col md:flex-row justify-center items-center gap-2 text-sm"
            title="Copiar texto para área de transferência"
          >
            <Copy className="w-5 h-5" />
            <span>Copiar</span>
          </button>

          {/* Botão de Download (Sempre disponível, mas não salva em Read-Only) */}
          <button
            onClick={handleDownloadEml}
            className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-all flex flex-col md:flex-row justify-center items-center gap-2 text-sm shadow-lg shadow-slate-300"
            title="Baixar arquivo .eml para abrir no Outlook"
          >
            <Download className="w-5 h-5" />
            <span>Baixar E-mail</span>
          </button>

          {/* Botões de Ação (Escondidos se Read-Only) */}
          {!isReadOnly ? (
              <button
                onClick={handleQuickOutlook}
                disabled={isLoading}
                className="col-span-2 bg-hex-sky-dark hover:bg-hex-sky text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-hex-sky/30 hover:shadow-hex-sky/50 transition-all flex flex-col md:flex-row justify-center items-center gap-2 text-sm group disabled:opacity-50 disabled:cursor-not-allowed"
                title="Abre o Outlook. Se o texto for longo, copia automaticamente o corpo para você colar."
              >
                <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-hex-sea" />
                    <span>
                        {isLoading ? 'Validando...' : 'Abrir no Outlook'}
                    </span>
                </div>
                <ExternalLink className="w-3 h-3 opacity-70 group-hover:translate-x-1 transition-transform hidden md:block" />
              </button>
          ) : (
              // Botão de Voltar Grande para Read-Only
              <button
                onClick={onBack}
                className="col-span-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 px-4 rounded-xl transition-all flex flex-col md:flex-row justify-center items-center gap-2 text-sm"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Voltar ao Histórico</span>
              </button>
          )}
        </div>

        {/* AI Action */}
        {!isReadOnly && (
            <div className="text-center">
            <button 
                onClick={() => validateAndSubmit(false)}
                disabled={isLoading || !isAiEnabled}
                className={`text-xs underline ${!isAiEnabled ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-hex-sky'}`}
                title={!isAiEnabled ? "Configure a API Key para habilitar" : ""}
            >
                {isAiEnabled ? "Ou gerar texto com Inteligência Artificial" : "IA Indisponível (Falta API Key)"}
            </button>
            </div>
        )}
      </div>
    </>
  );
};

export default InputForm;
