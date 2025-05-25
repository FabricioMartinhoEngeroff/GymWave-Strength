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
  const [exercicioSelecionado, setExercicioSelecionado] = useState<string>(
    ""
  );
  const [selecionando, setSelecionando] = useState<boolean>(false);
  const [data, setData] = useState<string>(dataAtual);

  // Carrega valores pré-existentes ao editar, inclusive a data
  useEffect(() => {
    if (value) {
      setPesos(value.pesos || ["", "", ""]);
      setRepeticoes(value.reps || ["", "", ""]);
      setObs(value.obs || "");
      if (value.exercicio && EXERCICIOS.includes(value.exercicio)) {
        setExercicioSelecionado(value.exercicio);
      }
      // usa a data do registro (se existir) ou a atual como fallback
      setData(value.data || dataAtual);
    }
  }, [value, dataAtual]);

  // Atualiza array de pesos ou repetições conforme input
  const handleArrayChange = (
    campo: "pesos" | "reps",
    index: number,
    valor: string
  ) => {
    const atualizados = campo === "pesos" ? [...pesos] : [...repeticoes];
    atualizados[index] = valor;
    campo === "pesos" ? setPesos(atualizados) : setRepeticoes(atualizados);
  };

  // Salva os dados preenchidos, agora usando o estado `data`
  const salvar = () => {
    const clean = (arr: string[]) => arr.map((v) => v.trim());
    const pesosLimpos = clean(pesos);
    const repsLimpos = clean(repeticoes);
    const obsLimpo = obs.trim();
    const pesoTotal = pesosLimpos.reduce((a, v) => a + (parseFloat(v) || 0), 0);

    if (pesoTotal === 0 && repsLimpos.every((r) => !r) && !obsLimpo) {
      alert("Preencha ao menos um peso, repetição ou observação.");
      return;
    }
    if (!exercicioSelecionado) {
      alert("Por favor, selecione um exercício.");
      return;
    }

    const novoRegistro = {
      data, // agora salva o valor que o usuário editou
      pesos: pesosLimpos,
      reps: repsLimpos,
      obs: obsLimpo,
      exercicio: exercicioSelecionado,
    };

    const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
    if (!db[exercicioSelecionado]) db[exercicioSelecionado] = {};
    db[exercicioSelecionado][ciclo] = novoRegistro;
    localStorage.setItem("dadosTreino", JSON.stringify(db));

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
        margin: "0 8px 16px",
        padding: 12,
        maxWidth: 360,
        border: "1px solid #ccc",
        borderRadius: 10,
        background: "#fff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
      }}
    >
      {/* Cabeçalho colorido */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontWeight: "bold",
          fontSize: 15,
          marginBottom: 10,
        }}
      >
        <ChartBar
          size={20}
          weight="fill"
          color="#4caf50"
          style={{ marginRight: 6 }}
        />
        <span>{ciclo}</span>
        <span style={{ margin: "0 8px" }}>|</span>
        <Lightning
          size={20}
          weight="fill"
          color="#ffeb3b"
          style={{ marginRight: 6 }}
        />
        <span>{percentual}</span>
        <span style={{ margin: "0 8px" }}>|</span>
        <Repeat
          size={20}
          weight="fill"
          color="#2196f3"
          style={{ marginRight: 6 }}
        />
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
              flex: 1,
              fontWeight: "bold",
              fontSize: 13,
              backgroundColor: "#e3f2fd",
              color: "#0d47a1",
              padding: "6px 10px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              textAlign: "left",
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
              flex: 1,
              padding: 6,
              borderRadius: 4,
              border: "1px solid #ccc",
              marginRight: 8,
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
