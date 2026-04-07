# Mapeamento Sarah Git

Atualizado em: 2026-04-04
Base lida: `J:\DEVELOPER_Projects\SourceControl_NovaEstrutura\Sarah\_git`

## 1. Visao geral da varredura

Foram mapeados `63` frontends/pacotes relevantes com sinais claros de Vue, Quasar ou Vite.

Resumo tecnico:

- `25` projetos com Vue 3
- `18` projetos com Vue 2
- `46` projetos com Quasar
- `25` projetos com Vite
- `20` projetos com Pinia
- `12` projetos com Vuex
- `15` projetos com Vue Query ou TanStack Query
- `13` projetos com Vitest
- `23` projetos com TypeScript
- `8` projetos com sinal de PWA

## 2. Linha moderna mais promissora

Projetos que servem como referencia positiva:

- `J:\DEVELOPER_Projects\SourceControl_NovaEstrutura\Sarah\_git\Sarah.SIH.Prontuario\prontuario\frontend\sarah-sih-prontuario`
- `J:\DEVELOPER_Projects\SourceControl_NovaEstrutura\Sarah\_git\Sarah.SIH.Triagem.InternacaoCirurgia\Sarah.Triagem.InternacaoCirurgia.Web`
- `J:\DEVELOPER_Projects\SourceControl_NovaEstrutura\Sarah\_git\Sarah.Componentes.Web\componentes\sarah-web`
- `J:\DEVELOPER_Projects\SourceControl_NovaEstrutura\Sarah\_git\Sarah.Componentes.Autenticacao\sarah.componentes.autenticacao-vue`
- `J:\DEVELOPER_Projects\SourceControl_NovaEstrutura\Sarah\_git\Sarah.Adm.RH.SSP\ssp\frontend\sarah-adm-rh-ssp`
- `J:\DEVELOPER_Projects\SourceControl_NovaEstrutura\Sarah\_git\Sarah.SIH.CentralProfissional\Sarah.SIH.CentralProfissional.Web`
- `J:\DEVELOPER_Projects\SourceControl_NovaEstrutura\Sarah\_git\Sarah.Dicom\Sarah.Dicom.QC\Sarah.SIH.Dicom.Web`

Padrao recorrente nesses projetos:

- Vue 3
- Quasar 2
- Vite
- Pinia
- Query para dados remotos
- TypeScript
- boot files
- algum nivel de testes

## 3. Linha legado a tratar com cautela

Projetos que ajudam a entender historico, mas nao devem orientar arquitetura nova:

- `J:\DEVELOPER_Projects\SourceControl_NovaEstrutura\Sarah\_git\Sarah.CME\sarah.cme.web\sarah.cme.web`
- `J:\DEVELOPER_Projects\SourceControl_NovaEstrutura\Sarah\_git\Sarah.CatalogoSistemas\Sarah.CatalogoSistemas.Web`
- `J:\DEVELOPER_Projects\SourceControl_NovaEstrutura\Sarah\_git\Sarah.MalaDireta\Sarah.MalaDireta.Web`
- `J:\DEVELOPER_Projects\SourceControl_NovaEstrutura\Sarah\_git\Sarah.Internet.PortalPaciente\Sarah.Internet.PortalPaciente.Web`
- `J:\DEVELOPER_Projects\SourceControl_NovaEstrutura\Sarah\_git\Sarah.SIH.CopiaProntuario\Sarah.SIH.CopiaProntuario.Web`
- `J:\DEVELOPER_Projects\SourceControl_NovaEstrutura\Sarah\_git\Sarah.SIH.DoacaoRoupas\Sarah.SIH.DoacaoRoupas.Web`

Sinais de cautela:

- Vue 2
- Vuex
- Quasar 1
- viewport fixa
- responsividade muito dependente de condicoes manuais

## 4. Arquivos lidos e por que importam

### Bootstrap e injecao de dependencias

`Sarah.SIH.Prontuario`:

- `src/boot/sarah.ts`
  - mostra auth e componentes compartilhados sendo registrados em boot file
- `src/boot/vue-query.ts`
  - mostra Query instalado de forma dedicada
- `src/stores/index.ts`
  - mostra Pinia centralizado, com espaco para plugins

### Shared components

`Sarah.Componentes.Web`:

- `src/components/STabela/STabela.vue`
  - evidencia o valor de encapsular padroes de CRUD, historico, expansao, slots e acoes em volta do `QTable`
- `src/components/STabela/regras/crud.acoes.ts`
  - mostra um ponto unico para persistencia, remocao, notificacao e query de listagem

### Plugin compartilhado de autenticacao

`Sarah.Componentes.Autenticacao`:

- `src/index.ts`
  - mostra plugin tipado, integracao com router, Pinia, eventos de auth e `provide/inject`

### Testes

`Sarah.SIH.Triagem.InternacaoCirurgia`:

- `tests/setup-file.ts`
  - mostra setup simples e pragmatico com Quasar + Pinia para testes unitarios

## 5. O que a base Sarah ensina de verdade

### Ensina a fazer

- separar inicializacao por boot files
- criar pacote compartilhado quando o padrao se repete muito
- usar wrappers de tabela e dialogo para acelerar CRUD
- colocar Pinia em tudo que e sessao, auth e UI
- usar Query quando a tela depende de leitura e revalidacao frequente
- padronizar testes por setup compartilhado

### Ensina a nao repetir

- formularios presos a altura da viewport
- telas que exigem duas implementacoes visuais para o mesmo fluxo
- muitos tamanhos magicos
- usar estado global para qualquer dado remoto
- tratar responsividade como excecao e nao como regra

## 6. Leitura cruzada com o trabalho anterior do CECOM

A documentacao anterior do `cecom_v1` ja apontava:

- abuso de `vh` e `vw`
- problemas de acessibilidade ligados a viewport
- uso misto de `platform.is.mobile` e breakpoints
- dialogos e tabelas muito centrados em desktop

A base Sarah confirma esses riscos e, ao mesmo tempo, mostra que a organizacao ja esta migrando para uma linha melhor:

- Quasar 2
- Pinia
- Query
- Vite
- TypeScript

## 7. Recomendacao final derivada da varredura

Para novos modulos IBG, a leitura da base Sarah nao recomenda inventar um quarto caminho.

O caminho mais seguro e:

- repetir a linha moderna que ja esta amadurecendo dentro da base
- absorver os wrappers e composables certos
- evitar herdar padroes estruturais que a propria base mais nova esta deixando para tras

