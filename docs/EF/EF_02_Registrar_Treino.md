# EF_02 — Registrar Treino (Aba Principal)

---

## 1. Acesso

Aba padrão ao abrir o app (`/app`). Acessada pelo ícone **Registrar** (haltere) na barra de navegação inferior.

Componente: `TreinoSessao` (tela). A lógica de sugestão, espelho de peso e rascunho fica no hook `useSessaoTreino`; as regras puras em `treinoSessao/domain/`; e cada modo tem o próprio bloco em `treinoSessao/blocks/`: `TopSetBlock`, `TopSet2Block`, `BackoffBlock`, `SeriesExtrasBlock`, `ClusterBlock` e `DeloadBlock`.

---

## 2. Atores e Permissões

Qualquer usuário autenticado possui acesso completo a esta tela.

---

## 3. Regras Gerais

- **RG1** – A tela exibe exercícios agrupados por sessão de treino (UA, UB, LA, LB, BR), definidos em `SESSOES` (hardcoded) com override do `planoTreino` (localStorage) quando disponível.
- **RG1.1** – Se `planoTreino` existir no localStorage para a sessão selecionada, o sistema aplica dois overrides: (a) **`seriesValidas`** de cada exercício é substituído pelo valor do plano (2 ou 3); (b) **a ordem dos exercícios** é reorganizada conforme o campo `ordem` do plano, permitindo que a importação de planilha altere a sequência sem editar código.
- **RG1.2** – O plano (padrão do `SESSOES` ou `planoTreino` importado, RG1.1) é a **única fonte de verdade** para `seriesValidas` — o histórico de treinos anteriores (`logbook`/`ultimoRegistro`) nunca sobrescreve esse valor. Se o último registro salvo daquele exercício tiver um `seriesValidas` diferente do plano atual (ex.: um treino feito antes de a planilha ser atualizada de 2 para 3 séries válidas), o sistema ignora o valor do histórico e usa sempre o do plano para decidir se o badge mostra "2 válidas"/"3 válidas" e se o bloco Back-off aparece. O histórico é usado apenas para sugerir o peso e as repetições do Top Set 1 (RG7) e as repetições do Top Set 2 e do Back-off (RG6, RG14) — nunca para redefinir a contagem de séries válidas.
- **RG1.3** – **Sessões vindas da planilha (protocolos com vários dias/semanas):** os botões de sessão vêm do plano importado do usuário (`sessoes_config`).
  - Sem plano importado, ou com um plano só das sessões padrão (Upper A/B, Lower A/B), a tela mostra as 4 sessões fixas, como sempre.
  - Se o plano tiver outras sessões, a tela mostra **as sessões do plano** no lugar das fixas. Exemplo: um protocolo de 6 dias com uma aba por semana gera `S1 Seg · Pull`, `S1 Sex · Upper Cluster`, `S2 Seg · Pull`… (ver EF_06).
  - Cada sessão tem um id curto gravado em cada registro. As fixas usam o id da rotação (`UA`, `UB`, `LA`, `LB`). As da planilha usam o id derivado do nome (`S1 Seg · Pull` → `S1SEG`), para que a mesma sessão em semanas diferentes não misture histórico.
  - *Motivo:* atletas com protocolos diferentes (ex.: 4 dias Upper/Lower × 6 dias variando por semana) usam o mesmo app. Cada um importa a própria planilha no próprio login, e o plano de um nunca afeta o do outro (os dados ficam em `gw:{id do usuário}:…`).
