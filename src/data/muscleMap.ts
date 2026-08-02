/** Maps each exercise name to one of the 8 display muscle groups for volume load grouping. */
export const MUSCLE_MAP: Record<string, string> = {

  // ── Peitoral ──────────────────────────────────────────────────────────────
  "Supino reto barra":                "Peitoral",
  "Supino halteres amplitude":        "Peitoral",
  "Crossover braço estendido":        "Peitoral",

  // ── Costas ────────────────────────────────────────────────────────────────
  "Barra fixa":               "Costas",
  "Puxada triângulo":                 "Costas",
  "Pull-around":                      "Costas",
  "Remada peito apoiado":             "Costas",
  "Remada baixa":    "Costas",
  "Remada unilateral apoiada":        "Costas",

  // ── Ombro ─────────────────────────────────────────────────────────────────
  "Elevação lateral livre":           "Ombro",
  "Elevação lateral cabo":            "Ombro",
  "Desenvolvimento máquina":          "Ombro",

  // ── Quadríceps ────────────────────────────────────────────────────────────
  "Agachamento livre":                "Quadríceps",
  "Cadeira extensora":                "Quadríceps",
  "Afundo no Smith":                  "Quadríceps",

  // ── Posterior/Glúteo ──────────────────────────────────────────────────────
  "Terra sumô":                       "Posterior/Glúteo",
  "Stiff":                            "Posterior/Glúteo",
  "Stiff perna reta":                 "Posterior/Glúteo",
  "Elevação pélvica":                 "Posterior/Glúteo",
  "Cadeira flexora sentada":          "Posterior/Glúteo",
  "Mesa flexora":          "Posterior/Glúteo",
  "Cadeira flexora unilateral":       "Posterior/Glúteo",
  "Adutor":                           "Posterior/Glúteo",
  "Abdutora":                         "Posterior/Glúteo",
  "Coice no cross joelho estendido":  "Posterior/Glúteo",
  "Coice no cross joelho dobrado":    "Posterior/Glúteo",

  // ── Panturrilha ───────────────────────────────────────────────────────────
  "Panturrilha em pé":                "Panturrilha",
  "Panturrilha sentado":              "Panturrilha",
  "Panturrilha leg press":            "Panturrilha",

  // ── Braço ─────────────────────────────────────────────────────────────────
  // Tríceps
  "Tríceps polia barra reta":         "Braço",
  "Tríceps testa halteres":           "Braço",
  "Tríceps polia unilateral":         "Braço",
  "Tríceps Francês":                    "Braço",
  "Pulley barra reta pronada":        "Braço",
  "Tríceps Pulley":                   "Braço",
  "Pulley corda":                     "Braço",
  // Bíceps
  "Rosca Bayesian":                   "Braço",
  "Rosca scott":                      "Braço",
  "Rosca martelo":                    "Braço",
  "Martelo corda":                    "Braço",
  "Rosca inclinada 45°":              "Braço",
  "Rosca scott unilateral":           "Braço",
  "Rosca polia alta":                 "Braço",
  "Rosca direta na polia baixa":      "Braço",
  "Rosca inversa":                    "Braço",
  // Antebraço
  "Antebraço invertido":              "Braço",
  "Antebraço rola palma":             "Braço",
  "Rolar barra cabo":                 "Braço",
  "Rosca punho":                      "Braço",

  // ── Core ──────────────────────────────────────────────────────────────────
  "Abdômen cabo ajoelhado":           "Core",
  "Abdômen infra pendurado":          "Core",
  "Abdômen infra banco":              "Core",
};
