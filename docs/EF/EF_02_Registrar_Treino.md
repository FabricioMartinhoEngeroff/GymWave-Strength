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
- **RG5.1** – **Regra geral — o sistema sugere, nunca altera:** o campo mantém o peso e as repetições da **última vez em que aquela série foi feita**, para o atleta saber o que fez e tentar manter ou melhorar. Subir peso, consolidar, fadiga, regressão e deload são **avisos** (RG29): nenhum deles muda o valor de um campo. Se a pessoa salvou peso e repetições em uma série, o mesmo treino na próxima vez abre com **exatamente a mesma anotação** em todos os campos (Top Set 1, Top Set 2, Back-off, Série 3, Série 4), em qualquer quantidade de válidas (1, 2, 3 ou 4). Nenhuma manipulação de treino altera um valor salvo: nada de incremento por teto atingido, nada de recalcular o Back-off a ~90% e nada de o Top Set 2 copiar o Top Set 1. Descrições e rótulos (ex.: "Back-off (90%)", "Tira ~10% da carga") continuam orientando o atleta, mas o campo mantém o valor do último treino. Os cálculos (espelho do Top Set 1, `Top Set 1 × backoffPct`) só preenchem campos que **não** têm nenhum valor salvo. Implementação: `sugestaoDoUltimoTreino` em `utils/seriesValidas.ts` e `referenciaDoExercicio` em `utils/storage.ts`.
  - **Série que não foi feita no último treino** (RG24): o campo busca o último treino da mesma sessão em que **aquela série** foi feita. Ex.: no último treino não fez o Back-off; o campo abre com o Back-off do treino anterior a ele.
  - **Deload não é referência** (RG15): o campo usa o último treino normal. Só se houver apenas deloads, usa o Top Set 1 do deload.
  - **Depois de um Cluster Set**, os Top Sets abrem com os valores do último treino em que foram feitos.
  - **O que o atleta digita ou apaga fica:** um campo apagado nunca é preenchido de novo pelo sistema naquele treino (inclui reconfirmar o Top Set 1 com 4 válidas).
