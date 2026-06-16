export type SessaoTipo = "Upper A" | "Upper B" | "Lower A" | "Lower B" | "Braço";

export interface ExercicioSessao {
  nome: string;
  grupo: string;
  faixaTopSet: [number, number]; // ex: [5, 9] reps
  faixaBackoff: [number, number]; // ex: [9, 15] reps
  backoffPct: number; // % de redução ex: 0.85
  seriesValidas: 2 | 3; // 2 = Top Set + Back-off | 3 = + Série Extra
  tecnica?: "BC" | "RP" | null; // Breathing Cluster / Rest-Pause
  cue: string;
}

// ── Faixas Saizen por categoria ───────────────────────────────────────────────
type Preset = Pick<ExercicioSessao, "faixaTopSet" | "faixaBackoff" | "backoffPct" | "seriesValidas">;

// Multiarticulares livres (terra, supino, agacho, barra fixa, remada)
const MULTIARTICULAR: Preset = {
  faixaTopSet: [5, 8],
  faixaBackoff: [8, 10],
  backoffPct: 0.85,
  seriesValidas: 2,
};

// Máquinas/Press pesados (desenvolvimento, stiff, puxadas de cabo pesado)
const MAQUINA: Preset = {
  faixaTopSet: [8, 10],
  faixaBackoff: [10, 12],
  backoffPct: 0.85,
  seriesValidas: 2,
};

// Isoladores, cabos e máquinas leves (extensora, lateral, crossover, etc.)
const ISOLADOR: Preset = {
  faixaTopSet: [10, 12],
  faixaBackoff: [12, 15],
  backoffPct: 0.85,
  seriesValidas: 2,
};

const PANTURRILHA: Preset = {
  faixaTopSet: [10, 12],
  faixaBackoff: [12, 15],
  backoffPct: 0.85,
  seriesValidas: 3,
};

const BRACO: Preset = {
  faixaTopSet: [10, 12],
  faixaBackoff: [12, 15],
  backoffPct: 0.85,
  seriesValidas: 2,
};

// ── Sessões ──────────────────────────────────────────────────────────────────

