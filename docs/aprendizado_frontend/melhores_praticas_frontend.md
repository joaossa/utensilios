# Melhores Praticas Frontend

Atualizado em: 2026-04-04
Escopo: Vue, Quasar, Vite, Pinia, Query, testes, responsividade e organizacao de codigo

## 1. Tese principal

A melhor combinacao encontrada entre maturidade local e referencia publica atual e:

- `Vue 3`
- `Vite`
- `Quasar 2`
- `TypeScript`
- `Pinia`
- `TanStack Query` ou `Vue Query`
- `Vitest`

Essa linha aparece de forma recorrente nos projetos Sarah mais maduros e tambem esta alinhada ao ecossistema oficial atual de Vue.

## 2. O que a base Sarah mostrou

### O que aparece nos projetos mais modernos

- bootstrap separado em `boot files`
- Pinia modular
- componentes e servicos desacoplados
- wrapper compartilhado para tabela, dialogo e CRUD
- query/caching para estado remoto
- TypeScript crescendo nos projetos que continuam ativos
- testes com Vitest nos projetos com maior disciplina estrutural

### O que envelheceu mal

- Vue 2 + Vuex + Quasar 1 como base para novos projetos
- uso excessivo de `vh`, `vw` e tamanhos magicos
- logica responsiva espalhada entre CSS, JS e condicoes de plataforma
- duplicacao de tela desktop/mobile
- tabelas desktop-centricas sem grid mode ou fallback

## 3. Arquitetura recomendada

Estrutura sugerida para modulos Vue + Quasar:

```text
src/
  assets/
  boot/
    api.ts
    query.ts
    auth.ts
  components/
    base/
    tables/
    forms/
    dialogs/
  composables/
    useCrudMessages.ts
    useResponsiveTable.ts
  css/
    app.scss
    variables.scss
  layouts/
  pages/
  router/
  services/
    api.ts
    members.service.ts
  stores/
    auth.store.ts
    ui.store.ts
  types/
  utils/
```

Regra pratica:

- `boot/`: inicializacao de dependencias
- `stores/`: estado do cliente e sessao
- `services/`: chamadas HTTP e adaptacao de payload
- `composables/`: logica reutilizavel com estado
- `components/`: UI reutilizavel
- `pages/`: orquestracao de tela, nao concentracao de regras

## 4. Boot files primeiro, bootstrap magro sempre

Quasar com Vite recomenda `boot files` para inicializar dependencias antes da app, justamente para evitar um bootstrap inflado e dificil de manter. Esse padrao ja aparece na base Sarah em `Sarah.SIH.Prontuario`.

Exemplo recomendado:

```ts
// src/boot/query.ts
import { boot } from 'quasar/wrappers'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

export default boot(({ app }) => {
  app.use(VueQueryPlugin, { queryClient })
})
```

Evitar:

- um `main.ts` inchado
- registrar plugins, componentes, auth e regras de ambiente tudo no mesmo arquivo

## 5. Estado: Pinia para cliente, Query para servidor

O melhor desenho observado nao coloca tudo em store.

Use `Pinia` para:

- sessao do usuario
- preferencia visual
- flags de navegacao
- estado efemero entre telas

Use `TanStack Query` ou `Vue Query` para:

- listagens
- detalhes vindos da API
- cache de leitura
- invalidacao apos create/update/delete

Exemplo:

```ts
// src/stores/auth.store.ts
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as null | { id: number; nome: string; email: string },
    token: '',
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
  },
  actions: {
    setSession(payload: { user: { id: number; nome: string; email: string }; token: string }) {
      this.user = payload.user
      this.token = payload.token
    },
    clearSession() {
      this.user = null
      this.token = ''
    },
  },
})
```

```ts
// src/services/members.service.ts
import { api } from './api'

export const membersService = {
  list(params?: Record<string, unknown>) {
    return api.get('/membros', { params }).then((r) => r.data)
  },
}
```

```ts
// src/composables/useMembersQuery.ts
import { computed, type Ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { membersService } from '@/services/members.service'

export function useMembersQuery(search: Ref<string>) {
  const params = computed(() => ({ q: search.value || undefined }))

  return useQuery({
    queryKey: ['members', params],
    queryFn: () => membersService.list(params.value),
  })
}
```

