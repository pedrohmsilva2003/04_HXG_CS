
import React, { useState, useEffect } from 'react';
import type { TravelRequestHistoryItem, TravelCosts, ToastType } from '../types';
import { Download, Calculator, Plane, Moon, Car, Utensils, Fuel, X, Calendar, Percent, Globe, Map, Trash2, Clipboard, Copy, CheckCircle, AlertTriangle, Eye } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: TravelRequestHistoryItem;
  onSaveCosts: (id: string, costs: TravelCosts) => void;
  addToast: (msg: string, type: ToastType) => void;
  readOnly?: boolean; // Modo consulta para solicitações aprovadas
}

// Componente extraído para fora para evitar re-renderização e perda de foco
const MoneyInput = ({ 
    value, 
    onChange, 
    currency,
    bgClass,
    label,
    visible = true,
    disabled = false
}: { 
    value: number | undefined, 
    onChange: (val: number) => void, 
    currency: 'BRL' | 'USD',
    bgClass?: string,
    label?: string,
    visible?: boolean,
    disabled?: boolean
}) => {
    if (!visible) return null;
    return (
      <div className={`relative rounded-lg border border-slate-200 overflow-hidden ${bgClass || 'bg-white'} ${disabled ? 'opacity-60 cursor-not-allowed' : 'focus-within:ring-1 focus-within:ring-hex-sky focus-within:border-hex-sky'} transition-all`}>
          <label className="absolute top-1.5 left-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide pointer-events-none truncate pr-2">
              {label || (currency === 'BRL' ? 'Em Reais (R$)' : 'Em Dólar (USD)')}
          </label>
          <div className="flex items-center">
              <span className={`pl-3 pt-5 pb-2 text-sm font-bold ${currency === 'BRL' ? 'text-slate-400' : 'text-green-600'}`}>
                  {currency === 'BRL' ? 'R$' : '$'}
              </span>
              <input 
                  type="number"
                  className="w-full pt-5 pb-2 pl-1 pr-3 bg-transparent text-sm font-semibold text-slate-700 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:cursor-not-allowed"
                  placeholder="0.00"
                  value={value || ''}
                  onChange={(e) => onChange(parseFloat(e.target.value))}
                  disabled={disabled}
              />
          </div>
      </div>
    );
};

