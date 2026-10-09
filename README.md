# Portfólio Fullstack 3D · Da pista para o código

Portfólio de um ex-piloto que virou dev: frontend imersivo em React Three Fiber com tema de Fórmula 1 e painel administrativo próprio.

**Hero:** traçados reais de **Spa-Francorchamps, Interlagos, Monaco e Yas Marina** em 3D, com seletor de circuito (BEL · BRA · MON · ABU) (com o relevo de Eau Rouge e da subida até Les Combes), setores coloridos como na cronometragem da F1 e um carro de F1 dando voltas com velocidades de uma simulação de volta. Um HUD de telemetria mostra velocidade, marcha, setores e a curva atual; o botão **Câmera onboard** coloca a câmera atrás do carro.

| Camada   | Stack                                                                       |
| -------- | --------------------------------------------------------------------------- |
| Frontend | React 19, Vite, TypeScript, SCSS Modules, React Three Fiber + drei, Motion  |
| Dados    | TanStack Query, React Hook Form + Zod                                       |
| Backend  | Node.js, Express 5, TypeScript, Prisma 7 (adapter `pg`), JWT, Multer        |
| Banco    | PostgreSQL 16 (Docker Compose)                                              |
| Contrato | `@portfolio/shared`: schemas Zod + DTOs usados pela API **e** pelo frontend |

## Arquitetura

Monorepo com **npm workspaces**: um `npm install`, um `npm run dev`. API e web validam com os mesmos schemas Zod, então uma regra de validação nunca diverge entre os dois lados.

```
portfolio-marcelo/
├─ docker-compose.yml         Postgres 16 (porta 5433 no host)
├─ packages/shared/           Contrato: schemas Zod, constantes e DTOs
├─ apps/api/
│  ├─ prisma/                 schema.prisma, migrations, seed.ts
│  └─ src/
│     ├─ app.ts               createApp(): middlewares + rotas (testável sem abrir porta)
│     ├─ server.ts            bootstrap + graceful shutdown
│     ├─ config/env.ts        variáveis de ambiente validadas com Zod (falha no boot)
│     ├─ lib/                 prisma client, storage (interface + disco local)
│     ├─ middlewares/         authenticate, validate, upload, errorHandler
│     └─ modules/<recurso>/   routes → controller → service → repository
└─ apps/web/
   ├─ scripts/                gerador do carro (.glb) e dos dados do circuito
   │  └─ data/                traçados dos circuitos (GeoJSON, MIT) + licença
   ├─ public/models/f1-car.glb  carro de F1 low-poly comprimido (~60 KB)
   └─ src/
      ├─ styles/              tokens, mixins, reset (SCSS)
      ├─ components/          UI compartilhada (Button, Section, Navbar…)
      └─ features/
         ├─ hero/             Canvas R3F, circuito, carro, câmeras (aérea/onboard), HUD
         │  └─ track/         dados gerados dos circuitos + lógica de volta (testada)
         ├─ projects/ about/ skills/   seções que consomem a API
         └─ admin/            login, lista, formulário, upload (chunk lazy)
```

**Camadas da API:** o controller só conhece HTTP, o service guarda as regras (slug único, limite de imagens, validação de arquivo) e o repository é o único que fala com o Prisma.

## Guia de execução

Pré-requisitos: Node.js ≥ 22.12 e Docker Desktop **aberto**.

```bash
# 1. Dependências (npm 11+ pode pedir aprovação dos install scripts do Prisma/esbuild:
#    já estão liberados em "allowScripts" no package.json)
npm install

# 2. Variáveis de ambiente da API: ajuste JWT_SECRET, ADMIN_EMAIL e ADMIN_PASSWORD
cp apps/api/.env.example apps/api/.env

# 3. Banco + migrations + seed (admin, perfil, skills e projetos de exemplo)
npm run setup

# 4. API (http://localhost:3333) + web (http://localhost:5173)
npm run dev
```

- Site: http://localhost:5173
- Painel: http://localhost:5173/admin (login com `ADMIN_EMAIL` / `ADMIN_PASSWORD` do `.env`)
- Para trocar a senha do admin, altere o `.env` e rode `npm run db:seed` de novo (o seed é idempotente e não sobrescreve conteúdo editado no painel).

### Scripts úteis

