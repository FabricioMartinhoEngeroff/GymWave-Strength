export type SessaoTipo = "Upper A" | "Upper B" | "Lower A" | "Lower B";

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

// ── Presets v4 ───────────────────────────────────────────────────────────────
type Preset = Pick<ExercicioSessao, "faixaTopSet" | "faixaBackoff" | "backoffPct" | "seriesValidas">;

// Multiarticulares pesados (terra, supino, agacho, barra fixa): faixa de força
const COMPOSTO: Preset = {
  faixaTopSet: [5, 8],
  faixaBackoff: [8, 10],
  backoffPct: 0.85,
  seriesValidas: 2,
};

// Máquinas, cabos e isoladores
const ISOLADOR: Preset = {
  faixaTopSet: [8, 10],
  faixaBackoff: [10, 12],
  backoffPct: 0.85,
  seriesValidas: 2,
};

// ── Sessões v4 ───────────────────────────────────────────────────────────────

export const SESSOES: Record<SessaoTipo, ExercicioSessao[]> = {
  "Lower A": [
    { nome: "Terra sumô",               grupo: "Posterior/Glúteo", ...COMPOSTO,  seriesValidas: 3, cue: "PR work — abre fresco. Descanso 4 min. Progressão toda semana" },
    { nome: "Panturrilha em pé",        grupo: "Panturrilha",      ...ISOLADOR,  seriesValidas: 3, cue: "Joelho estendido, gastrocnêmio em foco. Amplitude completa, pausa no topo" },
    { nome: "Adutor máquina",           grupo: "Posterior/Glúteo", ...ISOLADOR,  seriesValidas: 3, cue: "Fecha com controle sem bater o peso. Parte interna da coxa" },
    { nome: "Cadeira extensora",        grupo: "Quadríceps",       ...ISOLADOR,  seriesValidas: 3, cue: "Extensão completa com pico de contração" },
    { nome: "Cadeira flexora sentada",  grupo: "Posterior/Glúteo", ...ISOLADOR,  seriesValidas: 3, cue: "Fecha controlando sem tirar quadril do banco. Posterior com joelho flexionado" },
    { nome: "Panturrilha sentado",      grupo: "Panturrilha",      ...ISOLADOR,  seriesValidas: 3, cue: "Sóleo com joelho dobrado. Pesado, bilateral. Amplitude completa, segura em cima" },
  ],

  "Upper A": [
    { nome: "Supino reto barra",         grupo: "Peitoral", ...COMPOSTO,                      cue: "PR work — fresco para força. Descanso 3 min. Progressão toda semana" },
    { nome: "Puxada triângulo",          grupo: "Costas",   ...ISOLADOR,                      cue: "Cotovelo descendo junto ao corpo, pico de contração no peito. Latíssimo em largura" },
    { nome: "Elevação lateral livre",    grupo: "Ombro",    ...ISOLADOR, seriesValidas: 3,    cue: "Carga principal. Sobe até a linha do ombro sem jogar no trapézio" },
    { nome: "Elevação lateral cabo",     grupo: "Ombro",    ...ISOLADOR, seriesValidas: 3,    cue: "Tensão contínua. Mesma linha do ombro, pico de contração no topo" },
    { nome: "Pull-around cabo",          grupo: "Costas",   ...ISOLADOR, seriesValidas: 3,    cue: "Braço semi-estendido, puxa para o quadril. Latíssimo baixo — v-taper" },
    { nome: "Crossover braço estendido", grupo: "Peitoral", ...ISOLADOR, seriesValidas: 3,    cue: "Polia alta fechando para baixo. Padrão de adução — pico no fechamento" },
    { nome: "Pulldown inclinado",        grupo: "Costas",   ...ISOLADOR,                      cue: "Braços quase estendidos, puxa da frente para a coxa. Alongamento máximo" },
    { nome: "Rosca scott",               grupo: "Braço",    ...ISOLADOR,                      cue: "Cotovelo fixo na mesa, amplitude completa. Porção curta com qualidade" },
    { nome: "Rosca martelo",             grupo: "Braço",    ...ISOLADOR,                      cue: "Pegada neutra. Braquial em foco. Controla a descida" },
    { nome: "Francês corda",             grupo: "Braço",    ...ISOLADOR,                      cue: "Cabeça longa. Cotovelos apontados para cima, amplitude máxima no alongamento" },
    { nome: "Rosca punho cabo",          grupo: "Braço",    ...ISOLADOR, seriesValidas: 3,    cue: "Flexores do antebraço. Enrola controlando amplitude completa" },
    { nome: "Abdômen cabo ajoelhado",    grupo: "Core",     ...ISOLADOR,                      cue: "Enrola o tronco com carga. Progressão de carga toda semana — encerra o Upper A" },
  ],

  "Lower B": [
    { nome: "Panturrilha leg press",    grupo: "Panturrilha",      ...ISOLADOR, seriesValidas: 3, cue: "Pirâmide. Gastrocnêmio com joelho estendido. Amplitude completa" },
    { nome: "Agachamento livre",        grupo: "Quadríceps",       ...COMPOSTO, seriesValidas: 3, cue: "PR work no top set. Descanso 3-4 min. Top set ×7, segunda ×7-8, deload 30% ×10" },
    { nome: "Cadeira flexora deitado",  grupo: "Posterior/Glúteo", ...ISOLADOR, seriesValidas: 3, cue: "Fecha sem tirar o quadril. Entra antes do stiff — posterior pré-ativado" },
    { nome: "Stiff",                    grupo: "Posterior/Glúteo", ...ISOLADOR,                   cue: "Técnica controlada. Quadril para trás, pausa no alongamento embaixo" },
    { nome: "Adutor máquina",           grupo: "Posterior/Glúteo", ...ISOLADOR, seriesValidas: 3, cue: "Segunda sessão de adutor na semana. Fecha com controle" },
    { nome: "Cadeira extensora",        grupo: "Quadríceps",       ...ISOLADOR, seriesValidas: 3, cue: "Extensão completa com pico de contração" },
  ],

  "Upper B": [
    { nome: "Remada cabo sentado triângulo", grupo: "Costas",   ...ISOLADOR,                   cue: "PR work fresco. Polia baixa, puxa pro bolso. Cotovelo rente à pelve — lat em foco" },
    { nome: "Elevação lateral livre",        grupo: "Ombro",    ...ISOLADOR, seriesValidas: 3, cue: "2ª sessão semanal. Carga principal. 12 séries deltóide médio no total" },
    { nome: "Elevação lateral cabo",         grupo: "Ombro",    ...ISOLADOR, seriesValidas: 3, cue: "2ª sessão semanal. Tensão contínua pelo cabo" },
    { nome: "Remada unilateral apoiada",     grupo: "Costas",   ...ISOLADOR,                   cue: "Cotovelo rente ao corpo em direção ao quadril. Lombar fora. Componente de lat" },
    { nome: "Desenvolvimento máquina",       grupo: "Ombro",    ...ISOLADOR,                   cue: "Empurra sem subir trapézio. Entra antes da remada e do supino" },
    { nome: "Supino reto barra",             grupo: "Peitoral", ...ISOLADOR,                   cue: "Carga mais baixa — técnico, não PR. Melhora técnica e volume do peito" },
    { nome: "Barra fixa pronada",            grupo: "Costas",   ...COMPOSTO, seriesValidas: 3, cue: "3 séries pendurado ~1 min. Use straps. Progressão de carga leve — alongamento máximo do lat" },
    { nome: "Rosca Bayesian",                grupo: "Braço",    ...ISOLADOR,                   cue: "Braço atrás do corpo, porção longa em alongamento máximo. Controla a descida" },
    { nome: "Tríceps Pulley",                 grupo: "Braço",    ...ISOLADOR,                   cue: "PRIMEIRO — mais carga. PR work aqui. Cotovelos baixos e fixos. Medial em foco" },
    { nome: "Francês corda",                 grupo: "Braço",    ...ISOLADOR,                   cue: "Cabeça longa. Cotovelos apontados para cima, amplitude máxima no alongamento" },
    { nome: "Rosca inversa",                 grupo: "Braço",    ...ISOLADOR, seriesValidas: 3, cue: "Pegada pronada. Extensores do antebraço em foco. Amplitude completa" },
    { nome: "Abdômen cabo ajoelhado",        grupo: "Core",     ...ISOLADOR,                   cue: "Enrola o tronco com carga. Progressão de carga toda semana — encerra o Upper B" },
  ],

};

export const SESSOES_LABELS: SessaoTipo[] = [
  "Upper A",
  "Upper B",
  "Lower A",
  "Lower B",
];
