import React, { useState, useEffect } from "react";
import { EXERCICIOS } from "../data/exercise";
import {
  ChartBar,
  Lightning,
  Repeat,
  CalendarBlank,
  WarningCircle,
  CheckCircle,
} from "phosphor-react";


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
    const pesoTotal = pesosLimpos.reduce((acc, v) => acc + (parseFloat(v) || 0), 0);
    const isVazio =
      pesoTotal === 0 &&
      repsLimpos.every((r) => r === "") &&
      obsLimpo === "";

    if (isVazio) {
      alert("Preencha ao menos um peso, repetição ou observação.");
      return;
    }
    if (!exercicioSelecionado) {
      alert("Por favor, selecione um exercício.");
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

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: 16,
        borderRadius: 10,
        marginBottom: 16,
        background: "#fff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
      }}
    >
      {/* Cabeçalho com ícones MD */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontWeight: "bold",
          fontSize: 15,
          marginBottom: 10,
        }}
      >
        <MdBarChart size={20} style={{ marginRight: 6 }} />
        <span>{ciclo}</span>
        <span style={{ margin: "0 8px" }}>|</span>
        <MdBolt size={20} style={{ marginRight: 6 }} />
        <span>{percentual}</span>
        <span style={{ margin: "0 8px" }}>|</span>
        <MdRepeat size={20} style={{ marginRight: 6 }} />
        <span>{reps}</span>
      </div>

      {/* Seletor de exercício e data */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        {!selecionando ? (
          <button
            onClick={() => setSelecionando(true)}
            style={{
              fontWeight: "bold",
              fontSize: 14,
              backgroundColor: "rgba(59, 130, 246, 0.15)",
              color: "#2563eb",
              padding: "6px 12px",
              borderRadius: 8,
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
              flexGrow: 1,
              padding: 8,
              borderRadius: 6,
              border: "1px solid #ccc",
              marginRight: 10,
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

        <div style={{ display: "flex", alignItems: "center" }}>
          <MdEventNote size={18} style={{ marginRight: 4 }} />
          <input
            type="text"
            value={data}
            onChange={(e) => setData(e.target.value)}
            style={{
              fontWeight: "bold",
              fontSize: 13,
              padding: "4px 8px",
              border: "1px solid #ccc",
              borderRadius: 6,
              maxWidth: 110,
            }}
          />
        </div>
      </div>

      {/* Campos de peso e repetições */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            type="number"
            placeholder={`Peso ${i + 1} (kg)`}
            value={pesos[i]}
            onChange={(e) => handleArrayChange("pesos", i, e.target.value)}
            style={{
              flex: 1,
              padding: 8,
              borderRadius: 6,
              border: "1px solid #ccc",
            }}
          />
          <input
            type="number"
            placeholder={`Reps ${i + 1}`}
            value={repeticoes[i]}
            onChange={(e) => handleArrayChange("reps", i, e.target.value)}
            style={{
              flex: 1,
              padding: 8,
              borderRadius: 6,
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
          boxSizing: "border-box",
          padding: 8,
          marginBottom: 10,
          borderRadius: 6,
          border: "1px solid #ccc",
        }}
      />

      {/* Botão salvar */}
      <button
        onClick={salvar}
        style={{
          width: "100%",
          padding: 10,
          backgroundColor: salvando ? "#28a745" : "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontWeight: "bold",
          fontSize: 14,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {salvando ? (
          <>
            <MdCheckCircle size={18} style={{ marginRight: 6 }} />
            Salvo!
          </>
        ) : (
          <>
            <MdWarning size={18} style={{ visibility: "hidden", marginRight: 6 }} />
            Salvar
          </>
        )}
      </button>
    </div>
  );
};
