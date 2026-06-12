import React, { useCallback, useEffect, useState } from 'react';
import type { User } from "../types";
import { userService } from '../services/userService';
import { Check, X, User as UserIcon, ShieldAlert } from 'lucide-react';
import { DEPARTMENTS } from '../constants';
import { supabase } from '../services/supabaseClient';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onUpdatedCount?: (count: number) => void;
}

const PendingApprovalsModal: React.FC<Props> = ({ isOpen, onClose, onUpdatedCount }) => {
    const [pendingUsers, setPendingUsers] = useState<User[]>([]);
    const [selectedDepartments, setSelectedDepartments] = useState<Record<string, string>>({});

    const loadPending = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('app_users')
                .select('*')
                .eq('status', 'pending');

            if (!error && data) {
                const pending = data.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    email: item.email,
                    password: item.password,
                    department: item.department,
                    role: item.role,
                    status: item.status,
                    permissions: item.permissions,
                    canDeleteApproved: item.canDeleteApproved,
                    createdAt: item.createdAt,
                })) as User[];

                setPendingUsers(pending);
                const map: Record<string, string> = {};
                pending.forEach(u => { map[u.id] = u.department || 'administrativo'; });
                setSelectedDepartments(map);
                onUpdatedCount?.(pending.length);
                return;
            }
        } catch (err) {
            console.error('[PendingApprovalsModal] Erro ao carregar pendências do Supabase:', err);
        }

        const pending = userService.getPendingUsers();
        setPendingUsers(pending);
        const map: Record<string, string> = {};
        pending.forEach(u => { map[u.id] = u.department || 'administrativo'; });
        setSelectedDepartments(map);
        onUpdatedCount?.(pending.length);
    }, [onUpdatedCount]);

    useEffect(() => {
        if (isOpen) loadPending();
    }, [isOpen, loadPending]);

    const handleApprove = async (id: string) => {
        const dept = selectedDepartments[id] || undefined;
        try {
            const { error } = await supabase
                .from('app_users')
                .update({ status: 'active', department: dept })
                .eq('id', id);

            if (error) {
                throw error;
            }
        } catch (err) {
            console.error('[PendingApprovalsModal] Erro ao aprovar no Supabase, usando fallback local:', err);
            userService.approveUser(id, dept);
        }

        await loadPending();
    };

    const handleReject = async (id: string) => {
        if (!window.confirm("Deseja realmente rejeitar este cadastro?")) {
            return;
        }

        try {
            const { error } = await supabase.from('app_users').delete().eq('id', id);
            if (error) {
                throw error;
            }
        } catch (err) {
            console.error('[PendingApprovalsModal] Erro ao rejeitar no Supabase, usando fallback local:', err);
            await userService.rejectUser(id);
        }

        await loadPending();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px', zIndex: 100,
        }}>
            <div style={{
                background: 'white', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
                width: '100%', maxWidth: '640px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '80vh',
            }}>
                <div style={{
                    background: '#FFFBEB', padding: '16px', borderBottom: '1px solid #FDE68A',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: '#FEF3C7', padding: '8px', borderRadius: '9999px' }}>
                            <ShieldAlert size={20} color="#D97706" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>Aprovações Pendentes</h3>
                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Libere o acesso para novos usuários</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ padding: 8, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 8 }}>
                        <X size={20} color="#64748b" />
                    </button>
                </div>

                <div style={{ padding: '16px', overflowY: 'auto', flex: 1, background: '#F8FAFC' }}>
                    {pendingUsers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                            <Check size={48} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px auto' }} />
                            <p style={{ margin: 0 }}>Nenhuma solicitação pendente.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {pendingUsers.map(user => (
                                <div key={user.id} style={{
                                    background: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '12px',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: 40, height: 40, background: '#F1F5F9', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <UserIcon size={18} color="#94a3b8" />
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <h4 style={{ margin: 0, fontWeight: 700, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</h4>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                                            <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>Criado em: {new Date(user.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <select
                                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '14px' }}
                                            value={selectedDepartments[user.id] || 'administrativo'}
                                            onChange={(e) => setSelectedDepartments(prev => ({ ...prev, [user.id]: e.target.value }))}
                                        >
                                            {DEPARTMENTS.map(d => (
                                                <option key={d.value} value={d.value}>{d.label}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => handleReject(user.id)}
                                            style={{ padding: 8, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: 8, cursor: 'pointer' }}
                                            title="Rejeitar"
                                        >
                                            <X size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleApprove(user.id)}
                                            style={{ padding: 8, background: '#ECFDF5', color: '#059669', border: '1px solid #86EFAC', borderRadius: 8, cursor: 'pointer' }}
                                            title="Aprovar Acesso"
                                        >
                                            <Check size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PendingApprovalsModal;