- **RG6** – **Sugestão de peso do Top Set 2:** o Top Set 2 vem com o **peso e as repetições salvos no Top Set 2 do último treino** (RG5.1), e esse peso não acompanha trocas feitas no Top Set 1. Sem peso salvo no Top Set 2 (ou sem histórico), o campo espelha o Top Set 1 e **acompanha qualquer troca de peso** feita nele durante o treino (indicador visual azul = sugestão). O espelho trava permanentemente quando o peso veio do logbook, quando o usuário digita um valor próprio no campo (flag `backoffKgWasUserEdited`) ou quando confirma o bloco — a partir daí nada sobrescreve o valor.
- **RG7** – O sistema pré-preenche **peso e repetições** do Top Set 1 com os valores exatos do último registro desse exercício no mesmo treino — **sem incremento automático**, mesmo que o teto de reps tenha sido atingido (o status do Top Set e o resumo do treino informam o teto; quem decide a carga é o atleta). Campos exibidos com indicador visual azul = sugestão.
- **RG8** – Ao trocar de exercício ou de sessão, os avisos de validação (Top Set e Back-off) são resetados.
- **RG9** – Se houver treino em andamento ao trocar de aba ou sair da conta, o sistema pede confirmação (EF_09 RG7). O rascunho fica guardado.
- **RG10** – Após salvar todos os exercícios, é exibido um resumo com: quantidade feita / total, e quantos exercícios bateram o teto de reps dentro do alvo.
- **RG11** – Exercícios podem ser pulados (botão "Pular"). Exercícios pulados **não gravam peso, reps nem volume**, mesmo com sugestão nos campos. Se o atleta voltar e **confirmar** o exercício (Top Set 1 ou Cluster), ele deixa de ser pulado e é gravado normalmente.
- **RG12** – O rascunho de cada sessão é persistido no `localStorage` (chave `rascunho_treino`). A cada interação relevante (confirmar Top Set, confirmar Back-off, confirmar Técnica, avançar/voltar exercício, editar peso/reps) o estado completo da sessão em andamento é gravado. Ao reabrir o app ou retornar à tela Registrar, se existir rascunho para a sessão selecionada, os dados são restaurados automaticamente — mesmo que o app tenha sido fechado ou o cache limpo pelo sistema. O rascunho é removido somente após o salvamento definitivo do treino ("Confirmar e Salvar Treino").
- **RG13** – Durante o preenchimento do bloco Top Set, o sistema recalcula em tempo real o 1RM estimado pela fórmula de Epley: `1RM = Peso × (1 + Reps / 30)`. Se esse valor superar o recorde histórico daquele exercício — ou se as repetições atingirem ou ultrapassarem o teto da faixa cadastrada — aparece imediatamente o `[banner_pr]` (verde/dourado pulsante), antes mesmo de o usuário confirmar o Top Set. O recorde usa só peso e repetições feitos: o RPE **não** entra na conta, porque é autoavaliação e não cria recorde. O `[banner_pr]` fica **fora** do card "Último treino" (acima dele) e não conta no limite de avisos: os avisos do card (RG29) continuam visíveis junto. Ao apagar os campos ou reduzir os valores, o banner some.
- **RG14** – **Sugestão de peso do Back-off:** quando o bloco Back-off está visível (RG1.2), o peso e as repetições vêm **exatamente como foram salvos no Back-off do último treino** (RG5.1) — o sistema não baixa 10% de novo e o peso não acompanha trocas no Top Set 1. Só quando o último treino não tem Back-off salvo (sem histórico, ou o exercício era de 2 ou 4 válidas) o peso é calculado como `Top Set 1 × backoffPct`, arredondado. O `backoffPct` padrão é **0,9 (90%)** — ou seja, tira-se ~10% da carga dos Top Sets para uma série com mais técnica, mesmas reps ou mais, até a falha (ex.: supino 100 kg → 90 kg; extensora 50 kg → 45 kg). Nesse caso calculado, o campo **acompanha as trocas de peso do Top Set 1** e trava quando o usuário digita um valor próprio (flag `extraKgWasUserEdited`). A Série 3 de um treino de 4 válidas não é reaproveitada como Back-off (carga cheia ≠ ~90%). Esse pré-preenchimento é só sugestão de valor — não decide se o bloco aparece (isso é definido exclusivamente pelo plano, RG1.2).
- **RG14.1** – O `backoffPct` é configurável por exercício (`sessionExercises.ts`, presets `COMPOSTO` e `ISOLADOR`; ou coluna `backoff_pct` da planilha importada). O valor alimenta tanto o cálculo da sugestão quanto o rótulo do bloco ("Back-off (90%)") e o texto de apoio. Importações sem a coluna assumem 90%.
- **RG15** – **Modo Deload (1 série válida):** ao ativar o chip Deload, o atleta registra **apenas o Top Set 1** daquele exercício. Os blocos Top Set 2, Back-off, Série 3 e Série 4 são ocultados.
  - **Campo:** o Top Set 1 mantém o peso e as repetições que já estavam nele (os do último treino, RG5.1). Se o exercício estava em Cluster Set, o Top Set 1 volta com os valores do último treino.
  - **O que é gravado:** só a série `top1`, com `isDeload: true`, `seriesValidas: 1` e nenhum valor de Top Set 2, Back-off, Série 3 ou Série 4 — nem em `registros`, nem em `dadosTreino` — mesmo que esses campos tenham sugestão guardada.
  - **Registros antigos** de deload que guardaram séries a mais são **lidos** só com o Top Set 1. O dado original não é apagado.
  - **Não é desempenho:** deload não bate teto, não gera aviso de subir nem de consolidar (RG21), não dispara `[banner_pr]` nem PR confirmado na tela de treino e não conta no resumo de teto (4.12). Após confirmar, mostra `[deload_confirmado]`.
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
- **RG17** – **Painel "Último treino":** sempre que existe histórico do exercício no treino selecionado, o card exibe um painel com **todas as séries do último treino**, não só o Top Set 1. O painel lista, em ordem de execução, `Top Set 1`, `Top Set 2` e `Back-off` (ou, quando aquele treino foi em Cluster Set, cada bloco das duas séries: `Cluster S1 · B1`, `Cluster S1 · B2`, `Cluster S2 · B1`…), cada linha com peso × reps e, quando anotado, o esforço **nas duas escalas** (ex.: `100kg × 8 reps · RPE 8 · RIR 2`), seja qual for a escala escolhida na tela (RG20). Série sem esforço não mostra nenhuma das duas. Exibe também a data do treino, a contagem de séries, o volume total em kg·reps e a observação escrita naquele dia, quando houver. Séries com peso ou reps zerados são omitidas; um Top Set 1 registrado em Deload aparece como `Top Set 1 (deload)`. O painel é meramente informativo — serve para o atleta decidir entre subir a carga ou manter e buscar mais repetições — e traz **dentro dele** os avisos do exercício (RG29). O `[banner_pr]` (RG13) aparece acima do card.
  - **Sem histórico na sessão, ou sem série para listar:** havendo aviso, o card aparece só com o título e os avisos, sem data, séries, volume nem observação.
  - **Sem série e sem aviso:** o card não aparece.
