export type SessaoTipo = "Upper A" | "Upper B" | "Lower A" | "Lower B" | "Braço";

export interface ExercicioSessao {
  nome: string;
  grupo: string;
  faixaTopSet: [number, number];
  faixaBackoff: [number, number];
  backoffPct: number;
  seriesValidas: 2 | 3;
  tecnica?: "RP" | null;
  cue: string;
}

// ── Faixas Saizen por categoria ───────────────────────────────────────────────
type Preset = Pick<ExercicioSessao, "faixaTopSet" | "faixaBackoff" | "backoffPct" | "seriesValidas">;

// Multiarticulares livres (terra, supino, agacho, barra fixa, remada, puxada)
const MULTIARTICULAR: Preset = {
  faixaTopSet: [5, 7],
  faixaBackoff: [8, 10],
  backoffPct: 0.85,
  seriesValidas: 2,
};

// Máquinas/Press pesados (desenvolvimento, stiff)
const MAQUINA: Preset = {
  faixaTopSet: [8, 10],
  faixaBackoff: [10, 12],
  backoffPct: 0.85,
  seriesValidas: 2,
};

// Isoladores e cabos (extensora, lateral, crossover, pulldown, pull-around)
const ISOLADOR: Preset = {
  faixaTopSet: [8, 10],
  faixaBackoff: [10, 12],
  backoffPct: 0.85,
  seriesValidas: 2,
};

const PANTURRILHA: Preset = {
  faixaTopSet: [10, 12],
  faixaBackoff: [12, 15],
  backoffPct: 0.85,
  seriesValidas: 3,
};

// Braço — bíceps, tríceps (faixa mais ampla por natureza dos exercícios de braço)
const BRACO: Preset = {
  faixaTopSet: [8, 12],
  faixaBackoff: [12, 15],
  backoffPct: 0.85,
  seriesValidas: 2,
};

// Antebraço — extensores e flexores de punho/preensão
const ANTEBRACO: Preset = {
  faixaTopSet: [10, 15],
  faixaBackoff: [15, 20],
  backoffPct: 0.85,
  seriesValidas: 2,
};

// ── Sessões ──────────────────────────────────────────────────────────────────

