import React from "react";

interface CicloCardProps {
  ciclo: string;
  percentual: string;
  reps: string;
  objetivo: string;
  value: { peso?: string; obs?: string; data?: string };
  onChange: (campo: string, valor: string) => void;
}

export const CicloCard: React.FC<CicloCardProps> = ({
  ciclo,
  percentual,
  reps,
  objetivo,
  value,
  onChange
}) => {
  const dataAtual = new Date().toLocaleDateString("pt-BR");

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "12px",
        borderRadius: "8px",
        marginBottom: "12px",
        background: "#fff",
      }}
    >
      <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "4px" }}>
        {ciclo} - {percentual} - {reps} reps
      </div>
      <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
        {objetivo}
      </div>
      <input
        type="number"
        placeholder="Carga (kg)"
        style={{
          width: "100%",
          padding: "6px",
          marginBottom: "8px",
          borderRadius: "4px",
          border: "1px solid #ccc"
        }}
        value={value.peso || ""}
        onChange={(e) => onChange("peso", e.target.value)}
      />
      <input
        type="text"
        placeholder="Observações"
        style={{
          width: "100%",
          padding: "6px",
          marginBottom: "8px",
          borderRadius: "4px",
          border: "1px solid #ccc"
        }}
        value={value.obs || ""}
        onChange={(e) => onChange("obs", e.target.value)}
      />
      <div style={{ fontSize: "10px", textAlign: "right", color: "#999" }}>
        {dataAtual}
      </div>
    </div>
  );
};