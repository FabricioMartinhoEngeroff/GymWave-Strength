// Componente CicloCard com seleção de exercício em botão e correção do placeholder duplicado no select
import React, { useState, useEffect } from "react";
import { EXERCICIOS } from "../data/exercise";

interface CicloCardProps {
  ciclo: string;
  percentual: string;
  reps: string;
  value?: {
    data?: string;
    pesos?: string[];
    reps?: string[];
    obs?: string;
    exercicio?: string;
  };
  onChange?: (
    campo: "pesos" | "reps" | "obs",
    valor: string,
    index?: number
  ) => void;
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
  value,
  onSave,
}) => {
  const dataAtual = new Date().toLocaleDateString("pt-BR");

  const [salvando, setSalvando] = useState(false);
  const [pesos, setPesos] = useState<string[]>(["", "", ""]);
  const [repeticoes, setRepeticoes] = useState<string[]>(["", "", ""]);
  const [obs, setObs] = useState<string>("");
  const [exercicioSelecionado, setExercicioSelecionado] = useState<string>("");
  const [selecionando, setSelecionando] = useState<boolean>(false);
  const [data, setData] = useState<string>(dataAtual);

  // Carrega valores pré-existentes ao editar
  useEffect(() => {
    if (value) {
      setPesos(value.pesos || ["", "", ""]);
      setRepeticoes(value.reps || ["", "", ""]);
      setObs(value.obs || "");
      if (value.exercicio && EXERCICIOS.includes(value.exercicio)) {
        setExercicioSelecionado(value.exercicio);
      }
    }
  }, [value]);

  // Atualiza array de pesos ou repetições conforme input
  const handleArrayChange = (
    campo: "pesos" | "reps",
    index: number,
    valor: string
  ) => {
    const atualizados = campo === "pesos" ? [...pesos] : [...repeticoes];
    atualizados[index] = valor;
    if (campo === "pesos") {
      setPesos(atualizados);
    } else {
      setRepeticoes(atualizados);
    }
  };

  // Salva os dados preenchidos
  const salvar = () => {
    const pesosLimpos = pesos.map((p) => p.trim());
    const repsLimpos = repeticoes.map((r) => r.trim());
    const obsLimpo = obs.trim();

    const pesoTotal = pesosLimpos.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
    const isVazio = pesoTotal === 0 && repsLimpos.every((r) => r === "") && obsLimpo === "";

    if (isVazio) {
      alert("🚫 Preencha ao menos um peso, repetição ou observação.");
      return;
    }

    if (!exercicioSelecionado) {
      alert("⚠️ Por favor, selecione um exercício.");
      return;
    }

    const novoRegistro = {
      data: dataAtual,
      pesos: pesosLimpos,
      reps: repsLimpos,
      obs: obsLimpo,
      exercicio: exercicioSelecionado,
    };

    const dadosTreino = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
    if (!dadosTreino[exercicioSelecionado]) dadosTreino[exercicioSelecionado] = {};
    dadosTreino[exercicioSelecionado][ciclo] = novoRegistro;
    localStorage.setItem("dadosTreino", JSON.stringify(dadosTreino));

    setPesos(["", "", ""]);
    setRepeticoes(["", "", ""]);
    setObs("");
    setSalvando(true);
    setTimeout(() => setSalvando(false), 1000);

    onSave(novoRegistro);
  };

  const cicloTitulo = `📊 ${ciclo} | ⚡ ${percentual} | 🔁 ${reps}`;

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
      {/* Cabeçalho com título do ciclo */}
      <div style={{ fontWeight: "bold", fontSize: "15px", marginBottom: "10px" }}>
        {cicloTitulo}
      </div>

      {/* Linha do seletor de exercício + campo editável de data */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "6px",
        }}
      >
        {!selecionando ? (
          <button
            onClick={() => setSelecionando(true)}
            style={{
              fontWeight: "bold",
              fontSize: "14px",
              backgroundColor: "rgba(59, 130, 246, 0.15)",
              color: "#2563eb",
              padding: "6px 12px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            {exercicioSelecionado || "Selecione seu exercício"}
          </button>
        ) : (
          <select
            autoFocus
            value={exercicioSelecionado}
            onChange={(e) => {
              setExercicioSelecionado(e.target.value);
              setSelecionando(false);
            }}
            onBlur={() => setSelecionando(false)}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          >
            <option value="" disabled hidden>
              Selecione seu exercício
            </option>
            {EXERCICIOS.map((ex) => (
              <option key={ex} value={ex}>
                {ex}
              </option>
            ))}
          </select>
        )}

        {/* Campo editável de data */}
        <input
          type="text"
          value={data}
          onChange={(e) => setData(e.target.value)}
          style={{
            fontWeight: "bold",
            fontSize: "13px",
            color: "#000",
            padding: "4px 8px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            maxWidth: "110px",
          }}
        />
      </div>

      {/* Campos de peso e reps */}
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

      {/* Observações */}
      <input
        type="text"
        placeholder="Observações"
        value={obs}
        onChange={(e) => setObs(e.target.value)}
        style={{
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          padding: "8px",
          marginBottom: "10px",
          borderRadius: "6px",
          border: "1px solid #ccc",
        }}
      />

      {/* Botão salvar */}
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
