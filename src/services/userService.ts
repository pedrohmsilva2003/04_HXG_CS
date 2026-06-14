// Import relativo para garantir resolucao local do projeto
import type { User } from "../types";
import { MANAGERS_DATA } from "../constants";
import { generateUUID } from "../utils/uuid";
import { getSupabase } from "./cloudSync";
import { hashPassword, verifyPassword, isHashed } from "../utils/crypto";

const USERS_STORAGE_KEY = 'app_users_v1';
const CURRENT_USER_KEY = 'app_current_user';
let usersInitialized = false;

// Inicializa o "banco de dados" de usuários
const initializeUsers = () => {
    if (usersInitialized) return; // Evita reinicialização múltipla
    try {
        const stored = localStorage.getItem(USERS_STORAGE_KEY);
        let users: User[] = stored ? JSON.parse(stored) : [];
        
        // Proteção contra dados corrompidos (não array)
        if (!Array.isArray(users)) {
            users = [];
        }

        let hasChanges = false;

        // 1. Se o banco estiver vazio, cria base inicial (opcional, pois o passo 2 cobre isso)
        // Mantemos por clareza se nenhum manager existisse.
        if (users.length === 0) {
           // O passo 2 irá popular
        }

        // Normalize old user shapes: if stored users used firstName/lastName, convert to name
        users = users.map(u => {
            if (!u.name && (u as any).firstName) {
                return { ...u, name: `${(u as any).firstName || ''} ${(u as any).lastName || ''}`.trim() } as User;
            }
            return u;
        });

        // Migrar senhas padrão inseguras para forçar troca
        users = users.map(u => {
            if (u.password === '123' && u.role === 'manager' && !u.mustChangePassword) {
                hasChanges = true;
                return { ...u, mustChangePassword: true } as User;
            }
            return u;
        });

        // 2. SINCRONIZAÇÃO DE GERENTES (CRÍTICO)
        // Garante que todos os gerentes definidos em constants.ts existam no banco local
        // Isso permite adicionar 'Pedro Silva' via código e ele aparecer automaticamente.
        MANAGERS_DATA.forEach(manager => {
            // Verifica se já existe usuário com esse email (case insensitive)
            const existingIndex = users.findIndex(u => u.email.toLowerCase() === manager.email.toLowerCase());
            
            if (existingIndex === -1) {
                console.log(`[Auto-Create] Criando gerente definido no código: ${manager.name}`);
                users.push({
                    id: generateUUID(),
                    name: manager.name,
                    email: manager.email.toLowerCase(),
                    password: Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6).toUpperCase() + '!',
                    mustChangePassword: true,
                    department: (manager as any).department || 'administrativo',
                    role: 'manager',
                    status: 'active',
                    permissions: (manager as any).permissions || 'department',
                    canDeleteApproved: (manager as any).canDeleteApproved || false,
                    createdAt: new Date().toISOString()
                } as User);
                hasChanges = true;
            } else {
                // Sincroniza permissões especiais (ex: canDeleteApproved) do constants.ts
                const existingUser = users[existingIndex];
                const managerHasDeletePerm = (manager as any).canDeleteApproved || false;
                
                if (existingUser.canDeleteApproved !== managerHasDeletePerm) {
                    console.log(`[Update] Atualizando canDeleteApproved para ${manager.name}: ${managerHasDeletePerm}`);
                    users[existingIndex].canDeleteApproved = managerHasDeletePerm;
                    hasChanges = true;
                }
            }
        });

        if (hasChanges) {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        }

        // Sincronização com Supabase removida - dados agora vêm diretamente do Supabase
        usersInitialized = true; // Marca como inicializado
    } catch (e) {
        // Se houver erro crítico no JSON, reinicia o banco
        console.error("Erro ao inicializar usuários, reiniciando banco.", e);
        localStorage.setItem(USERS_STORAGE_KEY, '[]');
        usersInitialized = false; // Reseta a flag para tentar novamente
        // Chama recursivamente para recriar os padrões
        initializeUsers();
    }
};