Regra de ouro:

- store nao deve virar deposito de resposta de API quando Query resolve isso melhor

## 6. Composables para regra reutilizavel

A documentacao oficial do Vue reforca composables como encapsulamento de logica reutilizavel com estado. Na pratica, isso evita paginas monoliticas.

Exemplos de composables que valem extracao:

- `useCrudMessages`
- `useConfirmDelete`
- `useResponsiveTable`
- `useFieldMasks`
- `useListFilters`

Exemplo:

```ts
// src/composables/useResponsiveTable.ts
import { computed } from 'vue'
import { useQuasar } from 'quasar'

export function useResponsiveTable() {
  const $q = useQuasar()

  const dense = computed(() => $q.screen.lt.md)
  const grid = computed(() => $q.screen.xs)

  return { dense, grid }
}
```

## 7. Tabelas: tratar QTable como componente estrategico

Quasar documenta dois mecanismos muito valiosos para responsividade em tabela:

- `dense`
- `grid`

E a propria documentacao recomenda ligar isso ao `$q.screen`.

Exemplo recomendado:

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const rows = ref([])

const columns = [
  { name: 'descricao', label: 'DESCRICAO', field: 'descricao', align: 'left', required: true },
  { name: 'total', label: 'TOTAL', field: 'total', align: 'center' },
  { name: 'acoes', label: 'ACOES', field: 'acoes', align: 'right', required: true },
]

const visibleColumns = computed(() =>
  $q.screen.lt.md ? ['descricao', 'total', 'acoes'] : ['descricao', 'total', 'acoes']
)
</script>

<template>
  <q-table
    flat
    bordered
    :rows="rows"
    :columns="columns"
    row-key="id"
    :dense="$q.screen.lt.md"
    :grid="$q.screen.xs"
    :visible-columns="visibleColumns"
  />
</template>
```

Quando uma tabela cresce, a base Sarah mostra que vale extrair um wrapper compartilhado, no mesmo espirito do `STabela` de `Sarah.Componentes.Web`.

## 8. Responsividade: usar container e breakpoint, nao gambiarra de viewport

O maior aprendizado herdado da leitura anterior e reforcado pela base Sarah foi este:

- problemas de responsividade nascem menos por falta de framework e mais por abuso de largura/altura fixa

Preferir:

- `max-width`
- `width: 100%`
- `min-width: 0`
- flex/grid
- breakpoints do Quasar
- `grid mode` para tabelas
- `container queries` para componentes mais independentes

Evitar:

- `height: 100vh` como base de formulario ou card
- `width: 80vw` para dialogos e shell internos
- `platform.is.mobile` como eixo principal de layout
- manter duas arvores de componentes para a mesma tela

Exemplo com container query:

```css
.module-card {
  container-type: inline-size;
}

