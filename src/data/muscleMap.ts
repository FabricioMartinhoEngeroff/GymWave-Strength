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
  "Francês corda":                    "Braço",
  // Bíceps
  "Rosca Bayesian":                   "Braço",
  "Rosca scott":                      "Braço",
  "Rosca polia unilateral":           "Braço",
  "Rosca martelo":                    "Braço",
  "Rosca polia alta":                 "Braço",
  // Antebraço
  "Antebraço invertido":              "Braço",
  "Antebraço rola palma":             "Braço",
  // Legacy — mantidos para compatibilidade com dados históricos
  "Tríceps polia unilateral":         "Braço",
  "Rosca inclinada 45°":              "Braço",
  "Rosca scott unilateral":           "Braço",
  "Rosca inversa":                    "Braço",
  "Rolar barra cabo":                 "Braço",

  // ── Core ──────────────────────────────────────────────────────────────────
  "Abdômen cabo ajoelhado":           "Core",
  "Abdômen infra pendurado":          "Core",
  "Abdômen infra banco":              "Core",
};
