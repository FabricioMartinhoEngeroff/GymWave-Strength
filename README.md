💪 GymWave Strength
Sistema pessoal de gerenciamento de treinos de força com periodização ondulatória.
LINK: https://gym-wave-strength.vercel.app/#

⚠️ Projeto pessoal — feito exclusivamente para uso próprio, sem autenticação robusta, sem backend e sem nenhuma preocupação com segurança. Os dados ficam salvos localmente no navegador via localStorage. Use por sua conta e risco.


📖 O que é isso?
Um app web que eu construí para acompanhar minha evolução nos treinos de força. A ideia central é a periodização ondulatória: os treinos variam em intensidade a cada ciclo (Ciclo 0 ao Ciclo 4), e o sistema sugere o peso ideal para cada exercício com base no seu histórico.
Nada de servidor, nada de banco de dados — tudo roda no navegador mesmo.

🚀 Como usar

Clone o repositório e instale as dependências:

bashgit clone https://github.com/seu-usuario/GymWave-Strength.git
cd GymWave-Strength
npm install

Inicie o projeto em modo desenvolvimento:

bashnpm run dev

Abra http://localhost:5173 no navegador.


Dica: Na primeira vez, recomendo começar pelo Ciclo 4 para ter uma base de comparação nos treinos seguintes.


✨ O que o app faz

Seleciona o ciclo e o exercício do dia via checkboxes e multiselect com autocomplete
Sugere automaticamente o peso ideal com base no histórico registrado
Registra 3 séries por exercício (peso + repetições)
Salva tudo localmente no localStorage — funciona offline
Exibe gráficos de evolução por exercício (barras com média e total)
Permite filtrar registros por exercício e data


🛠️ Tecnologias usadas
TecnologiaO que eu aprendi / apliqueiReact 19Componentes funcionais, composição, ciclo de vidaTypeScript 5.7Tipagem de props, interfaces, generics básicosReact Router DOM 7Rotas, navegação programática, rotas protegidasContext API + Custom HooksEstado global, useAuth, separação de lógicaStyled Components 6CSS-in-JS, temas, componentes estilizadosRechartsGráficos de barra e linha, visualização de dadosAxiosRequisições HTTP, interceptors, tratamento de errosReact SelectSelect avançado com autocomplete e multiselectDate-fnsFormatação e manipulação de dataslocalStoragePersistência offline sem backendViteBuild tool, HMR, configuração de ambienteESLintQualidade e padronização de código

🧠 Aprendizados principais
Este projeto foi meu laboratório prático de React. As coisas que mais aprendi:
Arquitetura de componentes
Entender quando criar um componente novo vs. reusar um existente. Quanto menor e mais focado o componente, mais fácil de manter.
Custom Hooks
Isolar lógica de negócio em hooks (useAuth, useWorkoutHistory) deixou os componentes muito mais limpos. Aprendi que hooks são só funções — mas funções poderosas.
Estado global vs. local
Nem tudo precisa ir pro Context. Estado que só um componente usa fica melhor com useState local mesmo.
TypeScript na prática
Tipar as interfaces dos dados de treino (WorkoutRecord, Exercise, Serie) me salvou de vários bugs bobos e tornou o autocomplete do editor muito mais útil.
Persistência com localStorage
Aprendi a serializar/deserializar objetos com JSON.stringify / JSON.parse e a lidar com dados que podem estar ausentes ou corrompidos.
Visualização de dados
Integrar o Recharts foi meu primeiro contato com gráficos em React. Aprendi a transformar arrays de dados no formato que a biblioteca espera.

📁 Estrutura do projeto
src/
├── components/      # Componentes reutilizáveis (SerieBlock, ExerciseSelect...)
├── context/         # AuthContext, WorkoutContext
├── hooks/           # Custom hooks
├── pages/           # Telas principais (Home, History, Charts)
├── services/        # Lógica de acesso ao localStorage
├── types/           # Interfaces TypeScript
└── styles/          # Temas e estilos globais

⚙️ Requisitos

Node.js 18+
npm 9+
Navegador moderno (Chrome, Firefox, Edge)


📝 Observações

Não tem login real nem proteção de dados. É pessoal mesmo.
Limpar o localStorage do navegador apaga todos os registros.
Funciona offline depois do primeiro carregamento.
Mobile-first: foi pensado pra usar pelo celular na academia.
