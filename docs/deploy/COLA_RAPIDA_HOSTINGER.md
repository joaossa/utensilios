# Cola rapida - Hostinger

Data: 2026-04-04
Projeto: IBG - Utensilios

## 1. Gerar os artefatos

```powershell
cd F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios
powershell -ExecutionPolicy Bypass -File .\docs\hostinger\build_hostinger_artifacts.ps1
```

Arquivos:
- `docs/hostinger/ibg.utensilios.api-hostinger.zip`
- `docs/hostinger/ibg.utensilios.web-public_html.zip`

## 2. Configurar a API na Hostinger

Website Node:
- dominio: `api.ibgutensilios.com.br`
- Node: `20.x`
- gerenciador: `npm`
- arquivo de entrada: `index.js`

## 3. Variaveis da API

Cadastrar sem aspas:

```dotenv
DATABASE_URL=postgresql://neondb_owner:SEU_TOKEN@ep-jolly-star-anfd30bg-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=SEU_SEGREDO_FORTE
CORS_ORIGINS=https://ibgutensilios.com.br,https://www.ibgutensilios.com.br
WEB_BASE_URL=https://ibgutensilios.com.br
RECOVERY_PASSWORD_URL=https://ibgutensilios.com.br/recuperar-senha?token={token}
PORT=3001
```

## 4. Publicar a API

1. Enviar `ibg.utensilios.api-hostinger.zip`
2. Fazer redeploy
3. Testar:

```text
https://api.ibgutensilios.com.br/health
```

Resposta esperada:

```json
{"status":"ok","system":"ibg-utensilios-api"}
```

## 5. Se a API falhar

Verificar no File Manager da app Node:
- `hostinger-stages.log`
- `startup.log`

Interpretacao:
- sem `hostinger-stages.log`: pipeline nem chegou direito nos scripts
- com `hostinger-stages.log` e sem `startup.log`: o problema parou antes do bootstrap
- com `startup.log`: o `index.js` rodou e o erro passa a ser de runtime

## 6. Publicar o frontend

Frontend:
- dominio: `ibgutensilios.com.br`
- destino: `public_html`

Enviar:
- `ibg.utensilios.web-public_html.zip`

Extrair e confirmar:
- `index.html`
- `.htaccess`
- `assets`

## 7. Validacao final

1. API responde `/health`
2. frontend abre em `https://ibgutensilios.com.br`
3. login funciona
4. sem erro de CORS

## 8. Regra de ouro

- se a API nao responder `/health`, nao adianta testar login
- se mudar variavel da API, fazer redeploy
- se a Hostinger tentar compilar TypeScript, manter nossa linha:
  - `build` remoto controlado
  - `build:ts` somente local
  - `index.js` como entrypoint
