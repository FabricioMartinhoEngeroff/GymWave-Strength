# Migração Inteligente de Treino

**Funcionalidade:** Importação smart de planilha com preservação de histórico
**Tela:** Exportar / Importar (`src/components/exportar/Exportar.tsx`)

---

## Visão Geral

Quando o usuário importa uma nova planilha de treino, o sistema aplica uma mesclagem inteligente que **preserva todo o histórico de exercícios que continuam no novo programa**, adicionando apenas entradas realmente novas.

A lógica anterior sobrescrevia os dados de qualquer exercício presente na planilha importada, apagando pesos registrados, datas reais de treino e série histórica. A nova lógica é estritamente aditiva para exercícios e ciclos já existentes.

---

## Regras de Mesclagem

### Regra 1 — Exercício novo na planilha

> O exercício **não existe** no `dadosTreino` atual.

- Todos os ciclos com peso preenchido na planilha são criados normalmente.
- Comportamento idêntico ao anterior para exercícios novos.

### Regra 2 — Exercício existente, ciclo existente

> O exercício **já existe** no `dadosTreino` **e** o ciclo (`C1`, `C2`, `C3` ou `C4`) **já tem uma entrada registrada**.

- A entrada existente é **mantida intacta** (data real, pesos reais, reps reais, observações).
- O peso da planilha importada é **ignorado** para esse ciclo.
- Essa entrada conta como **preservada**, não como adicionada.

### Regra 3 — Exercício existente, ciclo novo

> O exercício **já existe** no `dadosTreino`, mas o ciclo específico da planilha **ainda não tem entrada**.

- O ciclo é **adicionado normalmente** com os dados da planilha.
- Conta como **adicionado**.

### Regra 4 — Exercício existente, ciclo sem peso na planilha

> Peso do ciclo na planilha está vazio ou zero.

- Nenhuma ação (igual ao comportamento anterior).

---

## Tabela de Comportamento

| Exercício no banco | Ciclo no banco | Peso na planilha | Ação              | Contabilizado como |
|--------------------|----------------|------------------|-------------------|--------------------|
| Não                | —              | Preenchido       | Cria entrada      | Adicionado         |
| Não                | —              | Vazio            | Ignora            | —                  |
| Sim                | Sim            | Preenchido       | Preserva existente| Preservado         |
| Sim                | Sim            | Vazio            | Ignora            | —                  |
| Sim                | Não            | Preenchido       | Cria entrada      | Adicionado         |
| Sim                | Não            | Vazio            | Ignora            | —                  |

---

## Impacto no Sistema

O histórico preservado continua funcionando normalmente em **todas as partes do app**:

| Funcionalidade | Como usa o histórico | Status após migração |
|---|---|---|
| Pré-preenchimento (tela Registrar) | `ultimoRegistro` lê do `logbook` (chave separada, não tocada pela migração) — preenche Top Set, Back-off e Série Extra com os valores reais do último treino | **Não é afetado** pela importação de planilha |
| Ordem e séries (tela Registrar) | `TreinoSessao` lê `planoTreino` para reordenar exercícios por `ordem` e sobrescrever `seriesValidas` — refletindo o plano importado da planilha | **Atualizado** após importação |
| Gráficos de intensidade | `useDadosTreino` e `buildExerciseHistory` leem todas as entradas de `dadosTreino` por data | Continua inalterado |
| Relatórios | `useRelatorio` lista todas as entradas de `dadosTreino` | Continua inalterado |
| Volume load semanal | `volumeLoadCalc` soma pesos da semana por músculo | Continua inalterado |

> **Nota:** `useSugestaoDePeso` e `carregarUltimaSerie` — referenciados em versões anteriores deste documento — pertencem ao componente `CycleCard` (legado, não renderizado no app). O pré-preenchimento ativo usa exclusivamente `ultimoRegistro` + `logbook`.

---

## Resultado Exibido após Migração

Após confirmar a importação, o card de resultado exibe:

```
Migração concluída — X adicionado(s) · Y preservado(s)
[Sessão]: Z registro(s)
```

- **Adicionados:** entradas criadas (exercícios novos ou ciclos novos em exercícios existentes).
- **Preservados:** ciclos que já tinham dados e não foram alterados.
- O feedback por sessão contabiliza apenas os registros **adicionados**.

---

## Mudanças na Interface

### Removido
- Botão **"Limpar tudo"** (`BtnDanger`) que apagava todos os dados do localStorage.
  - Motivo: risco de perda irreversível de histórico; a importação inteligente torna desnecessário zerar o banco para "recomeçar".

### Mantido
- Botão **"Desfazer importação"** (`BtnWarning`) que restaura automaticamente os backups de `dadosTreino` e `planoTreino` criados antes de cada importação.

---

## Estrutura de Dados

A função `confirmarImport` opera sobre **duas chaves** do localStorage com comportamentos distintos:

### `dadosTreino` — mesclagem aditiva (preserva histórico)

```
dadosTreino = {
  [exercicio: string]: {
    [cicloId: "C1" | "C2" | "C3" | "C4"]: RegistroTreino
  }
}
```

Ciclos existentes são mantidos intactos; só são criados ciclos ainda não registrados.

### `planoTreino` — substituição por sessão (template, não histórico)

```
planoTreino = {
  [sessao: string]: {
    [exercicio: string]: PlanoExercicio
  }
}
```

O plano é **sempre substituído** para as sessões presentes na planilha importada (`{ ...planoExistente, ...planoNovo }`). Sessões ausentes na planilha são preservadas. O `planoTreino` é um template de configuração, não contém histórico de pesos — por isso a substituição é segura.

**Consumo pelo TreinoSessao:** Ao selecionar uma sessão, o componente lê `planoTreino` do localStorage e aplica dois overrides sobre a lista estática `SESSOES`: (1) reordena os exercícios conforme o campo `ordem` do plano; (2) sobrescreve `seriesValidas` de cada exercício. Exercícios sem entrada no plano mantêm a posição e os valores originais do `SESSOES`.

### Pseudocódigo da mesclagem

```
backup dadosTreino = dadosTreino atual
backup planoTreino = planoTreino atual

adicionados = 0
preservados = 0

para cada linha da planilha:
  // planoTreino: sempre atualiza (template)
  planoNovo[sessao][exercicio] = { ordem, series_validas, series_C1..C4 }

  // dadosTreino: mesclagem aditiva
  para cada ciclo (C1–C4) com peso válido:
    se exercicio NÃO existe no banco:
      cria db[exercicio][cicloId] = { hoje, pesos[seriesCount], reps vazias }
      adicionados++
    senão se ciclo NÃO existe no banco:
      cria db[exercicio][cicloId] = { hoje, pesos[seriesCount], reps vazias }
      adicionados++
    senão:
      preservados++   // não toca na entrada existente

salva dadosTreino no localStorage
salva planoTreino mesclado ({ ...planoExistente, ...planoNovo })
exibe resultado: adicionados + preservados
```

### Desfazer importação

Restaura **ambas** as chaves a partir dos backups criados antes da importação (`dadosTreino_backup` e `planoTreino_backup`).

---

## Arquivo de Testes

`src/__tests__/components/exportar/Exportar.spec.tsx`

Seção relevante: **Migração inteligente** — ver `TESTES.md` seção 9.8.
