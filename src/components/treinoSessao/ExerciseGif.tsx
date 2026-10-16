import { useState } from "react";
import { fetchExerciseGif } from "../../services/exerciseDbService";
import { EXERCISE_VIDEOS } from "../../data/exerciseVideos";

type GifState = "idle" | "loading" | "loaded" | "error";

export function ExerciseGif({ exerciseName }: { exerciseName: string }) {
  const [gifState, setGifState] = useState<GifState>("idle");
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  // Guarda o nome do exercício que está tocando: ao trocar de exercício o bloco volta à miniatura.
  const [tocandoEm, setTocandoEm] = useState<string | null>(null);

  const youtubeId = EXERCISE_VIDEOS[exerciseName] || "";
  const hasVideo = youtubeId.length > 0;
  const tocando = hasVideo && tocandoEm === exerciseName;

  async function loadGif() {
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
    setTocandoEm(null); // só um player tocando por vez
    setModalOpen(true);
    if (!hasVideo && gifState === "idle") loadGif();
  }

  function closeModal() {
    setModalOpen(false);
  }

  const iconButton = {
    border: "none",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  } as const;

  return (
    <>
      {hasVideo ? (
        <section
          aria-label="Demonstração em vídeo"
          style={{
            background: "#f5f6fa",
            border: "0.5px solid rgba(0, 0, 0, 0.08)",
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 8,
          }}
        >
          {tocando ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&playsinline=1&rel=0`}
              title={`Demonstração: ${exerciseName}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ border: "none", display: "block", width: "100%", aspectRatio: "16 / 9" }}
            />
          ) : null}

          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 8 }}>
            {!tocando && (
              <img
                src={`https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`}
                alt={`Miniatura: ${exerciseName}`}
                loading="lazy"
                style={{ width: 80, height: 45, objectFit: "cover", borderRadius: 8, flexShrink: 0, background: "#e5e7eb" }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#111827" }}>Demonstração</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280" }}>
                {tocando ? "Tocando no bloco" : "Toque no play para assistir"}
              </p>
            </div>
            <button
              type="button"
              onClick={openModal}
              aria-label="Abrir em tela maior"
              title="Abrir em tela maior"
              style={{ ...iconButton, width: 32, height: 32, background: "#ffffff", color: "#6b7280", fontSize: 15 }}
            >
              ⛶
            </button>
            {!tocando && (
              <button
                type="button"
                onClick={() => setTocandoEm(exerciseName)}
                aria-label="Reproduzir demonstração"
                style={{ ...iconButton, width: 40, height: 40, background: "#2563eb", color: "#ffffff", fontSize: 14 }}
              >
                ▶
              </button>
            )}
          </div>
        </section>
      ) : (
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
      )}

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
            role="dialog"
            aria-modal="true"
            aria-label={exerciseName}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 18,
              padding: "14px 14px 18px",
              width: "min(360px, 90vw)",
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
                aria-label="Fechar demonstração"
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
              {hasVideo ? (
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title={`Demonstração: ${exerciseName}`}
                  width="100%"
                  height="200"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ border: "none", display: "block" }}
                />
              ) : (
                <>
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
                </>
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