export const SESSOES: Record<SessaoTipo, ExercicioSessao[]> = {
  "Upper A": [
    { nome: "Supino reto barra",         grupo: "Peitoral", ...MULTIARTICULAR,                         cue: "PR work, fresco" },
    { nome: "Puxada triângulo",          grupo: "Costas",   ...MULTIARTICULAR, faixaTopSet: [5, 8], faixaBackoff: [8, 10], cue: "cotovelo ao corpo" },
    { nome: "Elevação lateral livre",    grupo: "Ombro",    ...ISOLADOR, seriesValidas: 3,             cue: "até linha do ombro" },
    { nome: "Elevação lateral cabo",     grupo: "Ombro",    ...ISOLADOR, seriesValidas: 3,             cue: "tensão contínua" },
    { nome: "Pull-around cabo",          grupo: "Costas",   ...ISOLADOR, seriesValidas: 3,             cue: "v-taper, quadril" },
    { nome: "Crossover braço estendido", grupo: "Peitoral", ...ISOLADOR, seriesValidas: 3,             cue: "adução completa" },
    { nome: "Pulldown inclinado",        grupo: "Costas",   ...ISOLADOR,                              cue: "alongamento máximo" },
    { nome: "Rosca scott",               grupo: "Braço",    ...BRACO,                                  cue: "porção curta, qualidade" },
    { nome: "Francês corda",             grupo: "Braço",    ...BRACO,                                  cue: "cabeça longa, amplitude máxima" },
    { nome: "Antebraço invertido",       grupo: "Braço",    ...ANTEBRACO, seriesValidas: 3,            cue: "pegada pronada, extensores" },
    { nome: "Abdômen cabo ajoelhado",   grupo: "Core",     ...ISOLADOR,                              cue: "flexão de tronco, controle" },
  ],
  "Upper B": [
    { nome: "Barra fixa pronada",        grupo: "Costas",   ...MULTIARTICULAR,                         cue: "PR work, peito à barra" },
    { nome: "Elevação lateral livre",    grupo: "Ombro",    ...ISOLADOR, seriesValidas: 3,             cue: "2ª sessão semanal" },
    { nome: "Elevação lateral cabo",     grupo: "Ombro",    ...ISOLADOR, seriesValidas: 3,             cue: "12 séries deltóide total" },
    { nome: "Desenvolvimento máquina",   grupo: "Ombro",    ...MAQUINA,                                cue: "sem subir trapézio" },
    { nome: "Remada peito apoiado",      grupo: "Costas",   ...MULTIARTICULAR, seriesValidas: 3,       cue: "espessura, cotovelo baixo" },
    { nome: "Supino reto barra",         grupo: "Peitoral", ...MAQUINA,                                cue: "técnica e volume peito" },
    { nome: "Pull-around cabo",          grupo: "Costas",   ...ISOLADOR,                              cue: "v-taper, quadril" },
    { nome: "Rosca Bayesian",            grupo: "Braço",    ...BRACO,                                  cue: "porção longa, cotovelo atrás" },
    { nome: "Tríceps polia barra reta",  grupo: "Braço",    ...BRACO,                                  cue: "cotovelos baixos fixos, medial" },
    { nome: "Antebraço rola palma",      grupo: "Braço",    ...ANTEBRACO, seriesValidas: 3,            cue: "flexores, preensão" },
    { nome: "Abdômen cabo ajoelhado",   grupo: "Core",     ...ISOLADOR,                              cue: "flexão de tronco, controle" },
  ],
  "Lower A": [
    { nome: "Terra sumô",                grupo: "Posterior/Glúteo", ...MULTIARTICULAR,                 cue: "PR work, 4 min descanso" },
    { nome: "Elevação pélvica máquina",  grupo: "Posterior/Glúteo", ...ISOLADOR,                      cue: "pausa 2s no topo" },
    { nome: "Cadeira extensora",         grupo: "Quadríceps",       ...ISOLADOR,                      cue: "pico de contração" },
    { nome: "Cadeira flexora sentada",   grupo: "Posterior/Glúteo", ...ISOLADOR, seriesValidas: 3,    cue: "sem tirar quadril" },
    { nome: "Adutor máquina",            grupo: "Posterior/Glúteo", ...ISOLADOR, seriesValidas: 3,    cue: "controle, sem bater" },
    { nome: "Panturrilha em pé",         grupo: "Panturrilha",      ...PANTURRILHA,                   cue: "amplitude completa" },
    { nome: "Panturrilha sentado",       grupo: "Panturrilha",      ...PANTURRILHA,                   cue: "sóleo, joelho dobrado" },
    { nome: "Abdômen infra pendurado",   grupo: "Core",             ...ISOLADOR,                      cue: "pelve bascula" },
  ],
  "Lower B": [
    { nome: "Agachamento livre",         grupo: "Quadríceps",       ...MULTIARTICULAR,                 cue: "PR work, 3-4 min" },
    { nome: "Panturrilha leg press",     grupo: "Panturrilha",      ...PANTURRILHA,                   cue: "pirâmide, amplitude" },
    { nome: "Cadeira flexora deitado",   grupo: "Posterior/Glúteo", ...ISOLADOR, seriesValidas: 3,    cue: "antes do stiff" },
    { nome: "Stiff",                     grupo: "Posterior/Glúteo", ...MAQUINA,                        cue: "pausa no alongamento" },
    { nome: "Cadeira extensora",         grupo: "Quadríceps",       ...ISOLADOR,                      cue: "pico de contração" },
    { nome: "Adutor máquina",            grupo: "Posterior/Glúteo", ...ISOLADOR, seriesValidas: 3,    cue: "2ª sessão semanal" },
    { nome: "Abdômen infra pendurado",   grupo: "Core",             ...ISOLADOR,                      cue: "reto inferior" },
  ],
  "Braço": [
    { nome: "Tríceps polia barra reta",  grupo: "Braço", ...BRACO,                                    cue: "PR work, cotovelos fixos, medial" },
    { nome: "Tríceps testa halteres",    grupo: "Braço", ...BRACO,                                    cue: "cabeça longa + medial" },
    { nome: "Rosca polia unilateral",    grupo: "Braço", ...BRACO,                                    cue: "supinada, cotovelo fixo" },
    { nome: "Rosca scott",               grupo: "Braço", ...BRACO,                                    cue: "PR work, cotovelo fixo na mesa" },
    { nome: "Rosca martelo",             grupo: "Braço", ...BRACO,                                    cue: "braquial, controla descida" },
    { nome: "Rosca polia alta",          grupo: "Braço", ...BRACO,                                    cue: "porção longa, ângulo diferente" },
    { nome: "Antebraço invertido",       grupo: "Braço", ...ANTEBRACO,                                cue: "pegada pronada, extensores" },
    { nome: "Antebraço rola palma",      grupo: "Braço", ...ANTEBRACO,                                cue: "flexores, preensão" },
  ],
};

export const SESSOES_LABELS: SessaoTipo[] = [
  "Upper A",
  "Upper B",
  "Lower A",
  "Lower B",
  "Braço",
];