- **RG1.4** – `seriesValidas` aceita de **1 a 4**. O valor vem do plano (RG1.2).
- **RG2** – O usuário deve selecionar a sessão do dia antes de registrar qualquer exercício.
- **RG3** – O registro segue o modelo de séries v6: **Top Set 1** obrigatório → **Top Set 2** obrigatório → **Back-off** opcional (só quando `seriesValidas === 3`). Os dois Top Sets são pesados e ficam na mesma faixa de reps; o Back-off é a série extra de volume, com um pouco menos de carga, levada até a falha. A técnica **Cluster Set** e o modo **Deload** são alternativas ao fluxo padrão: ao ativar qualquer um deles, os blocos padrão são substituídos conforme as RGs correspondentes. Cluster Set e Deload são mutuamente exclusivos.
- **RG4** – Os campos **Top Set 1** e **Top Set 2** são obrigatórios no modo padrão. Ao usar **Cluster Set**, a confirmação da técnica cumpre o mesmo papel: é preciso finalizar as duas séries (**"Finalizar Série 1 → Série 2"** e depois **"Confirmar Cluster"**) — ver RG16. No modo **Deload**, apenas o **Top Set 1** é obrigatório — o Top Set 2 é suprimido. O **Top Set 2 com peso e repetições apagados ou zerados** significa "não fiz" e não bloqueia o avanço (RG24). Tentar avançar sem confirmar exibe aviso laranja com ⚠.
- **RG5** – O bloco **Back-off** (exibido somente quando `seriesValidas === 3`) é opcional. Nenhuma validação é exigida para seus campos; vazio ou zerado significa que não foi feito (RG24).
- **RG5.1** – **Regra geral — o sistema sugere, nunca altera:** o campo mantém o peso e as repetições da **última vez em que aquela série foi feita**, para o atleta saber o que fez e tentar manter ou melhorar. Subir peso, consolidar, fadiga e deload são **avisos**: nenhum deles muda o valor de um campo. Se a pessoa salvou peso e repetições em uma série, o mesmo treino na próxima vez abre com **exatamente a mesma anotação** em todos os campos (Top Set 1, Top Set 2, Back-off, Série 3, Série 4), em qualquer quantidade de válidas (1, 2, 3 ou 4). Nenhuma manipulação de treino altera um valor salvo: nada de incremento por teto atingido, nada de recalcular o Back-off a ~90% e nada de o Top Set 2 copiar o Top Set 1. Descrições e rótulos (ex.: "Back-off (90%)", "Tira ~10% da carga") continuam orientando o atleta, mas o campo mantém o valor do último treino. Os cálculos (espelho do Top Set 1, `Top Set 1 × backoffPct`) só preenchem campos que **não** têm nenhum valor salvo. Implementação: `sugestaoDoUltimoTreino` em `utils/seriesValidas.ts` e `referenciaDoExercicio` em `utils/storage.ts`.
  - **Série que não foi feita no último treino** (RG24): o campo busca o último treino da mesma sessão em que **aquela série** foi feita. Ex.: no último treino não fez o Back-off; o campo abre com o Back-off do treino anterior a ele.
  - **Deload não é referência** (RG15): o campo usa o último treino normal. Só se houver apenas deloads, usa o Top Set 1 do deload.
  - **Depois de um Cluster Set**, os Top Sets abrem com os valores do último treino em que foram feitos.
  - **O que o atleta digita ou apaga fica:** um campo apagado nunca é preenchido de novo pelo sistema naquele treino (inclui reconfirmar o Top Set 1 com 4 válidas).
