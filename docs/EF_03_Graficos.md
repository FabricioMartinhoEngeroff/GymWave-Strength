# EF_03 — Gráficos

---

## 1. Acesso

Aba **Gráficos** na barra de navegação inferior (ícone de tendência).

Rota também acessível via `/graficos` (link externo, requer autenticação).

Componente: `GraphicsContainer`

---

## 2. Atores e Permissões

Qualquer usuário autenticado com dados registrados possui acesso.

---

## 3. Regras Gerais

- **RG1** – Os gráficos são gerados a partir dos dados armazenados no `localStorage` (`dadosTreino` e `logbook`).
- **RG2** – Caso não haja dados para o filtro aplicado, o sistema exibe mensagem "Sem registros para listar."
- **RG3** – O usuário pode filtrar por exercício e por período (intervalo de tempo).
- **RG4** – Os gráficos são atualizados ao alterar os filtros.
- **RG5** – A barra de busca por exercício filtra as opções em tempo real.
- **RG6** – No Gráfico de Repetições, todo ponto em que as repetições do Top Set atingirem ou ultrapassarem o limite superior da faixa cadastrada para o exercício é destacado visualmente (bolinha verde e ícone de seta para cima). Esse destaque indica a sessão em que houve quebra de recorde e a progressão de carga deveria ter sido aplicada.
- **RG7** – No Gráfico de Volume Load, barras de sessões em que foi utilizada técnica avançada (BC — Breathing Cluster ou RP — Rest-Pause) recebem um marcador visual diferenciado (cor alternativa ou tag sobreposta). O tooltip dessas barras indica a técnica utilizada. Isso evita que picos de volume gerados pela acumulação de blocos sejam confundidos com evolução real de carga.

---

## 4. Tela

### 4.1 Filtros

| Nº | Campo | Tipo | Obrig. | Opção padrão |
|---|---|---|---|---|
| 01 | Exercício | Select com pesquisa | Não | Todos |
| 02 | Período | Select sem pesquisa | Não | Últimos 90 dias |

**Opções de período disponíveis:**

| Valor | Descrição |
|---|---|
| `7d` | Últimos 7 dias |
| `30d` | Últimos 30 dias |
| `90d` | Últimos 90 dias |
| `180d` | Últimos 6 meses |
| `365d` | Último ano |
| `all` | Todo o histórico |

### 4.2 Gráficos Exibidos

#### Gráfico de Evolução de Carga (Top Set)

- **Tipo:** Linha.
- **Eixo X:** Data do treino.
- **Eixo Y:** Peso (kg) do Top Set.
- **Dado agrupador:** Exercício selecionado.
- **Tooltip:** Exibe data + peso + repetições do Top Set.

#### Gráfico de Volume Load

- **Tipo:** Barra.
- **Eixo X:** Data do treino.
- **Eixo Y:** Volume total (kg × reps).
- **Tooltip:** Exibe data + volume total calculado + técnica utilizada (se BC ou RP).
- **Destaque de técnica avançada:** Barras de sessões com BC ou RP são exibidas em cor alternativa (ex.: roxo/âmbar) e recebem uma tag sobreposta com o nome da técnica. Ver **RG7**.

#### Gráfico de Repetições

- **Tipo:** Linha.
- **Eixo X:** Data do treino.
- **Eixo Y:** Repetições do Top Set.
- **Referência visual:** Linhas horizontais indicando os limites da faixa (mín / máx) do exercício selecionado.
- **Destaque de teto atingido:** Pontos em que as reps atingem ou ultrapassam o limite superior da faixa são exibidos em verde com ícone de seta para cima (↑). Ver **RG6**.

---

## 5. Mensagens do Sistema

| Identificador | Tipo | Cor | Texto |
|---|---|---|---|
| `[sem_dados]` | Informação | Cinza | Sem registros para listar. |