@container (width > 700px) {
  .module-card__actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
```

Use media query para layout macro e container query para componente reutilizavel.

## 9. Formularios: UX consistente e validacao espelhada

Padrao recomendado:

- limite de tamanho alinhado ao backend
- mascara em telefone, CPF, data, moeda, quando necessario
- mensagem clara em portugues
- label coerente e previsivel
- confirmacao visual para operacoes destrutivas
- validacao no frontend para orientar
- validacao no backend para garantir integridade

Exemplo:

```ts
const errors = reactive({
  nome: '',
  email: '',
})

function validate() {
  errors.nome = form.nome.trim() ? '' : 'Informe o nome.'
  errors.email = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(form.email)
    ? ''
    : 'Informe um e-mail valido.'

  return !errors.nome && !errors.email
}
```

E o backend deve repetir a regra critica, nunca confiar apenas na interface.

## 10. Nomes, props e componentes pequenos

Mesmo com o aviso de que o style guide do Vue esta antigo, algumas regras essenciais continuam valiosas:

- nome de componente sempre com mais de uma palavra
- props detalhadas
- `v-for` com `key`
- evitar misturar `v-if` com `v-for`

Exemplo:

```ts
const props = defineProps({
  memberId: {
    type: Number,
    required: true,
  },
  mode: {
    type: String,
    default: 'view',
    validator: (value: string) => ['view', 'edit'].includes(value),
  },
})
```

## 11. Performance: boas decisoes antes de micro-otimizacao

O Vue destaca que a primeira grande decisao de performance e arquitetural.

Para projetos internos como o Utensilios:

- SPA esta ok para a area autenticada
- rotas devem ser lazy-loaded
- dependencias pesadas precisam ser revistas antes de entrar
- listas grandes podem pedir `virtual scroll`
- props devem permanecer estaveis

Exemplo de rota lazy:

```ts
const routes = [
  {
    path: '/membros',
    component: () => import('@/pages/MembersPage.vue'),
  },
]
```

Se o projeto tiver paginas publicas de marketing no futuro:

- separar essas paginas em estatico/SSG ou SSR
- nao carregar a aplicacao autenticada inteira para isso

## 12. Ambiente e build: Vite exige disciplina

O Vite expoe no cliente apenas variaveis com prefixo `VITE_`.

Logo:

- segredo nunca entra em `VITE_*`
- URL publica da API pode entrar
- chave de banco e tokens privados ficam no backend

Exemplo:

```dotenv
VITE_API_BASE_URL=https://api.ibgutensilios.com.br
```

```ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
```

Nao fazer:

```dotenv
VITE_DB_PASSWORD=senha-real
```

## 13. Testes: comecar cedo e manter o escopo certo

O guia oficial do Vue recomenda comecar a testar cedo e distribuir a estrategia entre:

- unit
- component
- e2e

Padrao minimo recomendado para projetos IBG:

- unit/composable/store em `Vitest`
- componente de risco em `Vitest + Vue Test Utils`
- 3 a 5 fluxos E2E principais com `Playwright`

Exemplo de setup de teste, alinhado ao que foi visto em `Sarah.SIH.Triagem.InternacaoCirurgia`:

```ts
// tests/setup-file.ts
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { setActivePinia, createPinia } from 'pinia'

installQuasarPlugin({})
setActivePinia(createPinia())
```

Exemplo E2E:

```ts
import { test, expect } from '@playwright/test'

test('login exibe painel', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill('admin@utensilios.local')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByLabel('Palavra-passe').fill('Troque123!')
  await page.getByRole('button', { name: 'Iniciar sessao' }).click()
  await expect(page.getByText('IBG - UTENSILIOS')).toBeVisible()
})
```

Boas praticas de E2E:

- testar comportamento visivel ao usuario
- isolar testes
- usar `getByRole`, `getByLabel`, `getByText`
- nao testar dependencia de terceiro

## 14. Checklist de decisao tecnica

### Adotar ja

- Vue 3 + Quasar 2 + Vite + TypeScript
- Pinia para sessao/UI
- Query para estado remoto
- boot files
- QTable com `dense` e `grid`
- lazy load de rotas
- Vitest para camada critica

### Adotar quando o modulo pedir

- wrapper compartilhado de tabela
- virtual scroll
- container queries
- Playwright para fluxos ponta a ponta
- componentes compartilhados em pacote interno

### Evitar em novos modulos

- Vue 2 e Vuex como base nova
- cards e dialogs com `vh` e `vw` como estrutura principal
- duas telas separadas para desktop/mobile
- pagina com toda a logica no `View.vue`
- estado de servidor persistido manualmente em store

## 15. Aplicacao direta no Utensilios

Para o Utensilios, a documentacao recomenda priorizar:

1. padronizar wrappers de listagem e formulario
2. consolidar o padrao Quasar de responsividade nas listas
3. extrair composables de validacao e mensagens
4. introduzir Query para listagens mais ricas e invalidacao futura
5. criar base minima de testes para login, itens, membros e emprestimos

## 16. Frase-guia

Frontend sustentavel nao e o que "funciona no meu monitor". E o que mantem:

- consistencia estrutural
- responsividade previsivel
- regras reutilizaveis
- teste suficiente para evoluir sem medo

