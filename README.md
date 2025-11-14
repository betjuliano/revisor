# Revisor de Artigos Acadêmicos AI

Aplicação completa para revisar textos acadêmicos com a API Gemini. O front-end em React conversa com um backend Express que persiste usuários, créditos e transações diretamente no Postgres do Supabase *self-hosted* e mantém um snapshot local em `data/users.json` (gitignored) para auditoria manual ou concessão de créditos fora do fluxo da aplicação.

## Visão geral da arquitetura

- **Front-end (React + Vite):** interface para login, revisão de textos e gerenciamento de créditos.
- **Backend (Express):** expõe uma API REST (`server/index.js`) que grava e lê dados das tabelas `users` e `transactions` via driver `pg` diretamente no Postgres do Supabase self-hosted e sincroniza um arquivo local `data/users.json`.
- **Supabase self-hosted:** armazena os dados persistentes (banco Postgres do projeto sugerido: `revisor`). Configure as variáveis `POSTGRES_*` apontando para a instância hospedada na VPS.
- **Snapshots locais:** `data/users.json` é criado automaticamente e pode ser editado manualmente para ajustes emergenciais de créditos/usuários. O arquivo é ignorado pelo Git.

## Pré-requisitos

- Node.js 20+
- Instância Supabase/Postgres self-hosted acessível (ex.: `revisor`)
- Chave da API Gemini

## Configuração do Supabase

1. Garanta que o Postgres do Supabase self-hosted está acessível a partir da VPS (ex.: `postgres://postgres:senha@host:5432/revisor`).
2. No editor SQL do Supabase (ou via `psql`), execute o script abaixo para criar as tabelas utilizadas pelo backend:

```sql
create table if not exists public.users (
  id bigint generated always as identity primary key,
  name text,
  email text unique not null,
  cpf text,
  tier text default 'free',
  role text default 'user',
  credits integer default 0,
  free_words_used integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.transactions (
  id bigint generated always as identity primary key,
  user_id bigint not null references public.users(id) on delete cascade,
  credits integer not null,
  amount numeric(10,2) default 0,
  method text default 'PIX',
  created_at timestamptz default now()
);

alter table public.users enable row level security;
alter table public.transactions enable row level security;
```

> **Bucket para arquivos:** caso deseje armazenar exportações ou anexos, crie um bucket privado no Storage. Em uma instância Supabase tradicional execute:
>
> ```sql
> insert into storage.buckets (id, name, public)
> values ('revisor-user-data', 'revisor-user-data', false)
> on conflict (id) do nothing;
> ```
>
> Se o schema `storage` não estiver presente (instalação mínima do Supabase), habilite o módulo de Storage antes de executar o comando.

## Configuração do projeto

1. Clone este repositório e instale as dependências:

   ```bash
   npm install
   ```

2. Copie o arquivo de exemplo de variáveis de ambiente:

   ```bash
   cp .env.example .env
   ```

3. Preencha os valores no `.env`:
   - `VITE_GEMINI_API_KEY`: chave da API Gemini.
   - `VITE_API_BASE_URL`: URL onde o backend estará disponível (em desenvolvimento use `http://localhost:4000`).
   - `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: credenciais do Postgres self-hosted.
   - Opcionalmente `DATABASE_URL`: string única de conexão (`postgres://usuario:senha@host:5432/db`).
   - `POSTGRES_SSL`: defina como `true` se o banco exigir TLS.
   - (Opcional) `PORT`: porta para o servidor Express (padrão 4000).

## Executando localmente

O backend e o front-end podem ser iniciados em paralelo com um único comando:

```bash
npm run dev:full
```

Caso prefira controlar manualmente:

```bash
# Terminal 1 - API
npm run server

# Terminal 2 - Front-end Vite
npm run dev
```

O snapshot `data/users.json` será criado automaticamente no primeiro acesso ao backend.

## Ajustes manuais de créditos/usuários

- O arquivo `data/users.json` traz todos os usuários e transações consolidados do Supabase. Ele é gerado sempre que ocorre uma alteração (login, adição de créditos, consumo etc.).
- Para conceder créditos manualmente, edite `data/users.json` (ajuste os campos `credits`, `freeWordsUsed`, `tier` ou adicione uma nova transação com `id` vazio) e execute:

  ```bash
  npm run sync:snapshot
  ```

  O script sincroniza as alterações diretamente com o Postgres do Supabase self-hosted, registra transações inéditas (baseadas em `credits`/`amount`/`method`/`createdAt`) e recria o arquivo `data/users.json` com os dados oficiais do banco.

