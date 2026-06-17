# Pendente — Refatoração das Técnicas Avançadas (BC / RP)

## Comportamento definido

### Fluxo ao ativar técnica
- Ao clicar em **BC** ou **RP**, os blocos de **Top Set e Back-off somem** da tela
- No lugar aparecem os inputs da técnica selecionada

### BC — Breathing Cluster (4 blocos)
- R1: campo peso (kg) + campo reps
- R2: campo peso (kg) + campo reps
- R3: campo peso (kg) + campo reps
- R4: campo peso (kg) + campo reps

### RP — Rest-Pause (2 blocos)
- R1: campo peso (kg) + campo reps
- R2: campo peso (kg) + campo reps

Cada bloco tem peso e reps independentes (podem variar entre blocos).

### Fluxo ao desativar técnica
- Ao desmarcar BC/RP (clicar novamente no chip ativo), os campos de Top Set e Back-off voltam
- Os valores de Top Set e Back-off são **limpados** (não restaurados)

### Cálculo de Volume Load
- O volume da técnica é somado como se fossem séries normais:
  `(peso_R1 × reps_R1) + (peso_R2 × reps_R2) + ...`
- O resultado total deve ser equivalente ao treino sem técnica
- A contagem de séries semanais deve incluir os blocos da técnica

---

## Estado atual do código (antes da mudança)

- Arquivo principal: `src/components/treinoSessao/TreinoSessao.tsx`
- A técnica atualmente é **adicional** ao Top Set e Back-off (não os substitui) — ERRADO
- `clusterReps` salva apenas reps, sem campo de peso por bloco — INCOMPLETO
- `volumeLoadCalc.ts` ignora completamente `clusterReps` — INCOMPLETO

## Mudanças necessárias

### 1. Tipo `ExerciseState` (TreinoSessao.tsx)
- Substituir `clusterReps: string[]` por array de objetos: `clusterSeries: { kg: string; reps: string }[]`
- Ao ativar técnica: zera `topSetKg`, `topSetReps`, `backoffKg`, `backoffReps`
- Ao desativar técnica: zera todos os campos de `clusterSeries`

### 2. Tipo `RegistroExercicio` (types/TrainingData.ts)
- Substituir `clusterReps?: number[]` por `clusterSeries?: { kg: number; reps: number }[]`

### 3. UI (TreinoSessao.tsx — render do exercício)
- Quando `tecnica` ativo: **ocultar** blocos Top Set e Back-off, **exibir** blocos da técnica
- Cada bloco da técnica: campo peso + campo reps, label "Bloco N"
- Exibir total calculado: soma de todas as reps × pesos

### 4. Salvamento (`handleSalvarTreino`)
- Quando `tecnica` ativo: usar `clusterSeries` para montar o registro
- `topSetKg/Reps` e `backoffKg/Reps` ficam como 0 no registro

### 5. Volume Load (`volumeLoadCalc.ts`)
- Quando `clusterSeries` presente: somar `(kg × reps)` de cada bloco
- Contar número de blocos como séries individuais
