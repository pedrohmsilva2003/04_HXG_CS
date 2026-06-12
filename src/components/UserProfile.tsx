import React, { useState } from 'react';
import type { User } from '../types';
import { userService } from '../services/userService';
import { User as UserIcon, Lock, X, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface Props {
  onClose: () => void;
  currentUser: User;
}

const UserProfile: React.FC<Props> = ({ onClose, currentUser }) => {
  const [formData, setFormData] = useState({
    name: (currentUser as any).name || '',
    email: currentUser.email,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const clearMessages = () => {
    setTimeout(() => {
      setSuccessMsg('');
      setErrorMsg('');
    }, 3000);
  };

  const handleUpdateProfile = () => {
    try {
      // Validar senha atual
      if (formData.currentPassword && formData.currentPassword !== currentUser.password) {
        setErrorMsg('Senha atual incorreta');
        clearMessages();
        return;
      }

      // Se estiver alterando senha, validar novos campos
      if (formData.newPassword) {
        if (!formData.currentPassword) {
          setErrorMsg('Digite sua senha atual para alterar a senha');
          clearMessages();
          return;
        }

        if (formData.newPassword.length < 6) {
          setErrorMsg('A nova senha deve ter pelo menos 6 caracteres');
          clearMessages();
          return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
          setErrorMsg('As senhas não coincidem');
          clearMessages();
          return;
        }
      }

      // Atualizar usuário no localStorage
      const users = (userService as any).getAllUsers?.() || [];
      const index = users.findIndex((u: User) => u.id === currentUser.id);
      
      if (index >= 0) {
        users[index] = {
          ...users[index],
          name: formData.name,
          email: formData.email,
          password: formData.newPassword || users[index].password
        };
        
        localStorage.setItem('app_users_v1', JSON.stringify(users));
        
        setSuccessMsg('Perfil atualizado com sucesso!');
        
        // Limpar campos de senha
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        clearMessages();
        
        // Fechar modal após 1.5s
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg('Erro ao atualizar perfil');
      clearMessages();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '672px',
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(to right, #005198, #01adff)',
          padding: '24px',
          borderRadius: '16px 16px 0 0',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '12px',
                borderRadius: '8px',
              }}>
                <UserIcon style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: 'white',
                  margin: 0,
                }}>Meu Perfil</h2>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '14px',
                  margin: 0,
                }}>Altere suas informações pessoais</p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '8px',
                background: 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <X style={{ width: '24px', height: '24px', color: 'white' }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Messages */}
          {successMsg && (
            <div style={{
              padding: '12px',
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              color: '#15803D',
              fontSize: '14px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '24px',
            }}>
              <Check style={{ width: '16px', height: '16px' }} />
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div style={{
              padding: '12px',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#B91C1C',
              fontSize: '14px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '24px',
            }}>
              <AlertCircle style={{ width: '16px', height: '16px' }} />
              {errorMsg}
            </div>
          )}

          {/* Informações Básicas */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1E293B',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}>
              <UserIcon style={{ width: '20px', height: '20px', color: '#005198' }} />
              Informações Básicas
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#334155',
                marginBottom: '8px',
              }}>
                Nome Completo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = '2px solid #01adff';
                  e.currentTarget.style.padding = '9px 15px';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = '1px solid #CBD5E1';
                  e.currentTarget.style.padding = '10px 16px';
                }}
                placeholder="Digite seu nome completo"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#334155',
                marginBottom: '8px',
              }}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = '2px solid #01adff';
                  e.currentTarget.style.padding = '9px 15px';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = '1px solid #CBD5E1';
                  e.currentTarget.style.padding = '10px 16px';
                }}
                placeholder="seu.email@empresa.com"
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#334155',
                  marginBottom: '8px',
                }}>
                  Departamento
                </label>
                <input
                  type="text"
                  value={currentUser.department || 'suporte_tecnico'}
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    background: '#F1F5F9',
                    color: '#64748B',
                    fontSize: '14px',
                    cursor: 'not-allowed',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#334155',
                  marginBottom: '8px',
                }}>
                  Função
                </label>
                <input
                  type="text"
                  value={currentUser.role === 'manager' ? 'Gestor' : 'Colaborador'}
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    background: '#F1F5F9',
                    color: '#64748B',
                    fontSize: '14px',
                    cursor: 'not-allowed',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Alterar Senha */}
          <div style={{
            paddingTop: '24px',
            borderTop: '1px solid #E2E8F0',
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1E293B',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}>
              <Lock style={{ width: '20px', height: '20px', color: '#005198' }} />
              Alterar Senha
            </h3>
            
            <p style={{
              fontSize: '14px',
              color: '#64748B',
              marginBottom: '16px',
            }}>
              Deixe os campos em branco se não quiser alterar a senha
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#334155',
                marginBottom: '8px',
              }}>
                Senha Atual
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    paddingRight: '40px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = '2px solid #01adff';
                    e.currentTarget.style.padding = '9px 15px';
                    e.currentTarget.style.paddingRight = '39px';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = '1px solid #CBD5E1';
                    e.currentTarget.style.padding = '10px 16px';
                    e.currentTarget.style.paddingRight = '40px';
                  }}
                  placeholder="Digite sua senha atual"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94A3B8',
                    padding: 0,
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#64748B'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#94A3B8'}
                >
                  {showCurrentPassword ? <EyeOff style={{ width: '20px', height: '20px' }} /> : <Eye style={{ width: '20px', height: '20px' }} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#334155',
                marginBottom: '8px',
              }}>
                Nova Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    paddingRight: '40px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = '2px solid #01adff';
                    e.currentTarget.style.padding = '9px 15px';
                    e.currentTarget.style.paddingRight = '39px';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = '1px solid #CBD5E1';
                    e.currentTarget.style.padding = '10px 16px';
                    e.currentTarget.style.paddingRight = '40px';
                  }}
                  placeholder="Digite sua nova senha (mín. 6 caracteres)"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94A3B8',
                    padding: 0,
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#64748B'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#94A3B8'}
                >
                  {showNewPassword ? <EyeOff style={{ width: '20px', height: '20px' }} /> : <Eye style={{ width: '20px', height: '20px' }} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#334155',
                marginBottom: '8px',
              }}>
                Confirmar Nova Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    paddingRight: '40px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = '2px solid #01adff';
                    e.currentTarget.style.padding = '9px 15px';
                    e.currentTarget.style.paddingRight = '39px';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = '1px solid #CBD5E1';
                    e.currentTarget.style.padding = '10px 16px';
                    e.currentTarget.style.paddingRight = '40px';
                  }}
                  placeholder="Confirme sua nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94A3B8',
                    padding: 0,
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#64748B'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#94A3B8'}
                >
                  {showConfirmPassword ? <EyeOff style={{ width: '20px', height: '20px' }} /> : <Eye style={{ width: '20px', height: '20px' }} />}
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '12px',
            paddingTop: '24px',
          }}>
            <button
              onClick={handleUpdateProfile}
              style={{
                flex: 1,
                background: '#005198',
                color: 'white',
                fontWeight: '600',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
                fontSize: '14px',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#01adff'}
              onMouseOut={(e) => e.currentTarget.style.background = '#005198'}
            >
              <Check style={{ width: '20px', height: '20px' }} />
              Salvar Alterações
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                background: '#E2E8F0',
                color: '#1E293B',
                fontWeight: '600',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                fontSize: '14px',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#CBD5E1'}
              onMouseOut={(e) => e.currentTarget.style.background = '#E2E8F0'}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