- **RG20** – **Esforço por série (RPE ou RIR):** cada série feita recebe o esforço percebido, ou seja, quão perto da falha ela foi.
  - O dado gravado é sempre **RPE**, inteiro, de **6 a 10** (meio ponto durante a série é chute). **RIR** (repetições na reserva) é só outra forma de ler: `RIR = 10 − RPE` (RPE 8 = 2 reps na reserva; RPE 10 = falha).
  - A opção **≤6** (RIR **4+**) significa "6 ou menos" e grava 6.
  - **Meio ponto antigo** (7,5, 8,5, 9,5) continua válido e visível no histórico, nos gráficos e no backup. Num **rascunho**, volta vazio: a tela não tem mais esse botão e o atleta marca de novo.
  - **É obrigatório** em toda série válida feita (RG27).
  - **Nunca vem preenchido** do último treino: é a medida de hoje. É a única exceção à RG5.1. O valor anterior aparece só no painel "Último treino" (RG17).
  - Existe em todas as séries: Top Set 1, Top Set 2, Back-off, Série 3, Série 4 e, no Cluster Set, **um por série cluster** (gravado no último bloco da série).
  - Ativar ou desativar o Cluster Set, ou ativar o Deload, limpa os esforços marcados no exercício. O rascunho (RG12) guarda os esforços.
  - A escala escolhida (RPE ou RIR) vale para a tela toda e fica salva por usuário (chave `escala_esforco`).
  - Um `rpe` inválido vindo de importação é descartado; o resto do treino é mantido.
  - Um botão **?** explica as duas escalas (RG25).
  - Implementação: `utils/esforco.ts` e `treinoSessao/blocks/EsforcoInput.tsx`.
- **RG21** – **Progressão pelo esforço:** quando o Top Set 1 **bate o teto de reps**, o sistema compara o esforço com o **alvo do exercício** (RG28).
  - Esforço **igual ou abaixo do alvo** → status `[status_teto]` e, no treino seguinte, o aviso `[subir_peso]` no card (RG29).
  - Esforço **acima do alvo** → status e, no treino seguinte, aviso no card com o mesmo texto: `[consolidar_carga]` (RG29). Não conta no resumo de teto (RG10).
  - O alvo é uma faixa; o limite é o **valor de cima** (alvo 7 a 8: RPE 8 está dentro, RPE 9 está acima). Com alvo 9 a 10, bater o teto está sempre dentro.
  - Teto **sem RPE** (registro antigo, ou série ainda sem esforço marcado) → vale só o teto, e o texto não cita o alvo.
  - O fato `bateuTeto` continua gravado só pelas reps (usado na análise de estagnação da aba Volume). É só aviso: o sistema nunca altera a carga sozinho (RG5.1, RG7).
  - Implementação: `deveSubirPeso` e `passouDoAlvo` em `utils/esforco.ts`.
