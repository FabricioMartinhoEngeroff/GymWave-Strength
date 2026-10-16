# EF_06 — Exportar / Importar Dados

---

## 1. Acesso

Aba **Exportar** na barra de navegação inferior (ícone de download).

Componente: `Exportar`

---

## 2. Atores e Permissões

Qualquer usuário autenticado possui acesso.

---

## 3. Regras Gerais

- **RG1** – A exportação lê os dados armazenados no `localStorage` (`dadosTreino` e `logbook`).
- **RG2** – A importação aceita arquivos nos formatos `.xlsx` e `.csv`.
- **RG3** – Antes de importar, o sistema salva um backup automático dos dados atuais (`dadosTreino_backup`, `planoTreino_backup`), permitindo desfazer a operação.
- **RG4** – A importação preserva registros já existentes no ciclo correspondente (não sobrescreve dados já registrados).
- **RG5** – A importação atualiza o plano de treino (`planoTreino`) com as sessões e exercícios da planilha, sobrescrevendo o plano anterior (o plano é um template, não histórico). O `planoTreino` é consumido pela tela Registrar Treino (EF_02) para reordenar exercícios e sobrescrever `seriesValidas`.
- **RG5.1** – Os exercícios importados são ordenados pelo campo `ordem` da planilha dentro de cada sessão, tanto na pré-visualização quanto no plano salvo.
- **RG5.2** – Nomes de exercícios da planilha são normalizados para os nomes canônicos do app via mapeamento interno (`NOME_MAP`), garantindo correspondência com `SESSOES` e `logbook`.
- **RG5.3** – O `series_validas` importado prevalece sobre o histórico de treinos anteriores desse exercício (ver EF_02 RG1.2). Reimportar a planilha com um `series_validas` diferente (ex.: subir um exercício de 2 para 3 séries válidas) atualiza o comportamento da tela Registrar Treino imediatamente, mesmo que o exercício já tenha registros salvos com o valor antigo.
- **RG6** – O sistema exibe uma pré-visualização dos dados antes de confirmar a importação.
- **RG7** – Após importação bem-sucedida, o botão "Desfazer importação" fica disponível enquanto o usuário permanecer na tela.
- **RG8** – Ao desfazer, o sistema restaura os dados do backup e remove o resultado exibido.

---

## 4. Tela

### 4.1 Barra Superior (TopBar)

- Título: **Exportar dados**
- Subtítulo: *Faça backup do seu histórico*

### 4.2 Card de Informações

| Informação | Descrição |
|---|---|
| Total de registros | Contagem total de sessões salvas no `dadosTreino` |
| Período | Primeira e última data registrada (formato `mês/ano → mês/ano`) |

### 4.3 Botões de Exportação

| Botão | Ação | Formato gerado |
|---|---|---|
| **Exportar como CSV** | Gera arquivo com todos os registros do `logbook` | `.csv` com colunas: data, exercicio, treino_id, top_set_kg, top_set_reps, backoff_kg, backoff_reps, series_validas, extra_kg, extra_reps |
| **Exportar como JSON** | Gera backup completo do `dadosTreino` | `.json` com toda a estrutura armazenada |

**Nome dos arquivos:**
- CSV: `gymwave_AAAA-MM-DD.csv`
- JSON: `gymwave_backup_AAAA-MM-DD.json`

### 4.4 Importação de Planilha

Exibida ao clicar em **"Importar planilha"**.

#### Área de Upload

- Componente do tipo "arraste e solte" (drop zone).
- Texto: *"Arraste e solte o arquivo aqui ou clique para selecionar"*
- Subtexto: `.xlsx ou .csv`
- Ao clicar: abre explorador de arquivos.
- Formatos aceitos: `.xlsx`, `.csv`.
- Acessível via teclado (Enter ativa o explorador).

#### Mapeamento de Colunas

O sistema reconhece automaticamente as colunas da planilha pelos seguintes padrões (case-insensitive):

| Coluna esperada | Padrão reconhecido |
|---|---|
| Sessão | `sessão`, `sessao`, `treino` (v4 logbook) |
| Ordem | `ord.`, `ordem` |
| Exercício | `exercício`, `exercicio` |
| Grupo/Músculo | `grupo`, `músculo`, `musculo` |
| Rep. Mínimo | `rep min`, `rep mín` |
| Rep. Máximo | `rep max`, `rep máx` |
| Séries | `séries`, `series` |
| Séries C1–C4 | `séries c1`, `c1 séries` (e variações para C2, C3, C4) |
| Peso C1–C4 (kg) | `peso c1`, `peso c2`, `peso c3`, `peso c4` |
| Top Set Kg (v4) | `top set kg` (mapeado para peso C1) |
| Back-off Kg (v4) | `back-off kg`, `backoff kg` (mapeado para peso C2) |

Cabeçalhos de células com quebra de linha no Excel (texto "wrap") chegam com `\r\n` (CR+LF), não só `\n` — o sistema normaliza os dois antes de aplicar os padrões acima, para que colunas como `Top\r\nMín`, `TOP SET\r\nKg` e `BACK-OFF\r\nKg` sejam reconhecidas corretamente.

#### Pré-visualização

- Após leitura do arquivo, exibe tabela com colunas: Sessão, Exercício, Músculo, Reps (min–max), C1 kg, C2 kg, C3 kg, C4 kg.
- Exibe contagem: `X linhas (Y com peso preenchido)`.
- Pesos preenchidos aparecem em badge colorido; campos vazios aparecem como `—`.

#### Botões de Importação

| Botão | Ação | Regras |
|---|---|---|
| **Confirmar importação** | Executa a importação | Desabilitado se não houver linhas carregadas. Exibe resultado após execução. |
| **Desfazer importação** | Restaura dados do backup | Disponível apenas após importação bem-sucedida. Exige confirmação. |
| **Fechar importação** | Oculta a seção de importação | Reseta o estado (arquivo, pré-visualização, resultado). |

#### Resultado da Importação

Após confirmação bem-sucedida, exibe card com:
- Total de registros adicionados.
- Total de registros preservados (já existiam).
- Detalhamento por sessão: `NomeSessao: X registros`.

---

## 5. Estrutura da Planilha de Importação

| Coluna | Descrição | Obrig. |
|---|---|---|
| Sessão | Identificador da sessão (UA, UB, LA, LB, BR) | Sim |
| Ordem | Posição do exercício na sessão | Não |
| Exercício | Nome do exercício (deve corresponder ao cadastro) | Sim |
| Grupo / Músculo | Grupo muscular primário | Não |
| Rep mín / Rep máx | Faixa de repetições | Não |
| Séries | Número de séries válidas (1–3) | Não (padrão: 3) |
| Séries C1–C4 | Séries válidas por ciclo específico | Não |
| Peso C1–C4 (kg) | Peso inicial sugerido por ciclo | Não |

---

## 6. Mensagens do Sistema

| Identificador | Tipo | Cor | Texto |
|---|---|---|---|
| `[importacao_concluida]` | Informação | Azul | Migração concluída — X adicionados · Y preservados |
| `[confirmar_desfazer]` | Confirmação | — | Desfazer a importação e restaurar os dados anteriores? |
| `[sem_linhas]` | — | — | Botão "Confirmar importação" permanece desabilitado |