- **RG6** – **Sugestão de peso do Top Set 2:** o Top Set 2 vem com o **peso e as repetições salvos no Top Set 2 do último treino** (RG5.1), e esse peso não acompanha trocas feitas no Top Set 1. Sem peso salvo no Top Set 2 (ou sem histórico), o campo espelha o Top Set 1 e **acompanha qualquer troca de peso** feita nele durante o treino (indicador visual azul = sugestão). O espelho trava permanentemente quando o peso veio do logbook, quando o usuário digita um valor próprio no campo (flag `backoffKgWasUserEdited`) ou quando confirma o bloco — a partir daí nada sobrescreve o valor.
- **RG7** – O sistema pré-preenche **peso e repetições** do Top Set 1 com os valores exatos do último registro desse exercício no mesmo treino — **sem incremento automático**, mesmo que o teto de reps tenha sido atingido (o status "Teto atingido" e o resumo "sobem de peso" continuam avisando o atleta; quem sobe o peso é ele). Campos exibidos com indicador visual azul = sugestão.
- **RG8** – Ao trocar de exercício ou de sessão, os avisos de validação (Top Set e Back-off) são resetados.
- **RG9** – Se houver treino em andamento ao trocar de aba ou sair da conta, o sistema pede confirmação (EF_09 RG7). O rascunho fica guardado.
- **RG10** – Após salvar todos os exercícios, é exibido um resumo com: quantidade feita / total, e quantos exercícios sobem de peso no próximo ciclo.
- **RG11** – Exercícios podem ser pulados (botão "Pular"). Exercícios pulados **não gravam peso, reps nem volume**, mesmo com sugestão nos campos. Se o atleta voltar e **confirmar** o exercício (Top Set 1 ou Cluster), ele deixa de ser pulado e é gravado normalmente.
- **RG12** – O rascunho de cada sessão é persistido no `localStorage` (chave `rascunho_treino`). A cada interação relevante (confirmar Top Set, confirmar Back-off, confirmar Técnica, avançar/voltar exercício, editar peso/reps) o estado completo da sessão em andamento é gravado. Ao reabrir o app ou retornar à tela Registrar, se existir rascunho para a sessão selecionada, os dados são restaurados automaticamente — mesmo que o app tenha sido fechado ou o cache limpo pelo sistema. O rascunho é removido somente após o salvamento definitivo do treino ("Confirmar e Salvar Treino").
- **RG13** – Durante o preenchimento do bloco Top Set, o sistema recalcula em tempo real o 1RM estimado pela fórmula de Epley: `1RM = Peso × (1 + Reps / 30)`. Se esse valor superar o recorde histórico daquele exercício — ou se as repetições atingirem ou ultrapassarem o teto da faixa cadastrada — o Banner de Progressão assume imediatamente o estado `[banner_pr]` (verde/dourado pulsante), antes mesmo de o usuário confirmar o Top Set. O recorde usa só peso e repetições feitos: o RPE **não** entra na conta, porque é autoavaliação e não cria recorde. O aviso de progressão (RG21) e o de fadiga (RG22) continuam visíveis junto do `[banner_pr]`. Ao apagar os campos ou reduzir os valores, o banner retorna ao estado anterior.
- **RG14** – **Sugestão de peso do Back-off:** quando o bloco Back-off está visível (RG1.2), o peso e as repetições vêm **exatamente como foram salvos no Back-off do último treino** (RG5.1) — o sistema não baixa 10% de novo e o peso não acompanha trocas no Top Set 1. Só quando o último treino não tem Back-off salvo (sem histórico, ou o exercício era de 2 ou 4 válidas) o peso é calculado como `Top Set 1 × backoffPct`, arredondado. O `backoffPct` padrão é **0,9 (90%)** — ou seja, tira-se ~10% da carga dos Top Sets para uma série com mais técnica, mesmas reps ou mais, até a falha (ex.: supino 100 kg → 90 kg; extensora 50 kg → 45 kg). Nesse caso calculado, o campo **acompanha as trocas de peso do Top Set 1** e trava quando o usuário digita um valor próprio (flag `extraKgWasUserEdited`). A Série 3 de um treino de 4 válidas não é reaproveitada como Back-off (carga cheia ≠ ~90%). Esse pré-preenchimento é só sugestão de valor — não decide se o bloco aparece (isso é definido exclusivamente pelo plano, RG1.2).
- **RG14.1** – O `backoffPct` é configurável por exercício (`sessionExercises.ts`, presets `COMPOSTO` e `ISOLADOR`; ou coluna `backoff_pct` da planilha importada). O valor alimenta tanto o cálculo da sugestão quanto o rótulo do bloco ("Back-off (90%)") e o texto de apoio. Importações sem a coluna assumem 90%.
- **RG15** – **Modo Deload (1 série válida):** ao ativar o chip Deload, o atleta registra **apenas o Top Set 1** daquele exercício. Os blocos Top Set 2, Back-off, Série 3 e Série 4 são ocultados.
  - **Campo:** o Top Set 1 mantém o peso e as repetições que já estavam nele (os do último treino, RG5.1). Se o exercício estava em Cluster Set, o Top Set 1 volta com os valores do último treino.
  - **O que é gravado:** só a série `top1`, com `isDeload: true`, `seriesValidas: 1` e nenhum valor de Top Set 2, Back-off, Série 3 ou Série 4 — nem em `registros`, nem em `dadosTreino` — mesmo que esses campos tenham sugestão guardada.
  - **Registros antigos** de deload que guardaram séries a mais são **lidos** só com o Top Set 1. O dado original não é apagado.
  - **Não é desempenho:** deload não bate teto, não manda subir nem consolidar carga (RG21), não dispara `[banner_pr]` nem PR confirmado na tela de treino e não conta no resumo "sobem de peso". Após confirmar, mostra `[deload_confirmado]`.
  - **Não é referência:** o próximo treino abre com os valores do **último treino normal**, não com os do deload (RG5.1). A progressão (`progrediu`, peso anterior) também compara com o último treino normal.
  - **Gráficos:** sessões em deload são sempre diferenciadas — Gráficos (EF_03 RG10), Volume (EF_04 RG11) e Powerlifter (EF_07 RG8).
  - Ao desativar, o Top Set 2 volta com o peso e as repetições do último treino (RG6; sem histórico, espelha o Top Set 1). Deload é mutuamente exclusivo com Cluster Set.
- **RG16** – **Técnica Cluster Set (2 séries de até 4 blocos):** ao ativar o chip **Cluster Set**, os blocos Top Set 1, Top Set 2 e Back-off somem e a técnica passa a registrar **duas séries cluster**, cada uma com até 4 blocos (peso + reps). A ideia é quebrar uma série longa em blocos/clusters (ex.: 10 reps → 3+2+2). Cada série é preenchida separadamente: primeiro a **Série 1**, depois o botão **"Finalizar Série 1 → Série 2"** avança para a **Série 2**, e o botão **"Confirmar Cluster"** conclui a técnica. Uma navegação de abas (**Série 1 / Série 2**) permite alternar entre elas; a aba concluída recebe ✓. Regras de contabilização (idênticas em gráficos e telas de Volume Load):
  - **Volume:** a soma de **todos os blocos das duas séries** (`Σ pesoN × repsN`) — todos os blocos somam como um só valor de volume.
  - **Séries válidas:** cada série cluster **não-vazia** conta como **1 série válida** (portanto, no máximo **2** por exercício), independentemente de quantos blocos (3 ou 4) foram preenchidos em cada uma — não é 1 série por bloco.
  - **1RM / topSet (gráficos):** usa o **Bloco 1 da Série 1** (esforço mais fresco) como esforço máximo da sessão.
  - Persistência: `tecnica: "RP"`, `clusterSeries` (Série 1) e `clusterSeries2` (Série 2, apenas quando preenchida). Registros antigos com só `clusterSeries` permanecem válidos (contam como 1 série).
