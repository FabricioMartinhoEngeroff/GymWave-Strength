# EF_02 — Registrar Treino (Aba Principal)

---

## 1. Acesso

Aba padrão ao abrir o app (`/app`). Acessada pelo ícone **Registrar** (haltere) na barra de navegação inferior.

Componente: `TreinoSessao`

---

## 2. Atores e Permissões

Qualquer usuário autenticado possui acesso completo a esta tela.

---

## 3. Regras Gerais

- **RG1** – A tela exibe exercícios agrupados por sessão de treino (UA, UB, LA, LB, BR), definidos via planilha importada.
- **RG2** – O usuário deve selecionar a sessão do dia antes de registrar qualquer exercício.
- **RG3** – O registro segue o método Saizen/Heavy Duty. O fluxo padrão é **Top Set** obrigatório → **Back-off** obrigatório → **Série Extra** opcional. As técnicas **BC** e **RP** são alternativas ao Top Set/Back-off: ao ativar uma técnica, esses blocos somem e são substituídos pelos blocos da técnica.
- **RG4** – Os campos **Top Set** e **Back-off** são obrigatórios no modo padrão. Ao usar técnica (BC/RP), o botão **"Confirmar Técnica"** cumpre o mesmo papel. Tentar avançar sem confirmar exibe aviso laranja com ⚠.
- **RG5** – O campo **Série Extra** (exibido somente quando `seriesValidas === 3`) é opcional. Nenhuma validação é exigida para este campo.
- **RG6** – O sistema sugere automaticamente o peso do Back-off com base no percentual do exercício (`backoffPct`). Caso o usuário apague ou edite o valor sugerido, a sugestão não é replicada novamente.
- **RG7** – O sistema sugere o peso do Top Set com base no último registro desse exercício no mesmo treino.
- **RG8** – Ao trocar de exercício ou de sessão, os avisos de validação (Top Set e Back-off) são resetados.
- **RG9** – Se houver alterações não salvas ao trocar de aba, o sistema exibe confirmação `[alteracoes_nao_salvas]`.
- **RG10** – Após salvar todos os exercícios, é exibido um resumo com: quantidade feita / total, e quantos exercícios sobem de peso no próximo ciclo.
- **RG11** – Exercícios podem ser pulados (botão "Pular"). Exercícios pulados não geram registro.
- **RG12** – O rascunho de cada sessão é mantido em memória. Ao voltar para uma sessão já preenchida, os dados digitados são restaurados.
- **RG13** – Durante o preenchimento do bloco Top Set, o sistema recalcula em tempo real o 1RM estimado pela fórmula de Epley: `1RM = Peso × (1 + Reps / 30)`. Se esse valor superar o recorde histórico daquele exercício — ou se as repetições atingirem ou ultrapassarem o teto da faixa cadastrada — o Banner de Progressão assume imediatamente o estado `[banner_pr]` (verde/dourado pulsante), antes mesmo de o usuário confirmar o Top Set. Ao apagar os campos ou reduzir os valores, o banner retorna ao estado anterior.

---

## 4. Tela

### 4.1 Barra Superior (TopBar)

- Título: **GymWave Strength**
- Campo data do treino: editável, formato `DD/MM/AAAA`, valor padrão = data atual.
- Informação de dias desde o último treino da sessão selecionada.

### 4.2 Seletor de Sessão

| Componente | Tipo | Opções | Obrig. |
|---|---|---|---|
| Seletor de sessão | Chips clicáveis | UA / UB / LA / LB / BR | Sim |

Ao clicar em uma sessão já selecionada, a sessão é desmarcada.

### 4.3 Navegação entre Exercícios

- Setas de navegação (anterior / próximo) com indicadores de progresso (pontos).
- Ponto **azul** = exercício atual; **verde** = exercício concluído; **cinza** = não iniciado.
- Botão "Próximo" valida Top Set e Back-off antes de avançar (ou Técnica, se ativa). Se não confirmados, exibe o aviso correspondente.
- Botão "Ver Resumo" (no último exercício) aplica a mesma validação.

