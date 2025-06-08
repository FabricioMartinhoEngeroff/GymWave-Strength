import React, { useState, useEffect } from "react";
import { EXERCICIOS } from "../../data/exercise";
import { CalendarBlank } from "phosphor-react";

import CycleHeader from "./CycleHeader";
import SaveButton from "./SaveButton";
import { Input } from "./../ui/Input";
import { Button } from "../../ui/Button";

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
  onSave: (novoRegistro: {
    data: string;
    pesos: string[];
    reps: string[];
    obs: string;
    exercicio: string;
  }) => void;
}

export default function CicloCard({
  ciclo,
  percentual,
  reps,
  value,
  onSave,
}: CicloCardProps) {
  const dataAtual = new Date().toLocaleDateString("pt-BR");

  // Estados internos do card
  const [salvando, setSalvando] = useState(false);
  const [pesos, setPesos] = useState<string[]>(["", "", ""]);
  const [repeticoes, setRepeticoes] = useState<string[]>(["", "", ""]);
  const [obs, setObs] = useState<string>("");
  const [exercicioSelecionado, setExercicioSelecionado] = useState<string>("");
  const [selecionando, setSelecionando] = useState<boolean>(false);
  const [data, setData] = useState<string>(dataAtual);

  // Carrega valores pré-existentes (quando editar um registro)
  useEffect(() => {
    if (value) {
      setPesos(value.pesos || ["", "", ""]);
      setRepeticoes(value.reps || ["", "", ""]);
      setObs(value.obs || "");
      if (value.exercicio && EXERCICIOS.includes(value.exercicio)) {
        setExercicioSelecionado(value.exercicio);
      }
      setData(value.data || dataAtual);
    }
  }, [value, dataAtual]);

  // Atualiza array de pesos ou repetições conforme usuário digita
  const handleArrayChange = (
    campo: "pesos" | "reps",
    index: number,
    valor: string
  ) => {
    if (campo === "pesos") {
      const copia = [...pesos];
      copia[index] = valor;
      setPesos(copia);
    } else {
      const copia = [...repeticoes];
      copia[index] = valor;
      setRepeticoes(copia);
    }
  };

  // Função para validar e salvar no localStorage + disparar onSave
  const salvar = () => {
    const clean = (arr: string[]) => arr.map((v) => v.trim());
    const pesosLimpos = clean(pesos);
    const repsLimpos = clean(repeticoes);
    const obsLimpo = obs.trim();
    const pesoTotal = pesosLimpos.reduce(
      (acum, v) => acum + (parseFloat(v) || 0),
      0
    );

    if (pesoTotal === 0 && repsLimpos.every((r) => !r) && !obsLimpo) {
      alert("Preencha ao menos um peso, repetição ou observação.");
      return;
    }
    if (!exercicioSelecionado) {
      alert("Por favor, selecione um exercício.");
      return;
    }

    const novoRegistro = {
      data,
      pesos: pesosLimpos,
      reps: repsLimpos,
      obs: obsLimpo,
      exercicio: exercicioSelecionado,
    };

    // Persistir em localStorage
    const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
    if (!db[exercicioSelecionado]) db[exercicioSelecionado] = {};
    db[exercicioSelecionado][ciclo] = novoRegistro;
    localStorage.setItem("dadosTreino", JSON.stringify(db));

    // Resetar estados e exibir feedback visual
    setPesos(["", "", ""]);
    setRepeticoes(["", "", ""]);
    setObs("");
    setSalvando(true);
    setTimeout(() => setSalvando(false), 1000);

    // Dispara callback externo
    onSave(novoRegistro);
  };

  return (
    <div
      style={{
        margin: "0 auto 16px",
        width: "100%",
        maxWidth: 360,
        padding: 12,
        border: "1px solid #ccc",
        borderRadius: 10,
        background: "#fff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
      }}
    >
      {/* 1) Cabeçalho com ícones e valores */}
      <CycleHeader ciclo={ciclo} percentual={percentual} reps={reps} />

      {/* 2) Seletor de exercício + Data */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        {!selecionando ? (
          <Button
            text={exercicioSelecionado || "Selecione seu exercício"}
            onClick={() => setSelecionando(true)}
            type="button"
            disabled={false}
          />
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
              padding: 8,
              borderRadius: 6,
              border: "1px solid #ccc",
              appearance: "none",
              background: "#fafafa",
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

        <div style={{ display: "flex", alignItems: "center", marginLeft: 8 }}>
          <CalendarBlank
            size={18}
            weight="duotone"
            color="#9e9e9e"
            style={{ marginRight: 4 }}
          />
          <Input
            type="text"
            placeholder="DD/MM/AAAA"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
        </div>
      </div>

      {/* 3) Campos de peso e repetições (3 linhas) */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 6,
          }}
        >
          <Input
            type="number"
            placeholder={`Peso ${i + 1} (kg)`}
            value={pesos[i]}
            onChange={(e) => handleArrayChange("pesos", i, e.target.value)}
          />
          <Input
            type="number"
            placeholder={`Reps ${i + 1}`}
            value={repeticoes[i]}
            onChange={(e) => handleArrayChange("reps", i, e.target.value)}
          />
        </div>
      ))}

      {/* 4) Observação */}
      <Input
        type="text"
        placeholder="Observações"
        value={obs}
        onChange={(e) => setObs(e.target.value)}
      />

      {/* 5) Botão Salvar */}
      <SaveButton salvando={salvando} onClickSalvar={salvar} />
    </div>
  );
}