import { useState } from "react";
import { fetchExerciseGif } from "../../services/exerciseDbService";

type GifState = "idle" | "loading" | "loaded" | "error";

export function ExerciseGif({ exerciseName }: { exerciseName: string }) {
  const [gifState, setGifState] = useState<GifState>("idle");
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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

  function openModal() {
    setModalOpen(true);
    if (gifState === "idle") load();
  }

  function closeModal() {
    setModalOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
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
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 10 }}>▶</span>
        Ver demonstração
      </button>

      {modalOpen && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 18,
              padding: "14px 14px 18px",
              width: "min(320px, 90vw)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#111827", flex: 1, paddingRight: 8 }}>
                {exerciseName}
              </p>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  background: "#f3f4f6",
                  border: "none",
                  borderRadius: 8,
                  width: 28,
                  height: 28,
                  fontSize: 14,
                  cursor: "pointer",
                  color: "#6b7280",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div style={{ borderRadius: 12, overflow: "hidden", background: "#f5f6fa", minHeight: 100 }}>
              {gifState === "loading" && (
                <p style={{ fontSize: 12, color: "#6b7280", textAlign: "center", padding: "40px 0", margin: 0 }}>
                  Carregando...
                </p>
              )}
              {gifState === "error" && (
                <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "40px 0", margin: 0 }}>
                  Demonstração não disponível
                </p>
              )}
              {gifState === "loaded" && gifUrl && (
                <img
                  src={gifUrl}
                  alt={`Demonstração: ${exerciseName}`}
                  style={{ width: "100%", display: "block" }}
                />
              )}
            </div>

            <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", margin: "10px 0 0" }}>
              Toque fora para fechar
            </p>
          </div>
        </div>
      )}
    </>
  );
}