### 4.4 Card de Exercício

Exibe por exercício:

| Informação | Descrição |
|---|---|
| Nome | Nome do exercício |
| Grupo muscular | Ex.: Peito, Costas |
| Cue técnico | Dica de execução |
| Faixa de reps Top Set | Ex.: 6–8 reps |
| Faixa de reps Back-off | Ex.: 8–12 reps |
| Badge treino | Identificador da sessão (UA, UB…) |
| Badge séries | "2 válidas" ou "3 válidas" |
| Banner de progressão | Informa se deve subir peso, manter ou primeiro registro. Durante o preenchimento do Top Set assume o estado `[banner_pr]` quando o PR histórico é superado ou o teto de reps é atingido em tempo real (ver RG13) |

### 4.5 Bloco Técnica (chips BC / RP — sempre visíveis, topo do card)

- Chips **BC** (Breathing Cluster) e **RP** (Rest-Pause) aparecem acima do Top Set, sempre visíveis.
- **Ao ativar BC ou RP:** os blocos Top Set, Back-off e Série Extra somem. Os blocos da técnica ocupam o lugar deles.
- **Ao desativar (clicar no chip ativo):** os blocos Top Set e Back-off voltam com campos **limpos** (valores anteriores não são restaurados).
- Alternar entre BC e RP reinicializa os blocos da técnica.

**BC — Breathing Cluster (4 blocos):**

| Nº | Bloco | Campos | Obrig. |
|---|---|---|---|
| 01 | Bloco 1 | Peso (kg) + Repetições | Ao menos 1 bloco |
| 02 | Bloco 2 | Peso (kg) + Repetições | — |
| 03 | Bloco 3 | Peso (kg) + Repetições | — |
| 04 | Bloco 4 | Peso (kg) + Repetições | — |

**RP — Rest-Pause (4 blocos):**

| Nº | Bloco | Campos | Obrig. |
|---|---|---|---|
| 01 | Bloco 1 | Peso (kg) + Repetições | Ao menos 1 bloco |
| 02 | Bloco 2 | Peso (kg) + Repetições | — |
| 03 | Bloco 3 | Peso (kg) + Repetições | — |
| 04 | Bloco 4 | Peso (kg) + Repetições | — |

- Exibe **Total em kg·reps** calculado em tempo real: `Σ (pesoN × repsN)`.
- **Botão "Confirmar Técnica":** exige ao menos 1 bloco com peso e repetições positivos. Se inválido, exibe aviso laranja com ⚠.
- Após confirmação: exibe resumo dos blocos preenchidos (R1: Xkg × Nreps…) e botão "Editar Técnica".
- Volume registrado = soma dos blocos; contagem de séries = número de blocos preenchidos.

### 4.6 Bloco Top Set (obrigatório no modo padrão, oculto quando técnica ativa)

| Nº | Campo | Tipo | Obrig. |
|---|---|---|---|
| 01 | Peso (kg) | Input numérico | Sim |
| 02 | Repetições | Input numérico | Sim |

**Detecção de PR em tempo real:**
A cada alteração nos campos peso ou repetições, o sistema recalcula o 1RM estimado (`Peso × (1 + Reps / 30)`) e compara com o recorde histórico do exercício. Se o critério da RG13 for satisfeito, o Banner de Progressão muda para o estado `[banner_pr]` imediatamente. O cálculo é disparado no evento `onChange` de ambos os campos; ao esvaziar qualquer campo o banner retorna ao estado normal.

**Botão "Confirmar Top Set":**
- Sempre habilitado (clicável).
- Se os campos não estiverem preenchidos com valores positivos: exibe banner de aviso e destaca os campos com borda vermelha.
- Após confirmação: exibe status ("Teto atingido", "Na faixa" ou "Abaixo da faixa") e botão "Editar Top Set". Se o estado `[banner_pr]` estava ativo ao confirmar, o status exibido é "🔥 PR Confirmado!" no lugar dos status padrão.

