# Checkpoint de Retorno Frontend Utensilios

Atualizado em: 2026-04-01
Status da parada: segura para retomada

## Onde paramos

- contexto ativo: frontend Vue com login, painel e modulos operacionais; API Express + Knex + PostgreSQL com autenticacao vinculada a `membros`
- marcos estruturais ja concluidos:
  - `LOGIN-001`
  - `API-001`
  - `DB-001`
  - `CRUD-001`
  - `ITEM-IMG-001`
  - `ESTOQUE-001`

## Estado atual entendido

- a especificacao funcional segue em:
  - [Espeficicacao_Projeto.txt](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\docs\Espeficicacao_Projeto.txt)
- a consolidacao de configuracoes e publicacao segura segue em:
  - [configuracoes.txt](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\docs\configuracoes.txt)
- a tela de login principal segue em:
  - [LoginView.vue](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\ibg.utensilios.web\src\views\LoginView.vue)
- a navegacao e protecao inicial de rota seguem em:
  - [index.ts](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\ibg.utensilios.web\src\router\index.ts)
- o ponto de entrada e bootstrap da API seguem em:
  - [app.ts](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\ibg.utensilios.api\src\app.ts)
  - [server.ts](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\ibg.utensilios.api\src\server.ts)
- a autenticacao por e-mail e senha vinculada a `membros` segue em:
  - [auth.service.ts](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\ibg.utensilios.api\src\modules\auth\auth.service.ts)
- a estrutura atual do banco local segue documentada em:
  - [Banco_Estrutura_DDL_utensilios_v2.txt](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\docs\scripts_banco\Banco_Estrutura_DDL_utensilios_v2.txt)
- os scripts-raiz de operacao local e migracao seguem em:
  - [iniciarDev.ps1](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\iniciarDev.ps1)
  - [validarDev.ps1](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\validarDev.ps1)
  - [migrarProducao.ps1](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\migrarProducao.ps1)
- os artefatos e apoio de Hostinger seguem em:
  - [build_hostinger_artifacts.ps1](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\docs\hostinger\build_hostinger_artifacts.ps1)
  - [.htaccess](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\docs\hostinger\.htaccess)

## Trabalho concluido nesta rodada

- `CONFIG-004`:
  - perfis relidos e reassumidos em conjunto para esta instancia
  - leitura refeita na ordem pedida no prompt
  - confirmado que `cecom_v2/docs/aprendizado_frontend` esta vazio nesta maquina
  - correlacao ampliada com `cecom_v2/docs/deploy` e `cecom_v2/docs/hostinger`
  - confirmacao externa com documentacao oficial atual da Hostinger e do Vite
  - [configuracoes.txt](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\docs\configuracoes.txt) reescrito para registrar:
    - quem sou neste contexto
    - onde posso atuar
    - baseline segura para Hostinger
    - lacunas reais antes do primeiro deploy
    - proximos passos de `DEPLOY-001`
  - criadas as pastas espelho no `Utensilios`:
    - [docs/deploy](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\docs\deploy)
    - [docs/historico](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\docs\historico)
  - `docs/deploy` recebeu base propria adaptada ao `Utensilios`:
    - [README.md](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\docs\deploy\README.md)
    - [CHECKLIST.md](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\docs\deploy\CHECKLIST.md)
    - [HOSTINGER_REFERENCIA.md](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\docs\deploy\HOSTINGER_REFERENCIA.md)
    - [HISTORICO_HOSTINGER.md](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\docs\deploy\HISTORICO_HOSTINGER.md)
  - `docs/historico` recebeu marcador inicial:
    - [README.md](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\docs\historico\README.md)
  - `docs/historico` passou a ter historico consolidado do projeto:
    - [HISTORICO_GERAL.md](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\docs\historico\HISTORICO_GERAL.md)
    - linha do tempo montada a partir de migrations, scripts, checkpoint e configuracoes
  - validacao objetiva executada nesta rodada:
    - `powershell -ExecutionPolicy Bypass -File docs\hostinger\build_hostinger_artifacts.ps1`
    - ZIPs da API e da web gerados novamente com sucesso
    - hashes registrados em `docs\configuracoes.txt`

