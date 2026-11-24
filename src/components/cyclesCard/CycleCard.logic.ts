import { useEffect, useMemo, useState } from "react";
import { EXERCICIOS } from "../../data/exercise";
import type { TreinoRotacao } from "../../data/cycles";
import { hojeBR } from "../../utils/datas";
import { carregarDados, storageKey } from "../../utils/storage";
import { mensagens } from "../mensagens/mensagens";

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
  const dataAtual = hojeBR();

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
      mensagens.mostrar("preencha_registro");
      return;
    }

    if (!exercicioSelecionado) {
      mensagens.mostrar("selecione_exercicio");
      return;
    }

    const novoRegistro = {
      data,
      pesos: pesosLimpos,
      reps: repsLimpos,
      obs: obsLimpo,
      exercicio: exercicioSelecionado,
    };

    const db = carregarDados();
    (db[exercicioSelecionado] ??= {})[ciclo] = novoRegistro;
    localStorage.setItem(storageKey("dadosTreino"), JSON.stringify(db));

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

// --- Hook para sugestão de carga baseado no topset ---
export function useSugestaoDePeso(
  _rotacao: TreinoRotacao,
  exercicio: string
): { pesoMaximo: number; sugestaoPeso: number } {
  return useMemo(() => {
    const db = carregarDados();
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
