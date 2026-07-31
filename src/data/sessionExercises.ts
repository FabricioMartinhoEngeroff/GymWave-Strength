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

// ── Faixas Saizen v5 ─────────────────────────────────────────────────────────
type Preset = Pick<ExercicioSessao, "faixaTopSet" | "faixaBackoff" | "backoffPct" | "seriesValidas">;

// Multiarticulares livres (terra, supino, agacho, barra fixa, remada, puxada, stiff)
const MULTIARTICULAR: Preset = {
  faixaTopSet: [5, 8],
  faixaBackoff: [8, 10],
  backoffPct: 0.85,
  seriesValidas: 2,
};

// Máquinas e isoladores (todos os demais no v5)
const ISOLADOR: Preset = {
  faixaTopSet: [8, 10],
  faixaBackoff: [10, 12],
  backoffPct: 0.85,
  seriesValidas: 2,
};

// ── Sessões ──────────────────────────────────────────────────────────────────

export const SESSOES: Record<SessaoTipo, ExercicioSessao[]> = {
  "Upper A": [
    { nome: "Supino reto barra",         grupo: "Peitoral", ...MULTIARTICULAR,                      cue: "PR work, fresco para força" },
    { nome: "Puxada triângulo",          grupo: "Costas",   ...MULTIARTICULAR,                      cue: "cotovelo ao corpo, pico no peito" },
    { nome: "Elevação lateral livre",    grupo: "Ombro",    ...ISOLADOR, seriesValidas: 3,          cue: "até linha do ombro, sem trapézio" },
    { nome: "Elevação lateral cabo",     grupo: "Ombro",    ...ISOLADOR, seriesValidas: 3,          cue: "tensão contínua, pico no topo" },
    { nome: "Pull-around cabo",          grupo: "Costas",   ...ISOLADOR, seriesValidas: 3,          cue: "braço semi-estendido, latíssimo baixo" },
    { nome: "Crossover braço estendido", grupo: "Peitoral", ...ISOLADOR, seriesValidas: 3,          cue: "adução completa, pico no fechamento" },
    { nome: "Pulldown inclinado",        grupo: "Costas",   ...ISOLADOR,                            cue: "braços estendidos, puxa para coxa" },
    { nome: "Rosca scott",               grupo: "Braço",    ...ISOLADOR,                            cue: "porção curta, amplitude completa" },
    { nome: "Francês corda",             grupo: "Braço",    ...ISOLADOR,                            cue: "cabeça longa, cotovelos apontados acima" },
    { nome: "Rosca martelo",             grupo: "Braço",    ...ISOLADOR,                            cue: "braquial, controla a descida" },
    { nome: "Pulley barra reta pronada", grupo: "Braço",    ...ISOLADOR,                            cue: "cotovelos baixos fixos, medial" },
    { nome: "Antebraço rola palma",      grupo: "Braço",    ...ISOLADOR,                            cue: "flexores e preensão, enrola devagar" },
    { nome: "Abdômen cabo ajoelhado",    grupo: "Core",     ...ISOLADOR,                            cue: "enrola o tronco com carga" },
  ],
  "Upper B": [
    { nome: "Barra fixa pronada",        grupo: "Costas",   ...MULTIARTICULAR,                      cue: "PR work, peito subindo à barra" },
    { nome: "Elevação lateral livre",    grupo: "Ombro",    ...ISOLADOR, seriesValidas: 3,          cue: "2ª sessão semanal" },
    { nome: "Elevação lateral cabo",     grupo: "Ombro",    ...ISOLADOR, seriesValidas: 3,          cue: "12 séries deltóide total" },
    { nome: "Desenvolvimento máquina",   grupo: "Ombro",    ...ISOLADOR,                            cue: "sem subir trapézio" },
    { nome: "Remada peito apoiado",      grupo: "Costas",   ...MULTIARTICULAR,                      cue: "espessura, cotovelo baixo e para trás" },
    { nome: "Supino halteres amplitude", grupo: "Peitoral", ...MULTIARTICULAR,                      cue: "amplitude máxima, peito esticado" },
    { nome: "Pull-around cabo",          grupo: "Costas",   ...ISOLADOR,                            cue: "v-taper, latíssimo baixo" },
    { nome: "Rosca Bayesian",            grupo: "Braço",    ...ISOLADOR,                            cue: "porção longa, cotovelo atrás do corpo" },
    { nome: "Martelo corda",             grupo: "Braço",    ...ISOLADOR,                            cue: "braquial, tensão contínua pelo cabo" },
    { nome: "Francês corda",             grupo: "Braço",    ...ISOLADOR,                            cue: "cabeça longa, cotovelos apontados acima" },
    { nome: "Pulley corda",              grupo: "Braço",    ...ISOLADOR,                            cue: "cotovelos baixos fixos, extensão completa" },
    { nome: "Abdômen cabo ajoelhado",    grupo: "Core",     ...ISOLADOR,                            cue: "enrola o tronco com carga" },
  ],
  "Lower A": [
    { nome: "Terra sumô",                grupo: "Posterior/Glúteo", ...MULTIARTICULAR,              cue: "PR work — abre fresco. 4 min descanso" },
    { nome: "Elevação pélvica máquina",  grupo: "Posterior/Glúteo", ...ISOLADOR,                   cue: "pausa 2s no topo, glúteo encurtado" },
    { nome: "Cadeira extensora",         grupo: "Quadríceps",       ...ISOLADOR,                   cue: "extensão completa, pico de contração" },
    { nome: "Cadeira flexora sentada",   grupo: "Posterior/Glúteo", ...ISOLADOR, seriesValidas: 3, cue: "fecha controlando, sem tirar quadril" },
    { nome: "Adutor máquina",            grupo: "Posterior/Glúteo", ...ISOLADOR, seriesValidas: 3, cue: "fecha com controle, sem bater" },
    { nome: "Panturrilha em pé",         grupo: "Panturrilha",      ...ISOLADOR, seriesValidas: 3, cue: "amplitude completa, pausa no topo" },
    { nome: "Panturrilha sentado",       grupo: "Panturrilha",      ...ISOLADOR, seriesValidas: 3, cue: "sóleo com joelho dobrado, pesado" },
    { nome: "Abdômen infra pendurado",   grupo: "Core",             ...ISOLADOR,                   cue: "pelve bascula, reto inferior" },
  ],
  "Lower B": [
    { nome: "Agachamento livre",         grupo: "Quadríceps",       ...MULTIARTICULAR,              cue: "PR work, 3-4 min descanso" },
    { nome: "Panturrilha leg press",     grupo: "Panturrilha",      ...ISOLADOR, seriesValidas: 3, cue: "pirâmide, amplitude completa" },
    { nome: "Cadeira flexora deitado",   grupo: "Posterior/Glúteo", ...ISOLADOR, seriesValidas: 3, cue: "fecha sem tirar quadril, antes do stiff" },
    { nome: "Stiff",                     grupo: "Posterior/Glúteo", ...MULTIARTICULAR,              cue: "quadril para trás, pausa no alongamento" },
    { nome: "Cadeira extensora",         grupo: "Quadríceps",       ...ISOLADOR,                   cue: "extensão completa, pico de contração" },
    { nome: "Adutor máquina",            grupo: "Posterior/Glúteo", ...ISOLADOR, seriesValidas: 3, cue: "2ª sessão semanal, controle" },
    { nome: "Abdômen infra pendurado",   grupo: "Core",             ...ISOLADOR,                   cue: "reto inferior" },
  ],
  "Braço": [
    { nome: "Tríceps testa halteres",   grupo: "Braço", ...ISOLADOR, cue: "cabeça longa + medial, cotovelos fixos" },
    { nome: "Tríceps polia barra reta", grupo: "Braço", ...ISOLADOR, cue: "PR work, cotovelos baixos e fixos" },
    { nome: "Tríceps polia unilateral", grupo: "Braço", ...ISOLADOR, cue: "supinada, cotovelo fixo, extensão completa" },
    { nome: "Rosca inclinada 45°",      grupo: "Braço", ...ISOLADOR, cue: "porção longa em alongamento máximo" },
    { nome: "Rosca scott unilateral",   grupo: "Braço", ...ISOLADOR, cue: "cotovelo fixo na mesa, unilateral" },
    { nome: "Rosca polia alta",         grupo: "Braço", ...ISOLADOR, cue: "porção longa, ângulo diferente" },
    { nome: "Rosca inversa",            grupo: "Braço", ...ISOLADOR, cue: "pegada pronada, extensores do antebraço" },
    { nome: "Rolar barra cabo",         grupo: "Braço", ...ISOLADOR, cue: "flexores e preensão" },
    { nome: "Abdômen infra banco",      grupo: "Core",  ...ISOLADOR, cue: "reto inferior, joelhos ao peito" },
  ],
};

export const SESSOES_LABELS: SessaoTipo[] = [
  "Upper A",
  "Upper B",
  "Lower A",
  "Lower B",
  "Braço",
];
