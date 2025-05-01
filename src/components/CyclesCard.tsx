import React, { useState } from "react";

interface CicloCardProps {
  ciclo: string;
  percentual: string;
  reps: string;
  objetivo: string; // ➕ Novo campo para exibir abaixo do título
  value: {
    pesos?: string[];
    reps?: string[];
    obs?: string;
  };
  onChange: (campo: "pesos" | "reps" | "obs", valor: string | string[], index?: number) => void;
  onSave: (novoRegistro: {
    data: string;
    pesos: string[];
    reps: string[];
    obs: string;
    exercicio: string;
  }) => void;
}

export const CicloCard: React.FC<CicloCardProps> = ({
  ciclo,
  percentual,
  reps,
  objetivo,
  value,
  onChange,
  onSave,
}) => {
  const dataAtual = new Date().toLocaleDateString("pt-BR");
  const [salvando, setSalvando] = useState(false);

  const handleArrayChange = (campo: "pesos" | "reps", index: number, valor: string) => {
    const updatedArray = [...(value[campo] || ["", "", ""])];
    updatedArray[index] = valor;
    onChange(campo, updatedArray, index);
  };

  const salvarNoLocalStorage = () => {
    const pesosPadronizados = (value.pesos || ["", "", ""]).map(p => p.trim());
    const repsPadronizados = (value.reps || ["", "", ""]).map(r => r.trim());
    const obsLimpo = value.obs?.trim() || "";

    const isTudoVazio =
      pesosPadronizados.every(p => p === "") &&
      repsPadronizados.every(r => r === "") &&
      obsLimpo === "";

    if (isTudoVazio) {
      console.warn("🚫 Registro ignorado: todos os campos estão vazios.");
      return;
    }

    const novoRegistro = {
      data: dataAtual,
      pesos: pesosPadronizados,
      reps: repsPadronizados,
      obs: obsLimpo,
      exercicio: objetivo,
    };

    const dadosTreino = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
    const nomeExercicio = "Agachamento"; // ⚠️ Substitua depois por prop dinâmica se necessário
    if (!dadosTreino[nomeExercicio]) dadosTreino[nomeExercicio] = {};
    dadosTreino[nomeExercicio][ciclo] = novoRegistro;

    localStorage.setItem("dadosTreino", JSON.stringify(dadosTreino));
    onChange("pesos", ["", "", ""]);
    onChange("reps", ["", "", ""]);
    onChange("obs", "");
    setSalvando(true);
    setTimeout(() => setSalvando(false), 1000);
    onSave(novoRegistro);
  };

  // 🔠 Título do ciclo com ícones
  const cicloTitulo = `📊 ${ciclo} | ⚡ ${percentual} | 🔁 ${reps} | 🎯 ${objetivo} `;

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
      {/* 🏷️ Linha principal com ciclo + percentual + repetições */}
      <div style={{ fontWeight: "bold", fontSize: "15px", marginBottom: "6px" }}>
        {cicloTitulo}
      </div>

      {/* Inputs de pesos e repetições */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <input
            type="number"
            placeholder={`Peso ${i + 1} (kg)`}
            value={value.pesos?.[i] || ""}
            onChange={(e) => handleArrayChange("pesos", i, e.target.value)}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="number"
            placeholder={`Reps ${i + 1}`}
            value={value.reps?.[i] || ""}
            onChange={(e) => handleArrayChange("reps", i, e.target.value)}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
        </div>
      ))}

      {/* Campo de observações */}
      <input
        type="text"
        placeholder="Observações"
        value={value.obs || ""}
        onChange={(e) => onChange("obs", e.target.value)}
        style={{
          width: "100%",
          padding: "8px",
          marginBottom: "10px",
          borderRadius: "6px",
          border: "1px solid #ccc",
        }}
      />

      {/* Data da entrada */}
      <div style={{ fontSize: "11px", textAlign: "right", color: "#999", marginBottom: "10px" }}>
        {dataAtual}
      </div>

      {/* Botão de salvar */}
      <button
        onClick={salvarNoLocalStorage}
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
