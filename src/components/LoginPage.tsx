
import React, { useState } from 'react';
import { userService } from '../services/userService';
import type { User } from '../types';
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, AlertCircle, CheckCircle } from 'lucide-react';

interface Props {
  onLoginSuccess: (user: User) => void;
}

const LoginPage: React.FC<Props> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // Form States - Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Form States - Register
    const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
    // department is intentionally hidden at registration; manager will assign on approval

    const sendPasswordResetEmail = async (userEmail: string) => {
        const htmlBody = `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 2px solid #005198; border-radius: 10px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #005198 0%, #01adff 100%); color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 600;">🔑 Solicitação de Recuperação de Senha</h1>
        <p style="margin: 8px 0 0 0; font-size: 13px; opacity: 0.95;">Sistema de Viagens Hexagon</p>
    </div>
    <div style="background: #ffffff; padding: 20px;">
        <p style="color: #333; line-height: 1.5; margin: 0 0 15px 0; font-size: 14px;">Olá,</p>
        <p style="color: #555; line-height: 1.5; margin: 0 0 15px 0; font-size: 13px;">Foi solicitada a recuperação de senha para o seguinte usuário:</p>
        
        <table style="width: 100%; border-collapse: collapse; background: #f8f9fa; border-radius: 6px; overflow: hidden;">
            <tr>
                <td style="padding: 10px; font-weight: 600; color: #005198; font-size: 13px; width: 35%;">📧 Email:</td>
                <td style="padding: 10px; color: #333; font-size: 13px;">${userEmail}</td>
            </tr>
        </table>
        
        <p style="color: #555; line-height: 1.5; margin: 15px 0 0 0; font-size: 13px;">Por favor, providencie a redefinição de senha para este usuário.</p>
    </div>
    <div style="background: #f8f9fa; padding: 15px; text-align: center; border-top: 1px solid #e0e0e0;">
        <p style="color: #777; font-size: 11px; margin: 0;">Sistema de Viagens © 2026 Hexagon - Leica Geosystems</p>
    </div>
</div>`;

        // Copia o HTML para a área de transferência
        try {
            const blob = new Blob([htmlBody], { type: 'text/html' });
            const clipboardItem = new ClipboardItem({ 'text/html': blob });
            await navigator.clipboard.write([clipboardItem]);
            console.log('[LoginPage] ✓ HTML de recuperação copiado como formato HTML');
        } catch (err) {
            // Fallback: copia como texto
            await navigator.clipboard.writeText(htmlBody);
            console.log('[LoginPage] ✓ HTML de recuperação copiado como texto (fallback)');
        }
        
        const mailtoLink = `mailto:pedro.silva@leica-geosystems.com?subject=${encodeURIComponent('🔑 Recuperação de Senha - Sistema de Viagens')}&body=${encodeURIComponent('(Cole o conteúdo formatado aqui pressionando Ctrl+V)')}`;
        
        (window as any).pendingMailtoLink = mailtoLink;
        setShowForgotPasswordModal(true);
    };

    const notifyAdminByEmail = (payload: { name: string; email: string; department?: string; role?: string; status?: string }) => {
        const { name, email, department, role, status } = payload;
        
        // Cria o corpo do email em HTML formatado (inline styles para Outlook) - CORES HEXAGON
        const htmlBody = `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 2px solid #005198; border-radius: 10px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #005198 0%, #01adff 100%); color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 600;">🔔 Nova Solicitação de Conta</h1>
        <p style="margin: 8px 0 0 0; font-size: 13px; opacity: 0.95;">Sistema de Viagens Hexagon</p>
    </div>
    <div style="background: #ffffff; padding: 20px;">
        <p style="color: #333; line-height: 1.5; margin: 0 0 15px 0; font-size: 14px;">Olá,</p>
        <p style="color: #555; line-height: 1.5; margin: 0 0 15px 0; font-size: 13px;">Uma nova solicitação de conta foi criada e aguarda aprovação.</p>
        
        <table style="width: 100%; border-collapse: collapse; background: #f8f9fa; border-radius: 6px; overflow: hidden;">
            <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 10px; font-weight: 600; color: #005198; font-size: 13px; width: 35%;">👤 Nome:</td>
                <td style="padding: 10px; color: #333; font-size: 13px;">${name || 'N/A'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 10px; font-weight: 600; color: #005198; font-size: 13px;">📧 Email:</td>
                <td style="padding: 10px; color: #333; font-size: 13px;">${email || 'N/A'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 10px; font-weight: 600; color: #005198; font-size: 13px;">🏢 Depto:</td>
                <td style="padding: 10px; color: #333; font-size: 13px;">${department || 'A definir'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 10px; font-weight: 600; color: #005198; font-size: 13px;">💼 Cargo:</td>
                <td style="padding: 10px; color: #333; font-size: 13px;">${role === 'employee' ? 'Colaborador' : role || 'employee'}</td>
            </tr>
            <tr>
                <td style="padding: 10px; font-weight: 600; color: #005198; font-size: 13px;">📊 Status:</td>
                <td style="padding: 10px;"><span style="background: #fff3cd; color: #856404; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">${status === 'pending' ? 'Aguardando Aprovação' : status || 'pending'}</span></td>
            </tr>
        </table>
        
        <div style="text-align: center; margin: 20px 0;">
            <a href="https://hexagon-viagens.vercel.app" style="background: linear-gradient(135deg, #005198 0%, #01adff 100%); color: white; padding: 10px 25px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 13px; box-shadow: 0 2px 4px rgba(0,81,152,0.3);">Acessar Sistema</a>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
            <p style="color: #999; font-size: 11px; margin: 0;">Este é um e-mail automático. Responda para: pedro.silva@leica-geosystems.com</p>
            <p style="color: #005198; font-size: 11px; margin: 5px 0 0 0; font-weight: 600;">Sistema de Viagens • Hexagon | Leica Geosystems</p>
        </div>
    </div>
</div>`;
        
        // Corpo de texto para aparecer no Outlook antes de colar o HTML
        const placeholderBody = `[CLIQUE AQUI E PRESSIONE CTRL+V PARA COLAR O CONTEÚDO FORMATADO]`;
        
        // Copia o HTML para a área de transferência usando ClipboardItem para suportar HTML
        const copyHtmlToClipboard = async () => {
            try {
                // Tenta copiar como HTML para o Outlook reconhecer
                const blob = new Blob([htmlBody], { type: 'text/html' });
                const clipboardItem = new ClipboardItem({ 'text/html': blob });
                await navigator.clipboard.write([clipboardItem]);
                console.log('[LoginPage] ✓ HTML copiado como formato HTML');
            } catch (err) {
                // Fallback: copia como texto
                await navigator.clipboard.writeText(htmlBody);
                console.log('[LoginPage] ✓ HTML copiado como texto (fallback)');
            }
        };
        
        copyHtmlToClipboard().then(() => {
            console.log('[LoginPage] ✓ HTML copiado, mostrando modal');
        }).catch(err => {
            console.error('[LoginPage] ✗ Erro ao copiar:', err);
        });
        
        // Salva o link mailto para usar após o modal
        const subject = encodeURIComponent(`Solicitação de Cadastro - ${name || email} - Sistema Hexagon`);
        const body = encodeURIComponent(placeholderBody);
        const mailtoLink = `mailto:pedro.silva@leica-geosystems.com?subject=${subject}&body=${body}`;
        
        // Retorna o link para usar no modal
        return mailtoLink;
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
        if (isRegistering) {
            if (!name || !regEmail || !regPassword) {
                throw new Error("Preencha todos os campos.");
            }

            // Department is left undefined until a manager approves and assigns it
            const newUser = await userService.register(name, regEmail, regPassword);
            console.log('[LoginPage] Novo usuário criado:', newUser);
            
            if (newUser.status === 'active') {
                // Caso especial: Gerente pré-definido se cadastrando
                console.log('[LoginPage] Usuário é gerente pré-definido, fazendo login direto');
                onLoginSuccess(newUser);
            } else {
                console.log('[LoginPage] Usuário precisa aprovação, mostrando modal...');
                setSuccessMsg("Cadastro realizado! Aguarde...");
                
                // Prepara o email e mostra o modal
                const mailtoLink = notifyAdminByEmail({
                    name,
                    email: regEmail,
                    department: newUser.department,
                    role: newUser.role,
                    status: newUser.status
                });
                
                // Salva o link no state e mostra o modal
                (window as any).pendingMailtoLink = mailtoLink;
                setLoading(false);
                setShowEmailModal(true);
                return; // Não fecha o modal até clicar OK
            }
            
            setName('');
            setRegEmail('');
            setRegPassword('');
        } else {
            const user = await userService.login(email, password);
            onLoginSuccess(user);
        }
    } catch (err: any) {
        setError(err.message || "Ocorreu um erro.");
    } finally {
        setLoading(false);
    }
  };

  const toggleMode = () => {
      setIsRegistering(!isRegistering);
      setError('');
      setSuccessMsg('');
      // Reset todos os campos
      setEmail('');
      setPassword('');
    setName('');
      setRegEmail('');
      setRegPassword('');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
       <div className="max-w-5xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
           
           {/* Left Side - Brand (Imagem Decorativa) */}
           <div className="md:w-1/2 bg-gradient-to-br from-hex-sky-dark to-hex-sky p-12 flex flex-col justify-between text-white relative overflow-hidden">
               {/* Background Pattern - Hexagon Geometric Image */}
               <div 
                   className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none"
                   style={{
                       backgroundImage: 'url(/images/hexagon-pattern.jpg)',
                       backgroundSize: 'cover',
                       backgroundPosition: 'center'
                   }}
               />
               
               {/* TOP: Logos (Aligned Left & Bigger) */}
               <div className="relative z-10 flex items-center">
                    <img 
                        src="https://leica-geosystems.com/-/media/images/hexagon_logo/hexagon_logo_balck_svg.ashx?sc_lang=en" 
                        alt="Hexagon" 
                        className="h-12 w-auto object-contain brightness-0 invert opacity-100" 
                    />
               </div>
               
               {/* BOTTOM: Text Content */}
               <div className="relative z-10 mt-auto">
                   <h1 className="text-5xl font-bold mb-6 tracking-tight leading-tight">
                       Portal de<br/>Viagens
                   </h1>
                   <p className="text-blue-50 text-lg font-medium leading-relaxed mb-10 max-w-md opacity-90">
                       Gerencie suas solicitações corporativas com agilidade, transparência e padronização.
                   </p>

                   <div className="text-xs text-blue-200 font-medium border-t border-white/20 pt-6 flex items-center gap-2">
                       <span>&copy; 2026 Hexagon - Leica Geosystems</span>
                   </div>
               </div>
           </div>

           {/* Right Side - Form */}
           <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white relative">
               <div className="mb-10">
                   <h2 className="text-3xl font-bold text-slate-800 mb-2">
                       {isRegistering ? 'Criar Nova Conta' : 'Acesse sua Conta'}
                   </h2>
                   <p className="text-slate-500 text-base">
                       {isRegistering ? 'Preencha seus dados para solicitar acesso ao portal.' : 'Bem-vindo de volta! Insira suas credenciais para continuar.'}
                   </p>
               </div>

               {error && (
                   <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-600 text-sm flex items-start gap-3 rounded-r animate-fade-in">
                       <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /> 
                       <span>{error}</span>
                   </div>
               )}

               {successMsg && (
                   <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm flex items-start gap-3 rounded-r animate-fade-in">
                       <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> 
                       <div className="flex flex-col">
                           <span className="font-semibold">{successMsg}</span>
                           <span className="text-xs opacity-80 mt-1">Notificação enviada automaticamente ao gerente.</span>
                       </div>
                   </div>
               )}

               <form onSubmit={handleSubmit} className="space-y-6">
                   {isRegistering && (
                       <>
                           <div className="space-y-2">
                               <label className="text-sm font-bold text-slate-700 ml-1">Nome Completo</label>
                               <div className="relative group">
                                   <input 
                                       type="text" 
                                       className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-hex-sky focus:ring-4 focus:ring-hex-sky/10 outline-none transition-all placeholder:text-slate-400 text-slate-700"
                                       placeholder="Seu nome completo"
                                       value={name}
                                       onChange={(e) => setName(e.target.value)}
                                   />
                                   <UserIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-hex-sky transition-colors" />
                               </div>
                           </div>
                       </>
                   )}

                   <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700 ml-1">E-mail Corporativo</label>
                       <div className="relative group">
                           <input 
                               type="email" 
                               className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-hex-sky focus:ring-4 focus:ring-hex-sky/10 outline-none transition-all placeholder:text-slate-400 text-slate-700"
                               placeholder="nome@empresa.com"
                               value={isRegistering ? regEmail : email}
                               onChange={(e) => isRegistering ? setRegEmail(e.target.value) : setEmail(e.target.value)}
                           />
                           <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-hex-sky transition-colors" />
                       </div>
                   </div>

                   <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700 ml-1">Senha</label>
                       <div className="relative group">
                           <input 
                               type="password" 
                               className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-hex-sky focus:ring-4 focus:ring-hex-sky/10 outline-none transition-all placeholder:text-slate-400 text-slate-700"
                               placeholder="••••••••"
                               value={isRegistering ? regPassword : password}
                               onChange={(e) => isRegistering ? setRegPassword(e.target.value) : setPassword(e.target.value)}
                           />
                           <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-hex-sky transition-colors" />
                       </div>
                   </div>

                   {!isRegistering && (
                       <div className="flex justify-end -mt-2">
                           <button
                               type="button"
                               onClick={async () => {
                                   if (!email.trim()) {
                                       setError('Por favor, insira seu e-mail antes de solicitar recuperação de senha.');
                                       return;
                                   }
                                   setError('');
                                   await sendPasswordResetEmail(email);
                               }}
                               className="text-sm text-hex-sky hover:text-hex-sky-dark font-semibold hover:underline transition-colors"
                           >
                               Esqueci minha senha
                           </button>
                       </div>
                   )}

                   {/* department hidden during registration */}

                   <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-hex-sky-dark hover:bg-hex-sky text-white font-bold py-4 rounded-xl shadow-lg shadow-hex-sky/30 hover:shadow-hex-sky/50 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 mt-8 text-lg"
                   >
                       {loading ? 'Processando...' : (
                           isRegistering ? <><UserPlus className="w-6 h-6" /> Solicitar Acesso</> : <><LogIn className="w-6 h-6" /> Entrar no Portal</>
                       )}
                   </button>
               </form>

               <div className="mt-10 text-center border-t border-slate-100 pt-8">
                   <p className="text-slate-500 text-sm">
                       {isRegistering ? 'Já possui cadastro?' : 'Não tem acesso ainda?'}
                       <button 
                           onClick={toggleMode}
                           className="text-hex-sky font-bold hover:underline ml-1 focus:outline-none hover:text-hex-sky-dark transition-colors"
                       >
                           {isRegistering ? 'Fazer Login' : 'Solicitar conta'}
                       </button>
                   </p>
               </div>
           </div>
       </div>
       
       {/* Modal de Instrução para Recuperação de Senha */}
       {showForgotPasswordModal && (
           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
               <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform animate-[scale-in_0.2s_ease-out]">
                   <div className="text-center">
                       <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                           <Lock className="w-12 h-12 text-hex-sky-dark" />
                       </div>
                       
                       <h2 className="text-2xl font-bold text-slate-800 mb-4">
                           🔑 Solicitação Enviada!
                       </h2>
                       
                       <div className="text-left bg-slate-50 rounded-lg p-5 mb-6 space-y-3">
                           <p className="text-slate-700 font-medium">
                               📋 O conteúdo formatado foi copiado
                           </p>
                           <p className="text-slate-700 font-medium">
                               📧 O Outlook será aberto para Pedro Silva
                           </p>
                           <p className="text-slate-700 font-medium">
                               ⌨️ Clique no corpo do email e pressione <kbd className="px-2 py-1 bg-white rounded border border-slate-300 font-mono text-sm">CTRL+V</kbd>
                           </p>
                       </div>
                       
                       <button
                           onClick={() => {
                               setShowForgotPasswordModal(false);
                               setEmail('');
                               setPassword('');
                               
                               // Abre o Outlook após fechar o modal
                               const mailtoLink = (window as any).pendingMailtoLink;
                               if (mailtoLink) {
                                   window.location.href = mailtoLink;
                               }
                           }}
                           className="w-full bg-hex-sky-dark hover:bg-hex-sky text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-lg"
                       >
                           OK, Entendi
                       </button>
                   </div>
               </div>
           </div>
       )}
       
       {/* Modal de Instrução para Email */}
       {showEmailModal && (
           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
                               setShowEmailModal(false);
                               setIsRegistering(false);
                               setName('');
                               setRegEmail('');
                               setRegPassword('');
                               setSuccessMsg('');
                               
                               // Abre o Outlook após fechar o modal
                               const mailtoLink = (window as any).pendingMailtoLink;
                               if (mailtoLink) {
                                   window.location.href = mailtoLink;
                               }
                           }}
                           className="w-full bg-hex-sky-dark hover:bg-hex-sky text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-lg"
                       >
                           OK, Entendi
                       </button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default LoginPage;