- `CONFIG-002`:
  - perfis de trabalho relidos e assumidos em conjunto para esta instancia
  - baseline estavel de Hostinger correlacionada a partir de `cecom_v2/docs/deploy` e `cecom_v2/docs/hostinger`
  - confirmacao de que `aprendizado_frontend`, `backlog_frontend`, `backlog_integrado` e `historico` estavam vazios nesta maquina
  - [configuracoes.txt](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\docs\configuracoes.txt) consolidado novamente com:
    - identidade operacional desta instancia
    - ordem de confianca para decisoes
    - baseline segura proposta para frontend estatico e API Node na Hostinger
    - lacunas reais antes do primeiro deploy do Utensilios
    - proximos passos para abrir `DEPLOY-001`
    - validacao final contra o codigo real do repositorio
    - confirmacao externa com documentacao oficial da Hostinger e do Vite
    - modelos documentais de `.htaccess`, `.env.production` do frontend e ambiente minimo da API

- `CRUD-001`:
  - painel abre modulos reais por clique nos cards:
    - `Itens`
    - `Membros`
    - `Emprestimos`
    - `Historico`
  - `Itens` recebeu CRUD completo
  - `Membros`, `Emprestimos` e `Historico` receberam base CRUD operacional no frontend e na API
  - listagem de itens refinada:
    - `Total` passou para a mesma linha do titulo
    - codigo do item removido da listagem visual
    - distribuicao de colunas ficou mais compacta
    - acoes de `Editar`, `Imagens` e `Excluir` passaram a icones na mesma linha do registro
    - campo de pesquisa adicionado no cabecalho da lista, entre total e botoes de acao
    - pesquisa ampla por descricao, categoria, estado, localizacao, quantidades e data
    - exclusao passou a usar modal proprio com icones para confirmar ou cancelar

- `ITEM-IMG-001`:
  - `item_imagens` passou a aceitar imagem binaria no banco
  - upload com preview habilitado na tela de imagens do item
  - compatibilidade legada com `url_imagem` mantida
  - refinamentos visuais aplicados na tela de imagens:
    - titulo alterado para `Imagens`
    - descricao do item destacada em negrito
    - textos auxiliares redundantes removidos
    - area util da tela ampliada
  - regra de formulario endurecida:
    - o botao `Cadastrar imagem` so habilita quando houver imagem e descricao preenchida
  - atualizacao de imagem endurecida:
    - editar ordem ou descricao nao limpa mais o conteudo binario existente
    - erros de constraint passaram a ter tratamento mais amigavel na API
  - exclusao de imagem refinada:
    - retirada a confirmacao generica do browser
    - confirmacao agora ocorre com mensagem tratada na propria tela

- `ESTOQUE-001`:
  - `itens` passou a registrar `quantidade_total`
  - `emprestimos` passou a registrar `quantidade`
  - disponibilidade do item passou a ser calculada automaticamente

- `CONFIG-003`:
  - leitura dos scripts equivalentes do `cecom_v1`:
    - `iniciarDev.ps1`
    - `validarDev.ps1`
    - `migrarProducao.ps1`
  - criadas versoes proprias do `Utensilios` na raiz do projeto:
    - [iniciarDev.ps1](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\iniciarDev.ps1)
    - [validarDev.ps1](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\validarDev.ps1)
    - [migrarProducao.ps1](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\migrarProducao.ps1)
  - criado template local da API:
    - [ibg.utensilios.api/.env.development.local.example](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\ibg.utensilios.api\.env.development.local.example)
  - os scripts foram ajustados ao stack real do `Utensilios`:
    - `ibg.utensilios.api`
    - `ibg.utensilios.web`
    - build atual por `npm run build`
    - runtime atual por `dist/src/server.js`
    - validacao local por `localhost`
  - `iniciarDev.ps1` agora tambem abre automaticamente a tela inicial da web no browser apos a subida do frontend local

- `DEPLOY-001`:
  - criada a pasta propria de Hostinger do `Utensilios`
  - criado o script de artefatos:
    - [build_hostinger_artifacts.ps1](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\docs\hostinger\build_hostinger_artifacts.ps1)
  - criado o fallback da SPA:
    - [.htaccess](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\docs\hostinger\.htaccess)
  - baseline tecnica atual registrada:
    - frontend para `public_html`
    - API com runtime atual em `dist/src/server.js`
    - ZIPs esperados:
      - `docs\hostinger\ibg.utensilios.api-hostinger.zip`
      - `docs\hostinger\ibg.utensilios.web-public_html.zip`
  - validacao executada com sucesso:
    - `docs\hostinger\build_hostinger_artifacts.ps1`
    - artefatos ZIP gerados localmente sem erro