| Comando                                   | O que faz                                                                                                                   |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                             | API (tsx watch) + web (Vite) em paralelo                                                                                    |
| `npm run test`                            | API: integração em banco próprio (`portfolio_test`, criado e zerado automaticamente) · Web: lógica de volta e cronometragem |
| `npm run typecheck`                       | TypeScript em todos os workspaces                                                                                           |
| `npm run lint`                            | ESLint                                                                                                                      |
| `npm run build`                           | Bundle da API (tsdown) + build do web (Vite)                                                                                |
| `npm run db:migrate`                      | Cria/aplica migration após mudar o `schema.prisma`                                                                          |
| `npm run db:studio`                       | Prisma Studio                                                                                                               |
| `npm run model:generate`                  | Regenera o `f1-car.glb`                                                                                                     |
| `npm run track:build -w @portfolio/web`   | Regera os dados do circuito (linha central, altimetria, setores, simulação de volta)                                        |
| `npm run track:analyze -w @portfolio/web` | Lista as curvas do traçado (raio e posição) para calibrar nomes e setores                                                   |

### Como o Hero funciona

- **Circuitos:** cada um é configurado em `apps/web/scripts/circuits.config.ts` (arquivo de origem, posição da linha de chegada, altimetria, setores e curvas com nome). `npm run track:build -w @portfolio/web` lê os GeoJSON, reamostra a linha central a cada 5 m, gira o traçado para o eixo longo ficar na horizontal e gera `src/features/hero/track/circuits/` (metadados leves no bundle principal; geometria só no chunk do 3D).
- **Altimetria:** perfis aproximados, aplicados com exagero vertical de 3x (limitado para circuitos curtos como Monaco) para o relevo ficar legível: Eau Rouge/Les Combes em Spa, Descida do Lago/Subida dos Boxes em Interlagos, Cassino/túnel em Monaco.
- **Trajetória de corrida:** o carro não anda no centro da pista. `scripts/racing-line.ts` calcula, para cada circuito, a linha de **mínima curvatura** dentro da largura real do asfalto (13 m em Spa, 14 m em Interlagos, 9 m em Monaco, 15 m em Yas Marina): abre na entrada, toca o ápice por dentro e volta para fora na saída. É um gradiente projetado da "energia de flexão" da linha, resolvido em grades sucessivas, com a linha central levemente suavizada antes (o traçado vem de GPS). Na cena, as linhas coloridas de setor desenham essa trajetória e o carro segue por ela (`track/racingLine.ts`).
- **Simulação de volta:** o mesmo carro em todos os circuitos, sobre a trajetória de corrida. A velocidade em cada ponto vem do raio da curva (aderência lateral e frenagem crescendo com a downforce) e de potência e arrasto nas retas, com passadas de aceleração e frenagem. Resultados (perto de poles reais recentes):

  | Circuito   | Volta simulada | Ganho da trajetória sobre o centro | Faixa de velocidade |
  | ---------- | -------------- | ---------------------------------- | ------------------- |
  | Spa        | 1:42.7         | 3,3 s                              | 69–327 km/h         |
  | Interlagos | 1:09.4         | 3,4 s                              | 75–326 km/h         |
  | Monaco     | 1:09.8         | 6,6 s                              | 52–309 km/h         |
  | Yas Marina | 1:25.2         | 5,3 s                              | 73–325 km/h         |

  É uma aproximação didática, não um simulador.

- **Escala do carro:** na câmera aérea o carro é exagerado (em escala real seria um ponto num mapa de vários km, como nos grafismos de TV); na onboard ele volta à proporção da pista.
- **Desempenho:** o three.js inteiro entra num chunk lazy; o loop de render para quando o Hero sai da tela; HUD e rótulos de curva leem o estado do 3D num `requestAnimationFrame` próprio e escrevem direto no DOM (sem re-render do React).

### Usando seu próprio carro

```bash
npm run model:optimize -w @portfolio/web -- ~/Downloads/meu-carro.glb public/models/f1-car.glb
```

O `RaceCar` escala qualquer `.glb` pelo comprimento (frente em +Z) e gira os nós chamados `Wheel_*` conforme a velocidade.

### Créditos