- **RG16.1** – **Cluster com número de blocos do plano:** quando a planilha descreve o cluster (ex.: *"24 reps em blocos de 4"*), o plano guarda `clusterBlocos` (24 ÷ 4 = **6 blocos**) e cada série mostra esse número de blocos no lugar dos 4 padrão. Sem essa informação, continuam 4 blocos.
- **RG16.2** – **Cluster com 1 série válida:** se o exercício tem `seriesValidas = 1`, o Cluster Set tem **uma série só**: sem abas Série 1 / Série 2, sem "Finalizar Série 1 → Série 2" e sem "← Série 1". "Confirmar Cluster" exige ≥ 1 bloco válido apenas nessa série.
- **RG18** – **1 série válida:** quando o plano define `seriesValidas = 1` (comum em protocolos de alta intensidade, ex.: *"1 série até a falha"*), o exercício termina no **Top Set 1**. O bloco Top Set 2 não aparece, "Próximo"/"Ver Resumo" não cobram o Top Set 2, o badge mostra **"1 válida"** e o registro salvo tem só a série `top1`, sem Top Set 2 vazio ou "fantasma".
- **RG19** – **Histórico em lista de registros:** cada "Confirmar e Salvar Treino" grava **um registro novo por exercício** na chave `registros` do usuário. Registros anteriores nunca são sobrescritos, mesmo que o treino seja da mesma sessão.
  - *Motivo:* guardar todos os treinos permite ver a **evolução ou a regressão do volume** ao longo do tempo. Antes, um treino podia substituir o anterior.
  - Formato de cada registro (`src/utils/registros.ts`): `{ id, data (AAAA-MM-DD), sessao, exercicio (slug do catálogo), nome, series: [{ tipo, kg, reps, rpe? }], faixa?, faixaBackoff?, validas?, bateuTeto?, tecnica?, deload?, obs? }`.
  - `rpe` de cada série é opcional (RG20).
  - `tipo` de cada série: `top1`, `top2`, `backoff`, `serie3`, `serie4`, `cluster1`, `cluster2`. `kg` e `reps` são números.
  - Campos opcionais só são gravados quando existem. Dados derivados (progrediu, peso anterior, timestamp) não são gravados: são recalculados ao ler.
  - O exercício é identificado pelo slug do catálogo (ex.: `puxador_frente_pegada_neutra`). Assim, nomes escritos de jeitos diferentes caem no mesmo histórico.
  - Cada registro também guarda o **nome legível** do exercício (`nome`, ex.: "Puxador frente pegada neutra"), na grafia do catálogo. *Motivo:* quem lê o JSON exportado (uma pessoa ou uma IA fazendo análise) entende qual é o exercício e consegue classificar o grupo muscular sem precisar do código do app. Registros antigos sem `nome` recebem o nome do catálogo na exportação.
  - Na primeira abertura após a mudança, o `logbook` antigo é convertido automaticamente para `registros`. Uma cópia do original fica em `logbook_v1_backup`.
- **RG17** – **Painel "Último treino":** sempre que existe histórico do exercício no treino selecionado, o card exibe um painel com **todas as séries do último treino**, não só o Top Set 1. O painel lista, em ordem de execução, `Top Set 1`, `Top Set 2` e `Back-off` (ou, quando aquele treino foi em Cluster Set, cada bloco das duas séries: `Cluster S1 · B1`, `Cluster S1 · B2`, `Cluster S2 · B1`…), cada linha com peso × reps e, quando anotado, o esforço (ex.: `100kg × 8 reps · RPE 8.5`). Exibe também a data do treino, a contagem de séries, o volume total em kg·reps e a observação escrita naquele dia, quando houver. Séries com peso ou reps zerados são omitidas; um Top Set 1 registrado em Deload aparece como `Top Set 1 (deload)`. O painel é meramente informativo — serve para o atleta decidir entre subir a carga ou manter e buscar mais repetições — e convive com os banners de status (RG13 e Banner de Progressão), aparecendo abaixo deles, inclusive quando o `[banner_pr]` está ativo.
- **RG20** – **Esforço por série (RPE ou RIR):** cada série pode receber o esforço percebido, ou seja, quão perto da falha ela foi.
  - O dado gravado é sempre **RPE**, de **6 a 10**, de 0,5 em 0,5. **RIR** (repetições na reserva) é só outra forma de ler: `RIR = 10 − RPE` (RPE 8 = 2 reps na reserva; RPE 10 = falha).
  - A opção **≤6** (RIR **4+**) significa "6 ou menos" e grava 6.
  - **É opcional:** nenhum botão ou validação depende dele. Sem marcar, o registro é salvo exatamente como antes, sem o campo `rpe`.
  - **Nunca vem preenchido** do último treino: é a medida de hoje. É a única exceção à RG5.1. O valor anterior aparece só no painel "Último treino" (RG17).
  - Existe em todas as séries: Top Set 1, Top Set 2, Back-off, Série 3, Série 4 e, no Cluster Set, **um por série cluster** (gravado no último bloco da série).
  - Ativar ou desativar o Cluster Set, ou ativar o Deload, limpa os esforços marcados no exercício. O rascunho (RG12) guarda os esforços.
  - A escala escolhida (RPE ou RIR) vale para a tela toda e fica salva por usuário (chave `escala_esforco`).
  - Um `rpe` inválido vindo de importação é descartado; o resto do treino é mantido.
  - Implementação: `utils/esforco.ts` e `treinoSessao/blocks/EsforcoInput.tsx`.