const getUsers = (): User[] => {
    initializeUsers(); // Verifica e atualiza dados a cada chamada (seguro para mock local)
    try {
        const stored = localStorage.getItem(USERS_STORAGE_KEY);
        const users = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(users)) return [];
        // Normalize any legacy firstName/lastName to name
        const normalized = users.map((u: any) => {
            if (!u.name && (u.firstName || u.lastName)) {
                return { ...u, name: `${u.firstName || ''} ${u.lastName || ''}`.trim() };
            }
            return u;
        });
        return normalized as User[];
    } catch {
        return [];
    }
};

const saveUsers = (users: User[]) => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    // Sincronização automática removida - dados agora vêm diretamente do Supabase
};

// Listener para sincronização removido - não mais necessário

export const userService = {
    login: async (email: string, password: string): Promise<User> => {
        const isDev = (import.meta as any).env?.DEV;
        if (!isDev) {
            const supabase = getSupabase();
            if (supabase) {
                const { data, error } = await supabase
                    .from('app_users')
                    .select('*')
                    .eq('email', email.toLowerCase())
                    .maybeSingle();
                if (error) throw new Error('Erro ao consultar o banco de dados.');
                if (!data) throw new Error('E-mail ou senha inválidos.');
                const passwordOk = await verifyPassword(password, data.password ?? '');
                if (!passwordOk) throw new Error('E-mail ou senha inválidos.');
                if (data.status === 'pending') throw new Error('Sua conta aguarda aprovação de um gerente.');
                if (data.status === 'blocked') throw new Error('Sua conta foi bloqueada.');
                if (data.password && !isHashed(data.password)) {
                    const hashed = await hashPassword(password);
                    await supabase.from('app_users').update({ password: hashed }).eq('id', data.id);
                }
                const user: User = {
                    id: data.id, name: data.name, email: data.email,
                    password: data.password ?? '', department: data.department ?? undefined,
                    role: data.role, status: data.status ?? 'active',
                    permissions: data.permissions ?? undefined,
                    canDeleteApproved: data.canDeleteApproved ?? false,
                    mustChangePassword: data.must_change_password ?? false,
                    createdAt: data.createdAt ?? new Date().toISOString(),
                };
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
                return user;
            }
        }
        // DEV fallback: localStorage
        const users = getUsers();
        const userByEmail = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!userByEmail) {
            throw new Error("E-mail ou senha inválidos.");
        }

        const passwordOk = await verifyPassword(password, userByEmail.password);
        if (!passwordOk) {
            throw new Error("E-mail ou senha inválidos.");
        }

        if (userByEmail.status === 'pending') {
            throw new Error("Sua conta aguarda aprovação de um gerente.");
        }
        if (userByEmail.status === 'blocked') {
            throw new Error("Sua conta foi bloqueada.");
        }

        if (!isHashed(userByEmail.password)) {
            const allUsers = getUsers();
            const idx = allUsers.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
            if (idx >= 0) {
                allUsers[idx].password = await hashPassword(password);
                saveUsers(allUsers);
            }
        }

        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userByEmail));
        return userByEmail;
    },

    register: async (name: string, email: string, password: string, department: string = ''): Promise<User> => {
        const isDev = (import.meta as any).env?.DEV;
        const hashedPwd = await hashPassword(password);
        if (isDev) {
            const users = getUsers();
            if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
                throw new Error("Este e-mail já está cadastrado.");
            }
            const isPredefinedManager = MANAGERS_DATA.some(m => m.email.toLowerCase() === email.toLowerCase());
            const newUser: User = {
                id: generateUUID(),
                name,
                email: email.toLowerCase(),
                password: hashedPwd,
                department: department ? (department as any) : undefined,
                role: isPredefinedManager ? 'manager' : 'employee',
                status: isPredefinedManager ? 'active' : 'pending',
                createdAt: new Date().toISOString()
            } as User;
            users.push(newUser);
            saveUsers(users);
            return newUser;
        } else {
            // Produção: verifica duplicidade no Supabase
            const supabase = getSupabase();
            if (!supabase) throw new Error("Supabase não inicializado");
            const { data, error } = await supabase
                .from('app_users')
                .select('id')
                .eq('email', email.toLowerCase());
            if (error) throw new Error("Erro ao consultar Supabase: " + error.message);
            if (data && data.length > 0) {
                throw new Error("Este e-mail já está cadastrado.");
            }
            // Verifica se o e-mail está na lista de gerentes (MANAGERS_DATA)
            const isPredefinedManager = MANAGERS_DATA.some(m => m.email.toLowerCase() === email.toLowerCase());
            const newUser: User = {
                id: generateUUID(),
                name,
                email: email.toLowerCase(),
                password: hashedPwd,
                department: department ? (department as any) : undefined,
                role: isPredefinedManager ? 'manager' : 'employee',
                status: isPredefinedManager ? 'active' : 'pending',
                createdAt: new Date().toISOString()
            } as User;
            // Insere no Supabase
            const { error: insertError } = await supabase
                .from('app_users')
                .insert([newUser]);
            if (insertError) throw new Error("Erro ao cadastrar usuário: " + insertError.message);
            return newUser;
        }
    },

    logout: () => {
        localStorage.removeItem(CURRENT_USER_KEY);
    },

    getCurrentUser: (): User | null => {
        try {
            const stored = localStorage.getItem(CURRENT_USER_KEY);
            const user = stored ? JSON.parse(stored) : null;
            
            // Validação de segurança: Se o objeto de usuário estiver incompleto ou corrompido, força logout
            if (user && (!user.email || !user.role)) {
                console.warn("Usuário corrompido detectado, forçando logout.");
                localStorage.removeItem(CURRENT_USER_KEY);
                return null;
            }
            
            // Sincroniza com dados atualizados do banco (ex: canDeleteApproved)
            if (user) {
                const users = getUsers();
                const updatedUser = users.find(u => u.email.toLowerCase() === user.email.toLowerCase());
                if (updatedUser) {
                    // Atualiza a sessão com dados mais recentes
                    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
                    return updatedUser;
                }
            }
            
            return user;
        } catch {
            localStorage.removeItem(CURRENT_USER_KEY);
            return null;
        }
    },

    // --- Métodos Administrativos ---

    getPendingUsers: (): User[] => {
        return getUsers().filter(u => u.status === 'pending');
    },

    getAllUsers: (): User[] => {
        return getUsers();
    },

    approveUser: (id: string, department?: string) => {
        const users = getUsers();
        const index = users.findIndex(u => u.id === id);
        if (index >= 0) {
            users[index].status = 'active';
            if (department) {
                users[index].department = department as any;
            }
            saveUsers(users);
        }
    },

    rejectUser: async (id: string) => {
        const isDev = (import.meta as any).env?.DEV;
        if (isDev) {
            const users = getUsers();
            const newUsers = users.filter(u => u.id !== id); // Remove o usuário
            saveUsers(newUsers);
            console.log(`[Delete User] Usuário ${id} removido localmente. Total restante: ${newUsers.length}`);
            return;
        }
        // Produção: remove do Supabase
        const supabase = getSupabase();
        if (supabase) {
            const { error } = await supabase.from('app_users').delete().eq('id', id);
            if (error) {
                console.error('[Supabase] Erro ao deletar usuário:', error);
                throw error;
            }
            console.log(`[Supabase] Usuário ${id} removido do banco.`);
        }
    },

    // --- Função de Recuperação ---
    resetAllData: () => {
        try {
            localStorage.removeItem(USERS_STORAGE_KEY);
            localStorage.removeItem(CURRENT_USER_KEY);
            localStorage.removeItem('travel_history');
            localStorage.removeItem('app_pending_approvals');
            console.log("Todos os dados foram resetados com sucesso.");
            // Reinicializa com dados padrão
            initializeUsers();
        } catch (e) {
            console.error("Erro ao resetar dados:", e);
        }
    }
};