Traçados de Spa-Francorchamps, Interlagos, Monaco e Yas Marina: [bacinger/f1-circuits](https://github.com/bacinger/f1-circuits), licença MIT (ver `apps/web/scripts/data/LICENSE-f1-circuits.md`).

## API

| Método | Rota                                           | Auth                                 |
| ------ | ---------------------------------------------- | ------------------------------------ |
| GET    | `/api/health`                                  |                                      |
| GET    | `/api/projects` · `/api/projects/:slug`        |                                      |
| GET    | `/api/skills` · `/api/profile`                 |                                      |
| POST   | `/api/auth/login` · `/api/auth/logout`         |                                      |
| GET    | `/api/auth/me`                                 | ✔                                    |
| GET    | `/api/admin/projects`                          | ✔                                    |
| POST   | `/api/admin/projects`                          | ✔                                    |
| GET    | `/api/admin/projects/:id`                      | ✔                                    |
| PATCH  | `/api/admin/projects/:id`                      | ✔                                    |
| DELETE | `/api/admin/projects/:id`                      | ✔                                    |
| POST   | `/api/admin/projects/:id/images`               | ✔ (multipart, campo `images`, até 6) |
| DELETE | `/api/admin/projects/:id/images/:imageId`      | ✔                                    |
| CRUD   | `/api/admin/skills` · `PUT /api/admin/profile` | ✔                                    |
| GET    | `/api/admin/audit-logs?entity=&cursor=&limit=` | ✔                                    |

Erros seguem sempre o formato `{ "error": { "code", "message", "details?" } }`.

### Segurança

**Autenticação e sessão**

- JWT HS256 (8h) em **cookie httpOnly + SameSite=Strict** (Secure em produção): o JavaScript da página não lê o token, e o navegador não envia o cookie em requisições cross-site. `Authorization: Bearer` também é aceito, útil para curl e integrações.
- **Revogação imediata:** cada token carrega a `tokenVersion` do admin, conferida no banco a cada requisição. O **logout encerra a sessão em todos os dispositivos**, e trocar a senha (via `.env` + `npm run db:seed`) também. Um token roubado deixa de valer na hora, sem esperar as 8h.
- Login com rate limit (5 falhas / 15 min), bcrypt custo 12 e comparação em tempo constante mesmo para e-mail inexistente.

**Trilha de auditoria** (painel → _Atividade_, ou `GET /api/admin/audit-logs`)

- Toda escrita (projetos, imagens, habilidades, perfil) e todo login, logout e **tentativa de login falha** geram um registro com autor, IP, navegador, `requestId` e o diff `antes → depois`.
- O registro é gravado **na mesma transação** da alteração: não existe mudança sem rastro, nem rastro de mudança que não aconteceu.
- **Append-only no banco:** um trigger do Postgres recusa `UPDATE`/`DELETE` em `audit_logs`, inclusive vindos da própria aplicação. Expurgo por política de retenção é tarefa de DBA:

  ```sql
  BEGIN;
  ALTER TABLE audit_logs DISABLE TRIGGER audit_logs_append_only;
  DELETE FROM audit_logs WHERE created_at < now() - interval '2 years';
  ALTER TABLE audit_logs ENABLE TRIGGER audit_logs_append_only;
  COMMIT;
  ```

- **Logs de requisição** estruturados (pino, JSON em produção) com método, rota, status, duração, IP e admin. O header `X-Request-Id` liga cada log técnico ao registro de auditoria correspondente. Cookies, `Authorization` e senhas são mascarados.

**Uploads**

- Whitelist de MIME, limite de tamanho e **validação por magic bytes** (um `.php` renomeado para `.png` é recusado).
- **Re-encoding com sharp:** toda imagem é decodificada e gravada de novo em WebP. Metadados (EXIF, **localização GPS**, XMP) e qualquer conteúdo escondido no arquivo são descartados. A resolução é limitada a 2400px e arquivos acima de 40 megapixels ("decompression bombs") são recusados.
- Nome de arquivo `UUID` gerado pelo servidor; largura e altura salvas para o front reservar o espaço (sem layout shift).

**Geral:** Helmet, CORS restrito a `WEB_ORIGIN`, env validado no boot.

### Deploy: pontos de atenção

- O cookie usa `SameSite=Strict`. Sirva web e API **no mesmo domínio** (ex.: reverse proxy `/api` → API). Se ficarem em domínios diferentes, defina `VITE_API_URL` e ajuste a política do cookie em `apps/api/src/modules/auth/cookie.ts`.
- Uploads ficam em disco (`UPLOAD_DIR`). Em hosts com disco efêmero, implemente `StorageService` para S3/R2 em `apps/api/src/lib/storage/`: nenhum outro arquivo precisa mudar.
- Em produção, rode `npm run db:deploy -w @portfolio/api` (aplica migrations sem criar novas).
