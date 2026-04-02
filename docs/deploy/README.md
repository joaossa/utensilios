Deploy Essencial - Utensilios

Data: 2026-04-01
Escopo: publicacao inicial e futuras releases mantendo a baseline atual do projeto

Objetivo:
- concentrar somente o essencial para publicar sem improviso
- evitar releitura do historico completo a cada tentativa
- preservar a estrategia atual mais segura para o `Utensilios`

Leitura rapida para execucao:
- usar primeiro `docs/deploy/CHECKLIST.md`
- usar `docs/configuracoes.txt` para confirmar a baseline
- usar este arquivo como resumo operacional

Regra de ouro:
- nao reinventar o deploy
- publicar em cima da baseline comprovada no proprio repositorio hoje:
  - frontend estatico em `public_html`
  - API Node separada
  - artefatos locais gerados por `docs/hostinger/build_hostinger_artifacts.ps1`
  - runtime atual da API em `dist/src/server.js`
  - banco via `DATABASE_URL`

1. Pre-release

Antes de qualquer publicacao:
1. executar na raiz:
```powershell
.\validarDev.ps1
```
2. confirmar que a mudanca foi validada localmente
3. se houver migration:
   - revisar impacto
   - garantir ordem segura de aplicacao
4. confirmar que nenhuma configuracao local foi misturada com producao

Nao publicar se:
- o ambiente local nao validar
- houver duvida sobre migration
- a mudanca depender de trocar a baseline sem validacao controlada

2. Gerar artefatos

Executar:
```powershell
.\docs\hostinger\build_hostinger_artifacts.ps1
```

Artefatos esperados:
- `docs/hostinger/ibg.utensilios.api-hostinger.zip`
- `docs/hostinger/ibg.utensilios.web-public_html.zip`

Confirmar:
- o ZIP da API foi gerado localmente
- o ZIP do frontend foi gerado localmente
- nao enviar `.env` real
- nao enviar segredos
- nao enviar `node_modules`

3. Publicar API

Publicar primeiro a API.

No app Node da Hostinger:
- usar Node compativel com `engines`
- manter `npm`
- usar como primeira tentativa o runtime atual do projeto:
  - `dist/src/server.js`

Enviar:
- `docs/hostinger/ibg.utensilios.api-hostinger.zip`

Conferir variaveis de ambiente:
- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGINS`
- `PORT`

Se houver mudanca de variavel:
- salvar no painel
- fazer redeploy

Nao fazer:
- nao publicar apontando para banco errado
- nao depender de `.env` real dentro do ZIP
- nao trocar para workaround de `index.js` ou bundle sem evidencia da conta real

4. Publicar frontend

Publicar somente depois de a API estar valida.

Enviar:
- `docs/hostinger/ibg.utensilios.web-public_html.zip`

Destino:
- `public_html`

Conferir no conteudo publicado:
- `index.html`
- `.htaccess`
- pasta `assets`

Garantir:
- o frontend publicado aponta para o dominio real da API

5. Pos-release

Executar smoke test imediatamente:
1. abrir o healthcheck da API publicada
2. confirmar retorno JSON com status `ok`
3. abrir o frontend publicado
4. validar login
5. validar o fluxo afetado pela release

6. Se algo falhar

Prioridade de leitura:
1. runtime real
2. resposta do healthcheck
3. logs disponiveis
4. diagnostico automatico do painel por ultimo

Regra pratica:
- primeiro confirmar se a API realmente subiu
- depois confirmar se a web esta chamando a API correta
- so entao interpretar mensagens automaticas do painel

7. Registro obrigatorio

Apos cada release:
- registrar o resultado em `docs/deploy/HISTORICO_HOSTINGER.md`
- se a baseline mudar, atualizar `docs/configuracoes.txt`

8. Fontes de referencia

Se precisar sair do essencial:
- `docs/configuracoes.txt`
- `docs/deploy/HOSTINGER_REFERENCIA.md`
- `docs/deploy/HISTORICO_HOSTINGER.md`