- `AUTH-002`:
  - identificada a causa da mensagem recorrente na tela de login:
    - o frontend convertia qualquer `401` da API em "Sua sessao expirou ou ficou invalida. Entre novamente."
    - isso mascarava falhas reais do proprio `/auth/login`
  - [api.ts](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\ibg.utensilios.web\src\services\api.ts) ajustado para:
    - preservar a mensagem real do backend no caso de `401` em `/auth/login`
    - manter a mensagem generica apenas para sessao/token invalido em rotas protegidas
  - admin local recriado via seed:
    - `admin@utensilios.local`
  - validacao real do login concluida com sucesso contra `/auth/login`

## Ultima validacao registrada

- validacoes fortes anteriores ja registradas no projeto:
  - `npm run build` em `ibg.utensilios.web`
  - `npm run test:unit -- LoginView` em `ibg.utensilios.web`
  - `npm run build` em `ibg.utensilios.api`
  - `npm run db:migrate` em `ibg.utensilios.api`
  - `npm run db:seed` em `ibg.utensilios.api`
- nesta rodada atual foi feita validacao documental e de configuracao, sem nova alteracao de codigo
- nesta rodada tambem foi executado novamente com sucesso:
  - `powershell -ExecutionPolicy Bypass -File docs\hostinger\build_hostinger_artifacts.ps1`
- nesta rodada de interface foi executado com sucesso:
  - `npm run build` em `ibg.utensilios.web`
- nesta rodada de tratamento de imagens foi executado com sucesso:
  - `npm run build` em `ibg.utensilios.api`
  - `npm run build` em `ibg.utensilios.web`
- nesta rodada de refinamento da listagem de itens foi executado com sucesso:
  - `npm run build` em `ibg.utensilios.web`
- nesta rodada de pesquisa e modal na lista de itens foi executado com sucesso:
  - `npm run build` em `ibg.utensilios.web`
- nenhuma mudanca funcional adicional foi aplicada nesta rodada; o ganho desta etapa foi endurecer a baseline documental para deploy
- os novos scripts PowerShell foram validados por parse sintatico, sem execucao completa do fluxo local
- `.\validarDev.ps1` foi executado com sucesso apos corrigir o runtime real da API para `dist/src/server.js`

## Proximo passo ao retornar

- frente funcional:
  - validar manualmente o fluxo ponta a ponta dos quatro modulos em `localhost`
  - endurecer regras, UX e consistencia dos CRUDs ja criados
- frente tecnica paralela:
  - abrir `DEPLOY-001` para transformar a baseline documental em configuracao real de producao
- ordem recomendada:
  - 1. validar `Itens`, `Membros`, `Emprestimos` e `Historico` com fluxo real
  - 2. revisar mensagens de erro, protecao de sessao e tratamento de `401`
  - 3. criar `ibg.utensilios.web/.env.production`
  - 4. definir dominio da web e subdominio da API
  - 5. criar checklist e historico de deploy do Utensilios
  - 6. so depois congelar a estrategia do primeiro deploy

## Como retomar com seguranca

- ler nesta ordem:
  - [Espeficicacao_Projeto.txt](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\docs\Espeficicacao_Projeto.txt)
  - [configuracoes.txt](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\docs\configuracoes.txt)
  - [checkpoint_retorno.md](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\docs\backlog_frontend\checkpoint_retorno.md)
- depois abrir:
  - [LoginView.vue](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\ibg.utensilios.web\src\views\LoginView.vue)
  - [DashboardView.vue](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\ibg.utensilios.web\src\views\DashboardView.vue)
  - [auth.service.ts](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\ibg.utensilios.api\src\modules\auth\auth.service.ts)
  - [202603310001_link_auth_to_membros.js](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\ibg.utensilios.api\db\migrations\202603310001_link_auth_to_membros.js)
- validar novamente com:
  - `npm run build` em `ibg.utensilios.web`
  - `npm run build` em `ibg.utensilios.api`
  - `npm run test:unit -- LoginView` em `ibg.utensilios.web`
  - `curl http://localhost:3001/health`
  - `.\iniciarDev.ps1`
  - `.\validarDev.ps1`

## Observacoes de continuidade

- o principal risco estrutural anterior era a ausencia de backend real, e isso deixou de ser o bloqueio principal
- a autenticacao agora esta no lugar correto do dominio, vinculada a `membros`
- o banco local esta pronto para evolucao funcional sem reabrir a base de autenticacao
- a proxima convergencia natural entre produto, frontend e backend esta em:
  - consolidar os CRUDs
  - fechar a baseline de deploy para Hostinger