- **RG21** – **Progressão pelo esforço:** o sistema só manda subir a carga quando o Top Set 1 **bate o teto de reps com RPE abaixo de 8** (mais de 2 reps na reserva).
  - Teto com **RPE < 8** → "Teto atingido — sobe peso no próximo" e, no treino seguinte, `[subir_peso]`.
  - Teto com **RPE ≥ 8** → "Teto atingido com RPE X — repete a carga no próximo" e, no treino seguinte, `[consolidar_carga]`. Não conta no resumo "sobem de peso" (RG10).
  - Teto **sem RPE** → vale a regra antiga: sobe.
  - O fato `bateuTeto` continua gravado só pelas reps (usado na análise de estagnação da aba Volume). O sistema nunca altera a carga sozinho (RG5.1, RG7).
  - Implementação: `deveSubirPeso` (limite em `RPE_LIMITE_SUBIR`).
- **RG22** – **Alerta de fadiga:** aparece quando a **mesma carga** no Top Set 1 passa a custar mais esforço ao longo das semanas. Todas as condições precisam valer:
  - pelo menos **3 treinos** seguidos com RPE anotado naquela carga;
  - em nenhum deles o RPE caiu nem as reps subiram em relação ao anterior (mais reps com RPE maior é progresso, não fadiga);
  - alta total de pelo menos **1 ponto** de RPE;
  - pelo menos **10 dias** entre o primeiro e o último, dentro de uma janela de **6 semanas**.
  - A carga de referência é a do último treino daquela sessão. Na sessão ainda sem histórico, vale o último treino do exercício.
  - Cluster Set, treinos sem RPE e outras cargas não entram na sequência. Um **Deload zera a contagem**. Mudar a carga encerra o alerta.
  - É só um aviso: não ativa o Deload nem bloqueia nada. Implementação: `detectarFadiga`.
- **RG23** – **1RM pelo esforço:** com RPE anotado (7 ou mais), o 1RM usa as repetições **até a falha** = `reps feitas + (10 − RPE)`.
  - Até 10 reps até a falha: Epley. 1 rep com RPE 10 é o próprio 1RM.
  - Acima de 10: o Epley superestima, então usa **Mayhew** — `100 × peso ÷ (52,2 + 41,9 × e^(−0,055 × reps))`, nunca abaixo do valor em 10 reps — e o número é marcado como aproximado (**≈**).
  - Sem RPE, ou com RPE abaixo de 7, não há estimativa pelo esforço. Exibição no Gráfico Powerlifter (EF_07 RG9). Implementação: `estimar1RM`.
- **RG24** – **Só conta o que foi feito:** uma série só é gravada com **peso e repetições maiores que zero**. Se um dos dois estiver vazio ou zerado, a série inteira é ignorada: não vai para `registros` nem para `dadosTreino`, não soma volume e não conta como série válida. Ex.: exercício de 3 válidas com o Back-off zerado grava e conta **2 séries**.
  - **Top Set 1:** sem peso e reps, o exercício não é gravado. Zerar um Top Set já confirmado deixa o exercício não concluído e "Próximo" pede o preenchimento.
  - **Top Set 2:** só é gravado se **confirmado**. Apagar ou zerar os dois campos significa "não fiz": o exercício conclui sem ele e não aparece aviso.
  - **Back-off, Série 3 e Série 4:** só são gravados se o bloco apareceu (Top Sets confirmados). Sugestão de bloco que nem foi aberto não é gravada.
  - **Cluster Set:** blocos sem peso ou reps são ignorados; série cluster sem bloco não conta.
  - O esforço (RG20) de uma série ignorada também não é gravado.
  - A tela de revisão mostra exatamente as séries que serão gravadas. Implementação: `seriesFeitas` em `treinoSessao/domain/`.

---