- **RG22** – **Alerta de fadiga:** aparece quando a **mesma carga com as mesmas reps** no Top Set 1 passa a custar mais esforço e isso **se repete em 2 treinos seguidos** (um dia ruim sozinho não alerta). Todas as condições precisam valer:
  - os treinos comparados têm **a mesma carga, as mesmas reps** e RPE anotado;
  - nos **2 últimos treinos** o RPE está pelo menos **1 ponto** acima do treino que abriu a sequência, e não caiu do penúltimo para o último;
  - nos 2 últimos treinos o RPE **passou do alvo** do exercício (RG28) ou chegou à **falha (RPE 10)**. Ex.: alvo 7 a 8: 8 → 9 → 9 alerta; 7 → 8 → 8 não. Alvo 9 a 10: 9 → 10 → 10 alerta; 9 → 10 ainda não;
  - pelo menos **10 dias** entre o primeiro e o último, dentro de uma janela de **6 semanas**.
  - Reps diferentes encerram a sequência (mais reps com RPE maior é progresso).
  - A carga de referência é a do último treino daquela sessão. Na sessão ainda sem histórico, vale o último treino do exercício.
  - Cluster Set, treinos sem RPE e outras cargas não entram na sequência. Um **Deload zera a contagem**. Mudar a carga encerra o alerta.
  - É só informação: não sugere nem ativa o Deload e não bloqueia nada. Aparece no card (RG29). Implementação: `detectarFadiga`.
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
- **RG25** – **Ajuda do esforço (?):** ao lado do botão de trocar escala, em todas as séries, o botão **?** abre um balão que explica o RPE, o RIR e para que servem (`[ajuda_esforco]`).
  - **Abre** só ao tocar no **?**. Nunca abre sozinho.
  - **Fecha** ao tocar de novo no **?**, no **X**, fora do balão ou com a tecla **Esc**. Rolar a tela não fecha.
  - Só **um balão** fica aberto por vez: abrir o de outra série fecha o anterior.
  - Flutua abaixo da linha do esforço, sem empurrar os campos. Se não couber na tela, a tela rola até ele aparecer.
  - O texto é o mesmo nas duas escalas e os alvos vêm de `RPE_ALVO` (RG28), para nunca divergir da regra.
  - É só leitura: não marca esforço, não troca a escala, não grava nada e não entra no rascunho (RG12).
  - Implementação: `treinoSessao/blocks/AjudaEsforco.tsx`.
- **RG26** – **Data do treino:** a data precisa estar no formato `DD/MM/AAAA` e **existir no calendário** (regra única do sistema, ver "Formato de Data" no INDICE).
  - **Data inválida não salva:** vazia, texto, ano com 2 dígitos ou dia que não existe (`31/02/2026`) mostra `[data_invalida]` (EF_09), nada é gravado e o rascunho continua guardado. A data **nunca** é trocada por hoje em silêncio.
  - Dia e mês podem ter 1 dígito (`4/11/2026`). O treino é gravado sempre com 2 (`04/11/2026`).
  - *Motivo:* um treino salvo com data ilegível não volta na leitura do histórico, e o atleta veria "Treino finalizado!" para um treino perdido.
  - Implementação: `utils/datas.ts`.
- **RG27** – **Esforço obrigatório:** toda série válida **feita** (RG24) precisa do esforço, num toque. Sem ele a sugestão (RG21) e o alerta (RG22) não funcionam.
  - Vale para Top Set 1, Top Set 2, Back-off, Série 3, Série 4, Deload (1 válida) e cada série do Cluster Set. Série não feita, vazia ou zerada, e exercício pulado **não** pedem esforço.
  - **"Próximo"** e **"Ver Resumo"**: se faltar, não avança e cada série sem esforço mostra `[aviso_esforco]`, que some ao marcar. Peso e reps são validados antes (RG4).
  - **Confirmar** a série não exige o esforço: pode ser marcado no descanso. No Cluster confirmado, o campo continua na tela até ser marcado.
  - **"Confirmar e Salvar Treino"**: quem chegou à revisão pelas setas vê `[esforco_faltando]` (EF_09) com a lista por exercício; nada é gravado e o rascunho continua guardado.
  - Registros antigos e importados sem `rpe` continuam válidos.
  - Implementação: `camposSemEsforco` em `treinoSessao/domain/seriesFeitas.ts` e `seriesSemEsforco` em `pendencias.ts`.
