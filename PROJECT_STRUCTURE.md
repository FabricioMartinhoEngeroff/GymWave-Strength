# GymWave-Strength — Estrutura do Projeto

Stack: **React 19 + TypeScript 5.7 + Vite 6.4 + styled-components 6**
Testes: **Vitest 4 + @testing-library/react + jsdom**

---

## Raiz

```
GymWave-Strength/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts          # Configuração Vite (HTTPS dev server)
├── vitest.config.ts        # Configuração Vitest (separada do vite para evitar conflito de certificado)
└── src/
```

---

## src/

```
src/
├── main.tsx                # Entrypoint — monta <App /> no DOM
├── App.tsx                 # Shell de 5 abas com BottomNav (tab state)
├── vite-env.d.ts

├── components/
│   ├── cyclesCard/         # Card de ciclo Saizen (C1–C4) com inputs de série
│   │   ├── index.tsx           # Exporta CycleCard (componente principal)
│   │   ├── CycleCard.logic.ts  # Lógica pura: cálculo de series, validação
│   │   ├── CycleCard.styles.ts # Styled-components do card
│   │   ├── CycleHeader.tsx     # Cabeçalho com nome e sigla do ciclo
│   │   ├── CycleInstruction.tsx# Instruções de rep-range
│   │   ├── ExerciseSection.tsx # Seção de exercício com campos de peso/rep
│   │   └── SeriesInputs.tsx    # Inputs de uma série (peso + rep)
│   │
│   ├── exportar/
│   │   └── Exportar.tsx        # Tela de exportação CSV / JSON
│   │
│   ├── graphic/            # Gráficos de intensidade por ciclo
│   │   ├── index.tsx
│   │   ├── GraphicsContainer.tsx  # Container principal com filtros
│   │   ├── ChartCard.tsx          # Card de um gráfico individual
│   │   └── SearchBar.tsx          # Barra de busca de exercício
│   │
│   ├── layout/
│   │   └── BottomNav.tsx       # Bottom navigation bar (5 abas)
│   │
│   ├── PowerliftChart/     # Gráfico estilo powerlifting dashboard
│   │   ├── index.tsx
│   │   └── styles.ts
│   │
│   ├── report/             # Tela de relatórios de treino
│   │   ├── index.tsx           # Exporta ReportPage
│   │   ├── ReportItem.tsx      # Item individual de relatório
│   │   ├── ReportList.tsx      # Lista de itens com paginação
│   │   ├── EditRow.tsx         # Linha em modo de edição
│   │   └── SearchBar.tsx       # Filtro de exercício + período
│   │
│   ├── treinoSessao/       # Tela principal de registro de treino (aba Registrar)
│   │   ├── TreinoSessao.tsx        # Componente principal
│   │   └── TreinoSessao.styles.ts  # Styled-components
│   │
│   ├── ui/                 # Componentes de UI reutilizáveis
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── NativeSelect.tsx
│   │   ├── FormField.tsx
│   │   ├── CheckboxGroup.tsx
│   │   ├── DatePicker.tsx
│   │   └── IconButton.tsx
│   │
│   └── volumeLoad/
│       └── VolumeLoad.tsx      # Tela de Volume Load semanal por grupo muscular

├── contexts/               # Context API de autenticação
│   ├── AuthContext.ts          # Criação do contexto + interface AuthContextType
│   ├── AuthProvider.tsx        # Provider que implementa login/logout
│   ├── AuthProviderContext.tsx # Wiring do provider com contexto
│   └── useAuth.ts              # Hook para consumir AuthContext

├── data/                   # Dados estáticos / configuração
│   ├── cycles.ts               # Ciclos Saizen: C1 Acum, C2 Intens, C3 Pico, C4 Deload
│   ├── exercise.ts             # Lista master de exercícios
│   ├── muscleMap.ts            # Mapa exercício → grupo muscular
│   └── sessionExercises.ts     # Mapa sessão → exercícios (Upper A/B, Lower A/B, Braço)

├── hooks/                  # Hooks customizados
│   ├── useBreakpoint.ts        # Detecta breakpoint responsivo
│   ├── useDadosTreino.ts       # Lê localStorage e transforma em DadosAgrupados p/ gráficos
│   ├── useLoginForm.ts         # Gerencia estado do formulário de login
│   └── useRelatorio.ts         # Carrega, filtra, edita e exclui linhas de relatório

├── pages/
│   └── loginPages/
│       ├── AuthPages.tsx       # Wrapper que alterna entre Login e Register
│       ├── Login.tsx           # Formulário de login (props-only, sem hooks internos)
│       └── Register.tsx        # Formulário de cadastro

├── router/
│   ├── PrivateRoute.tsx        # Rota protegida: verifica token no localStorage
│   └── RouterTEMP.tsx          # Router temporário (em revisão)

├── services/               # Camada de serviços (mock localStorage)
│   ├── authService.ts          # login() e register() com JWT simulado
│   └── userService.ts          # Operações de usuário

├── styles/
│   └── GlobalStyles.tsx        # Estilos globais e componentes de layout (RightPanel, LoginBox…)

├── types/                  # Tipos TypeScript compartilhados
│   ├── Form.ts                 # Tipos de formulário
│   ├── TrainingData.ts         # DadosTreino, RegistroTreino, LinhaRelatorio, SerieInfo…
│   └── User.ts                 # Interface User

└── utils/                  # Funções utilitárias puras
    ├── handleApiError.ts       # Tratamento padronizado de erros de API
    ├── storage.ts              # salvarDados() / carregarDados() → localStorage["dadosTreino"]
    ├── timeFilter.ts           # getCutoffTs() — corte de timestamp por intervalo (1M, 3M…)
    ├── validateUUID.ts         # Validação de UUID
    ├── validationErrors.ts     # Mensagens de erro centralizadas
    ├── validators.ts           # validateEmail, validateCPF, validatePhone, validatePassword…
    ├── volumeLoadCalc.ts       # calcVolumeLoad() — soma Volume Load por grupo muscular e semana ISO
    └── workoutMetrics.ts       # computeSessionPoint(), buildExerciseHistory() p/ gráficos
```

