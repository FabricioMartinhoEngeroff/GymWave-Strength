import { useEffect, useMemo, useState } from "react";
import { EXERCICIOS } from "../../data/exercise";
import type { TreinoRotacao } from "../../data/cycles";

interface CycleLogicParams {
  ciclo: string;
  value?: {
    data?: string;
    pesos?: string[];
    reps?: string[];
    obs?: string;
    exercicio?: string;
  };
  onSave: (registro: {
    data: string;
    pesos: string[];
    reps: string[];
    obs: string;
    exercicio: string;
  }) => void;
}

export function useCycleCardLogic({ ciclo, value, onSave }: CycleLogicParams) {
  const dataAtual = new Date().toLocaleDateString("pt-BR");

  const [salvando, setSalvando] = useState(false);
  const [pesos, setPesos] = useState<string[]>(["", "", ""]);
  const [repeticoes, setRepeticoes] = useState<string[]>(["", "", ""]);
  const [obs, setObs] = useState<string>("");
  const [data, setData] = useState<string>(dataAtual);
  const [exercicioSelecionado, setExercicioSelecionado] = useState<string>("");

  useEffect(() => {
    if (value) {
      setPesos(value.pesos || ["", "", ""]);
      setRepeticoes(value.reps || ["", "", ""]);
      setObs(value.obs || "");
      setData(value.data || dataAtual);

      if (value.exercicio && EXERCICIOS.includes(value.exercicio)) {
        setExercicioSelecionado(value.exercicio);
      }
    }
  }, [value, dataAtual]);

  const handleArrayChange = (
    campo: "pesos" | "reps",
    index: number,
    valor: string
  ) => {
    const setter = campo === "pesos" ? setPesos : setRepeticoes;
    const current = campo === "pesos" ? pesos : repeticoes;

    const copia = [...current];
    copia[index] = valor;
    setter(copia);
  };

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

  return {
    pesos,
    repeticoes,
    obs,
    data,
    exercicioSelecionado,
    setPesos,
    setRepeticoes,
    setObs,
    setData,
    setExercicioSelecionado,
    handleArrayChange,
    salvar,
    salvando,
  };
}

// --- Funções utilitárias de data ---
export function parseData(data: string): Date | null {
  if (!data) return null;
  const [day, month, year] = data.split("/");
  if (!day || !month || !year) return null;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export function formatarData(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// --- Hook para sugestão de carga baseado no topset ---
export function useSugestaoDePeso(
  _rotacao: TreinoRotacao,
  exercicio: string
): { pesoMaximo: number; sugestaoPeso: number } {
  return useMemo(() => {
    const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
    const entries = db?.[exercicio];
    if (!entries) return { pesoMaximo: 0, sugestaoPeso: 0 };

    let pesoMaximo = 0;
    Object.values(entries).forEach((reg: unknown) => {
      const r = reg as { pesos?: string[] };
      (r.pesos ?? []).forEach((p: string) => {
        const n = parseFloat(p);
        if (!isNaN(n) && n > pesoMaximo) pesoMaximo = n;
      });
    });

    return { pesoMaximo, sugestaoPeso: pesoMaximo };
  }, [exercicio]);
}