- **RG28** – **Esforço alvo do exercício:** cada exercício tem um RPE alvo (`rpeAlvo`, faixa), cadastrado em `sessionExercises.ts` junto da faixa de reps e do cue. Aparece no cabeçalho do card, na escala escolhida.
  - **Multiarticulares pesados** (preset `COMPOSTO`: agacho, supino, terra e barra fixa): **7 a 8**. O supino técnico do Upper B usa faixa de reps de isolador, mas alvo 7 a 8.
  - **Máquinas, cabos e isoladores** (preset `ISOLADOR`): **9 a 10**.
  - **Plano importado com `rpe_alvo`** (EF_06 RG14): vale o alvo da planilha, acima do cadastro e do tipo. Muda só a referência dos avisos e o cabeçalho: a obrigatoriedade do esforço (RG27) continua igual.
  - **Plano importado ou salvo sem alvo:** usa o alvo do mesmo exercício no cadastro (nome ou apelido do catálogo). Fora do cadastro, agachamento, supino e terra livres usam 7 a 8; os demais, 9 a 10. Alvo em formato inválido é ignorado.
  - Implementação: `RPE_ALVO` em `sessionExercises.ts` e `rpeAlvoDoExercicio` em `treinoSessao/domain/rpeAlvo.ts`.
- **RG29** – **Avisos dentro do card "Último treino":** o app **informa, nunca manda**. Todo aviso descreve um dado do histórico, em linguagem neutra, sem ordem. Nenhum aviso bloqueia o treino nem altera campo (RG5.1).
  - **Onde:** uma linha logo abaixo das séries, acima da contagem e do volume. Não há caixa de aviso fora do card; a única exceção é o `[banner_pr]` (RG13).
  - **Quais, em ordem de prioridade:**

| Prioridade | Aviso | Quando | Marca | Cor |
|---|---|---|---|---|
| 1 | `[subir_peso]` | Último treino bateu o teto sem passar do alvo (RG21) | ↑ | Verde |
| 2 | `[alerta_fadiga]` | RG22 | ! | Âmbar |
| 2 | `[alerta_regressao]` | RG30 | ! | Âmbar |
| 3 | `[consolidar_carga]` | Último treino bateu o teto acima do alvo (RG21) | i | Azul |
| 3 | `[primeiro_registro]` | Exercício sem registro nesta sessão | i | Azul |

  - Fadiga exige as mesmas reps e regressão exige reps caindo: nunca aparecem juntas. Subir e consolidar também não.
  - **No máximo 1 aviso por vez** (`MAX_AVISOS_VISIVEIS`), o de maior prioridade. Havendo mais, o link **"ver mais"** mostra os outros na mesma ordem e vira **"ver menos"**. Com 1 aviso não há link; sem aviso, a linha não existe.
  - O card abre sempre **recolhido**, inclusive ao trocar de exercício. O estado do link não é gravado nem vai para o rascunho (RG12).
  - RPE ou RIR conforme a escala da tela (RG20). As séries do painel continuam nas duas escalas (RG17).
  - Sempre ligado: não há configuração. Limites e prioridades são constantes nomeadas.
  - **Cores** (tokens `TONS` de `TreinoSessao.styles.ts`, sem hex solto nos componentes):
    - **Azul do sistema:** título, data, séries e aviso informativo. **Verde:** só `[subir_peso]`. **Âmbar:** só fadiga e regressão. **Cinza:** contagem e volume, observação do dia e "ver mais". **Vermelho:** nunca.
  - **Resto da tela de treino** (mesmo princípio e mesma paleta): status do Top Set 1 → `[status_teto]` verde, `[consolidar_carga]` e `[status_faixa]` azul, `[status_abaixo]` âmbar. Deload (texto do modo, `[deload_confirmado]` e etiqueta da revisão) → cinza: é uma escolha do atleta. Vermelho só para erro de verdade (ex.: campo inválido).
    - O aviso **não tem fundo colorido**: barra lateral fina, marca e texto na cor do aviso. Sem `[subir_peso]`, fadiga ou regressão, o card é só azul e cinza.
  - **Acessibilidade:** todo aviso tem marca **e** texto, nunca só cor. O link é um botão com `aria-expanded`.
  - Implementação: `avisosDoTreino` em `treinoSessao/domain/avisosTreino.ts` monta a lista já ordenada; `UltimoTreinoPanel` só exibe.
