# EF_09 — Mensagens, Conquistas e Tela de Erro (Módulo Global)

---

## 1. Acesso

Módulo global, presente em todas as telas. Não tem rota própria.

Componentes: `src/components/mensagens/` — `CentralDeMensagens` (avisos e diálogos), `ErrorBoundary` e `TelaErro`.

---

## 2. Atores e Permissões

Qualquer pessoa usando o app, logada ou não. "Baixar backup" só aparece para usuário logado.

---

## 3. Regras Gerais

- **RG1** – **Um só lugar para falar com o atleta:** toda mensagem do sistema (sucesso, erro, aviso, informação, conquista e confirmação) passa por este módulo. Não se usa `alert`, `confirm` do navegador, nem faixa de mensagem própria de cada tela. Validação **de campo** (borda vermelha e ⚠ ao lado do campo, ex.: EF_01 §7.1 e `[aviso_top_set]`) continua no campo.
- **RG2** – **Catálogo:** todo texto tem um identificador no catálogo (`domain/catalogo.ts`) e está na seção 5. Textos são curtos, em português, sem termo técnico, e dizem **o que aconteceu** e **o que fazer**. O atleta nunca vê mensagem técnica, código ou pilha de erro.
- **RG3** – **Tipos e duração:**

| Tipo | Cor | Ícone (`lucide-react`) | Some sozinho |
|---|---|---|---|
| Sucesso | Verde | `CircleCheck` | 5 s |
| Informação | Azul | `Info` | 5 s |
| Aviso | Âmbar | `TriangleAlert` | 8 s |
| Conquista | Verde/Dourado | `Trophy` | 8 s |
| Erro | Vermelho | `CircleAlert` | Não: fica até fechar |

- **RG4** – **Empilhamento:** no máximo **3** mensagens na tela; as demais esperam a vez. A mesma mensagem repetida não empilha: renova a que já está visível. Toda mensagem tem botão fechar.
- **RG5** – **Confirmação (diálogo):** usada antes de ações que saem da tela, apagam ou gravam de forma incompleta. Uma por vez.
  - O foco abre no botão **seguro** (cancelar). `Esc` e toque fora do diálogo também cancelam.
  - Ação destrutiva tem o botão de confirmar em **vermelho**.
- **RG6** – **Acessibilidade:** erro usa `role="alert"`; os demais, `role="status"`; diálogo usa `role="alertdialog"` com título e texto associados, e o `Tab` não sai dele. Cor nunca é a única pista: sempre há ícone e texto.
- **RG7** – **Saída da tela de treino:** com treino em andamento, trocar de aba ou sair da conta pede `[treino_em_andamento]` / `[sair_da_conta]`.
  - "Em andamento" = o atleta **fez algo** (digitou, confirmou, pulou, anotou ou marcou esforço). Só abrir a sessão, com os campos sugeridos, **não** pede confirmação.
  - Só pergunta ao sair da aba Registrar; navegar entre as outras abas não pergunta de novo.
  - Sair **não perde nada**: o rascunho fica guardado no aparelho (EF_02 RG12).
  - Ao voltar para um treino com progresso guardado, aparece `[rascunho_restaurado]`.
- **RG8** – **Séries não feitas:** ao tocar em "Confirmar e Salvar Treino", se houver exercício não preenchido ou série não feita (EF_02 RG24), abre `[series_nao_feitas]` com a lista por exercício. O atleta escolhe **Voltar e preencher** ou **Salvar assim mesmo**; as séries listadas não entram no volume.
  - Exercício **pulado** e **Deload** não entram na lista.
  - Se **nenhuma** série foi feita, nada é gravado: aparece `[nenhuma_serie_feita]` e o rascunho continua guardado.
- **RG9** – **Conquistas:** depois de salvar o treino, além de `[treino_salvo]`:
  - `[conquista_recorde]` — exercício cujo 1RM estimado (Epley, EF_02 RG13) superou o recorde anterior. Deload e primeiro registro não contam. Vários recordes viram uma mensagem só.
  - `[conquista_treino_completo]` — todos os exercícios da sessão feitos, sem pular e sem pendência da RG8.
  - `[conquista_marco]` — 1º, 10º, 25º, 50º, 100º e, depois, a cada 100 treinos. Um treino = uma sessão em um dia.