export const SESSOES: Record<SessaoTipo, ExercicioSessao[]> = {
  "Upper A": [
    { nome: "Supino reto barra", grupo: "Peitoral", ...MULTIARTICULAR, cue: "PR work, fresco" },
    { nome: "Puxada triângulo", grupo: "Costas", ...MAQUINA, cue: "cotovelo ao corpo" },
    { nome: "Elevação lateral livre", grupo: "Ombro", ...ISOLADOR, seriesValidas: 3, cue: "até linha do ombro" },
    { nome: "Elevação lateral cabo", grupo: "Ombro", ...ISOLADOR, seriesValidas: 3, cue: "tensão contínua" },
    { nome: "Pull-around cabo", grupo: "Costas", ...ISOLADOR, seriesValidas: 3, cue: "v-taper, quadril" },
    { nome: "Crossover braço estendido", grupo: "Peitoral", ...ISOLADOR, seriesValidas: 3, cue: "adução completa" },
    { nome: "Pulldown inclinado", grupo: "Costas", ...ISOLADOR, cue: "alongamento máximo" },
    { nome: "Abdômen cabo ajoelhado", grupo: "Core", ...ISOLADOR, cue: "progressão de carga" },
  ],
  "Upper B": [
    { nome: "Barra fixa pronada", grupo: "Costas", ...MULTIARTICULAR, cue: "PR work, peito à barra" },
    { nome: "Elevação lateral livre", grupo: "Ombro", ...ISOLADOR, seriesValidas: 3, cue: "2ª sessão semanal" },
    { nome: "Elevação lateral cabo", grupo: "Ombro", ...ISOLADOR, seriesValidas: 3, cue: "12 séries deltóide total" },
    { nome: "Desenvolvimento máquina", grupo: "Ombro", ...MAQUINA, cue: "sem subir trapézio" },
    { nome: "Remada peito apoiado", grupo: "Costas", ...MULTIARTICULAR, cue: "espessura, cotovelo baixo" },
    { nome: "Supino halteres amplitude", grupo: "Peitoral", ...MULTIARTICULAR, cue: "-10% carga, técnico" },
    { nome: "Pull-around cabo", grupo: "Costas", ...ISOLADOR, cue: "v-taper, quadril" },
    { nome: "Abdômen cabo ajoelhado", grupo: "Core", ...ISOLADOR, cue: "progressão de carga" },
  ],
  "Lower A": [
    { nome: "Terra sumô", grupo: "Posterior/Glúteo", ...MULTIARTICULAR, cue: "PR work, 4 min descanso" },
    { nome: "Elevação pélvica máquina", grupo: "Posterior/Glúteo", ...ISOLADOR, cue: "pausa 2s no topo" },
    { nome: "Cadeira extensora", grupo: "Quadríceps", ...ISOLADOR, cue: "pico de contração" },
    { nome: "Cadeira flexora sentada", grupo: "Posterior/Glúteo", ...ISOLADOR, seriesValidas: 3, cue: "sem tirar quadril" },
    { nome: "Adutor máquina", grupo: "Posterior/Glúteo", ...ISOLADOR, seriesValidas: 3, cue: "controle, sem bater" },
    { nome: "Panturrilha em pé", grupo: "Panturrilha", ...PANTURRILHA, cue: "amplitude completa" },
    { nome: "Panturrilha sentado", grupo: "Panturrilha", ...PANTURRILHA, cue: "sóleo, joelho dobrado" },
    { nome: "Abdômen infra pendurado", grupo: "Core", ...ISOLADOR, cue: "pelve bascula" },
  ],
  "Lower B": [
    { nome: "Agachamento livre", grupo: "Quadríceps", ...MULTIARTICULAR, cue: "PR work, 3-4 min" },
    { nome: "Panturrilha leg press", grupo: "Panturrilha", ...PANTURRILHA, cue: "pirâmide, amplitude" },
    { nome: "Cadeira flexora deitado", grupo: "Posterior/Glúteo", ...ISOLADOR, seriesValidas: 3, cue: "antes do stiff" },
    { nome: "Stiff", grupo: "Posterior/Glúteo", ...MAQUINA, cue: "pausa no alongamento" },
    { nome: "Cadeira extensora", grupo: "Quadríceps", ...ISOLADOR, cue: "pico de contração" },
    { nome: "Adutor máquina", grupo: "Posterior/Glúteo", ...ISOLADOR, seriesValidas: 3, cue: "2ª sessão semanal" },
    { nome: "Abdômen infra pendurado", grupo: "Core", ...ISOLADOR, cue: "reto inferior" },
  ],
  "Braço": [
    { nome: "Tríceps testa halteres", grupo: "Braço", ...BRACO, cue: "mais carga primeiro" },
    { nome: "Tríceps polia barra reta", grupo: "Braço", ...BRACO, cue: "cotovelos fixos baixos" },
    { nome: "Tríceps polia unilateral", grupo: "Braço", ...BRACO, cue: "pegada supinada" },
    { nome: "Rosca inclinada 45°", grupo: "Braço", ...BRACO, cue: "PR work, porção longa" },
    { nome: "Rosca scott unilateral", grupo: "Braço", ...BRACO, cue: "porção curta, qualidade" },
    { nome: "Rosca polia alta", grupo: "Braço", ...BRACO, cue: "alonga antes de contrair" },
    { nome: "Rosca inversa", grupo: "Braço", ...BRACO, cue: "extensores antebraço" },
    { nome: "Rolar barra cabo", grupo: "Braço", ...BRACO, cue: "flexores, preensão" },
    { nome: "Abdômen infra banco", grupo: "Core", ...ISOLADOR, cue: "progressão de carga" },
  ],
};

export const SESSOES_LABELS: SessaoTipo[] = [
  "Upper A",
  "Upper B",
  "Lower A",
  "Lower B",
  "Braço",
];