- **RG30** – **Alerta de regressão:** aparece quando a **mesma carga** no Top Set 1 rende **cada vez menos reps**, com esforço alto. Todas as condições precisam valer:
  - pelo menos **3 treinos** seguidos com a mesma carga, cada um com **menos reps** que o anterior (2 quedas seguidas). Reps iguais ou maiores encerram a sequência;
  - nos **2 últimos treinos** o RPE é **9 ou mais**. O RPE do treino que abriu a sequência pode ser qualquer um. Não depende do alvo do exercício (RG28);
  - pelo menos **10 dias** entre o primeiro e o último treino da sequência (uma semana ruim sozinha não alerta, mesmo com o exercício em duas sessões), dentro de uma janela de **6 semanas** (42 dias, contados do último treino). São as **mesmas constantes** da RG22 (`ALERTA_MIN_DIAS` e `ALERTA_JANELA_DIAS`): mudar uma muda os dois alertas.
  - Carga de referência, Cluster Set, treinos sem RPE, outras cargas e **Deload** (zera a contagem): iguais à RG22. Top Set 1 sem reps não entra. Mudar a carga encerra o alerta.
  - O aviso mostra **todas** as reps da sequência (ex.: 11 → 10 → 9 → 8 em 4 treinos).
  - É só informação: não altera campo, não ativa o Deload e não bloqueia nada. Implementação: `detectarRegressao` em `utils/esforco.ts`, ao lado de `detectarFadiga`.

---

## 4. Tela

### 4.1 Barra Superior (TopBar)

- Título: **GymWave Strength**
- Campo data do treino: editável, formato `DD/MM/AAAA`, valor padrão = data atual. Data inválida impede salvar (RG26).
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
| Esforço alvo | Ex.: `alvo RPE 7–8` (ou `alvo RIR 2–3`), ao lado da faixa de reps dos Top Sets (RG28) |
| Badge treino | Identificador da sessão (UA, UB…) |
| Badge séries | "1 válida", "2 válidas", "3 válidas" ou "4 válidas" |
| Banner de PR | `[banner_pr]`, durante o preenchimento do Top Set 1, quando o PR histórico é superado ou o teto de reps é atingido em tempo real (ver RG13). Fica acima do card "Último treino" |
| Painel "Último treino" | Lista todas as séries do treino anterior (peso × reps e esforço em RPE e RIR), data, volume e observação — ver RG17. Traz também os avisos do exercício, no máximo 1 por vez — ver RG29 |

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
- Exibe informativo, em cinza: *"Deload — apenas 1 série válida (Top Set), mesmo peso do último treino"*.
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
A cada alteração nos campos peso ou repetições, o sistema recalcula o 1RM estimado (`Peso × (1 + Reps / 30)`) e compara com o recorde histórico do exercício. Se o critério da RG13 for satisfeito, o `[banner_pr]` aparece imediatamente. O cálculo é disparado no evento `onChange` de ambos os campos; ao esvaziar qualquer campo o banner some.

**Botão "Confirmar Top Set 1":**
- Habilitado somente quando peso e repetições são positivos (desabilitado enquanto vazio).
- Se os campos não estiverem preenchidos com valores positivos: exibe banner de aviso e destaca os campos com borda vermelha.
- Após confirmação: exibe status com ícone (`[status_teto]`, `[consolidar_carga]`, `[status_faixa]` ou `[status_abaixo]`, ver RG21 e RG29) e botão "Editar Top Set 1". Se o estado `[banner_pr]` estava ativo ao confirmar, o status exibido é "🔥 PR Confirmado!" no lugar dos status padrão.

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