### 4.7 Bloco Back-off (obrigatório no modo padrão, oculto quando técnica ativa)

| Nº | Campo | Tipo | Obrig. |
|---|---|---|---|
| 01 | Peso (kg) | Input numérico (auto-sugerido) | Sim |
| 02 | Repetições | Input numérico | Sim |

**Regras do campo peso Back-off:**
- Sugestão automática = `topSetKg × backoffPct` na primeira vez.
- Se o usuário editar ou apagar o valor, a sugestão não reaparece (flag `backoffKgWasUserEdited`).
- O campo pode ser apagado livremente.

**Botão "Confirmar Back-off":**
- Sempre habilitado.
- Se campos inválidos: exibe banner de aviso e borda vermelha.
- Após confirmação: exibe botão "Editar Back-off".

### 4.8 Bloco Série Extra (opcional, oculto quando técnica ativa)

Visível quando `seriesValidas === 3` e Back-off confirmado.

| Nº | Campo | Tipo | Obrig. |
|---|---|---|---|
| 01 | Peso (kg) | Input numérico | Não |
| 02 | Repetições | Input numérico | Não |

- O peso é auto-preenchido com o valor do Back-off, mas pode ser editado ou apagado livremente.
- Não há botão de confirmar. Os valores são salvos diretamente ao salvar o treino.
- Faixa de referência exibida abaixo: "não conta para teto".

### 4.9 Observação

- Textarea livre por exercício.
- Não obrigatório.

### 4.10 Botões de Navegação (por exercício)

| Botão | Ação | Regras |
|---|---|---|
| **Pular** | Marca exercício como pulado e avança | — |
| **Próximo** | Avança para o próximo exercício | Modo padrão: valida Top Set e Back-off. Modo técnica: valida Técnica confirmada. |
| **Ver Resumo** | Abre tela de revisão pré-salvamento | Mesma validação do Próximo para o exercício atual. |

### 4.11 Tela de Revisão (Pré-save)

- Lista todos os exercícios com status (✓ concluído / ○ não preenchido / "Pulado").
- Exibe dados resumidos: modo padrão → `Top: Xkg × Nreps · Back-off: Xkg × Nreps · Extra: Xkg × Nreps`; modo técnica → `BC: R1: Xkg × Nreps · R2: Xkg × Nreps …`.
- Ao clicar em um exercício, retorna para edição.
- Botão **"Confirmar e Salvar Treino"**: salva todos os exercícios concluídos no localStorage (`logbook` e `dadosTreino`).
- Botão **"Voltar ao exercício"**: fecha a revisão sem salvar.

### 4.12 Resumo pós-save

- Exibe: `X/Y exercícios registrados`.
- Se houver exercícios que atingiram o teto de reps: `Z exercícios sobem de peso no próximo ciclo`.

---

## 5. Mensagens do Sistema

| Identificador | Tipo | Cor | Título | Texto |
|---|---|---|---|---|
| `[aviso_top_set]` | Aviso inline | Laranja | ⚠ | Preencha o peso e as repetições do Top Set antes de confirmar. |
| `[aviso_backoff]` | Aviso inline | Laranja | ⚠ | Preencha o peso e as repetições do Back-off antes de confirmar. |
| `[aviso_tecnica]` | Aviso inline | Laranja | ⚠ | Preencha pelo menos um bloco com peso e repetições. |
| `[alteracoes_nao_salvas]` | Confirmação | — | — | Você tem alterações não salvas. Sair mesmo assim? |
| `[treino_salvo]` | Sucesso | Verde | — | Treino salvo com sucesso! (banner no topo por 5 s) |
| `[banner_pr]` | Destaque motivacional | Verde/Dourado pulsante | 🔥 Ritmo de Recorde Pessoal! | Confirme para validar o PR. (exibido em tempo real durante preenchimento do Top Set, ver RG13) |
