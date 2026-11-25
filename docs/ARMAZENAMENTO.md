# Armazenamento local — inventário e plano de encapsulamento

Refatoração **Encapsular variável**: só o módulo de armazenamento toca no `localStorage`. **Não muda comportamento**: mesmas chaves, mesmo formato gravado, sem migração de dados.

**Situação:** inventário feito em 25/11/2026. As seções 1, 2 e 6 descrevem o código **antes** da refatoração.

| Etapa | Estado |
|---|---|
| Grupo (a): preferências e rascunho | Feito |
| Grupo (b): plano e sessões | A fazer |
| Grupo (c): dados de treino, histórico e backups | A fazer |
| Regra ESLint | A fazer |

Linhas a migrar: 40 no início, **30** depois do grupo (a).

**Decisões:** `carregarDados` e `salvarDados` mantêm o nome. `storageKey` continua exportada, mas só o módulo e os testes podem usá-la (ESLint). Todos os `*_backup` ficam no grupo (c). Cópia e desfazer seguem a ordem do Exportar: `dadosTreino`, `planoTreino`, `sessoes_config` e, por último, `registros`. Não há função para apagar backup.

---

## 1. Contagem

Linhas com `get/set/removeItem` fora dos testes: **65**.

| Onde | Linhas |
|---|---|
| `utils/storage.ts` | 22 |
| `AdminImport` | 10 |
| `Exportar` | 9 |
| `backupJson` | 7 |
| `TextImport` | 4 |
| `treinoSessao/domain/rascunho.ts` | 3 |
| `useEscalaEsforco` · `CycleInstruction` | 2 + 2 |
| `backupEmergencia` · `CycleCard.logic` · `cyclesCard/index` | 1 + 1 + 1 |
| **A migrar** (soma acima, sem `storage.ts`) | **40** |
| `MockAuthGateway` (autenticação, fora do escopo) | 3 |

Há também acessos que não são `get/set/removeItem`: `Object.keys(localStorage)` em `storage.ts` e em `backupEmergencia.ts` (este a migrar), e `legacyPurge` (autenticação, fora do escopo). Algumas linhas têm duas chamadas. Nada fora de `src/` usa `localStorage`.

---

## 2. Chaves

Todas são gravadas como `gw:{id do usuário}:{chave}`; sem usuário, só `{chave}`. A chave é montada **na hora de cada acesso**, porque o usuário atual pode mudar (`AdminImport` e `TextImport` chamam `setCurrentUser`).

| Chave | Formato | Quem lê hoje | Quem grava hoje | Quem apaga hoje |
|---|---|---|---|---|
| `escala_esforco` | texto `RPE`/`RIR` | `useEscalaEsforco` | `useEscalaEsforco` | — |
| `instrucoesVistas` | texto `true` | `CycleInstruction` | `CycleInstruction` | — |
| `rascunho_treino` | objeto por sessão | `rascunho.ts`, `backupEmergencia` | `rascunho.ts` | `rascunho.ts` (última sessão), `Exportar`, `AdminImport`, `TextImport` (tudo) |
| `planoTreino` | objeto | `sessoes.ts`, `backupJson`, `backupEmergencia` | `Exportar`, `AdminImport`, `TextImport`, `backupJson` | — |
| `sessoes_config` | objeto | `sessoes.ts`, `backupJson`, `backupEmergencia` | `Exportar`, `AdminImport`, `TextImport`, `backupJson` | — |
| `dadosTreino` | objeto | `storage.ts` (`carregarDados`), `backupJson`, `backupEmergencia`, `cyclesCard/index` | `storage.ts` (`salvarDados`), `Exportar`, `AdminImport`, `TextImport`, `backupJson`, `CycleCard.logic` | `AdminImport` (Limpar tudo) |
| `registros` | lista | `storage.ts`, `backupEmergencia` | `storage.ts` | `storage.ts` (`limparRegistros`) |
| `logbook` | objeto (v2) | `storage.ts` (migração), `backupEmergencia` | só a restauração do `emTransacao` e a migração de chave global | `storage.ts` (migração, `limparRegistros`) |
| `logbook_v1_backup` | cópia crua | `emTransacao` | `storage.ts` (migração) | — |
| `dadosTreino_backup` · `planoTreino_backup` · `sessoes_config_backup` | cópia crua | `Exportar`, `AdminImport`, `backupJson` | os mesmos três | — |
| `registros_backup` | cópia crua | `storage.ts` (`restaurarRegistros`) | `storage.ts` (`fotografarRegistros`) | — |
| `registros_corrompido*` · `dadosTreino_corrompido*` | cópia crua | `storage.ts`, `backupEmergencia` | `storage.ts` (`guardarCorrompido`) | — |

`emTransacao` lê, apaga e regrava `registros`, `logbook`, `logbook_v1_backup`, `dadosTreino`, `planoTreino` e `sessoes_config`. Não cobre `rascunho_treino` nem os `*_backup`.

---

## 3. Módulo proposto

Pasta `src/utils/storage/` com `index.ts`. O caminho `utils/storage` continua valendo, então nenhum import existente muda.

| Arquivo | Conteúdo |
|---|---|
| `chaves.ts` | usuário atual, `storageKey`, migração de chaves globais |
| `leitura.ts` (interno) | ler e gravar texto/JSON, cópia do corrompido, ouvintes |
| `preferencias.ts` | escala e instruções |
| `rascunho.ts` | rascunho do treino |
| `plano.ts` | plano e sessões |
| `dadosTreino.ts` | `dadosTreino` |
| `historico.ts` | registros, logbook e consultas do histórico (só movidos) |
| `copiaDeSeguranca.ts` | `*_backup`, desfazer, leituras para o backup JSON e o de emergência |
| `transacao.ts` | `emTransacao` |