### 4.8.1 Esforço da série (obrigatório nas séries feitas, em todos os blocos)

Fica logo abaixo de peso e repetições de cada série (ver RG20).

| Nº | Campo | Tipo | Opções | Obrig. |
|---|---|---|---|---|
| 01 | Esforço | 5 chips de um toque | RPE: ≤6, 7, 8, 9, 10 · RIR: 0, 1, 2, 3, 4+ (nessa ordem) | Sim, se a série foi feita (RG27) |
| 02 | Trocar escala | Botão com ícone de setas | Mostra a outra escala (RPE ⇄ RIR) | — |
| 03 | Ajuda | Botão **?**, à direita do botão de trocar escala | Abre e fecha o balão `[ajuda_esforco]` (RG25) | — |

- Tocar no chip marcado **desmarca**.
- Chip marcado, botão de trocar escala e botão **?**: **azul do sistema** (`#2563eb`) com texto e ícone brancos, nas duas escalas. O chip não usa verde, laranja nem vermelho: RPE 9 é o esperado num isolador e alto num agacho.
- Série feita sem esforço, ao tentar avançar: `[aviso_esforco]` abaixo dos chips (RG27).
- Ícones `lucide-react`, os mesmos da barra de navegação: `Gauge` (esforço), `ArrowLeftRight` (trocar escala), `CircleHelp` (ajuda), `X` (fechar ajuda), `TrendingUp` (subir), `Repeat` (consolidar), `Equal` (na faixa), `TrendingDown` (abaixo), `Layers` (Cluster Set), `BatteryCharging` (Deload).
- Acessibilidade: cada grupo tem o nome da série e do exercício, e o chip marcado usa `aria-pressed`. O **?** usa `aria-expanded`, e fechar com **Esc** ou no **X** devolve o foco para ele.

### 4.9 Observação

- Textarea livre por exercício.
- Não obrigatório.

### 4.10 Botões de Navegação (por exercício)

| Botão | Ação | Regras |
|---|---|---|
| **Pular** | Marca exercício como pulado e avança | — |
| **Próximo** | Avança para o próximo exercício | Modo padrão: valida Top Set 1 e Top Set 2. Modo Cluster Set: valida as 2 séries confirmadas ("Confirmar Cluster"). Modo Deload: valida apenas o Top Set 1 confirmado. Em todos: valida o esforço das séries feitas (RG27). |
| **Ver Resumo** | Abre tela de revisão pré-salvamento | Valida o esforço das séries feitas do exercício atual (RG27). O que ficou por fazer aparece ao salvar (EF_09 RG8). |

### 4.11 Tela de Revisão (Pré-save)

- Lista todos os exercícios com status (✓ concluído / ○ não preenchido / "Pulado").
- Exibe dados resumidos: modo padrão → `Top 1: Xkg × Nreps · Top 2: Xkg × Nreps · Back-off: Xkg × Nreps`; modo técnica Cluster Set → `Cluster S1 — B1: Xkg × Nreps · B2: … | Cluster S2 — B1: Xkg × Nreps · …` (só as séries preenchidas); modo Deload → exibe `Top 1: Xkg × Nreps` seguido da etiqueta **"· Deload"** em cinza.
- As séries mostram `@ RPE X` (ou `@ RIR X`) depois das reps.
- Ao clicar em um exercício, retorna para edição.
- Botão **"Confirmar e Salvar Treino"**: avisa se houver séries não feitas (EF_09 RG8) e salva todos os exercícios concluídos no localStorage do usuário. Cada exercício vira um registro novo em `registros` (RG19), e o resumo por ciclo continua em `dadosTreino`.
- Botão **"Voltar ao exercício"**: fecha a revisão sem salvar.

### 4.12 Resumo pós-save

