# 🔐 Configuração de Autenticação com Supabase

## Como Criar Usuários no Supabase

### 1. Acesse o Supabase Dashboard

Acesse: https://supabase.com/dashboard/project/nkohoaygnnpvmjattzit

### 2. Vá para Authentication

No menu lateral esquerdo, clique em **Authentication** > **Users**

### 3. Criar um novo usuário

Clique em **Add user** e preencha:

- **Email**: pedro.silva@leica-geosystems.com
- **Password**: (escolha uma senha segura)
- **Auto Confirm User**: ✅ (marque esta opção)

Clique em **Create user**

### 4. Adicionar informações extras (Opcional)

Para adicionar nome e cargo do usuário, vá em **Database** > **users** (tabela) e insira:

```sql
INSERT INTO users (id, email, name, role)
VALUES (
  'uuid-do-usuario-criado',
  'pedro.silva@leica-geosystems.com',
  'Pedro Silva',
  'colaborador'
);
```

**Nota**: O `id` deve ser o mesmo UUID gerado no Authentication.

### 5. Criar a tabela users (se não existir)

Se a tabela `users` ainda não existir, execute no **SQL Editor**:

```sql
-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  role text DEFAULT 'colaborador' CHECK (role IN ('colaborador', 'gestor', 'admin')),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver apenas seus próprios dados
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Policy: Usuários podem atualizar apenas seus próprios dados
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Admins podem ver todos os usuários
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Roles (Cargos) Disponíveis

- **colaborador**: Acesso básico às aplicações
- **gestor**: Acesso de gestor com permissões extras
- **admin**: Acesso administrativo completo

## Testando o Login

1. Inicie o portal: http://localhost:3019
2. Use as credenciais criadas no Supabase
3. O portal deve autenticar e redirecionar para o dashboard

## Troubleshooting

### Erro: "Email not confirmed"

**Solução**: Ao criar o usuário, certifique-se de marcar **Auto Confirm User**

### Erro: "Invalid login credentials"

**Solução**: Verifique se:
- O email está correto
- A senha está correta
- O usuário foi confirmado no Supabase

### Erro: "User not found in users table"

**Solução**: O usuário existe no Auth mas não na tabela `users`. Execute:

```sql
INSERT INTO users (id, email, name, role)
SELECT id, email, email, 'colaborador'
FROM auth.users
WHERE id NOT IN (SELECT id FROM users);
```

## Integrando com outras aplicações

Para que o SSO funcione entre as aplicações:

1. Todas devem usar o mesmo `SUPABASE_URL` e `SUPABASE_ANON_KEY`
2. Compartilhar o token de sessão via localStorage ou sessionStorage
3. Verificar a sessão ao iniciar cada aplicação

### Exemplo de verificação de sessão:

```typescript
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  // Usuário está logado
  console.log('User:', session.user);
} else {
  // Redirecionar para login
  window.location.href = 'http://localhost:3019';
}
```

## Links Úteis

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Dashboard](https://supabase.com/dashboard)
