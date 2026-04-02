Deploy Hostinger - andamento controlado
Data inicial do registro: 2026-04-01
Projeto: Utensilios

Objetivo:
- registrar passo a passo as futuras tentativas de deploy no Hostinger
- permitir retomada segura a partir do ultimo ponto validado
- manter historico do que foi tentado, do que falhou e do que ficou aprovado

1. Arquitetura proposta atual

- Frontend:
  - publicacao estatica em `public_html`
- API:
  - app Node.js separado em subdominio
- Banco:
  - conexao externa via `DATABASE_URL`

Status:
- aprovado documentalmente

2. Premissas confirmadas no repositorio

- o frontend e um build estatico Vite
- a API usa Node.js + Express + Knex + pg
- o projeto ja gera artefatos locais de Hostinger
- a API possui `GET /health`
- o runtime atual da API e `dist/src/server.js`

Status:
- aprovado

3. Artefatos locais validados

Script executado:
- `docs/hostinger/build_hostinger_artifacts.ps1`

Saidas:
- `docs/hostinger/ibg.utensilios.web-public_html.zip`
- `docs/hostinger/ibg.utensilios.api-hostinger.zip`

Resultado:
- compilacao da API ok
- compilacao da web ok
- ZIPs gerados com sucesso

Status:
- concluido

4. Ponto atual

- a baseline documental de deploy foi criada em `docs/deploy`
- ainda nao ha tentativa real de deploy do `Utensilios` registrada nesta pasta
- o proximo passo operacional e definir dominios reais, ambiente de producao do frontend e estrategia de migrations

Status:
- aguardando primeira publicacao controlada

5. Regra de atualizacao deste arquivo

Atualizar este registro a cada marco:
- quando a primeira tentativa de deploy for iniciada
- quando a API falhar ou subir com sucesso
- quando variaveis forem cadastradas
- quando o endpoint `/health` responder corretamente em producao
- quando o frontend for publicado
- quando login ponta a ponta for validado
