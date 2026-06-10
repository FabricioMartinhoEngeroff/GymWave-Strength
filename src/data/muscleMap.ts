/** Maps each exercise name to one of the 8 display muscle groups for volume load grouping. */
export const MUSCLE_MAP: Record<string, string> = {

  // ── Peitoral ──────────────────────────────────────────────────────────────
  "Supino Reto":                        "Peitoral",
  "supino reto barra":                  "Peitoral",
  "supino halteres":                    "Peitoral",
  "Voador Peck Deck / máquina":         "Peitoral",
  "Crossover no cabo":                  "Peitoral",
  "crossover braço estendido":          "Peitoral",

  // ── Costas ────────────────────────────────────────────────────────────────
  "Barra fixa":                         "Costas",
  "Puxada na Frente":                   "Costas",
  "pulldown cabo":                      "Costas",
  "Remada apoiada no peito":            "Costas",
  "Remada Curvada":                     "Costas",
  "remada livre":                       "Costas",
  "puxada triângulo":                   "Costas",
  "pull-around cabo":                   "Costas",
  "pulldown braço estendido":           "Costas",
  "remada peito apoiado":               "Costas",

  // ── Ombro ─────────────────────────────────────────────────────────────────
  "Desenvolvimento Lateral cabo":       "Ombro",
  "Desenvolvimento Lateral livre":      "Ombro",
  "Desenvolvimento livre/maquina":      "Ombro",
  "elevação lateral livre":             "Ombro",
  "elevação lateral cabo":              "Ombro",
  "desenvolvimento máquina":            "Ombro",

  // ── Quadríceps ────────────────────────────────────────────────────────────
  "Agachamento":                        "Quadríceps",
  "Cadeira Extensora":                  "Quadríceps",
  "Panturrilha Leg Press":              "Quadríceps",
  "agachamento livre":                  "Quadríceps",
  "cadeira extensora":                  "Quadríceps",
  "panturrilha no leg press":           "Quadríceps",

  // ── Posterior/Glúteo ──────────────────────────────────────────────────────
  "Levantamento Terra":                 "Posterior/Glúteo",
  "Elevação Pélvica":                   "Posterior/Glúteo",
  "Stiff":                              "Posterior/Glúteo",
  "Cadeira/Mesa Flexora":               "Posterior/Glúteo",
  "Abdução máquina (abrir as pernas)":  "Posterior/Glúteo",
  "Adutor máquina (fechar as pernas)":  "Posterior/Glúteo",
  "terra sumô":                         "Posterior/Glúteo",
  "stiff":                              "Posterior/Glúteo",
  "cadeira flexora sentada":            "Posterior/Glúteo",
  "cadeira flexora deitado":            "Posterior/Glúteo",
  "elevação pélvica máquina":           "Posterior/Glúteo",

  // ── Panturrilha ───────────────────────────────────────────────────────────
  "Panturrilha no Smith":               "Panturrilha",
  "Panturrilha sentado":                "Panturrilha",
  "panturrilha sentado máquina":        "Panturrilha",
  "panturrilha em pé":                  "Panturrilha",
  "panturrilha unilateral no degrau":   "Panturrilha",

  // ── Braço ─────────────────────────────────────────────────────────────────
  "Bíceps Halteres/Polia":              "Braço",
  "Rosca Scott unilateral":             "Braço",
  "Tríceps Polia":                      "Braço",
  "rosca scott":                        "Braço",
  "rosca inclinada halteres":           "Braço",
  "rosca bayesian":                     "Braço",
  "rosca polia alta":                   "Braço",
  "martelo":                            "Braço",
  "rosca inversa":                      "Braço",
  "rolar barra no cabo":                "Braço",
  "tríceps testa halteres":             "Braço",
  "tríceps polia barra reta":           "Braço",
  "tríceps polia alta unilateral":      "Braço",
  "francês corda":                      "Braço",
  "pulley barra reta":                  "Braço",
  "pulley corda":                       "Braço",

  // ── Core ──────────────────────────────────────────────────────────────────
  "Abdômen no cabo":                    "Core",
  "abdômen infra pendurado":            "Core",
  "abdômen cabo ajoelhado":             "Core",
  "abdômen infra banco inclinado":      "Core",
};
