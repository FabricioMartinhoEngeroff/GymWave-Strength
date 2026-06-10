/** Maps each exercise name to a display muscle group for volume load grouping. */
export const MUSCLE_MAP: Record<string, string> = {
  // Lower
  "Agachamento": "Quadríceps",
  "Levantamento Terra": "Posterior",
  "Elevação Pélvica": "Glúteo",
  "Stiff": "Posterior",
  "Cadeira/Mesa Flexora": "Posterior",
  "Cadeira Extensora": "Quadríceps",
  "Abdução máquina (abrir as pernas)": "Glúteo médio",
  "Adutor máquina (fechar as pernas)": "Adutor",
  "Panturrilha Leg Press": "Panturrilha",
  "Panturrilha no Smith": "Panturrilha",
  "Panturrilha sentado": "Panturrilha",

  // Back
  "Barra fixa": "Costas",
  "Puxada na Frente": "Costas",
  "pulldown cabo": "Costas",
  "Remada apoiada no peito": "Costas",
  "Remada Curvada": "Costas",
  "remada livre": "Costas",

  // Chest
  "Supino Reto": "Peito",
  "Voador Peck Deck / máquina": "Peito",
  "Crossover no cabo": "Peito",

  // Shoulders
  "Desenvolvimento Lateral cabo": "Deltóide médio",
  "Desenvolvimento Lateral livre": "Deltóide médio",
  "Desenvolvimento livre/maquina": "Deltóide anterior",

  // Arms
  "Bíceps Halteres/Polia": "Bíceps",
  "Rosca Scott unilateral": "Bíceps",
  "Tríceps Polia": "Tríceps",

  // Core
  "Abdômen no cabo": "Core",
};
