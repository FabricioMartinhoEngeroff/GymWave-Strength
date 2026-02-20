import { useEffect, useMemo, useState } from "react";
import { EXERCICIOS } from "../../data/exercise";
import { CicloInfo } from "../../data/cycles";

interface CycleLogicParams {
  ciclo: string;
  value?: {
    data?: string;
    pesos?: string[];
    reps?: string[];
    obs?: string;
    exercicio?: string;
    rpe?: number;
  };
  onSave: (registro: {
    data: string;
    pesos: string[];
    reps: string[];
    obs: string;
    exercicio: string;
    rpe?: number;
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
  const [rpe, setRpe] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (value) {
      setPesos(value.pesos || ["", "", ""]);
      setRepeticoes(value.reps || ["", "", ""]);
      setObs(value.obs || "");
      setData(value.data || dataAtual);
      setRpe(typeof value.rpe === "number" ? value.rpe : undefined);

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
      rpe,
    };

    const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
    if (!db[exercicioSelecionado]) db[exercicioSelecionado] = {};
    db[exercicioSelecionado][ciclo] = novoRegistro;
    localStorage.setItem("dadosTreino", JSON.stringify(db));

    setPesos(["", "", ""]);
    setRepeticoes(["", "", ""]);
    setObs("");
    setRpe(undefined);
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
    rpe,
    setPesos,
    setRepeticoes,
    setObs,
    setData,
    setExercicioSelecionado,
    setRpe,
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
  ciclo: CicloInfo,
  exercicio: string
): { pesoMaximo: number; sugestaoPeso: number } {
  return useMemo(() => {
    const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
    const ciclo4 = db?.[exercicio]?.["C4"];
    if (!ciclo4 || !ciclo4.pesos) return { pesoMaximo: 0, sugestaoPeso: 0 };

    const pesos = ciclo4.pesos
      .map((p: string) => parseFloat(p))
      .filter((n: number) => !isNaN(n));

    const pesoMaximo = pesos.length ? Math.max(...pesos) : 0;

    const multiplicadores: Record<string, number> = {
      C1: 0.8,
      C2: 0.9,
      C3: 0.95,
      C4: 1.02,
    };

    const fator = multiplicadores[ciclo.id] ?? 1;
    const sugestaoPeso = Math.round(pesoMaximo * fator);

    return { pesoMaximo, sugestaoPeso }; // ✅ nomes iguais
  }, [ciclo.id, exercicio]);
}
