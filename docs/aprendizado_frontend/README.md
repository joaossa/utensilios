# Aprendizado Frontend

Atualizado em: 2026-04-04
Objetivo: consolidar melhores praticas de frontend para projetos IBG a partir de tres bases:

- a documentacao anterior do `cecom_v1`
- a varredura tecnica da base `J:\DEVELOPER_Projects\SourceControl_NovaEstrutura\Sarah\_git`
- fontes publicas atuais de Vue, Quasar, Vite, Pinia, testes e responsividade

## Resultado em uma frase

A base Sarah confirma uma direcao clara: o caminho mais sustentavel para projetos Vue atuais e `Vue 3 + Vite + Quasar 2 + Pinia + TanStack Query/Vue Query + TypeScript + Vitest`, com boot files bem separados, wrappers de componentes recorrentes e responsividade guiada por breakpoints e grid mode, nao por viewport fixa e duplicacao de layout.

## Leitura recomendada

1. [melhores_praticas_frontend.md](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\docs\aprendizado_frontend\melhores_praticas_frontend.md)
2. [mapeamento_sarah_git.md](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\docs\aprendizado_frontend\mapeamento_sarah_git.md)
3. [fontes_publicas_e_github.md](F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\docs\aprendizado_frontend\fontes_publicas_e_github.md)

## Resumo executivo

- base local mapeada:
  - `63` frontends/pacotes relevantes
  - `25` projetos com Vue 3
  - `18` projetos ainda em Vue 2
  - `46` projetos com Quasar
  - `20` projetos com Pinia
  - `15` projetos com Vue Query ou TanStack Query
  - `13` projetos com Vitest
  - `23` projetos com TypeScript explicito
- referencias modernas fortes:
  - `Sarah.SIH.Prontuario`
  - `Sarah.SIH.Triagem.InternacaoCirurgia`
  - `Sarah.Componentes.Web/componentes/sarah-web`
  - `Sarah.Componentes.Autenticacao/sarah.componentes.autenticacao-vue`
  - `Sarah.Adm.RH.SSP`
  - `Sarah.SIH.CentralProfissional`
  - `Sarah.Dicom.QC/Sarah.SIH.Dicom.Web`
- referencias a usar com cautela:
  - projetos Vue 2 + Vuex + Quasar 1
  - projetos com muito `vh`, `vw`, `device/platform.is.mobile`
  - telas que duplicam arvore de DOM para desktop e mobile

## Decisoes que esta documentacao recomenda para os proximos projetos IBG

- Preferir `Vue 3 + Vite + Quasar 2 + TypeScript`.
- Usar `Pinia` para estado de interface, sessao e preferencias do cliente.
- Usar `TanStack Query` ou `Vue Query` para estado de servidor, cache e invalidacao.
- Isolar inicializacao em `boot files`, nunca inflar o bootstrap.
- Tratar `QTable` como um componente estrategico:
  - tabela no desktop
  - `grid mode` no mobile
  - colunas visiveis por breakpoint
- Padronizar formularios:
  - labels consistentes
  - mascaras no frontend
  - validacao espelhada no backend
  - feedback de erro claro
- Adotar `Vitest` cedo, pelo menos para composables, stores e componentes de risco.
- Reservar E2E para fluxos nucleares:
  - login
  - listagem
  - CRUD principal
  - operacoes de confirmacao

## Uso pratico no Utensilios

Este pacote deve ser usado como referencia para:

- novos modulos
- refatoracoes de telas antigas
- criacao de componentes compartilhados
- checklist de revisao tecnica antes de publicar

Se houver conflito entre praticidade imediata e qualidade estrutural, o criterio recomendado e:

1. corrigir UX e responsividade do fluxo atual
2. extrair padroes repetidos em composables/componentes
3. endurecer testes e performance