## 4. Tela

### 4.1 Barra Superior (TopBar)

- Título: **GymWave Strength**
- Campo data do treino: editável, formato `DD/MM/AAAA`, valor padrão = data atual.
- Informação de dias desde o último treino da sessão selecionada.

### 4.2 Seletor de Sessão

| Componente | Tipo | Opções | Obrig. |
|---|---|---|---|
| Seletor de sessão | Chips clicáveis | Upper A / Upper B / Lower A / Lower B, ou as sessões do plano importado (RG1.3) | Sim |

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
| Faixa de reps dos Top Sets | Ex.: 5–8 reps (vale para o Top Set 1 e o Top Set 2) |
| Faixa de reps do Back-off | Ex.: 8–10 reps, exibida com o percentual de carga: "Back-off (90%)" — só quando `seriesValidas === 3` |
| Badge treino | Identificador da sessão (UA, UB…) |
| Badge séries | "1 válida", "2 válidas", "3 válidas" ou "4 válidas" |
| Banner de progressão | Informa se deve subir peso, consolidar a carga (RG21) ou primeiro registro. Durante o preenchimento do Top Set 1 assume o estado `[banner_pr]` quando o PR histórico é superado ou o teto de reps é atingido em tempo real (ver RG13) |
| Alerta de fadiga | `[alerta_fadiga]`, quando a mesma carga custa RPE cada vez maior (RG22) |
| Painel "Último treino" | Lista todas as séries do treino anterior (peso × reps), data, volume e observação — ver RG17 |

### 4.5 Chips de modo avançado (Cluster Set / Deload — sempre visíveis, topo do card)

Chips **Cluster Set** (ícone de camadas) e **Deload** (ícone de bateria) aparecem acima do Top Set 1, sempre visíveis, sob o rótulo **Técnica**. São mutuamente exclusivos: ativar um desativa o outro.

**Cluster Set (2 séries de até 4 blocos):** (ver RG16)

- Ao ativar: os blocos Top Set 1, Top Set 2 e Back-off somem; exibe a técnica com **duas séries cluster**.
- Ao desativar: os blocos padrão voltam — Top Set 1 e Top Set 2 restaurados do último treino sem alteração (indicador azul, RG5.1) ou limpos se não houver histórico (o Top Set 2 então espelha o Top Set 1, RG6).
- **Navegação Série 1 / Série 2:** abas no topo do bloco permitem alternar entre as séries; a aba concluída recebe ✓. Só é possível ir para a Série 2 depois de preencher ao menos 1 bloco válido na Série 1.
- Cada série tem até 4 blocos (preencha 3 ou 4 — os vazios são ignorados):

| Nº | Bloco | Campos | Obrig. |
|---|---|---|---|
| 01 | Bloco 1 | Peso (kg) + Repetições | Ao menos 1 bloco por série |
| 02 | Bloco 2 | Peso (kg) + Repetições | — |
| 03 | Bloco 3 | Peso (kg) + Repetições | — |
| 04 | Bloco 4 | Peso (kg) + Repetições | — |

- Exibe **Total da série** em kg·reps em tempo real (`Σ pesoN × repsN`); na Série 2 exibe também o **Geral** (soma das duas séries).
- **Fluxo de confirmação:** na Série 1, o botão **"Finalizar Série 1 → Série 2"** avança (exige ≥ 1 bloco válido na Série 1). Na Série 2, os botões **"← Série 1"** (voltar) e **"Confirmar Cluster"** (concluir) — o "Confirmar Cluster" exige ≥ 1 bloco válido em **cada** série. Se inválido, exibe aviso laranja com ⚠.
- Após confirmação: exibe resumo das duas séries (S1: B1: Xkg × Nreps… / S2: B1: Xkg × Nreps…) e botão "Editar Técnica".
- **Contabilização (ver RG16):** volume registrado = soma de **todos** os blocos das duas séries; contagem = **1 série válida por série cluster não-vazia** (máx. 2), não por bloco.

**Deload (1 série válida):**

- Ao ativar: os blocos Top Set 2 e Back-off somem; o Top Set 1 permanece visível.
- O campo Top Set 1 mantém o peso e as reps do último treino (RG5.1).
- Exibe informativo: *"Deload — apenas 1 série válida (Top Set), mesmo peso do último treino"*.
- Ao desativar: o bloco Top Set 2 volta com o peso e as repetições do último treino (indicador azul); sem histórico, o peso espelha o Top Set 1 (RG6).
- Não há bloco de técnica nem botão de confirmar técnica — o fluxo de confirmação é o mesmo do Top Set 1 padrão.
- Salvo só com o Top Set 1: `isDeload: true`, `seriesValidas: 1` (RG15).
- Após confirmar, exibe `[deload_confirmado]` no lugar do status de teto/faixa.

### 4.6 Bloco Top Set 1 (obrigatório no modo padrão, oculto quando técnica ativa)

