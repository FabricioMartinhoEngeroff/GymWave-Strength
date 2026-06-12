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
| Sugestão de peso (tela principal) | `useSugestaoDePeso` lê o topSet do C4 e aplica multiplicadores | Continua inalterado |
| Gráficos de intensidade | `useDadosTreino` e `buildExerciseHistory` leem todas as entradas por data | Continua inalterado |
| Relatórios | `useRelatorio` lista todas as entradas de `dadosTreino` | Continua inalterado |
| Auto-fill no registro | `carregarUltimaSerie` lê o último peso do ciclo | Continua inalterado |
| Volume load semanal | `volumeLoadCalc` soma pesos da semana por músculo | Continua inalterado |

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
- Botão **"Desfazer importação"** (`BtnWarning`) que restaura o backup automático criado antes de cada importação.

---

## Estrutura de Dados

A função `confirmarImport` opera sobre a chave `dadosTreino` do localStorage:

```
dadosTreino = {
  [exercicio: string]: {
    [cicloId: "C1" | "C2" | "C3" | "C4"]: RegistroTreino
  }
}
```

### Pseudocódigo da mesclagem

```
backup = dadosTreino atual
adicionados = 0
preservados = 0

para cada linha da planilha:
  para cada ciclo (C1–C4) com peso válido:
    se exercicio NÃO existe no banco:
      cria db[exercicio] = {}
      cria db[exercicio][cicloId] = { hoje, pesos, reps vazias }
      adicionados++
    senão se ciclo NÃO existe no banco:
      cria db[exercicio][cicloId] = { hoje, pesos, reps vazias }
      adicionados++
    senão:
      preservados++   // não toca na entrada existente

salva db no localStorage
exibe resultado: adicionados + preservados
```

---

## Arquivo de Testes

`src/__tests__/components/exportar/Exportar.spec.tsx`

Seção relevante: **Migração inteligente** — ver `TESTES.md` seção 9.8.