---

## 4. Funções novas

### Grupo (a) — preferências e rascunho

| Função | Substitui |
|---|---|
| `carregarEscala()` | `useEscalaEsforco`: `getItem === "RIR" ? "RIR" : "RPE"` |
| `salvarEscala(escala)` | `useEscalaEsforco`: `setItem` (erro de gravação continua subindo) |
| `instrucoesForamVistas()` · `marcarInstrucoesVistas()` | `CycleInstruction` |
| `carregarRascunhos()` · `salvarRascunhos(porSessao)` | `loadDraftStore` · `saveDraftStore` |
| `limparRascunhos()` | `removeItem("rascunho_treino")` em `rascunho.ts`, `Exportar`, `AdminImport` e `TextImport` |

`saveDraft`, `loadDraft` e `clearDraft` ficam em `treinoSessao/domain/rascunho.ts`: são regra da tela (uma sessão, sanear o estado) e passam a usar as funções acima.

### Grupo (b) — plano e sessões

| Função | Substitui |
|---|---|
| `carregarPlano()` · `carregarSessoesConfig()` | `lerObjetoSalvo("planoTreino")` e `("sessoes_config")` em `sessoes.ts`; `lerObjetoSalvo` deixa de ser exportada |
| `salvarPlano(plano)` · `salvarSessoesConfig(config)` | 4 pares de `setItem`: `Exportar`, `AdminImport`, `TextImport`, `backupJson` |

### Grupo (c) — dados de treino, histórico e backups

| Função | Substitui |
|---|---|
| `carregarDados()` (já existe) | — |
| `salvarDados(dados)` (já existe) | continua: **tira os ciclos vazios** antes de gravar |
| `salvarDadosSemFiltrar(dados)` | `setItem("dadosTreino")` em `Exportar`, `AdminImport`, `TextImport`, `backupJson`, `CycleCard.logic` |
| `lerDadosTreinoComoTexto()` | `cyclesCard/index` |
| `limparHistorico()` | `removeItem("dadosTreino")` + `limparRegistros()` em Limpar tudo |
| `fazerCopiaDeSeguranca()` | os 3 `*_backup` + `fotografarRegistros()` em `Exportar`, `AdminImport`, `backupJson` |
| `restaurarCopiaDeSeguranca()` | o laço de desfazer + `restaurarRegistros()` nos mesmos três (`desfazerBackup` some) |
| `lerComoGravado(chave, vazio)` | `lerChave` do `backupJson` |
| `listarChavesDoUsuario()` e leitura do texto guardado | `Object.keys(localStorage)` e `getItem` do `backupEmergencia` |

Depois deste grupo, `fotografarRegistros`, `restaurarRegistros` e `limparRegistros` ficam internas.

---

## 5. Diferenças que parecem iguais (não unificar)

Cada uma tem teste de caracterização escrito antes da refatoração do seu grupo. Já fixada: a 4 (`rascunho.spec.ts`) e, da 6, o rascunho fora da transação (`importacoes.rascunho.spec.tsx`).

1. **Duas gravações de `dadosTreino`.** `salvarDados` descarta ciclos vazios e quebra se um peso não for texto; as importações gravam tudo. Trocar uma pela outra poderia apagar dados.
2. **Duas leituras no backup JSON.** `lerChave` devolve o que o JSON tiver (lista, `null`), sem filtrar nem avisar corrupção. `carregarDados` filtra e guarda cópia. Trocar mudaria o arquivo exportado e a decisão de restaurar o plano.
3. **Plano e sessões ilegíveis viram vazio, sem cópia `_corrompido`.** Só `registros` e `dadosTreino` têm cópia.
4. **Rascunho tem leitura própria:** nunca lança (nem se o `getItem` falhar) e aceita lista como objeto.
5. **`registros_backup` vazio é `[]`; os outros são `{}`.** Desfazer sem dado anterior deixa `{}` gravado, não a chave ausente.
6. **`TextImport` não faz cópia de segurança** e apaga o rascunho fora da transação.
7. **Limpar tudo** apaga só `dadosTreino`, `registros` e `logbook`. Plano, sessões, rascunho e `*_backup` ficam.
8. **`cyclesCard/index` exporta o JSON codificado duas vezes** (`JSON.stringify` de um texto). Mantido.

---

## 6. Cobertura de testes hoje

| Grupo | Já coberto | Falta fixar antes de mexer |
|---|---|---|
| (a) | Rascunho na tela (19 casos), instruções por usuário, escala lembrada ao reabrir | Escala inválida vira RPE, escala por usuário, falha ao gravar; `getItem` falhando no rascunho; importações apagam o rascunho de todas as sessões (Exportar, AdminImport, TextImport) |
| (b) | Plano e sessões gravados e substituídos nas importações; ilegível vira vazio; backup JSON só restaura se vazio | Texto exato gravado nas chaves; plano `null` ou lista no backup JSON; gravação no escopo do usuário em cada importação |
| (c) | Transação, corrompidos, migração v2, desfazer no AdminImport e no backup JSON | `dadosTreino_backup` (nenhum teste cita); `*_backup` e desfazer completo no Exportar; desfazer sem dado anterior; Limpar tudo preserva plano e backups; ciclo vazio preservado nas importações; `CycleCard` salvar e exportar |

---

## 7. ESLint (etapa final)

- `no-restricted-globals` e `no-restricted-properties` para `localStorage` (inclui `window.localStorage` e `globalThis.localStorage`), mantendo a regra atual do `alert`.
- `no-restricted-imports` para `storageKey` e para os arquivos internos da pasta.
- Exceções: `src/utils/storage/**`, `src/__tests__/**` e a autenticação (`src/components/login/**`).
