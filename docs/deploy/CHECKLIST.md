Checklist de Release - Utensilios

Data: 2026-04-01
Uso: copiar e seguir na hora da publicacao

1. Pre-release

[ ] Executar na raiz:
```powershell
.\validarDev.ps1
```

[ ] Confirmar que a mudanca foi validada localmente
[ ] Confirmar que nao houve mistura de configuracao local com producao
[ ] Se houver migration, revisar impacto e ordem de aplicacao
[ ] Confirmar que a baseline de deploy nao sera alterada sem motivo tecnico comprovado

2. Gerar artefatos

[ ] Executar:
```powershell
.\docs\hostinger\build_hostinger_artifacts.ps1
```

[ ] Confirmar existencia de:
- `docs/hostinger/ibg.utensilios.api-hostinger.zip`
- `docs/hostinger/ibg.utensilios.web-public_html.zip`

[ ] Confirmar que o pacote nao leva:
- `.env` real
- segredos
- `node_modules`

3. Publicar API

[ ] Publicar primeiro a API
[ ] Enviar `docs/hostinger/ibg.utensilios.api-hostinger.zip`
[ ] Confirmar no Hostinger:
- Node compativel com `engines`
- `npm`
- entrypoint inicial alinhado ao projeto atual:
  - `dist/src/server.js`

[ ] Confirmar variaveis:
- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGINS`
- `PORT`

[ ] Conferir `DATABASE_URL` de producao:
- continua apontando para o banco correto
- continua com o schema esperado

[ ] Se alterou variavel, salvar e redeploy

4. Validar API publicada

[ ] Abrir o endpoint `/health`
[ ] Confirmar retorno JSON com status `ok`

5. Publicar frontend

[ ] Enviar `docs/hostinger/ibg.utensilios.web-public_html.zip`
[ ] Publicar em `public_html`
[ ] Confirmar que ficaram presentes:
- `index.html`
- `.htaccess`
- `assets`

[ ] Confirmar que o frontend continua apontando para a API publicada

6. Pos-release

[ ] Abrir o frontend publicado
[ ] Validar login
[ ] Validar o fluxo afetado pela release
[ ] Validar os CRUDs principais se a release tocar modulos operacionais

7. Se algo falhar

[ ] Verificar primeiro o healthcheck da API
[ ] Verificar runtime/log real antes de interpretar o painel
[ ] Nao trocar a estrategia vencedora sem nova validacao controlada

8. Fechamento

[ ] Registrar resultado em `docs/deploy/HISTORICO_HOSTINGER.md`
[ ] Se a baseline mudou, atualizar `docs/configuracoes.txt`