- **RG10** – **Tela de erro amigável:** se qualquer tela quebrar, o atleta vê `[tela_erro]` em vez de tela branca.
  - Botões **Recarregar** e **Baixar backup**.
  - **Aba:** erro dentro de uma aba mostra a tela de erro só no conteúdo; a barra de navegação continua e trocar de aba se recupera.
  - **Rota:** erro em qualquer outra rota mostra a tela de erro inteira.
  - **Inicialização:** falha ao iniciar o app também mostra a tela de erro.
- **RG11** – **Backup de emergência:** o "Baixar backup" da tela de erro gera o mesmo JSON do Exportar (EF_06), que o app sabe importar. Se algum dado estiver ilegível ou a montagem falhar, o arquivo leva também o **conteúdo bruto** (campo `bruto`) dos dados de treino, para nada se perder. Nunca inclui senha, sessão ou dados de outros usuários.
- **RG12** – **Dado ilegível nunca é sobrescrito:** se `registros` ou `dadosTreino` não puder ser lido (inteiro ou em parte), o original é copiado para `{chave}_corrompido` **antes** de qualquer gravação e aparece `[dados_corrompidos]`. O app continua funcionando com o que conseguiu ler. Plano e sessões ilegíveis são tratados como vazios, sem quebrar a tela.
- **RG13** – **Gravação tudo ou nada:** salvar treino e importar gravam por completo ou **voltam ao estado anterior**. Uma falha no meio (ex.: armazenamento cheio) não deixa treino pela metade nem apaga o que existia; o rascunho continua guardado.
- **RG14** – **Rascunho que não pôde ser salvo** (armazenamento cheio ou bloqueado) não derruba a tela: aparece `[rascunho_nao_salvo]`.
- **RG15** – **Erro traduzido:** erros não tratados (clique, tarefa em segundo plano) são traduzidos: armazenamento cheio → `[armazenamento_cheio]`; armazenamento bloqueado → `[armazenamento_bloqueado]`; rede → `[sem_conexao]`; arquivo/dado ilegível → `[dados_ilegiveis]`; demais → `[erro_inesperado]`. O detalhe técnico só vai para o log de desenvolvimento, sem dados pessoais (EF_01). Ruídos do navegador (ex.: `ResizeObserver loop`) são ignorados.
- **RG16** – **Importação de arquivo:** arquivo ilegível → `[arquivo_invalido]`; planilha sem linhas reconhecidas → `[planilha_vazia]`. Nada é gravado.

---

## 4. Tela

### 4.1 Avisos (toast)

Faixa no topo da tela, acima do conteúdo, respeitando a área segura do celular. Ícone, título, texto e botão fechar (`X`).

### 4.2 Diálogo de confirmação

Cartão central sobre fundo escurecido: ícone, título, texto, lista de itens (quando houver) e dois botões.

### 4.3 Tela de erro

| Nº | Campo | Tipo | Regra |
|---|---|---|---|
| 01 | Ícone | `HeartCrack` | — |
| 02 | Título | Texto | Algo deu errado |
| 03 | Texto | Texto | Seus dados estão salvos neste aparelho. Recarregue para continuar; se o erro voltar, baixe um backup. |
| 04 | Recarregar | Botão (`RefreshCw`) | Recarrega a página |
| 05 | Baixar backup | Botão (`Download`) | RG11; só com usuário logado. Após baixar: "Backup baixado". Se falhar: "Não foi possível gerar o backup." |

---

## 5. Catálogo de Mensagens

### 5.1 Avisos