## Variáveis importantes

| Componente        | Variável                         | Descrição |
|-------------------|----------------------------------|-----------|
| Front-end         | `VITE_GEMINI_API_KEY`           | Chave da API Gemini usada nas requisições ao Gemini |
| Front-end         | `VITE_API_BASE_URL`             | URL base para acessar a API Express |
| Backend           | `POSTGRES_HOST` / `POSTGRES_PORT` | Host/porta do Postgres self-hosted |
| Backend           | `POSTGRES_USER` / `POSTGRES_PASSWORD` | Credenciais do banco |
| Backend           | `POSTGRES_DB`                   | Nome do banco (ex.: `revisor`) |
| Backend (opcional)| `DATABASE_URL`                  | String única de conexão Postgres |
| Backend (opcional)| `POSTGRES_SSL`                  | Define o uso de TLS (`true`/`false`) |
| Backend (opcional)| `PORT`                          | Porta local da API |

## Docker

### Build das imagens

```bash
# API
docker build -f Dockerfile.server -t registry.example.com/revisor-api:latest .

# Front-end (substitua pela URL real da API)
docker build \
  -f Dockerfile.web \
  -t registry.example.com/revisor-web:latest \
  --build-arg VITE_API_BASE_URL=https://api.seudominio.com .
```

### Execução local com Docker Compose (opcional)

```bash
docker network create revisor-local || true

docker run --rm -it --name revisor-api \
  --network revisor-local \
  -e POSTGRES_HOST=... \
  -e POSTGRES_USER=... \
  -e POSTGRES_PASSWORD=... \
  -e POSTGRES_DB=... \
  -p 4000:4000 \
  registry.example.com/revisor-api:latest

docker run --rm -it --name revisor-web \
  --network revisor-local \
  -p 5173:80 \
  registry.example.com/revisor-web:latest
```

## Deploy na VPS (Docker Swarm + Traefik)

1. **Pré-requisitos**
   - DNS apontando para a VPS (`nslookup app.seudominio.com`)
   - Swarm inicializado (`docker swarm init`)
   - Rede `iaprojetos` criada (`docker network create --driver overlay iaprojetos`)
   - Traefik no Swarm com Let's Encrypt (exemplo em `traefik-stack.yml` fornecido pelo cliente)

2. **Crie segredos/variáveis**
   ```bash
   echo "<host-do-postgres>" | docker secret create revisor_pg_host -
   echo "<usuario>" | docker secret create revisor_pg_user -
   echo "<senha>" | docker secret create revisor_pg_password -
   echo "<nome-do-banco>" | docker secret create revisor_pg_db -
   ```
   Adapte os nomes conforme sua política de segurança ou utilize `DATABASE_URL` diretamente (ex.: `postgres://usuario:senha@host:5432/revisor`).

3. **Faça push das imagens** para um registry acessível pelo Swarm (`registry.example.com` é um placeholder).

4. **Edite `deploy/stack.yml`**:
   - Substitua os hosts `api.seudominio.com` e `app.seudominio.com` pelo seu domínio.
   - Referencie suas imagens (`registry.example.com/...`).
   - Configure variáveis/secrets conforme o passo 2 (mapeando secrets para variáveis `POSTGRES_*` ou `DATABASE_URL`).

5. **Faça o deploy**:

   ```bash
   docker stack deploy -c deploy/stack.yml revisor
   ```

   O Traefik cuidará da emissão/renovação de certificados via Let's Encrypt.

## Testes

- `npm run build`: garante que o front-end compila.
- `npm run server`: inicia a API e valida a conexão com o Postgres.
- `npm run sync:snapshot`: aplica ajustes feitos no arquivo `data/users.json` diretamente no banco Postgres.

## Suporte

- Dados persistentes: Postgres do Supabase self-hosted (`users`, `transactions`).
- Snapshots e auditoria: `data/users.json`.
- Para ajustes emergenciais de créditos, utilize o painel admin ou edite os registros via Postgres/Supabase Studio diretamente.
