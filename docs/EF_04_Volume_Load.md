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
- **RG2** – A tela compara a semana atual com a semana anterior por grupo muscular.
- **RG3** – Volume Load = soma de (peso × repetições) de todas as séries do músculo na semana.
- **RG4** – O sistema classifica o número de séries semanais por músculo em quatro categorias, calibradas para o método Saizen/Heavy Duty:
  - **Abaixo do estímulo:** < 4 séries semanais.
  - **Adequado (ok):** 4–10 séries semanais.
  - **Volume alto:** 11–16 séries (risco de junk volume para este método).
  - **Risco de overtraining:** > 16 séries semanais.
- **RG5** – Se não houver dados na semana atual nem na anterior, exibe a mensagem "Nenhum treino registrado esta semana ou na anterior."
- **RG6** – Apenas grupos musculares com ao menos um registro são exibidos.

---

## 4. Tela

### 4.1 Barra Superior (TopBar)

- Título: **Volume load por músculo**
- Subtítulo: *Semana atual vs semana anterior*

### 4.2 Cards de Resumo

| Card | Dado exibido |
|---|---|
| Volume load total | Soma do volume load de todos os músculos na semana atual (em kg ou em formato "Xk kg") |
| Variação vs semana anterior | Percentual de variação (verde se positivo, vermelho se negativo, "—" se igual) |

### 4.3 Cards por Grupo Muscular

Para cada grupo muscular com dados, exibe:

| Informação | Descrição |
|---|---|
| Nome do músculo | Ex.: Peito, Costas, Quadríceps |
| Número de séries | Exibe qtd de séries na semana atual |
| Badge de alerta | "abaixo do estímulo" (amarelo), "adequado" (verde), "volume alto" (laranja) ou "risco overtraining" (vermelho), conforme RG4 |
| Variação percentual | Variação vs semana anterior (verde / vermelho / "—") |
| Barra semana anterior | Barra cinza proporcional ao volume anterior |
| Barra semana atual | Barra colorida (verde = crescimento, vermelho = queda, azul = igual) |
| Valores numéricos | Volume em kg ao lado de cada barra |

---

## 5. Mensagens do Sistema

| Identificador | Tipo | Cor | Texto |
|---|---|---|---|
| `[sem_dados_semana]` | Informação | Cinza | Nenhum treino registrado esta semana ou na anterior. |
