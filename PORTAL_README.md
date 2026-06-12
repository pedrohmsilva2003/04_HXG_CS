# 🏢 Portal Corporativo Hexagon

Portal de autenticação unificada para acesso às aplicações corporativas da Hexagon/Leica Geosystems.

## 🎯 Objetivo

Centralizar o acesso a todas as aplicações internas através de um único ponto de entrada com autenticação via Supabase.

## 🧱 Arquitetura

- **Portal Principal**: http://localhost:3019
- **Banco de Dados**: Supabase (compartilhado)
- **Autenticação**: Supabase Auth (SSO)

### Aplicações Integradas

1. **Solicitação de Viagem** - Gestão de solicitações de viagem
2. **Controle de Calibrações** - Controle inteligente de equipamentos

## 🚀 Como Iniciar

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente

O projeto já está configurado com o Supabase compartilhado. As credenciais estão em:
- `.env` (desenvolvimento local)
- `public/env.js` (produção Vercel)

### 3. Executar o projeto

**Usando o script bat:**
```bash
INICIAR_PORTAL.bat
```

**Ou manualmente:**
```bash
npm run dev
```

O portal abrirá automaticamente em: http://localhost:3019

## 🔐 Autenticação

### Login com Supabase

O portal usa Supabase Auth para autenticação. Os usuários são gerenciados centralmente no Supabase.

**Para criar um usuário de teste:**
1. Acesse o Supabase Dashboard
2. Vá em Authentication > Users
3. Crie um novo usuário com email/senha
4. Use essas credenciais para login no portal

### Fluxo de Autenticação

1. Usuário acessa http://localhost:3019
2. Faz login com email/senha
3. Supabase valida as credenciais
4. Dashboard é exibido com as aplicações disponíveis
5. Ao clicar em uma aplicação, o token de autenticação é compartilhado (SSO)

## 🗄️ Banco de Dados

### Supabase Configuration

- **URL**: https://nkohoaygnnpvmjattzit.supabase.co
- **Projeto**: Compartilhado com Solicitação de Viagem e Controle de Calibrações

### Estrutura de Dados

#### Tabela: `users`
```sql
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  name text,
  role text DEFAULT 'colaborador',
  created_at timestamp DEFAULT now()
);
```

## 📦 Deploy na Vercel

### 1. Configurar variáveis de ambiente na Vercel

```
VITE_SUPABASE_URL=https://nkohoaygnnpvmjattzit.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 2. Deploy

```bash
vercel --prod
```

### 3. Domínio Customizado

Após o deploy, configure um domínio personalizado na Vercel:
- Exemplo: `portal.hexagon.com`

## 🛠️ Tecnologias

- **Frontend**: React + TypeScript + Vite
- **Autenticação**: Supabase Auth
- **Banco de Dados**: Supabase (PostgreSQL)
- **Estilização**: CSS-in-JS (React inline styles)
- **Deploy**: Vercel

## 📋 Próximas Funcionalidades

- [ ] SSO completo entre aplicações
- [ ] Gerenciamento de perfil de usuário
- [ ] Recuperação de senha
- [ ] Registro de novos usuários (com aprovação)
- [ ] Dashboard com estatísticas
- [ ] Notificações em tempo real
- [ ] Logs de acesso
- [ ] Permissões granulares por aplicação

## 🔗 Links Relacionados

- [Documentação do Supabase](https://supabase.com/docs)
- [Vercel Deploy](https://vercel.com/docs)
- [React + TypeScript](https://react.dev/)

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com a equipe de TI.