---

## src/__tests__/

Estrutura espelhando `src/` — cada módulo tem seu arquivo `.spec.ts(x)`.

```
src/__tests__/
├── setup/
│   └── vitest.setup.ts         # @testing-library/jest-dom + limpa localStorage antes/após cada teste

├── components/
│   ├── cyclesCard/
│   │   └── CycleCard.spec.tsx      # 5 testes — stub de renderização do card de ciclo
│   ├── exportar/
│   │   └── Exportar.spec.tsx       # 7 testes — renderização, contagem e download
│   ├── graphic/
│   │   └── GraphicsContainer.spec.tsx  # 5 testes — título, filtros, estado vazio
│   ├── layout/
│   │   └── BottomNav.spec.tsx      # 11 testes — abas, active state, callbacks
│   ├── report/
│   │   └── ReportPage.spec.tsx     # 5 testes — título, filtros, dados
│   ├── treinoSessao/
│   │   └── TreinoSessao.spec.tsx   # 22 testes — sessão, ciclo, navegação, auto-fill, conclusão
│   ├── ui/
│   │   └── Input.spec.tsx          # 6 testes — Input (3) e Button (3)
│   └── volumeLoad/
│       └── VolumeLoad.spec.tsx     # 6 testes — renderização e cálculo de volume

├── contexts/
│   └── AuthContext.spec.ts         # 4 testes — criação do contexto e hook useAuth

├── data/
│   ├── cycles.spec.ts              # 10 testes — integridade dos ciclos Saizen
│   ├── muscleMap.spec.ts           # 13 testes — cobertura do mapa exercício→músculo
│   └── sessionExercises.spec.ts    # 10 testes — mapeamento sessão→exercícios

├── hooks/
│   ├── useDadosTreino.spec.ts      # 4 testes — estado vazio, agrupamento, legado, topSet
│   └── useRelatorio.spec.ts        # 9 testes — carregamento, filtros, edição, exclusão

├── pages/
│   └── loginPages/
│       └── Login.spec.tsx          # 8 testes — renderização e interação do formulário

├── router/
│   └── PrivateRoute.spec.tsx       # 4 testes — acesso negado sem token, acesso com token

├── services/
│   └── authService.spec.ts         # 8 testes — register e login com mock localStorage

└── utils/
    ├── storage.spec.ts             # 7 testes — salvarDados / carregarDados
    ├── timeFilter.spec.ts          # 8 testes — getCutoffTs por intervalo
    ├── validators.spec.ts          # 18 testes — email, CPF, telefone, senha, campos vazios
    ├── volumeLoadCalc.spec.ts      # 10 testes — cálculo de volume por semana ISO
    └── workoutMetrics.spec.ts      # 13 testes — computeSessionPoint, buildExerciseHistory
```

**Total: 22 arquivos de teste | 211 testes passando**

---

## Modelo de dados (`localStorage`)

```
dadosTreino: {
  [exercicio: string]: {
    [cicloId: string]: {   // ex: "C1", "C2", "C3", "C4"
      data: string;        // "DD/MM/YYYY"
      pesos: string[];
      reps: string[];
      obs?: string;
      exercicio: string;
    }
  }
}
```

## Ciclos Saizen

| ID  | Nome            | Séries | Rep-range | Objetivo          |
|-----|-----------------|--------|-----------|-------------------|
| C1  | Acumulação      | 3      | 10–15     | Volume / base     |
| C2  | Intensificação  | 3      | 6–10      | Força + volume    |
| C3  | Pico            | 2      | 3–6       | Força máxima      |
| C4  | Deload          | 2      | 10–15     | Recuperação ativa |

## Sessões

| Sessão  | Foco               |
|---------|--------------------|
| Upper A | Peito, ombro, tríceps |
| Upper B | Costas, bíceps     |
| Lower A | Quadríceps, glúteo |
| Lower B | Posterior, panturrilha |
| Braço   | Bíceps, tríceps isolados |
