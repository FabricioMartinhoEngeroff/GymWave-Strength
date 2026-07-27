const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY as string;
const RAPIDAPI_HOST = "exercisedb.p.rapidapi.com";
const BASE_URL = "https://exercisedb.p.rapidapi.com";

const NAME_MAP: Record<string, string> = {
  "Supino reto barra": "barbell bench press",
  "Supino halteres amplitude": "dumbbell fly",
  "Crossover braço estendido": "cable crossover",
  "Barra fixa pronada": "pull up",
  "Puxada triângulo": "cable pulldown",
  "Pull-around cabo": "cable pullover",
  "Pulldown inclinado": "cable pulldown",
  "Remada peito apoiado": "incline row",
  "Desenvolvimento máquina": "machine shoulder press",
  "Elevação lateral livre": "dumbbell lateral raise",
  "Elevação lateral cabo": "cable lateral raise",
  "Agachamento livre": "barbell squat",
  "Cadeira extensora": "leg extension",
  "Terra sumô": "sumo deadlift",
  "Stiff": "romanian deadlift",
  "Elevação pélvica máquina": "barbell hip thrust",
  "Cadeira flexora sentada": "seated leg curl",
  "Cadeira flexora deitado": "lying leg curl",
  "Adutor máquina": "hip adduction",
  "Panturrilha em pé": "standing calf raise",
  "Panturrilha sentado": "seated calf raise",
  "Panturrilha leg press": "leg press calf raise",
  "Tríceps testa halteres": "dumbbell triceps extension",
  "Tríceps polia barra reta": "cable triceps pushdown",
  "Tríceps polia unilateral": "cable one arm triceps pushdown",
  "Rosca inclinada 45°": "incline dumbbell curl",
  "Rosca scott unilateral": "preacher curl",
  "Rosca polia alta": "cable curl",
  "Rosca inversa": "reverse curl",
  "Rolar barra cabo": "cable crunch",
  "Abdômen cabo ajoelhado": "cable crunch",
  "Abdômen infra pendurado": "hanging leg raise",
  "Abdômen infra banco": "decline crunch",
};

function headers() {
  return { "X-RapidAPI-Key": RAPIDAPI_KEY, "X-RapidAPI-Host": RAPIDAPI_HOST };
}

// In-memory cache — survives navigation within the session, cleared on page reload.
const gifCache = new Map<string, string>();

export async function fetchExerciseGif(portugueseName: string): Promise<string | null> {
  if (gifCache.has(portugueseName)) return gifCache.get(portugueseName)!;

  const searchTerm = NAME_MAP[portugueseName];
  if (!searchTerm || !RAPIDAPI_KEY) return null;

  const searchRes = await fetch(
    `${BASE_URL}/exercises/name/${encodeURIComponent(searchTerm)}?limit=1&offset=0`,
    { headers: headers() }
  );
  if (!searchRes.ok) return null;

  const searchData = await searchRes.json();
  const exercises: Array<Record<string, unknown>> = Array.isArray(searchData)
    ? searchData
    : Array.isArray(searchData?.data)
    ? searchData.data
    : [];

  // The ExerciseDB API returns gifUrl directly in the search result — a stable
  // https:// CDN URL that works on all platforms (no blob URL needed).
  const gifUrl = (exercises[0]?.gifUrl as string) || null;
  if (gifUrl) gifCache.set(portugueseName, gifUrl);
  return gifUrl;
}
