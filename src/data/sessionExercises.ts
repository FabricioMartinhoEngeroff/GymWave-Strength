export type SessaoTipo = "Upper A" | "Lower A" | "Upper B" | "Lower B" | "Braço";

export interface ExercicioSessao {
  nome: string;
  musculo: string;
}

export const SESSOES: Record<SessaoTipo, ExercicioSessao[]> = {
  "Upper A": [
    { nome: "Supino Reto", musculo: "peitoral" },
    { nome: "Voador Peck Deck / máquina", musculo: "peitoral médio" },
    { nome: "Crossover no cabo", musculo: "peitoral" },
    { nome: "Puxada na Frente", musculo: "costas" },
    { nome: "Remada Curvada", musculo: "costas" },
    { nome: "Desenvolvimento livre/maquina", musculo: "deltóide anterior" },
    { nome: "Desenvolvimento Lateral livre", musculo: "deltóide médio" },
    { nome: "Desenvolvimento Lateral cabo", musculo: "deltóide médio" },
  ],
  "Lower A": [
    { nome: "Agachamento", musculo: "quadríceps + glúteo" },
    { nome: "Cadeira Extensora", musculo: "quadríceps" },
    { nome: "Cadeira/Mesa Flexora", musculo: "bíceps femoral" },
    { nome: "Elevação Pélvica", musculo: "glúteo" },
    { nome: "Stiff", musculo: "posterior + lombar" },
    { nome: "Panturrilha Leg Press", musculo: "panturrilha" },
    { nome: "Abdução máquina (abrir as pernas)", musculo: "glúteo médio" },
    { nome: "Adutor máquina (fechar as pernas)", musculo: "adutor" },
  ],
  "Upper B": [
    { nome: "Barra fixa", musculo: "costas" },
    { nome: "Remada apoiada no peito", musculo: "costas" },
    { nome: "remada livre", musculo: "costas" },
    { nome: "pulldown cabo", musculo: "costas" },
    { nome: "Supino Reto", musculo: "peitoral" },
    { nome: "Desenvolvimento Lateral livre", musculo: "deltóide médio" },
    { nome: "Desenvolvimento Lateral cabo", musculo: "deltóide médio" },
    { nome: "Desenvolvimento livre/maquina", musculo: "deltóide anterior" },
  ],
  "Lower B": [
    { nome: "Levantamento Terra", musculo: "posterior + costas" },
    { nome: "Agachamento", musculo: "quadríceps" },
    { nome: "Cadeira/Mesa Flexora", musculo: "bíceps femoral" },
    { nome: "Cadeira Extensora", musculo: "quadríceps" },
    { nome: "Elevação Pélvica", musculo: "glúteo" },
    { nome: "Panturrilha sentado", musculo: "sóleo" },
    { nome: "Adutor máquina (fechar as pernas)", musculo: "adutor" },
    { nome: "Abdução máquina (abrir as pernas)", musculo: "glúteo médio" },
  ],
  "Braço": [
    { nome: "Bíceps Halteres/Polia", musculo: "bíceps" },
    { nome: "Rosca Scott unilateral", musculo: "bíceps braquial" },
    { nome: "Tríceps Polia", musculo: "tríceps" },
    { nome: "Abdômen no cabo", musculo: "abdômen" },
  ],
};

export const SESSOES_LABELS: SessaoTipo[] = [
  "Upper A",
  "Lower A",
  "Upper B",
  "Lower B",
  "Braço",
];
