import { useEffect, useState } from "react";
import { carregarDados } from "../utils/storage";
import { DadosTreino } from "../types/TrainingData";
import { CICLOS } from "../data/cycles";
import { Search } from "lucide-react";

interface LinhaRelatorio {
  data: string;
  exercicio: string;
  ciclo: string;
  series: {
    serie: number;
    rep: string;
    peso: string;
  }[];
  obs?: string;
}

export default function Report() {
  const [linhas, setLinhas] = useState<LinhaRelatorio[]>([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const bruto: DadosTreino = carregarDados();
    const geradas: LinhaRelatorio[] = [];

    Object.entries(bruto).forEach(([exercicio, ciclos]) => {
      Object.entries(ciclos).forEach(([ciclo, registro]) => {
        const { pesos = [], reps = [], obs = "", data = "" } = registro;

        const cicloId = ciclo.startsWith("Ciclo ") ? `C${ciclo.split(" ")[1]}` : ciclo;
        const cicloNome = CICLOS.find((c) => c.id === cicloId)?.titulo || "Ciclo não identificado";

        const series = reps.map((rep, index) => ({
          serie: index + 1,
          rep: rep || "-",
          peso: pesos[index] || "-",
        }));

        geradas.push({ data, exercicio, ciclo: cicloNome, series, obs });
      });
    });

    setLinhas(geradas);
  }, []);

  const linhasFiltradas = linhas.filter((linha) =>
    linha.exercicio.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", padding: "20px" }}>
      <h1 style={{
        textAlign: "center",
        fontSize: "24px",
        fontWeight: "bold",
        marginBottom: "24px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "10px"
      }}>
        📋 Relatório de Treinos
      </h1>

      {/* Campo de busca com estilo */}
      <div style={{ maxWidth: "500px", margin: "0 auto", position: "relative", marginBottom: "24px" }}>
        <Search size={20} style={{ position: "absolute", top: "10px", left: "12px", color: "#aaa" }} />
        <input
          type="text"
          placeholder="Buscar exercício..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px 10px 36px",
            borderRadius: "9999px",
            border: "1px solid #ccc",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}
        />
      </div>

      <div style={{ maxWidth: "500px", margin: "0 auto" }}>
        {linhasFiltradas.map((linha, idx) => (
          <div
            key={idx}
            style={{
              background: "#fff",
              padding: "16px",
              borderRadius: "12px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
              marginBottom: "20px",
              border: "1px solid #e2e8f0"
            }}
          >
            <p style={{ marginBottom: "6px", fontSize: "14px", color: "#444" }}>
              📅 <strong>Data:</strong> {linha.data}
            </p>
            <p style={{ marginBottom: "6px", fontSize: "14px", color: "#444" }}>
              🏋️ <strong>Exercício:</strong> {linha.exercicio}
            </p>
            <p style={{ marginBottom: "10px", fontSize: "14px", color: "#444" }}>
              📌 <strong>Ciclo:</strong> {linha.ciclo}
            </p>

            <p style={{ fontSize: "13px", marginBottom: "6px", color: "#888" }}>
              🎯 Série 🔁 Reps 🏋️ Peso
            </p>

            {linha.series.map((serie) => (
              <p
                key={serie.serie}
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  marginBottom: "6px",
                  fontSize: "14px",
                  color: "#333"
                }}
              >
                Série {serie.serie}: {serie.rep} reps x {serie.peso} kg
              </p>
            ))}

            {linha.obs && (
              <p style={{
                fontSize: "13px",
                color: "#555",
                borderTop: "1px solid #eee",
                marginTop: "12px",
                paddingTop: "10px"
              }}>
                📝 <strong>Observações:</strong> {linha.obs}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
