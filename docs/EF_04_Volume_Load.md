# EF_04 — Volume Load por Músculo

---

## 1. Acesso

Aba **Volume** na barra de navegação inferior (ícone de raio).

Componente: `VolumeLoad`

---

## 2. Atores e Permissões

Qualquer usuário autenticado com dados registrados possui acesso.

---

## 3. Regras Gerais

- **RG1** – O cálculo é feito automaticamente com base nos dados do `localStorage` (`logbook`).
- **RG2** – A tela compara o período atual com o período anterior por grupo muscular. O período é definido pelo toggle de granularidade (semana ou mês).
- **RG3** – Volume Load = soma de (peso × repetições) de todas as séries do músculo no período selecionado.
- **RG4** – O sistema classifica o número de séries semanais por músculo em quatro categorias, calibradas para o método Saizen/Heavy Duty:
  - **Abaixo do estímulo:** < 4 séries semanais.
  - **Adequado (ok):** 4–10 séries semanais.
  - **Volume alto:** 11–16 séries (risco de junk volume para este método).
  - **Risco de overtraining:** > 16 séries semanais.
- **RG5** – Se não houver dados no período atual nem no anterior, exibe a mensagem `[sem_dados_periodo]`.
- **RG6** – Apenas grupos musculares com ao menos um registro são exibidos.
- **RG7** – O toggle de granularidade alterna entre **Semana** e **Mês**. A comparação acompanha: semana atual vs semana anterior, ou mês atual vs mês anterior.
- **RG8** – O banner de semanas consecutivas (`[banner_deload]`) é exibido quando o usuário possui ≥ 10 semanas de treino contínuo no logbook sem pausa de ≥ 7 dias. Semanas consecutivas são contadas a partir das datas reais dos registros.
- **RG9** – O badge `[estagnado]` é exibido no card do grupo muscular quando ≥ 2 exercícios daquele grupo acumulam ≥ 4 sessões consecutivas sem progressão (`progrediu === false` e `topSetBateuTeto === false`).
- **RG10** – O badge `[↓ carga]` é exibido no card do grupo muscular quando o tonnage (peso × reps) caiu entre o período anterior e o atual em ≥ 2 exercícios daquele grupo.

---

## 4. Tela

### 4.1 Barra Superior (TopBar)

- Título: **Volume load por músculo**
- Subtítulo dinâmico conforme granularidade:
  - Semana: *Semana atual vs semana anterior*
  - Mês: *Mês atual vs mês anterior*

### 4.2 Toggle de Granularidade

Chips clicáveis abaixo da TopBar:

| Opção | Janela de cálculo |
|---|---|
| **Esta semana** (padrão) | Seg–Dom da semana ISO atual vs semana anterior |
| **Este mês** | Mês calendário atual vs mês anterior |

### 4.3 Banner de Deload (`[banner_deload]`)

Exibido acima dos cards de resumo quando RG8 for satisfeita.

| Elemento | Detalhe |
|---|---|
| Cor de fundo | Amarelo suave (`#fefce8`) |
| Ícone | 🟡 |
| Texto principal | `X semanas de treino contínuo` |
| Texto secundário | `Você pode estar acima do teto recuperável. Considere 1–2 semanas com volume reduzido.` |

O banner some automaticamente quando o usuário fizer uma pausa ≥ 7 dias (detectada pelo logbook).

### 4.4 Cards de Resumo

| Card | Dado exibido |
|---|---|
| Volume load total | Soma do volume load de todos os músculos no período atual (formato "Xk kg") |
| Variação vs período anterior | Percentual de variação (verde se positivo, vermelho se negativo, "—" se igual) |

### 4.5 Cards por Grupo Muscular

Para cada grupo muscular com dados, exibe:

| Informação | Descrição |
|---|---|
| Nome do músculo | Ex.: Peito, Costas, Quadríceps |
| Número de séries | Qtd de séries no período atual |
| Badge de volume | `abaixo do estímulo` (amarelo) / `adequado` (verde) / `volume alto` (laranja) / `risco overtraining` (vermelho) — conforme RG4 |
| Badge de estagnação | `estagnado` (laranja) — conforme RG9; exibido ao lado do badge de volume |
| Badge de queda | `↓ carga` (vermelho) — conforme RG10; exibido ao lado dos outros badges |
| Variação percentual | Variação vs período anterior (verde / vermelho / "—") |
| Barra período anterior | Barra cinza proporcional ao volume anterior |
| Barra período atual | Barra colorida (verde = crescimento, vermelho = queda, azul = igual) |
| Valores numéricos | Volume em kg ao lado de cada barra |

Regra de exibição dos badges de diagnóstico:
- Os badges `[estagnado]` e `[↓ carga]` são independentes do badge de volume — podem aparecer juntos ou separados.
- Um músculo pode ter `risco overtraining` + `estagnado` ao mesmo tempo (volume alto mas sem progressão de carga).

---

## 5. Lógica de Diagnóstico de Fadiga

### 5.1 Semanas Consecutivas (RG8)

```
semanas_com_treino = conjunto de semanas ISO com ao menos 1 registro no logbook
streak = 0
para cada semana em ordem decrescente:
  se semana tem registro:
    streak++
  senão:
    break   // primeira semana sem treino encerra a contagem
exibir [banner_deload] se streak >= 10
```

### 5.2 Estagnação por Exercício (RG9)

```
para cada exercício do grupo muscular:
  pegar últimas N sessões do logbook (mesmo treinoId)
  contar quantas consecutivas têm progrediu === false E topSetBateuTeto === false
  se >= 4 → exercício estagnado

se >= 2 exercícios do grupo estagnados → badge [estagnado] no card do grupo
```

### 5.3 Queda de Rendimento (RG10)

```
para cada exercício do grupo muscular:
  tonnage_atual   = topSetKg × topSetReps (última sessão no período atual)
  tonnage_anterior = topSetKg × topSetReps (última sessão no período anterior)
  se tonnage_atual < tonnage_anterior → exercício com queda

se >= 2 exercícios do grupo com queda → badge [↓ carga] no card do grupo
```

---

## 6. Mensagens do Sistema

| Identificador | Tipo | Cor | Texto |
|---|---|---|---|
| `[sem_dados_periodo]` | Informação | Cinza | Nenhum treino registrado neste período ou no anterior. |
| `[banner_deload]` | Alerta | Amarelo | `X semanas de treino contínuo — considere 1–2 semanas com volume reduzido.` |
