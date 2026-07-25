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
// Stores object URLs (blob://...) for images fetched as binary.
const gifCache = new Map<string, string>();

export async function fetchExerciseGif(portugueseName: string): Promise<string | null> {
  if (gifCache.has(portugueseName)) return gifCache.get(portugueseName)!;

  const searchTerm = NAME_MAP[portugueseName];
  if (!searchTerm || !RAPIDAPI_KEY) return null;

  // Step 1 — search by name to get the exercise ID
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

  const exerciseId = exercises[0]?.id as string | undefined;
  if (!exerciseId) return null;

  // Step 2 — fetch image by exercise ID (getExerciseImage endpoint)
  const imageRes = await fetch(
    `${BASE_URL}/image?exerciseId=${exerciseId}&resolution=180`,
    { headers: headers() }
  );
  if (!imageRes.ok) return null;

  let gifUrl: string | null = null;
  const contentType = imageRes.headers.get("content-type") ?? "";

  if (contentType.startsWith("image/")) {
    // Endpoint returns the binary image directly — wrap in object URL
    const blob = await imageRes.blob();
    gifUrl = URL.createObjectURL(blob);
  } else {
    // Endpoint returns JSON with a URL field
    const imageData = await imageRes.json();
    gifUrl =
      (imageData?.url as string) ||
      (imageData?.gifUrl as string) ||
      (imageData?.image as string) ||
      null;
  }

  if (gifUrl) gifCache.set(portugueseName, gifUrl);
  return gifUrl;
}