- Exibe: `X/Y exercícios registrados`.
- Se houver exercícios que atingiram o teto de reps dentro do esforço alvo (RG21): `Z exercício(s) no teto de reps dentro do alvo`.

---

## 5. Mensagens do Sistema

| Identificador | Tipo | Cor | Título | Texto |
|---|---|---|---|---|
| `[aviso_top_set]` | Aviso inline | Laranja | ⚠ | Preencha o peso e as repetições do Top Set 1 antes de confirmar. |
| `[aviso_backoff]` | Aviso inline | Laranja | ⚠ | Preencha o peso e as repetições do Top Set 2 antes de confirmar. |
| `[aviso_esforco]` | Aviso inline | Laranja | ⚠ | Marque o esforço desta série para avançar. |
| `[aviso_tecnica]` | Aviso inline | Laranja | ⚠ | Preencha pelo menos um bloco (peso e reps) em cada série. |
| — | — | — | — | Sucesso, erro, conquista e confirmações desta tela estão no catálogo da EF_09 (`[treino_salvo]`, `[treino_nao_salvo]`, `[treino_em_andamento]`, `[series_nao_feitas]`…) |
| `[banner_pr]` | Destaque motivacional | Verde/Dourado pulsante | 🔥 Ritmo de Recorde Pessoal! | Confirme para validar o PR. (exibido em tempo real durante preenchimento do Top Set 1, ver RG13) |
| `[status_teto]` | Status | Verde | `TrendingUp` | Teto de reps atingido dentro do alvo · Sem esforço marcado: Teto de reps atingido |
| `[status_faixa]` | Status | Azul | `Equal` | Na faixa de reps |
| `[status_abaixo]` | Status | Âmbar | `TrendingDown` | Abaixo da faixa |
| `[deload_confirmado]` | Status | Cinza | `BatteryCharging` | Deload registrado — não conta para progressão |
| `[subir_peso]` | Aviso no card | Verde | ↑ | Bateu o teto de reps dentro do alvo (RPE X). Dá para subir a carga. · Sem RPE (registro antigo): Bateu o teto de reps. Dá para subir a carga. |
| `[consolidar_carga]` | Aviso no card e status | Azul | i (card) · `Repeat` (status) | Teto de reps com esforço acima do alvo (RPE X, alvo A–B): carga em consolidação. |
| `[alerta_fadiga]` | Aviso no card | Âmbar | ! | Mesma carga (X kg), esforço subindo: RPE A → B em N treinos. |
| `[alerta_regressao]` | Aviso no card | Âmbar | ! | Mesma carga (X kg), reps caindo: A → B → C em N treinos. |
| `[primeiro_registro]` | Aviso no card | Azul | i | Primeiro registro deste exercício nesta sessão. |
| `[ver_mais]` | Link no card | Cinza | — | ver mais · ver menos |
| `[ajuda_esforco]` | Balão | Branco | RPE e RIR: quão perto da falha | **RPE** (esforço percebido): nota de 6 a 10. 10 é a falha, não sairia mais nenhuma rep. · **RIR** (reps na reserva): quantas reps ainda sairiam. 0 é a falha. · É a mesma medida: RIR = 10 − RPE. Ex.: RPE 8 = RIR 2. · **Para que serve:** bateu o teto de reps no Top Set 1 com esforço igual ou abaixo do alvo do exercício, dá para subir a carga; se passou do alvo, carga em consolidação. É só um aviso: o peso não muda sozinho. · **Alvo:** agacho, supino, terra e barra fixa, RPE 7–8 (RIR 2–3). Máquinas, cabos e isoladores, RPE 9–10 (RIR 0–1). · A mesma carga e as mesmas reps pesando mais por 2 treinos seguidos geram o alerta de fadiga. · Obrigatório: marque ao terminar a série. |
| `[ultimo_treino]` | Painel informativo | Azul claro | ÚLTIMO TREINO · DD/MM/AAAA | Todas as séries do treino anterior (peso × reps · RPE X · RIR Y), contagem de séries, volume em kg·reps, observação do dia, quando houver, e avisos (ver RG17 e RG29) |