| Nº | Campo | Tipo | Obrig. |
|---|---|---|---|
| 01 | Peso (kg) | Input numérico (pré-preenchido do histórico) | Sim |
| 02 | Repetições | Input numérico (pré-preenchido do histórico) | Sim |

**Pré-preenchimento (RG7):** Ao carregar a sessão, peso e repetições são preenchidos com os valores do último treino. Campos com sugestão exibem borda e texto azul. Ao editar qualquer campo, o indicador visual de sugestão é removido.

**Detecção de PR em tempo real:**
A cada alteração nos campos peso ou repetições, o sistema recalcula o 1RM estimado (`Peso × (1 + Reps / 30)`) e compara com o recorde histórico do exercício. Se o critério da RG13 for satisfeito, o Banner de Progressão muda para o estado `[banner_pr]` imediatamente. O cálculo é disparado no evento `onChange` de ambos os campos; ao esvaziar qualquer campo o banner retorna ao estado normal.

**Botão "Confirmar Top Set 1":**
- Habilitado somente quando peso e repetições são positivos (desabilitado enquanto vazio).
- Se os campos não estiverem preenchidos com valores positivos: exibe banner de aviso e destaca os campos com borda vermelha.
- Após confirmação: exibe status com ícone ("Teto atingido — sobe peso", "Teto atingido com RPE X — repete a carga", "Na faixa" ou "Abaixo da faixa", ver RG21) e botão "Editar Top Set 1". Se o estado `[banner_pr]` estava ativo ao confirmar, o status exibido é "🔥 PR Confirmado!" no lugar dos status padrão.

### 4.7 Bloco Top Set 2 (obrigatório no modo padrão, oculto quando técnica ativa ou Deload)

Visível após a confirmação do Top Set 1. É a segunda série pesada, na **mesma carga e mesma faixa de reps** do Top Set 1.

| Nº | Campo | Tipo | Obrig. |
|---|---|---|---|
| 01 | Peso (kg) | Input numérico (pré-preenchido do histórico; sem histórico, espelha o Top Set 1) | Sim |
| 02 | Repetições | Input numérico (pré-preenchido do histórico) | Sim |

**Regras de sugestão (RG6):**
- **Peso:** o peso salvo no Top Set 2 do último treino, sem alteração (borda e texto azul = sugestão). Sem esse valor, espelha o Top Set 1 e acompanha as trocas de peso feitas nele.
- **Repetições:** pré-preenchidas com as do último treino.
- Peso vindo do logbook ou digitado pelo usuário trava o espelho definitivamente (flag `backoffKgWasUserEdited`) — o campo segue livre para subir, baixar ou ser apagado.
- Confirmar o bloco também interrompe o espelho.

**Botão "Confirmar Top Set 2":**
- Sempre habilitado.
- Se campos inválidos: exibe banner de aviso e borda vermelha.
- Após confirmação: exibe botão "Editar Top Set 2".

### 4.8 Bloco Back-off (opcional, oculto quando técnica ativa ou Deload)

Visível quando `seriesValidas === 3` e o Top Set 2 está confirmado. É a série de volume: tira-se ~10% da carga dos Top Sets e leva-se até a falha, com mais técnica e as mesmas repetições ou mais.

| Nº | Campo | Tipo | Obrig. |
|---|---|---|---|
| 01 | Peso (kg) | Input numérico (pré-preenchido do histórico; sem histórico, calculado do Top Set 1) | Não |
| 02 | Repetições | Input numérico (pré-preenchido do histórico) | Não |

**Regras de sugestão (RG14):**
- **Peso:** o peso salvo no Back-off do último treino, sem alteração (borda e texto azul = sugestão). Sem esse valor, `Top Set 1 × backoffPct` arredondado — 90% por padrão — que acompanha as trocas de peso do Top Set 1.
- **Repetições:** pré-preenchidas com as do último treino.
- Peso vindo do logbook ou digitado pelo usuário trava o cálculo definitivamente (flag `extraKgWasUserEdited`).
- A visibilidade do bloco em si depende só do plano (RG1.2), não do histórico — ver nota abaixo.

- Rótulo do bloco exibe o percentual configurado: **"Back-off (90%)"**.
- Não há botão de confirmar. Os valores são salvos diretamente ao salvar o treino.
- Texto de apoio abaixo dos campos: *"Tira ~10% da carga do Top Set — mais técnica, mesmas reps ou mais, até a falha · X–Y+ reps · não conta para teto"*.

### 4.8.1 Esforço da série (opcional, em todos os blocos)

Fica logo abaixo de peso e repetições de cada série (ver RG20).