const QuoteApprovalModal: React.FC<Props> = ({ isOpen, onClose, data, onSaveCosts, addToast, readOnly = false }) => {
  // Estado local para armazenar BRL e USD separadamente
  const [costs, setCosts] = useState<TravelCosts>({
    currency: 'BRL',
    flightPrice: 0, flightPriceUSD: 0,
    hotelPrice: 0, hotelPriceUSD: 0,
    carPrice: 0, carPriceUSD: 0,
    foodPrice: 0, foodPriceUSD: 0,
    otherPrice: 0, otherPriceUSD: 0,
  });

  // Estado separado para inputs de voo (Ida e Volta)
  const [flightSplit, setFlightSplit] = useState({
      outboundBRL: 0, returnBRL: 0,
      outboundUSD: 0, returnUSD: 0
  });

  // Estado para Conteúdo Personalizado (Prints e Descrições)
  const [quoteDetails, setQuoteDetails] = useState({
      flightImages: [] as string[], // Base64 strings
      hotelText: '',
      carText: ''
  });

  // Detalhes específicos de Hotel (Local apenas, para calcular o total)
  const [hotelDetails, setHotelDetails] = useState({
      nights: 0,
      taxPercent: 5, // Padrão 5%
      dailyRateBRL: 0,
      dailyRateUSD: 0
  });

  // Dias calculados automaticamente para alimentação
  const [calculatedDays, setCalculatedDays] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); // Estado para o modal de sucesso

  const isInternational = !!data.isInternational;

  // Verificadores de Serviço (Helpers)
  const hasFlight = data.services.includes('Transporte Aéreo');
  const hasHotel = data.services.includes('Hospedagem');
  const hasCar = data.services.includes('Locação de Veículo');
  // Alimentação e Outros são sempre true conforme solicitado

  useEffect(() => {
    if (isOpen) {
        // 1. Calcular Dias
        let days = 0;
        let nights = 0;
        
        if (data.startDate && data.endDate) {
            const start = new Date(data.startDate);
            const end = new Date(data.endDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            nights = diffDays;
            days = diffDays === 0 ? 1 : diffDays + 1;
            setCalculatedDays(days);
        }

        // 2. Preparar valores iniciais com sugestão automática de alimentação
        // Regra: R$ 120 (BRL) e $ 70 (USD) por dia
        const suggestionBRL = days * 120;
        const suggestionUSD = days * 70;

        const currentFoodBRL = data.costs?.foodPrice || 0;
        const currentFoodUSD = data.costs?.foodPriceUSD || 0;

        // Se estiver zerado, aplica a sugestão. Se tiver valor salvo (mesmo que antigo), mantém, exceto se for 0.
        const finalFoodBRL = currentFoodBRL === 0 ? suggestionBRL : currentFoodBRL;
        
        // Para USD, apenas se for internacional. Se estiver zerado, aplica a sugestão.
        const finalFoodUSD = isInternational 
            ? (currentFoodUSD === 0 ? suggestionUSD : currentFoodUSD) 
            : 0;

        // Inicializa custos gerais
        setCosts({ 
            currency: 'BRL',
            flightPrice: data.costs?.flightPrice || 0,
            flightPriceUSD: isInternational ? (data.costs?.flightPriceUSD || 0) : 0,
            hotelPrice: data.costs?.hotelPrice || 0,
            hotelPriceUSD: isInternational ? (data.costs?.hotelPriceUSD || 0) : 0,
            carPrice: data.costs?.carPrice || 0,
            carPriceUSD: isInternational ? (data.costs?.carPriceUSD || 0) : 0,
            foodPrice: finalFoodBRL,
            foodPriceUSD: finalFoodUSD,
            otherPrice: data.costs?.otherPrice || 0,
            otherPriceUSD: isInternational ? (data.costs?.otherPriceUSD || 0) : 0,
        });

        // Inicializa Split de Voos
        // Como o banco salva apenas o total, ao abrir, colocamos o total na "Ida" e 0 na "Volta" por padrão
        setFlightSplit({
            outboundBRL: data.costs?.flightPrice || 0,
            returnBRL: 0,
            outboundUSD: isInternational ? (data.costs?.flightPriceUSD || 0) : 0,
            returnUSD: 0
        });

        // Inicializa detalhes do hotel
        setHotelDetails({
            nights: nights > 0 ? nights : 1,
            taxPercent: 5,
            dailyRateBRL: 0,
            dailyRateUSD: 0
        });
        
        // Limpa detalhes extras ao abrir (ou poderia carregar se fosse persistido)
        setQuoteDetails({
            flightImages: [],
            hotelText: '',
            carText: ''
        });
    }
  }, [data, isOpen, isInternational]);

  // Efeito: Listener de Paste (Ctrl+V) para Imagens
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    // Prevenir comportamento padrão
                    e.preventDefault();

                    const reader = new FileReader();
                    reader.onload = (event) => {
                        if (event.target?.result) {
                            setQuoteDetails(prev => {
                                if (prev.flightImages.length >= 2) {
                                    addToast('Máximo de 2 imagens permitido.', 'error');
                                    return prev;
                                }
                                addToast('Imagem colada com sucesso!', 'success');
                                return {
                                    ...prev,
                                    flightImages: [...prev.flightImages, event.target!.result as string]
                                };
                            });
                        }
                    };
                    reader.readAsDataURL(blob);
                }
            }
        }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isOpen, addToast]);

  // Efeito: Calcular Total Hotel (Apenas BRL)
  useEffect(() => {
      if (!isOpen) return;

      const { nights, taxPercent, dailyRateBRL } = hotelDetails;
      
      // Cálculo BRL (Automático)
      const subTotalBRL = dailyRateBRL * nights;
      const totalBRL = subTotalBRL + (subTotalBRL * (taxPercent / 100));
      
      const newCosts: Partial<TravelCosts> = {
          hotelPrice: parseFloat(totalBRL.toFixed(2))
      };

      // USD agora é manual, não calculamos aqui.

      setCosts(prev => ({ ...prev, ...newCosts }));

  }, [hotelDetails, isOpen]);

  // Efeito: Somar Ida + Volta para o Total de Voo
  useEffect(() => {
      if(!isOpen) return;
      
      const totalFlightBRL = (flightSplit.outboundBRL || 0) + (flightSplit.returnBRL || 0);
      const totalFlightUSD = (flightSplit.outboundUSD || 0) + (flightSplit.returnUSD || 0);

      setCosts(prev => ({
          ...prev,
          flightPrice: parseFloat(totalFlightBRL.toFixed(2)),
          flightPriceUSD: parseFloat(totalFlightUSD.toFixed(2))
      }));
  }, [flightSplit, isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Limite de 2 imagens
        if (quoteDetails.flightImages.length < 2) {
             setQuoteDetails(prev => ({
                 ...prev,
                 flightImages: [...prev.flightImages, base64String]
             }));
        } else {
             addToast('Máximo de 2 imagens permitido.', 'error');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
      setQuoteDetails(prev => ({
          ...prev,
          flightImages: prev.flightImages.filter((_, i) => i !== index)
      }));
  };


  if (!isOpen) return null;

  const totalBRL = (costs.flightPrice || 0) + (costs.hotelPrice || 0) + (costs.carPrice || 0) + (costs.foodPrice || 0) + (costs.otherPrice || 0);
  const totalUSD = (costs.flightPriceUSD || 0) + (costs.hotelPriceUSD || 0) + (costs.carPriceUSD || 0) + (costs.foodPriceUSD || 0) + (costs.otherPriceUSD || 0);
  
  // Flag para e-mail: Se não for internacional, NÃO mostra coluna USD mesmo que tenha sujeira
  const showUSDColumn = isInternational; 

  const formatMoney = (val?: number, currency: 'BRL' | 'USD' = 'BRL') => {
    if (!val || val === 0) return '-';
    return val.toLocaleString(currency === 'BRL' ? 'pt-BR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const generateEmailContent = () => {
    // 1. Saudação Dinâmica
    const hour = new Date().getHours();
    let greeting = 'Boa noite';
    if (hour >= 5 && hour < 12) greeting = 'Bom dia';
    else if (hour >= 12 && hour < 18) greeting = 'Boa tarde';
    
    const subject = `RE: Solicitação de viagem - ${data.reason} - ${data.client} (Prot: ${data.protocol})`;
    const approverName = data.approverName || 'Gestor';
    const requesterName = data.passengers[0]?.name || 'Solicitante';

    // --- ESTILOS MODERNOS ---
    const sTable = "width: 100%; max-width: 600px; border-collapse: collapse; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #334155;";
    // ALTERAÇÃO AQUI: color: white -> color: #ffffff
    const sTh = "background-color: #005198; color: #ffffff; padding: 12px; text-align: left; border-bottom: 2px solid #003d73;";
    const sTd = "padding: 10px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle;";
    const sTdNum = "padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; white-space: nowrap;";
    const sTotalRow = "background-color: #f1f5f9; font-weight: bold; color: #0f172a;";
    const sTotalNum = "background-color: #f1f5f9; font-weight: bold; text-align: right; color: #005198;";

    const headerCols = showUSDColumn 
        ? `<th style="${sTh} text-align: right;">BRL (R$)</th><th style="${sTh} text-align: right;">USD ($)</th>`
        : `<th style="${sTh} text-align: right;">Valor (R$)</th>`;

    const rowCols = (valBRL: number | undefined, valUSD: number | undefined) => {
        if (showUSDColumn) {
            return `<td style="${sTdNum}">${valBRL ? `R$ ${formatMoney(valBRL)}` : '-'}</td><td style="${sTdNum}">${valUSD ? `$ ${formatMoney(valUSD, 'USD')}` : '-'}</td>`;
        }
        return `<td style="${sTdNum}">${valBRL ? `R$ ${formatMoney(valBRL)}` : '-'}</td>`;
    };

    const totalCols = () => {
        if (showUSDColumn) {
            return `<td style="${sTotalNum}">R$ ${formatMoney(totalBRL)}</td><td style="${sTotalNum}">$ ${formatMoney(totalUSD, 'USD')}</td>`;
        }
        return `<td style="${sTotalNum}">R$ ${formatMoney(totalBRL)}</td>`;
    };

    // Gera o conteúdo dos anexos/descrições
    // Só gera se tiver o serviço
    let flightContent = '';
    if (hasFlight) {
        flightContent = `
        <p style="margin-bottom: 5px;"><strong>✈️ Passagens:</strong>${quoteDetails.flightImages.length > 0 
            ? quoteDetails.flightImages.map(img => `<img src="${img}" style="margin-top: 5px; max-width: 100%; height: auto; display: block; border: 1px solid #ddd;" />`).join('')
            : '<br>(Insira print aqui)'}</p>`;
    }

    let hotelContent = '';
    if (hasHotel) {
        hotelContent = `
        <p style="margin-bottom: 5px;"><strong>🏨 Hospedagem:</strong>${quoteDetails.hotelText 
        ? `<div style="margin-top: 2px; background-color: #f8fafc; padding: 6px; border-left: 3px solid #01adff; font-weight: 500;">${quoteDetails.hotelText.replace(/\n/g, '<br>')}</div>`
        : '<br>(Insira print aqui)'}</p>`;
    }

    let carContent = '';
    if (hasCar) { // Carro mostra se tiver serviço
         carContent = `
         <p style="margin-bottom: 5px;"><strong>🚗 Locação:</strong>${quoteDetails.carText 
        ? `<div style="margin-top: 2px; background-color: #f8fafc; padding: 6px; border-left: 3px solid #01adff; font-weight: 500;">${quoteDetails.carText.replace(/\n/g, '<br>')}</div>`
        : '<br>(Insira print aqui)'}</p>`;
    }

    // Rows da Tabela - Condicionais
    const hotelRow = hasHotel ? `
        <tr>
            <td style="${sTd}">🏨 Hospedagem</td>
            ${rowCols(costs.hotelPrice, costs.hotelPriceUSD)}
        </tr>
    ` : '';
    
    // Alimentação e Outros SEMPRE aparecem na tabela
    const foodRow = `
        <tr style="background-color: #f8fafc;">
            <td style="${sTd}">🍽️ Alimentação</td>
            ${rowCols(costs.foodPrice, costs.foodPriceUSD)}
        </tr>
    `;

    const otherRow = `
        <tr>
            <td style="${sTd}">🚕 Uber / Combustível / Outros</td>
            ${rowCols(costs.otherPrice, costs.otherPriceUSD)}
        </tr>
    `;

    const carRow = hasCar ? `
        <tr style="background-color: #f8fafc;">
            <td style="${sTd}">🚗 Locação de Veículo</td>
            ${rowCols(costs.carPrice, costs.carPriceUSD)}
        </tr>
    ` : '';

    const flightRow = hasFlight ? `
        <tr>
            <td style="${sTd}">✈️ Voo (Ida/Volta)</td>
            ${rowCols(costs.flightPrice, costs.flightPriceUSD)}
        </tr>
    ` : '';

    const htmlBody = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #334155; line-height: 1.5;">
        <p style="margin-bottom: 10px;">${greeting}, @Kelly Klassen<br>Seguem as opções cotadas para aprovação:</p>
        
        ${flightContent}
        ${hotelContent}
        ${carContent}
        
        <br>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        
        <p style="margin-bottom: 10px;">@${approverName}<br>Espero que te encuentres bien. Lo siguiente es una solicitud de aprobación:</p>
        
        <p style="margin-bottom: 10px;">
           <strong>Cliente:</strong> ${data.client}<br>
           <strong>Motivo:</strong> ${data.reason}<br>
           <strong>Passageiro:</strong> ${requesterName}
        </p>
        
        <table style="${sTable}">
            <thead>
                <tr>
                    <th style="${sTh} border-top-left-radius: 8px;">Categoria</th>
                    ${headerCols}
                </tr>
            </thead>
            <tbody>
                ${hotelRow}
                ${foodRow}
                ${otherRow}
                ${carRow}
                ${flightRow}
                <tr style="${sTotalRow}">
                    <td style="${sTd} border-bottom: 2px solid #005198;">TOTAL ESTIMADO</td>
                    ${totalCols()}
                </tr>
            </tbody>
        </table>
        
        <br>
        <p style="margin-bottom: 10px;">Saludos,</p>
      </div>
    `;

    let plainBody = `Solicitação de Aprovação\n\n`;
    plainBody += `Cliente: ${data.client}\nMotivo: ${data.reason}\nTotal BRL: R$ ${formatMoney(totalBRL)}\n`;
    if (showUSDColumn) {
        plainBody += `Total USD: $ ${formatMoney(totalUSD, 'USD')}\n`;
    }

    return { subject, plainBody, htmlBody };
  };

  const handleDownloadEml = () => {
    onSaveCosts(data.id, costs);
    const content = generateEmailContent();
    const to = ""; // Destinatário vazio
    const cc = ""; // Cópia vazia
    let emlContent = `To: ${to}\nCc: ${cc}\nSubject: ${content.subject}\nX-Unsent: 1\nContent-Type: text/html; charset=utf-8\nMIME-Version: 1.0\n\n${content.htmlBody}`;
    const blob = new Blob([emlContent], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Aprovacao_${data.protocol || 'Viagem'}.eml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('E-mail baixado!', 'success');
    onClose();
  };

  const handleSmartOutlook = async () => {
    setIsLoading(true);
    // 1. Salva os custos
    onSaveCosts(data.id, costs);

    // 2. Gera o Conteúdo
    const content = generateEmailContent();

    // 3. Copia HTML rico para o Clipboard
    try {
        const blobHtml = new Blob([content.htmlBody], { type: 'text/html' });
        const blobText = new Blob([content.plainBody], { type: 'text/plain' });
        
        // Escreve no clipboard
        const item = new ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobText });
        await navigator.clipboard.write([item]);
        
        // Exibe o modal de sucesso ao invés do Toast
        setShowSuccess(true);
        // Não fecha automaticamente, espera o usuário ler e clicar

    } catch (err) {
        console.error("Failed to copy", err);
        addToast('Erro ao copiar para área de transferência. Tente baixar o arquivo.', 'error');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      
      {/* Modal de Sucesso de Cópia (Sobreposto) */}
      {showSuccess && (
          <div className="absolute inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 border border-white/20">
                <div className="bg-green-50 p-6 flex flex-col items-center justify-center text-center border-b border-green-100">
                   <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                      <CheckCircle className="w-8 h-8 text-green-600" strokeWidth={2.5} />
                   </div>
                   <h3 className="text-xl font-bold text-slate-800">Tabela Copiada!</h3>
                </div>
                <div className="p-6">
                   <p className="text-slate-600 text-center text-sm leading-relaxed">
                      Os dados da cotação foram copiados para sua área de transferência.
                      <br/><br/>
                      Vá até o seu e-mail e pressione <strong>Ctrl + V</strong> para colar a tabela e as imagens.
                   </p>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <button 
                        onClick={() => { setShowSuccess(false); onClose(); }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-green-200"
                    >
                        Entendido, fechar janela
                    </button>
                </div>
             </div>
          </div>
      )}

      {/* Modal Principal */}
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Compacto */}
        <div className="bg-white p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <div className={`${readOnly ? 'bg-emerald-500' : 'bg-hex-sky'} text-white p-2 rounded-lg shadow-lg ${readOnly ? 'shadow-emerald-500/30' : 'shadow-hex-sky/30'}`}>
                {readOnly ? <Eye className="w-5 h-5" /> : <Calculator className="w-5 h-5" />}
             </div>
             <div>
                <h3 className="font-bold text-slate-800 text-lg leading-tight">
                    {readOnly ? '📋 Consulta de Cotação' : 'Cotação & Aprovação'}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                    {readOnly ? (
                        <>
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            <span className="text-amber-600 font-semibold">Modo Somente Leitura (Aprovado)</span>
                        </>
                    ) : (
                        <>
                            {isInternational ? <Globe className="w-3 h-3" /> : <Map className="w-3 h-3" />}
                            {isInternational ? 'Viagem Internacional (USD habilitado)' : 'Viagem Nacional (Apenas BRL)'}
                        </>
                    )}
                </p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Scrollável - Inputs Centralizados */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
            
            {/* ROW 1: Passagem Aérea (Condicional) */}
            {hasFlight && (
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase">
                            <Plane className="w-4 h-4 text-hex-sky" /> Passagem Aérea
                        </h4>
                        <div className="text-[10px] bg-sky-50 text-sky-700 px-2 py-1 rounded font-bold border border-sky-100">
                            Total: {isInternational ? `$ ${formatMoney(costs.flightPriceUSD, 'USD')} + ` : ''}R$ {formatMoney(costs.flightPrice)}
                        </div>
                    </div>

                    {/* Upload Area */}
                    <div className="flex items-start gap-2 overflow-x-auto pb-2">
                        {quoteDetails.flightImages.map((img, idx) => (
                            <div key={idx} className="relative w-24 h-24 shrink-0 rounded-lg border border-slate-200 overflow-hidden group">
                                <img src={img} alt="Print" className="w-full h-full object-cover" />
                                {!readOnly && (
                                    <button 
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-500 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {!readOnly && quoteDetails.flightImages.length < 2 && (
                            <label className="w-24 h-24 shrink-0 rounded-lg border-2 border-dashed border-slate-300 hover:border-hex-sky hover:bg-sky-50 transition-all flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-hex-sky text-center p-1">
                                <Clipboard className="w-5 h-5 mb-1" />
                                <span className="text-[9px] font-bold leading-tight">Colar (Ctrl+V)<br/>ou Clicar</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        )}
                    </div>

                    {/* BRL Inputs */}
                    <div className="grid grid-cols-2 gap-4 mb-2">
                        <MoneyInput 
                            label="Voo Ida (BRL)"
                            currency="BRL" 
                            value={flightSplit.outboundBRL} 
                            bgClass="bg-sky-50/30"
                            onChange={(v) => setFlightSplit({...flightSplit, outboundBRL: v})}
                            disabled={readOnly}
                        />
                        <MoneyInput 
                            label="Voo Volta (BRL)"
                            currency="BRL" 
                            value={flightSplit.returnBRL} 
                            bgClass="bg-sky-50/30"
                            onChange={(v) => setFlightSplit({...flightSplit, returnBRL: v})}
                            disabled={readOnly}
                        />
                    </div>

                    {/* USD Inputs (Only if International) */}
                    {isInternational && (
                        <div className="grid grid-cols-2 gap-4 border-t border-dashed border-slate-200 pt-3">
                            <MoneyInput 
                                label="Voo Ida (USD)"
                                currency="USD" 
                                value={flightSplit.outboundUSD} 
                                bgClass="bg-green-50/30"
                                onChange={(v) => setFlightSplit({...flightSplit, outboundUSD: v})}
                                disabled={readOnly}
                            />
                            <MoneyInput 
                                label="Voo Volta (USD)"
                                currency="USD" 
                                value={flightSplit.returnUSD} 
                                bgClass="bg-green-50/30"
                                onChange={(v) => setFlightSplit({...flightSplit, returnUSD: v})}
                                disabled={readOnly}
                            />
                        </div>
                    )}
                </div>
            )}
            
            {/* ROW 2: Hospedagem (Condicional) */}
            {hasHotel && (
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
                    <h4 className="flex items-center justify-between text-sm font-bold text-slate-700 uppercase">
                        <span className="flex items-center gap-2"><Moon className="w-4 h-4 text-hex-sky" /> Hospedagem</span>
                        {/* Remove o badge "Cálculo Automático" se for internacional no lado do dólar, mas mantem para BRL */}
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded">
                            {isInternational ? 'BRL Auto / USD Manual' : 'Cálculo Automático'}
                        </span>
                    </h4>
                    
                    {/* Texto Extra */}
                    <textarea 
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-hex-sky outline-none resize-none bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="Cole aqui a descrição do hotel (Ex: Ibis Belo Horizonte Savassi...)"
                        rows={2}
                        value={quoteDetails.hotelText}
                        onChange={(e) => setQuoteDetails({...quoteDetails, hotelText: e.target.value})}
                        disabled={readOnly}
                    />

                    {/* Inputs de Controle (Noites, Taxa) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative rounded-lg border border-slate-200 bg-slate-50 p-2">
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">Nº Pernoites</label>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <input 
                                    type="number" 
                                    className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
                                    value={hotelDetails.nights}
                                    onChange={(e) => setHotelDetails({...hotelDetails, nights: parseFloat(e.target.value)})}
                                    disabled={readOnly}
                                />
                            </div>
                        </div>
                        <div className="relative rounded-lg border border-slate-200 bg-slate-50 p-2">
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">% Taxa / Café</label>
                            <div className="flex items-center gap-2">
                                <Percent className="w-3 h-3 text-slate-400" />
                                <input 
                                    type="number" 
                                    className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
                                    value={hotelDetails.taxPercent}
                                    onChange={(e) => setHotelDetails({...hotelDetails, taxPercent: parseFloat(e.target.value)})}
                                    disabled={readOnly}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Inputs de Diária */}
                    <div className={`grid ${isInternational ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                        {/* Coluna BRL (Calculado) */}
                        <div>
                            <span className="block text-xs font-bold text-slate-500 mb-1 ml-1">Valor da Diária (BRL)</span>
                            <MoneyInput 
                                currency="BRL" value={hotelDetails.dailyRateBRL} bgClass="bg-sky-50/30"
                                onChange={(v) => setHotelDetails({...hotelDetails, dailyRateBRL: v})}
                                disabled={readOnly}
                            />
                            <div className="text-right mt-1 text-xs text-slate-400 font-medium">
                                Total Calculado: R$ {formatMoney(costs.hotelPrice)}
                            </div>
                        </div>
                        
                        {/* Coluna USD (Manual Total) */}
                        {isInternational && (
                            <div>
                                <span className="block text-xs font-bold text-green-600 mb-1 ml-1">Valor Total Hospedagem (USD)</span>
                                {/* Input direto no costs.hotelPriceUSD, sem usar dailyRateUSD */}
                                <MoneyInput 
                                    currency="USD" 
                                    label="Total Manual (USD)"
                                    value={costs.hotelPriceUSD} 
                                    bgClass="bg-green-50/30"
                                    onChange={(v) => setCosts(prev => ({ ...prev, hotelPriceUSD: v }))}
                                    disabled={readOnly}
                                />
                                <div className="text-right mt-1 text-xs text-green-600/70 font-medium">
                                    Insira o valor total final
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ROW 3: Alimentação (SEMPRE VISÍVEL) */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase">
                        <Utensils className="w-4 h-4 text-hex-sky" /> Alimentação
                    </h4>
                    <span className="text-[10px] text-slate-400">
                        {calculatedDays} dias x {isInternational ? '($ 70 USD e R$ 120 BRL)' : 'R$ 120 (BRL)'}
                    </span>
                </div>
                <div className={`grid ${isInternational ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                    <MoneyInput 
                        currency="BRL" value={costs.foodPrice} bgClass="bg-sky-50/30"
                        onChange={(v) => setCosts({...costs, foodPrice: v})}
                        disabled={readOnly}
                    />
                    <MoneyInput 
                        currency="USD" value={costs.foodPriceUSD} bgClass="bg-green-50/30"
                        onChange={(v) => setCosts({...costs, foodPriceUSD: v})}
                        visible={isInternational}
                        disabled={readOnly}
                    />
                </div>
            </div>

            {/* ROW 4: Locação (Condicional) */}
            {hasCar && (
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase">
                        <Car className="w-4 h-4 text-hex-sky" /> Locação de Veículo
                    </h4>
                    
                    {/* Texto Extra */}
                    <textarea 
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-hex-sky outline-none resize-none bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="Cole aqui a descrição do veículo (Ex: Movida Grupo HW...)"
                        rows={2}
                        value={quoteDetails.carText}
                        onChange={(e) => setQuoteDetails({...quoteDetails, carText: e.target.value})}
                        disabled={readOnly}
                    />

                    <div className={`grid ${isInternational ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                        <MoneyInput 
                            currency="BRL" value={costs.carPrice} bgClass="bg-sky-50/30"
                            onChange={(v) => setCosts({...costs, carPrice: v})}
                            disabled={readOnly}
                        />
                        <MoneyInput 
                            currency="USD" value={costs.carPriceUSD} bgClass="bg-green-50/30"
                            onChange={(v) => setCosts({...costs, carPriceUSD: v})}
                            visible={isInternational}
                            disabled={readOnly}
                        />
                    </div>
                </div>
            )}

            {/* ROW 5: Outros (SEMPRE VISÍVEL) */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase mb-3">
                    <Fuel className="w-4 h-4 text-hex-sky" /> Uber / Combustível / Outros
                </h4>
                <div className={`grid ${isInternational ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                    <MoneyInput 
                        currency="BRL" value={costs.otherPrice} bgClass="bg-sky-50/30"
                        onChange={(v) => setCosts({...costs, otherPrice: v})}
                        disabled={readOnly}
                    />
                    <MoneyInput 
                        currency="USD" value={costs.otherPriceUSD} bgClass="bg-green-50/30"
                        onChange={(v) => setCosts({...costs, otherPriceUSD: v})}
                        visible={isInternational}
                        disabled={readOnly}
                    />
                </div>
            </div>

            {/* Totalizadores */}
            <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-end items-center gap-6">
                <div className="text-right">
                    <span className="block text-xs font-bold text-slate-400 uppercase">Total Estimado (BRL)</span>
                    <span className="block text-2xl font-black text-slate-800">R$ {formatMoney(totalBRL)}</span>
                </div>
                {isInternational && (
                    <div className="text-right">
                        <span className="block text-xs font-bold text-green-600 uppercase">Total Estimado (USD)</span>
                        <span className="block text-2xl font-black text-green-600">$ {formatMoney(totalUSD, 'USD')}</span>
                    </div>
                )}
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-between gap-3 shrink-0">
             
             {/* Botão Secundário: Download EML */}
             <button
                onClick={handleDownloadEml}
                className="px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm text-sm"
                title="Baixar arquivo físico .eml (Backup)"
             >
                <Download className="w-4 h-4" /> 
                <span className="hidden sm:inline">Baixar Arquivo (.eml)</span>
             </button>
             
             {/* Botão Principal: Copiar Tabela */}
             <button
                onClick={handleSmartOutlook}
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-hex-sky-dark hover:bg-hex-sky text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-hex-sky/20 transition-all text-sm disabled:opacity-70 disabled:cursor-not-allowed"
             >
                {isLoading ? (
                    'Processando...'
                ) : (
                    <>
                        <Copy className="w-4 h-4" /> 
                        Copiar Tabela <span className="text-xs font-normal opacity-80">(Ctrl + V no E-mail)</span>
                    </>
                )}
             </button>
        </div>
      </div>
    </div>
  );
};

export default QuoteApprovalModal;