| Identificador | Tipo | Título | Texto |
|---|---|---|---|
| `[treino_salvo]` | Sucesso | Treino finalizado! | Registro salvo com sucesso. |
| `[importacao_concluida]` | Sucesso | Importação concluída | Seus treinos foram atualizados. |
| `[importacao_desfeita]` | Sucesso | Importação desfeita | Seus dados anteriores foram restaurados. |
| `[registro_excluido]` | Sucesso | Registro excluído | O registro saiu do relatório. |
| `[rascunho_restaurado]` | Informação | Treino retomado | Continuamos de onde você parou. |
| `[nenhuma_serie_feita]` | Aviso | Nenhuma série feita | Confirme ao menos uma série para salvar. Seu rascunho continua guardado. |
| `[rascunho_nao_salvo]` | Aviso | Rascunho não guardado | O aparelho não deixou guardar o rascunho. Salve o treino antes de sair desta tela. |
| `[planilha_vazia]` | Aviso | Nada para importar | Não encontramos exercícios neste arquivo. Confira as colunas e tente de novo. |
| `[preencha_registro]` | Aviso | Falta preencher | Preencha ao menos um peso, repetição ou observação. |
| `[selecione_exercicio]` | Aviso | Falta o exercício | Selecione um exercício. |
| `[dados_corrompidos]` | Aviso | Parte dos dados não pôde ser lida | Guardamos uma cópia do original. Baixe um backup na aba Exportar. |
| `[treino_nao_salvo]` | Erro | Treino não salvo | Não foi possível salvar o treino. Nada foi perdido: seu rascunho continua guardado. Tente novamente. |
| `[armazenamento_cheio]` | Erro | Sem espaço no aparelho | Nada foi perdido. Baixe um backup e libere espaço no navegador antes de tentar de novo. |
| `[armazenamento_bloqueado]` | Erro | Armazenamento bloqueado | O navegador não deixou acessar os dados. Saia do modo anônimo ou libere o armazenamento do site. |
| `[sem_conexao]` | Erro | Sem conexão | Verifique sua internet e tente novamente. Seus treinos continuam no aparelho. |
| `[arquivo_invalido]` | Erro | Arquivo não reconhecido | Não foi possível ler o arquivo. Nada foi alterado. |
| `[dados_ilegiveis]` | Erro | Dados ilegíveis | Não foi possível ler essas informações. Tente recarregar a página. |
| `[erro_inesperado]` | Erro | Algo deu errado | Seus dados estão salvos. Tente novamente. |
| `[conquista_recorde]` | Conquista | Novo recorde! | Lista dos exercícios: `Supino reto barra: 100kg × 8` |
| `[conquista_treino_completo]` | Conquista | Treino completo! | Você fez todas as séries de hoje. |
| `[conquista_marco]` | Conquista | N treinos! / Primeiro treino! | Constância é o que constrói resultado. |

### 5.2 Confirmações

| Identificador | Título | Texto | Cancelar | Confirmar |
|---|---|---|---|---|
| `[treino_em_andamento]` | Treino em andamento | Este treino ainda não foi salvo no histórico. O rascunho fica guardado neste aparelho para você continuar depois. | Continuar treinando | Sair da tela |
| `[sair_da_conta]` | Sair da conta? | Há um treino em andamento. O rascunho fica guardado neste aparelho para quando você voltar. | Ficar | Sair da conta |
| `[series_nao_feitas]` | Há séries não feitas | Elas não entram no volume nem nas séries válidas. (lista) | Voltar e preencher | Salvar assim mesmo |
| `[desfazer_importacao]` | Desfazer a importação? | Os dados anteriores à importação serão restaurados. | Manter | Desfazer (vermelho) |
| `[limpar_tudo]` | Apagar todos os treinos? | Todo o histórico da sua conta será apagado deste aparelho. Baixe um backup antes. | Cancelar | Apagar tudo (vermelho) |
| `[excluir_registro]` | Excluir registro? | Este registro sairá do relatório. | Cancelar | Excluir (vermelho) |
| `[ocultar_grafico]` | Ocultar gráfico? | O gráfico some desta tela até recarregar. Seus treinos não são apagados. | Cancelar | Ocultar |

### 5.3 Tela cheia

| Identificador | Título | Texto |
|---|---|---|
| `[tela_erro]` | Algo deu errado | Seus dados estão salvos neste aparelho. Recarregue para continuar; se o erro voltar, baixe um backup. |