| Nº | Campo | Tipo | Opções | Obrig. |
|---|---|---|---|---|
| 01 | Esforço | 8 chips de um toque | RPE: ≤6, 7, 7.5, 8, 8.5, 9, 9.5, 10 · RIR: 4+, 3, 2.5, 2, 1.5, 1, 0.5, 0 | Não |
| 02 | Trocar escala | Botão com ícone de setas | Mostra a outra escala (RPE ⇄ RIR) | — |

- Tocar no chip marcado **desmarca**.
- Cor do chip marcado: **verde** (abaixo de RPE 8), **laranja** (8 e 8.5), **vermelho** (9 ou mais). O número é sempre visível, então a informação não depende só da cor.
- Ícones `lucide-react`, os mesmos da barra de navegação: `Gauge` (esforço), `ArrowLeftRight` (trocar escala), `TrendingUp` (subir), `Repeat` (consolidar), `Equal` (na faixa), `TrendingDown` (abaixo), `BatteryWarning` (fadiga), `Layers` (Cluster Set), `BatteryCharging` (Deload).
- Acessibilidade: cada grupo tem o nome da série e do exercício, e o chip marcado usa `aria-pressed`.

### 4.9 Observação

- Textarea livre por exercício.
- Não obrigatório.

### 4.10 Botões de Navegação (por exercício)

| Botão | Ação | Regras |
|---|---|---|
| **Pular** | Marca exercício como pulado e avança | — |
| **Próximo** | Avança para o próximo exercício | Modo padrão: valida Top Set 1 e Top Set 2. Modo Cluster Set: valida as 2 séries confirmadas ("Confirmar Cluster"). Modo Deload: valida apenas o Top Set 1 confirmado. |
| **Ver Resumo** | Abre tela de revisão pré-salvamento | Mesma validação do Próximo para o exercício atual. |

### 4.11 Tela de Revisão (Pré-save)

- Lista todos os exercícios com status (✓ concluído / ○ não preenchido / "Pulado").
- Exibe dados resumidos: modo padrão → `Top 1: Xkg × Nreps · Top 2: Xkg × Nreps · Back-off: Xkg × Nreps`; modo técnica Cluster Set → `Cluster S1 — B1: Xkg × Nreps · B2: … | Cluster S2 — B1: Xkg × Nreps · …` (só as séries preenchidas); modo Deload → exibe `Top 1: Xkg × Nreps` seguido da etiqueta **"· Deload"** em vermelho.
- Séries com esforço anotado mostram `@ RPE X` (ou `@ RIR X`) depois das reps.
- Ao clicar em um exercício, retorna para edição.
- Botão **"Confirmar e Salvar Treino"**: avisa se houver séries não feitas (EF_09 RG8) e salva todos os exercícios concluídos no localStorage do usuário. Cada exercício vira um registro novo em `registros` (RG19), e o resumo por ciclo continua em `dadosTreino`.
- Botão **"Voltar ao exercício"**: fecha a revisão sem salvar.

### 4.12 Resumo pós-save

- Exibe: `X/Y exercícios registrados`.
- Se houver exercícios que atingiram o teto de reps com folga (RG21): `Z exercícios sobem de peso no próximo ciclo`.

---

## 5. Mensagens do Sistema

| Identificador | Tipo | Cor | Título | Texto |
|---|---|---|---|---|
| `[aviso_top_set]` | Aviso inline | Laranja | ⚠ | Preencha o peso e as repetições do Top Set 1 antes de confirmar. |
| `[aviso_backoff]` | Aviso inline | Laranja | ⚠ | Preencha o peso e as repetições do Top Set 2 antes de confirmar. |
| `[aviso_tecnica]` | Aviso inline | Laranja | ⚠ | Preencha pelo menos um bloco (peso e reps) em cada série. |
| — | — | — | — | Sucesso, erro, conquista e confirmações desta tela estão no catálogo da EF_09 (`[treino_salvo]`, `[treino_nao_salvo]`, `[treino_em_andamento]`, `[series_nao_feitas]`…) |
| `[banner_pr]` | Destaque motivacional | Verde/Dourado pulsante | 🔥 Ritmo de Recorde Pessoal! | Confirme para validar o PR. (exibido em tempo real durante preenchimento do Top Set 1, ver RG13) |
| `[deload_confirmado]` | Status | Vermelho claro | — | Deload registrado — não conta para progressão |
| `[subir_peso]` | Banner | Âmbar | — | SUBIR PESO HOJE (teto atingido: Xkg x Nreps) |
| `[consolidar_carga]` | Banner | Azul | — | CONSOLIDAR CARGA (teto com RPE X: Xkg x Nreps) |
| `[alerta_fadiga]` | Banner | Vermelho | Sinal de fadiga | Xkg foi de RPE A para RPE B em N treinos. Considere um deload. |
| `[ultimo_treino]` | Painel informativo | Azul claro | ÚLTIMO TREINO · DD/MM/AAAA | Todas as séries do treino anterior (peso × reps), contagem de séries, volume em kg·reps e observação do dia, quando houver (ver RG17) |
