/** Maps each exercise name to one of the 8 display muscle groups for volume load grouping. */
export const MUSCLE_MAP: Record<string, string> = {

  // ── Peitoral ──────────────────────────────────────────────────────────────
  "Supino reto barra":                "Peitoral",
  "Supino halteres amplitude":        "Peitoral",
  "Crossover braço estendido":        "Peitoral",

  // ── Costas ────────────────────────────────────────────────────────────────
  "Barra fixa pronada":               "Costas",
  "Puxada triângulo":                 "Costas",
  "Pull-around cabo":                 "Costas",
  "Pulldown inclinado":               "Costas",
  "Remada peito apoiado":             "Costas",
  "Remada cabo sentado triângulo":    "Costas",
  "Remada unilateral apoiada":        "Costas",

  // ── Ombro ─────────────────────────────────────────────────────────────────
  "Elevação lateral livre":           "Ombro",
  "Elevação lateral cabo":            "Ombro",
  "Desenvolvimento máquina":          "Ombro",

  // ── Quadríceps ────────────────────────────────────────────────────────────
  "Agachamento livre":                "Quadríceps",
  "Cadeira extensora":                "Quadríceps",

  // ── Posterior/Glúteo ──────────────────────────────────────────────────────
  "Terra sumô":                       "Posterior/Glúteo",
  "Stiff":                            "Posterior/Glúteo",
  "Elevação pélvica máquina":         "Posterior/Glúteo",
  "Cadeira flexora sentada":          "Posterior/Glúteo",
  "Cadeira flexora deitado":          "Posterior/Glúteo",
  "Adutor máquina":                   "Posterior/Glúteo",

  // ── Panturrilha ───────────────────────────────────────────────────────────
  "Panturrilha em pé":                "Panturrilha",
  "Panturrilha sentado":              "Panturrilha",
  "Panturrilha leg press":            "Panturrilha",

  // ── Braço ─────────────────────────────────────────────────────────────────
  // Tríceps
  "Tríceps polia barra reta":         "Braço",
  "Tríceps testa halteres":           "Braço",
  "Tríceps polia unilateral":         "Braço",
  "Francês corda":                    "Braço",
  "Pulley barra reta pronada":        "Braço",
  "Polia barra reta pronada":         "Braço",
  "Pulley corda":                     "Braço",
  // Bíceps
  "Rosca Bayesian":                   "Braço",
  "Rosca scott":                      "Braço",
  "Rosca martelo":                    "Braço",
  "Martelo corda":                    "Braço",
  "Rosca inclinada 45°":              "Braço",
  "Rosca scott unilateral":           "Braço",
  "Rosca polia alta":                 "Braço",
  "Rosca inversa":                    "Braço",
  // Antebraço
  "Antebraço invertido":              "Braço",
  "Antebraço rola palma":             "Braço",
  "Rolar barra cabo":                 "Braço",
  "Rosca punho cabo":                 "Braço",

  // ── Core ──────────────────────────────────────────────────────────────────
  "Abdômen cabo ajoelhado":           "Core",
  "Abdômen infra pendurado":          "Core",
  "Abdômen infra banco":              "Core",
};
