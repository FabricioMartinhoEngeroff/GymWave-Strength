import { useState } from "react";
import { fetchExerciseGif } from "../../services/exerciseDbService";

type GifState = "idle" | "loading" | "loaded" | "error";

export function ExerciseGif({ exerciseName }: { exerciseName: string }) {
  const [gifState, setGifState] = useState<GifState>("idle");
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function load() {
    setGifState("loading");
    try {
      const url = await fetchExerciseGif(exerciseName);
      if (url) {
        setGifUrl(url);
        setGifState("loaded");
      } else {
        setGifState("error");
      }
    } catch {
      setGifState("error");
    }
  }

  function toggle() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && gifState === "idle") load();
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <button
        type="button"
        onClick={toggle}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          fontSize: 12,
          color: "#2563eb",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <span style={{ fontSize: 10 }}>{open ? "▲" : "▶"}</span>
        {open ? "Fechar demonstração" : "Ver demonstração"}
      </button>

      {open && (
        <div style={{ marginTop: 8, borderRadius: 10, overflow: "hidden", background: "#f5f6fa" }}>
          {gifState === "loading" && (
            <p style={{ fontSize: 12, color: "#6b7280", textAlign: "center", padding: "16px 0", margin: 0 }}>
              Carregando...
            </p>
          )}
          {gifState === "error" && (
            <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "12px 0", margin: 0 }}>
              Demonstração não disponível
            </p>
          )}
          {gifState === "loaded" && gifUrl && (
            <img
              src={gifUrl}
              alt={`Demonstração: ${exerciseName}`}
              style={{ width: "100%", display: "block", borderRadius: 10 }}
            />
          )}
        </div>
      )}
    </div>
  );
}
