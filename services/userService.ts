// Import apenas de TIPOS (evita erro em runtime no Vite)
import type { User } from "../types";

import { MANAGERS_DATA } from "../constants";
import { generateUUID } from "../utils/uuid";
import { getSupabase } from "./cloudSync";

const USERS_STORAGE_KEY = "app_users_v1";
const CURRENT_USER_KEY = "app_current_user";

let usersInitialized = false;

/**
 * Inicializa o "banco de dados" local de usuários
 */
const initializeUsers = () => {
  if (usersInitialized) return;

  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    let users: User[] = stored ? JSON.parse(stored) : [];

    if (!Array.isArray(users)) {
      users = [];
    }

    let hasChanges = false;

    // Normaliza usuários antigos (firstName / lastName → name)
    users = users.map((u: any) => {
      if (!u.name && (u.firstName || u.lastName)) {
        return {
          ...u,
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
        } as User;
      }
      return u;
    });

    // Sincronização automática de gerentes definidos em constants.ts
    MANAGERS_DATA.forEach((manager) => {
      const index = users.findIndex(
        (u) => u.email.toLowerCase() === manager.email.toLowerCase()
      );

      if (index === -1) {
        console.log(`[Auto-Create] Criando gerente: ${manager.name}`);

        users.push({
          id: generateUUID(),
          name: manager.name,
          email: manager.email.toLowerCase(),
          password: "123",
          department: (manager as any).department || "administrativo",
          role: "manager",
          status: "active",
          permissions: (manager as any).permissions || "department",
          canDeleteApproved: (manager as any).canDeleteApproved || false,
          createdAt: new Date().toISOString(),
        } as User);

        hasChanges = true;
      } else {
        const existingUser = users[index];
        const managerDeletePerm =
          (manager as any).canDeleteApproved || false;

        if (existingUser.canDeleteApproved !== managerDeletePerm) {
          users[index].canDeleteApproved = managerDeletePerm;
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }

    usersInitialized = true;
  } catch (error) {
    console.error(
      "Erro ao inicializar usuários. Reiniciando base.",
      error
    );
    localStorage.setItem(USERS_STORAGE_KEY, "[]");
    usersInitialized = false;
    initializeUsers();
  }
};

const getUsers = (): User[] => {
  initializeUsers();

  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    const users = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(users)) return [];
    return users as User[];
  } catch {
    return [];
  }
};

const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const userService = {
  // ---------------- AUTH ----------------

  login(email: string, password: string): User {
    const users = getUsers();
    const user = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password
    );

    if (!user) throw new Error("E-mail ou senha inválidos.");
    if (user.status === "pending")
      throw new Error("Sua conta aguarda aprovação.");
    if (user.status === "blocked")
      throw new Error("Sua conta foi bloqueada.");

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  },

  async register(
    name: string,
    email: string,
    password: string,
    department: string = ""
  ): Promise<User> {
    const isDev = (import.meta as any).env?.DEV;

    if (isDev) {
      const users = getUsers();

      if (users.some((u) => u.email === email.toLowerCase())) {
        throw new Error("Este e-mail já está cadastrado.");
      }

      const isManager = MANAGERS_DATA.some(
        (m) => m.email.toLowerCase() === email.toLowerCase()
      );

      const newUser: User = {
        id: generateUUID(),
        name,
        email: email.toLowerCase(),
        password,
        department: department || undefined,
        role: isManager ? "manager" : "employee",
        status: isManager ? "active" : "pending",
        createdAt: new Date().toISOString(),
      } as User;

      users.push(newUser);
      saveUsers(users);
      return newUser;
    }

    // PRODUÇÃO (Supabase)
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase não inicializado");

    const { data } = await supabase
      .from("app_users")
      .select("id")
      .eq("email", email.toLowerCase());

    if (data && data.length > 0) {
      throw new Error("Este e-mail já está cadastrado.");
    }

    const newUser: User = {
      id: generateUUID(),
      name,
      email: email.toLowerCase(),
      password,
      department: department || undefined,
      role: "employee",
      status: "pending",
      createdAt: new Date().toISOString(),
    } as User;

    const { error } = await supabase.from("app_users").insert([newUser]);
    if (error) throw error;

    return newUser;
  },

  logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (!stored) return null;

      const user = JSON.parse(stored) as User;
      if (!user.email || !user.role) {
        localStorage.removeItem(CURRENT_USER_KEY);
        return null;
      }

      const users = getUsers();
      const updated = users.find(
        (u) => u.email.toLowerCase() === user.email.toLowerCase()
      );

      if (updated) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
        return updated;
      }

      return user;
    } catch {
      localStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }
  },

  // ---------------- ADMIN ----------------

  getPendingUsers(): User[] {
    return getUsers().filter((u) => u.status === "pending");
  },

  getAllUsers(): User[] {
    return getUsers();
  },

  approveUser(id: string, department?: string) {
    const users = getUsers();
    const index = users.findIndex((u) => u.id === id);

    if (index >= 0) {
      users[index].status = "active";
      if (department) users[index].department = department as any;
      saveUsers(users);
    }
  },

  async rejectUser(id: string) {
    const isDev = (import.meta as any).env?.DEV;

    if (isDev) {
      const users = getUsers().filter((u) => u.id !== id);
      saveUsers(users);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) return;

    await supabase.from("app_users").delete().eq("id", id);
  },

  // ---------------- RESET ----------------

  resetAllData() {
    localStorage.removeItem(USERS_STORAGE_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    initializeUsers();
  },
};
