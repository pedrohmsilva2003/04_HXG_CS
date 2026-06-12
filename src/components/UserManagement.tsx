import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { userService } from '../services/userService';
import { getSupabase } from '../services/cloudSync';
import { Users, Trash2, Edit2, Plus, X, Check, Lock, Unlock, Shield, AlertCircle } from 'lucide-react';
import { DEPARTMENTS, MANAGERS_DATA } from '../constants';

interface Props {
  onClose?: () => void;
  currentUser: User;
}

const UserManagement: React.FC<Props> = ({ onClose, currentUser }) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    department: 'administrativo' as const,
    role: ('employee' as const) as 'employee' | 'manager'
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isDeptManager = currentUser.role === 'manager' && (currentUser as any).permissions === 'department';

  // Permissão: managers com permission 'department' só gerenciam seu departamento; 'all' gerencia tudo
  const canManageUser = (user: User) => {
    if (currentUser.role !== 'manager') return false;
    if ((currentUser as any).permissions === 'all') return true;
    if ((currentUser as any).permissions === 'department') return user.department === currentUser.department;
    return false;
  };

  const visibleUsers = allUsers.filter((u) => {
    if ((currentUser as any).permissions === 'all') return true;
    if ((currentUser as any).permissions === 'department') return u.department === currentUser.department;
    // default: só vê seu departamento
    return u.department === currentUser.department;
  });

  // Carregar usuários do Supabase
  const loadUsers = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) {
        // Fallback para localStorage se Supabase não disponível
        const users = (userService as any).getAllUsers?.() || [];
        console.log('[UserManagement] Total de usuários carregados (localStorage):', users.length);
        setAllUsers(users);
        return;
      }

      const { data, error } = await supabase.from('app_users').select('*');
      
      if (error) {
        console.error('[UserManagement] Erro ao carregar usuários do Supabase:', error);
        // Fallback para localStorage
        const users = (userService as any).getAllUsers?.() || [];
        setAllUsers(users);
        return;
      }

      const users = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        password: item.password,
        department: item.department,
        role: item.role,
        status: item.status,
        permissions: item.permissions,
        canDeleteApproved: item.canDeleteApproved || false,
        createdAt: item.createdAt
      }));

      console.log('[UserManagement] Total de usuários carregados:', users.length);
      setAllUsers(users);
    } catch (error) {
      console.error('[UserManagement] Erro ao carregar usuários:', error);
      const users = (userService as any).getAllUsers?.() || [];
      setAllUsers(users);
    }
  };

  useEffect(() => {
    loadUsers();
    
    // Listener para sincronização em tempo real (quando Supabase atualiza via polling)
    const handleUsersSync = () => {
      console.log('[UserManagement] Evento users-synced recebido, recarregando lista...');
      loadUsers();
    };
    
    window.addEventListener('users-synced', handleUsersSync);
    return () => window.removeEventListener('users-synced', handleUsersSync);
  }, []);

  const clearMessages = () => {
    setTimeout(() => {
      setSuccessMsg('');
      setErrorMsg('');
    }, 3000);
  };

  const handleAddUser = async () => {
    try {
      if (!newUserForm.name.trim() || !newUserForm.email.trim() || !newUserForm.password.trim()) {
        setErrorMsg('Preencha todos os campos');
        clearMessages();
        return;
      }

      // Managers de departamento: só criar colaborador do próprio departamento
      if (isDeptManager) {
        const isPredefinedManager = MANAGERS_DATA.some(m => m.email.toLowerCase() === newUserForm.email.toLowerCase());
        if (isPredefinedManager) {
          setErrorMsg('Você não pode criar gestores.');
          clearMessages();
          return;
        }
        newUserForm.department = currentUser.department as any;
        newUserForm.role = 'employee';
      }

      const newUser = await userService.register(newUserForm.name, newUserForm.email, newUserForm.password, newUserForm.department);
      
      // Se for gerente pré-definido, ativar automaticamente
      if (newUserForm.role === 'manager') {
        userService.approveUser(newUser.id);
      }

      // Para managers de departamento, força cargo/perm/departamento seguros
      if (isDeptManager) {
        const users = (userService as any).getAllUsers?.() || [];
        const idx = users.findIndex((u: User) => u.id === newUser.id);
        if (idx >= 0) {
          users[idx].role = 'employee';
          (users[idx] as any).permissions = 'own';
          users[idx].department = currentUser.department;
          localStorage.setItem('app_users_v1', JSON.stringify(users));
        }
      }

      setSuccessMsg('Usuário adicionado com sucesso!');
      setNewUserForm({ name: '', email: '', password: '', department: (isDeptManager && currentUser?.department ? currentUser.department : 'administrativo') as any, role: 'employee' });
      setShowAddForm(false);
      loadUsers();
      clearMessages();
    } catch (err: any) {
      setErrorMsg(err.message);
      clearMessages();
    }
  };

  const handleEditUser = (user: User) => {
    if (!canManageUser(user)) return;
    setEditingId(user.id);
    setEditForm({ ...user });
  };

  const handleSaveEdit = () => {
    if (!editForm) return;
    if (!canManageUser(editForm as User)) return;

    try {
      const users = (userService as any).getAllUsers?.() || [];
      const index = users.findIndex((u: User) => u.id === editForm.id);
      
      if (index >= 0) {
        const original = users[index];
        const safeEdit = isDeptManager ? {
          ...editForm,
          department: original.department,
          role: original.role,
          permissions: (original as any).permissions,
        } : editForm;
        users[index] = safeEdit as User;
        localStorage.setItem('app_users_v1', JSON.stringify(users));
        setSuccessMsg('Usuário atualizado com sucesso!');
        setEditingId(null);
        setEditForm(null);
        loadUsers();
        clearMessages();
      }
    } catch (err: any) {
      setErrorMsg('Erro ao atualizar usuário');
      clearMessages();
    }
  };

  const handleDeleteUser = async (id: string) => {
    const target = allUsers.find(u => u.id === id);
    if (!target || !canManageUser(target)) return;
    try {
      console.log('[Delete] Deletando usuário:', id);
      await userService.rejectUser(id);
      setSuccessMsg('Usuário removido com sucesso!');
      setDeleteConfirm(null);
      // Forçar recarregamento
      setTimeout(() => {
        loadUsers();
      }, 100);
      clearMessages();
    } catch (err: any) {
      console.error('[Delete Error]', err);
      setErrorMsg('Erro ao remover usuário: ' + err.message);
      clearMessages();
    }
  };

  const handleStatusChange = (id: string, status: 'active' | 'pending' | 'blocked') => {
    const target = allUsers.find(u => u.id === id);
    if (!target || !canManageUser(target)) return;
    try {
      const users = (userService as any).getAllUsers?.() || [];
      const index = users.findIndex((u: User) => u.id === id);
      
      if (index >= 0) {
        users[index].status = status;
        localStorage.setItem('app_users_v1', JSON.stringify(users));
        setSuccessMsg('Status atualizado com sucesso!');
        loadUsers();
        clearMessages();
      }
    } catch (err: any) {
      setErrorMsg('Erro ao atualizar status');
      clearMessages();
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'pending': return 'Pendente';
      case 'blocked': return 'Bloqueado';
      default: return status;
    }
  };

  const getRoleLabel = (role: string) => {
    return role === 'manager' ? 'Gestor' : 'Colaborador';
  };

  return (
    <>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#f8fafc',
        padding: '24px 16px',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%',
        }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: '#E0F2FE',
              padding: '12px',
              borderRadius: '8px',
            }}>
              <Users size={24} color="#005198" />
            </div>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: 700,
                color: '#1F2937',
              }}>
                Gerenciamento de Usuários
              </h1>
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '13px',
                color: '#6B7280',
              }}>
                Total de usuários cadastrados: {allUsers.length}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: '8px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#F3F4F6'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <X size={24} color="#6B7280" />
            </button>
          )}
        </div>

        {/* Messages */}
        {successMsg && (
          <div style={{
            marginBottom: '16px',
            padding: '12px 16px',
            background: '#F0FDF4',
            border: '1px solid #86EFAC',
            color: '#166534',
            fontSize: '13px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Check size={16} /> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{
            marginBottom: '16px',
            padding: '12px 16px',
            background: '#FEE2E2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            fontSize: '13px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        {/* Add User Button */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #005198 0%, #01adff 100%)',
              color: 'white',
              fontWeight: 700,
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            <Plus size={16} /> Adicionar Novo Usuário
          </button>
        </div>

        {/* Add User Form */}
        {showAddForm && (
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
              Novo Usuário
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '16px',
            }}>
              <input
                type="text"
                placeholder="Nome completo"
                value={newUserForm.name}
                onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #D4D4D8',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#01adff'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#D4D4D8'}
              />
              <input
                type="email"
                placeholder="Email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #D4D4D8',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#01adff'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#D4D4D8'}
              />
              <input
                type="password"
                placeholder="Senha"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #D4D4D8',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#01adff'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#D4D4D8'}
              />
              <select
                value={isDeptManager ? currentUser.department : newUserForm.department}
                onChange={(e) => setNewUserForm({ ...newUserForm, department: e.target.value as any })}
                disabled={isDeptManager}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #D4D4D8',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                  background: isDeptManager ? '#f3f4f6' : 'white',
                  color: isDeptManager ? '#6b7280' : '#000',
                  cursor: isDeptManager ? 'not-allowed' : 'pointer',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#01adff'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#D4D4D8'}
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept.value} value={dept.value}>{dept.label}</option>
                ))}
              </select>
              <select
                value={isDeptManager ? 'employee' : newUserForm.role}
                onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
                disabled={isDeptManager}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #D4D4D8',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                  background: isDeptManager ? '#f3f4f6' : 'white',
                  color: isDeptManager ? '#6b7280' : '#000',
                  cursor: isDeptManager ? 'not-allowed' : 'pointer',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#01adff'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#D4D4D8'}
              >
                <option value="employee">Colaborador</option>
                {!isDeptManager && <option value="manager">Gestor</option>}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleAddUser}
                style={{
                  padding: '10px 16px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#059669'}
                onMouseOut={(e) => e.currentTarget.style.background = '#10b981'}
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewUserForm({ name: '', email: '', password: '', department: (isDeptManager && currentUser?.department ? currentUser.department : 'administrativo') as any, role: 'employee' });
                }}
                style={{
                  padding: '10px 16px',
                  background: '#cbd5e1',
                  color: '#1e293b',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#a8b5c5'}
                onMouseOut={(e) => e.currentTarget.style.background = '#cbd5e1'}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div style={{
          overflowX: 'auto',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
          }}>
            <colgroup>
              <col style={{ width: '12%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '7%' }} />
            </colgroup>
            <thead>
              <tr style={{
                background: '#f1f5f9',
                borderBottom: '1px solid #e2e8f0',
              }}>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 12px',
                  fontWeight: 700,
                  color: '#475569',
                }}>
                  Nome
                </th>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 12px',
                  fontWeight: 700,
                  color: '#475569',
                }}>
                  Email
                </th>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 12px',
                  fontWeight: 700,
                  color: '#475569',
                }}>
                  Departamento
                </th>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 12px',
                  fontWeight: 700,
                  color: '#475569',
                }}>
                  Função
                </th>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 12px',
                  fontWeight: 700,
                  color: '#475569',
                }}>
                  Permissões
                </th>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 12px',
                  fontWeight: 700,
                  color: '#475569',
                }}>
                  Status
                </th>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 12px',
                  fontWeight: 700,
                  color: '#475569',
                }}>
                  Senha
                </th>
                <th style={{
                  textAlign: 'right',
                  padding: '12px 12px',
                  fontWeight: 700,
                  color: '#475569',
                }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{
                    padding: '32px 12px',
                    textAlign: 'center',
                    color: '#a1a5b0',
                  }}>
                    Nenhum usuário cadastrado
                  </td>
                </tr>
              ) : (
                visibleUsers.map((user) => (
                  <tr key={user.id} style={{
                    borderBottom: '1px solid #e2e8f0',
                    background: 'white',
                  }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <td style={{ padding: '12px', color: '#1f2937' }}>
                      {editingId === user.id ? (
                        <input
                          type="text"
                          value={(editForm as any)?.name || ''}
                          onChange={(e) => editForm && setEditForm({ ...editForm, name: e.target.value } as any)}
                          style={{
                            padding: '6px 8px',
                            border: '1px solid #d4d4d8',
                            borderRadius: '4px',
                            width: '100%',
                            fontSize: '13px',
                          }}
                        />
                      ) : (
                        <span style={{ fontWeight: 500 }}>{(user as any).name}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', color: '#64748b' }}>
                      {editingId === user.id ? (
                        <input
                          type="email"
                          value={editForm?.email || ''}
                          onChange={(e) => editForm && setEditForm({ ...editForm, email: e.target.value })}
                          style={{
                            padding: '6px 8px',
                            border: '1px solid #d4d4d8',
                            borderRadius: '4px',
                            width: '100%',
                            fontSize: '13px',
                          }}
                        />
                      ) : (
                        user.email
                      )}
                    </td>
                    <td style={{ padding: '12px', color: '#64748b' }}>
                      {editingId === user.id ? (
                        <select
                          value={editForm?.department || 'administrativo'}
                          onChange={(e) => editForm && setEditForm({ ...editForm, department: e.target.value as any })}
                          disabled={isDeptManager}
                          style={{
                            padding: '6px 8px',
                            border: '1px solid #d4d4d8',
                            borderRadius: '4px',
                            fontSize: '13px',
                            width: '100%',
                            background: isDeptManager ? '#f3f4f6' : 'white',
                            color: isDeptManager ? '#6b7280' : '#000',
                            cursor: isDeptManager ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {DEPARTMENTS.map((dept) => (
                            <option key={dept.value} value={dept.value}>{dept.label}</option>
                          ))}
                        </select>
                      ) : (
                        DEPARTMENTS.find(d => d.value === user.department)?.label
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {editingId === user.id ? (
                        <select
                          value={editForm?.role || 'employee'}
                          onChange={(e) => editForm && setEditForm({ ...editForm, role: e.target.value as any })}
                          disabled={isDeptManager}
                          style={{
                            padding: '6px 8px',
                            border: '1px solid #d4d4d8',
                            borderRadius: '4px',
                            fontSize: '13px',
                            width: '100%',
                            background: isDeptManager ? '#f3f4f6' : 'white',
                            color: isDeptManager ? '#6b7280' : '#000',
                            cursor: isDeptManager ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <option value="employee">Colaborador</option>
                          {!isDeptManager && <option value="manager">Gestor</option>}
                        </select>
                      ) : (
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '13px',
                        }}>
                          {user.role === 'manager' ? (
                            <>
                              <Shield size={16} style={{ color: '#a855f7' }} />
                              <span style={{ color: '#7e22ce', fontWeight: 600 }}>{getRoleLabel(user.role)}</span>
                            </>
                          ) : (
                            <span style={{ color: '#64748b' }}>{getRoleLabel(user.role)}</span>
                          )}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px' }}>
                      {editingId === user.id ? (
                        user.role === 'manager' || editForm?.role === 'manager' ? (
                          <select
                            value={editForm?.permissions || 'own'}
                            onChange={(e) => editForm && setEditForm({ ...editForm, permissions: e.target.value as any })}
                            disabled={isDeptManager}
                            style={{
                              padding: '6px 8px',
                              border: '1px solid #d4d4d8',
                              borderRadius: '4px',
                              fontSize: '13px',
                              width: '100%',
                              background: isDeptManager ? '#f3f4f6' : 'white',
                              color: isDeptManager ? '#6b7280' : '#000',
                              cursor: isDeptManager ? 'not-allowed' : 'pointer',
                            }}
                          >
                            <option value="own">Próprias</option>
                            <option value="department">Departamento</option>
                            <option value="all">Todas (Admin)</option>
                          </select>
                        ) : (
                          <span style={{ color: '#a1a5b0', fontSize: '11px' }}>N/A</span>
                        )
                      ) : (
                        user.role === 'manager' ? (
                          <span style={{ color: '#64748b', fontSize: '12px' }}>
                            {user.permissions === 'all' ? '🔓 Admin Total' : user.permissions === 'department' ? '🏢 Depart.' : '👤 Próprias'}
                          </span>
                        ) : (
                          <span style={{ color: '#a1a5b0', fontSize: '11px' }}>-</span>
                        )
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {editingId === user.id ? (
                        <select
                          value={editForm?.status || 'pending'}
                          onChange={(e) => editForm && setEditForm({ ...editForm, status: e.target.value as any })}
                          style={{
                            padding: '6px 8px',
                            border: '1px solid #d4d4d8',
                            borderRadius: '4px',
                            fontSize: '13px',
                            width: '100%',
                          }}
                        >
                          <option value="active">Ativo</option>
                          <option value="pending">Pendente</option>
                          <option value="blocked">Bloqueado</option>
                        </select>
                      ) : (
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          border: '1px solid',
                          ...(user.status === 'active' ? {
                            background: '#f0fdf4',
                            color: '#166534',
                            borderColor: '#86EFAC'
                          } : user.status === 'pending' ? {
                            background: '#fffbeb',
                            color: '#92400e',
                            borderColor: '#FCD34D'
                          } : {
                            background: '#fee2e2',
                            color: '#991b1b',
                            borderColor: '#FCA5A5'
                          })
                        }}>
                          {getStatusLabel(user.status)}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px', color: '#a1a5b0', fontSize: '12px' }}>
                      {editingId === user.id ? (
                        <input
                          type="password"
                          value={editForm?.password || ''}
                          onChange={(e) => editForm && setEditForm({ ...editForm, password: e.target.value })}
                          placeholder="Nova senha"
                          style={{
                            padding: '6px 8px',
                            border: '1px solid #d4d4d8',
                            borderRadius: '4px',
                            width: '100%',
                            fontSize: '13px',
                          }}
                        />
                      ) : (
                        '••••••'
                      )}
                    </td>
                    <td style={{
                      padding: '12px',
                      textAlign: 'right',
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '8px',
                    }}>
                      {editingId === user.id ? (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            style={{
                              padding: '6px 8px',
                              background: '#f0fdf4',
                              color: '#16a34a',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = '#16a34a';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = '#f0fdf4';
                              e.currentTarget.style.color = '#16a34a';
                            }}
                            title="Salvar"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditForm(null);
                            }}
                            style={{
                              padding: '6px 8px',
                              background: '#f3f4f6',
                              color: '#4b5563',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = '#e5e7eb';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = '#f3f4f6';
                            }}
                            title="Cancelar"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          {canManageUser(user) && (
                            <>
                              <button
                                onClick={() => handleEditUser(user)}
                                style={{
                                  padding: '6px 8px',
                                  background: '#dbeafe',
                                  color: '#2563eb',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s',
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.background = '#2563eb';
                                  e.currentTarget.style.color = 'white';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.background = '#dbeafe';
                                  e.currentTarget.style.color = '#2563eb';
                                }}
                                title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              {user.status === 'blocked' ? (
                                <button
                                  onClick={() => handleStatusChange(user.id, 'active')}
                                  style={{
                                    padding: '6px 8px',
                                    background: '#fef3c7',
                                    color: '#b45309',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.background = '#b45309';
                                    e.currentTarget.style.color = 'white';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.background = '#fef3c7';
                                    e.currentTarget.style.color = '#b45309';
                                  }}
                                  title="Desbloquear"
                                >
                                  <Unlock size={16} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStatusChange(user.id, 'blocked')}
                                  style={{
                                    padding: '6px 8px',
                                    background: '#fef3c7',
                                    color: '#b45309',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.background = '#b45309';
                                    e.currentTarget.style.color = 'white';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.background = '#fef3c7';
                                    e.currentTarget.style.color = '#b45309';
                                  }}
                                  title="Bloquear"
                                >
                                  <Lock size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => setDeleteConfirm(user.id)}
                                style={{
                                  padding: '6px 8px',
                                  background: '#fee2e2',
                                  color: '#dc2626',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s',
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.background = '#dc2626';
                                  e.currentTarget.style.color = 'white';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.background = '#fee2e2';
                                  e.currentTarget.style.color = '#dc2626';
                                }}
                                title="Deletar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          background: 'rgba(30, 41, 59, 0.6)',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
            padding: '24px',
            maxWidth: '448px',
            width: '100%',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
            }}>
              <div style={{
                background: '#fee2e2',
                padding: '8px',
                borderRadius: '50%',
              }}>
                <AlertCircle size={24} color="#dc2626" />
              </div>
              <h3 style={{ fontWeight: 700, color: '#1f2937', margin: 0 }}>Confirmar Exclusão</h3>
            </div>
            <p style={{
              color: '#4b5563',
              marginBottom: '24px',
              margin: '0 0 24px 0',
            }}>
              Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleDeleteUser(deleteConfirm)}
                style={{
                  flex: 1,
                  background: '#dc2626',
                  color: 'white',
                  fontWeight: 700,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#b91c1c'}
                onMouseOut={(e) => e.currentTarget.style.background = '#dc2626'}
              >
                Remover
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  flex: 1,
                  background: '#e5e7eb',
                  color: '#1f2937',
                  fontWeight: 700,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#d1d5db'}
                onMouseOut={(e) => e.currentTarget.style.background = '#e5e7eb'}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default UserManagement;
