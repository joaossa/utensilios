Historico Geral - Utensilios

Atualizado em: 2026-04-01

Objetivo:
- consolidar a linha do tempo do projeto em um unico lugar
- registrar marcos tecnicos, funcionais e documentais
- facilitar retomada futura sem depender de memoria informal

Fontes usadas nesta consolidacao:
- `docs/backlog_frontend/checkpoint_retorno.md`
- `docs/configuracoes.txt`
- migrations e seeds em `ibg.utensilios.api/db`
- scripts raiz do projeto
- artefatos e scripts em `docs/hostinger`

Observacao importante sobre datas:
- quando a data veio do nome de migration, ela foi tratada como data forte
- quando a data veio do checkpoint sem carimbo detalhado, ela foi mantida como marco consolidado em 2026-04-01
- quando houver inferencia, isso sera dito explicitamente

1. Linha do tempo consolidada

2026-03-30
- migration criada:
  - `202603300001_init_utensilios_schema.js`
- inferencia segura:
  - este e o marco mais antigo confirmado no repositorio para a base inicial do banco do projeto
- efeito esperado desse marco:
  - estabelecimento do schema inicial do `Utensilios`

2026-03-31
- migration criada:
  - `202603310001_link_auth_to_membros.js`
- leitura conjunta com o checkpoint:
  - a autenticacao deixou de ser uma camada isolada e passou a ficar ligada ao dominio real de `membros`
- impacto estrutural:
  - o principal risco anterior de ausencia de backend real saiu do centro do problema

2026-03-31
- migration criada:
  - `202603310002_item_lookup_tables.js`
- inferencia segura:
  - o dominio de itens recebeu tabelas auxiliares para evolucao mais consistente da camada operacional

2026-04-01
- migration criada:
  - `202604010001_item_imagens_binario.js`
- correlacao com o checkpoint:
  - `ITEM-IMG-001` consolidado
  - `item_imagens` passou a aceitar imagem binaria no banco
  - upload com preview habilitado
  - compatibilidade com `url_imagem` mantida

2026-04-01
- migration criada:
  - `202604010002_item_estoque_quantidades.js`
- correlacao com o checkpoint:
  - `ESTOQUE-001` consolidado
  - `itens` passou a registrar `quantidade_total`
  - `emprestimos` passou a registrar `quantidade`
  - disponibilidade automatica passou a ser calculada

2026-04-01
- migration criada:
  - `202604010003_add_utensilios_cozinha_categoria.js`
- seed confirmada na mesma data:
  - `seed-item-lookups.ts`
- leitura tecnica:
  - houve evolucao da classificacao dos itens com reforco de dados auxiliares

2026-04-01
- seeds confirmadas:
  - `seed.ts`
  - `seed-item-lookups.ts`
- correlacao com o checkpoint:
  - admin local validado por seed com `admin@utensilios.local`

2026-04-01
- scripts raiz criados/ajustados:
  - `iniciarDev.ps1`
  - `validarDev.ps1`
  - `migrarProducao.ps1`
- marco operacional:
  - o projeto passou a ter um kit proprio de subida, validacao e migracao
- baseline registrada:
  - build atual da API por `npm run build`
  - runtime atual da API por `dist/src/server.js`
  - validacao local por `localhost`

2026-04-01
- frente funcional consolidada no checkpoint:
  - `CRUD-001`
  - `LOGIN-001`
  - `API-001`
  - `DB-001`
  - `ITEM-IMG-001`
  - `ESTOQUE-001`
- leitura do estado funcional:
  - painel abre os modulos reais
  - `Itens` recebeu CRUD completo
  - `Membros`, `Emprestimos` e `Historico` receberam base operacional

2026-04-01
- frente de autenticacao consolidada:
  - `AUTH-002`
- causa identificada:
  - o frontend mascarava qualquer `401` como sessao expirada
- resposta aplicada:
  - login passou a preservar a mensagem real do backend em `/auth/login`
- resultado registrado:
  - validacao real do login concluida com sucesso

2026-04-01
- frente de Hostinger aberta:
  - `DEPLOY-001`
- entregas tecnicas registradas:
  - criacao de `docs/hostinger`
  - script `build_hostinger_artifacts.ps1`
  - `.htaccess` para fallback da SPA
  - artefatos locais:
    - `ibg.utensilios.api-hostinger.zip`
    - `ibg.utensilios.web-public_html.zip`
- validacao registrada:
  - artefatos ZIP gerados localmente sem erro

2026-04-01
- consolidacao documental reforcada:
  - `docs/configuracoes.txt` reescrito com baseline segura
  - `docs/deploy` criado com base propria do `Utensilios`
  - `docs/historico` criado
- confirmacao externa usada:
  - documentacao oficial atual da Hostinger
  - documentacao oficial atual do Vite

2026-04-01
- validacao objetiva adicional executada:
  - `powershell -ExecutionPolicy Bypass -File docs/hostinger/build_hostinger_artifacts.ps1`
- resultado:
  - API compilou com sucesso
  - web compilou com sucesso
  - ZIP da API gerado com sucesso
  - ZIP da web gerado com sucesso

2. Decisoes estruturais que ficaram valendo

- frontend segue como SPA Vue 3 + Vite
- backend segue como API Express + TypeScript + Knex + PostgreSQL
- autenticacao esta vinculada a `membros`
- banco usa `DATABASE_URL` com tratamento de `schema` por `searchPath`
- estrategia inicial de Hostinger para o `Utensilios` continua sendo a mais simples:
  - frontend estatico em `public_html`
  - API Node separada
  - runtime atual em `dist/src/server.js`
- o workaround final do `cecom_v2` com `index.js` + bundle NAO virou baseline do `Utensilios`

3. Estado atual resumido

Estado seguro em 2026-04-01:
- frontend real existe
- API real existe
- healthcheck real existe
- scripts locais de operacao existem
- artefatos de Hostinger existem e foram validados localmente
- baseline documental de deploy existe

4. Pendencias historicamente abertas

- validar manualmente o fluxo ponta a ponta dos quatro modulos em `localhost`
- endurecer UX e consistencia dos CRUDs ja criados
- criar `ibg.utensilios.web/.env.production`
- definir dominio da web e subdominio da API
- criar a rotina real de release em producao
- decidir e ensaiar a estrategia de migrations para o ambiente publicado

5. Como manter este historico vivo

Atualizar este arquivo quando ocorrer qualquer um destes marcos:
- nova migration relevante
- mudanca estrutural de autenticacao, banco ou deploy
- primeira publicacao real no Hostinger
- alteracao da baseline documental
- fechamento de uma frente grande do checkpoint
