import React, { useState } from "react";

interface CicloCardProps {
  ciclo: string;
  percentual: string;
  reps: string;
  objetivo: string;
  onSave: (novoRegistro: {
    data: string;
    pesos: string[];
    reps: string[];
    obs: string;
    exercicio: string;
  }) => void;
  value?: string | number | undefined; // Specify the expected types
}

export const CicloCard: React.FC<CicloCardProps> = ({
  ciclo,
  percentual,
  reps,
  objetivo,
  onSave,
}) => {
  const dataAtual = new Date().toLocaleDateString("pt-BR");
  const [salvando, setSalvando] = useState(false);

  // 👉 Estados internos por card
  const [pesos, setPesos] = useState<string[]>(["", "", ""]);
  const [repeticoes, setRepeticoes] = useState<string[]>(["", "", ""]);
  const [obs, setObs] = useState<string>("");

  const handleArrayChange = (
    campo: "pesos" | "reps",
    index: number,
    valor: string
  ) => {
    if (campo === "pesos") {
      const atualizados = [...pesos];
      atualizados[index] = valor;
      setPesos(atualizados);
    } else {
      const atualizados = [...repeticoes];
      atualizados[index] = valor;
      setRepeticoes(atualizados);
    }
  };

  const salvar = () => {
    const pesosLimpos = pesos.map((p) => p.trim());
    const repsLimpos = repeticoes.map((r) => r.trim());
    const obsLimpo = obs.trim();

    const isVazio =
      pesosLimpos.every((p) => p === "") &&
      repsLimpos.every((r) => r === "") &&
      obsLimpo === "";

    if (isVazio) {
      console.warn("🚫 Registro ignorado: todos os campos estão vazios.");
      return;
    }

    const novoRegistro = {
      data: dataAtual,
      pesos: pesosLimpos,
      reps: repsLimpos,
      obs: obsLimpo,
      exercicio: objetivo,
    };

    // Salvar no localStorage
    const dadosTreino = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
    const nomeExercicio = "Agachamento";
    if (!dadosTreino[nomeExercicio]) dadosTreino[nomeExercicio] = {};
    dadosTreino[nomeExercicio][ciclo] = novoRegistro;
    localStorage.setItem("dadosTreino", JSON.stringify(dadosTreino));

    // Limpa campos
    setPesos(["", "", ""]);
    setRepeticoes(["", "", ""]);
    setObs("");
    setSalvando(true);
    setTimeout(() => setSalvando(false), 1000);

    onSave(novoRegistro);
  };

  const cicloTitulo = `📊 ${ciclo} | ⚡ ${percentual} | 🔁 ${reps} | 🎯 ${objetivo}`;

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "16px",
        borderRadius: "10px",
        marginBottom: "16px",
        background: "#fff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ fontWeight: "bold", fontSize: "15px", marginBottom: "6px" }}>
        {cicloTitulo}
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <input
            type="number"
            placeholder={`Peso ${i + 1} (kg)`}
            value={pesos[i]}
            onChange={(e) => handleArrayChange("pesos", i, e.target.value)}
            style={{
              width: "48%",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="number"
            placeholder={`Reps ${i + 1}`}
            value={repeticoes[i]}
            onChange={(e) => handleArrayChange("reps", i, e.target.value)}
            style={{
              width: "48%",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
        </div>
      ))}

      <input
        type="text"
        placeholder="Observações"
        value={obs}
        onChange={(e) => setObs(e.target.value)}
        style={{
          width: "100%",
          padding: "8px",
          marginBottom: "10px",
          borderRadius: "6px",
          border: "1px solid #ccc",
        }}
      />

      <div style={{ fontSize: "11px", textAlign: "right", color: "#999", marginBottom: "10px" }}>
        {dataAtual}
      </div>

      <button
        onClick={salvar}
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: salvando ? "#28a745" : "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          fontWeight: "bold",
          fontSize: "14px",
          cursor: "pointer",
        }}
      >
        {salvando ? "✔️ Salvo!" : "Salvar"}
      </button>
    </div>
  );
};
