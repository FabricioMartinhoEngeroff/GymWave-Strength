import { useState, useEffect, useMemo } from "react";
import { carregarDados, salvarDados } from "../utils/storage";
import { CICLOS } from "../data/cycles";
import type { DadosTreino, LinhaRelatorio, SerieInfo } from "../types/TrainingData";
import { getCutoffTs, type TimeInterval } from "../utils/timeFilter";

export function useRelatorio() {
  //Estado interno das linhas já processadas
  const [linhas, setLinhas] = useState<LinhaRelatorio[]>([]);
  const [exercicioSelecionado, setExercicioSelecionado] = useState<string>("");
  const [intervalo, setIntervalo] = useState<TimeInterval>("Tudo");

  function parseDataBR(data: string): Date {
    const [dia, mes, ano] = data.split("/");
    return new Date(`${ano}-${mes}-${dia}`);
  }

  // Ao montar, lê storage e converte em LinhaRelatorio[]
  useEffect(() => {
    const bruto: DadosTreino = carregarDados();
    const geradas: LinhaRelatorio[] = [];

    Object.entries(bruto).forEach(([exercicio, ciclos]) => {
      Object.entries(ciclos).forEach(([cicloKey, registro]) => {
        const { pesos = [], reps = [], obs = "", data = "" } = registro;
        const cicloId = cicloKey.startsWith("Ciclo ")
          ? `C${cicloKey.split(" ")[1]}`
          : cicloKey;
        const cicloNome =
          CICLOS.find((c) => c.id === cicloId)?.titulo || "Ciclo não identificado";

        const series: SerieInfo[] = reps.map((rep, idx) => ({
          serie: idx + 1,
          rep: rep || "",
          peso: pesos[idx] || "",
        }));

        geradas.push({ data, exercicio, cicloKey, ciclo: cicloNome, series, obs });
      });
    });

    geradas.sort(
      (a, b) => parseDataBR(b.data).getTime() - parseDataBR(a.data).getTime()
    );

    setLinhas(geradas);
  }, []);

  const resolveCicloKey = (
    dadosDoExercicio: DadosTreino[string] | undefined,
    linha: LinhaRelatorio
  ): string | null => {
    if (!dadosDoExercicio) return null;

    if (linha.cicloKey && dadosDoExercicio[linha.cicloKey]) return linha.cicloKey;

    const cid = CICLOS.find((c) => c.titulo === linha.ciclo)?.id;
    if (cid && dadosDoExercicio[cid]) return cid;

    // fallback: tenta formato legado "Ciclo N"
    const match = cid?.match(/^C(\d+)$/);
    if (match) {
      const legado = `Ciclo ${match[1]}`;
      if (dadosDoExercicio[legado]) return legado;
    }

    return null;
  };

  //Função para salvar edição de uma linha (e sincronizar com storage)
  const salvarEdicao = (idx: number, linhaEditada: Partial<LinhaRelatorio>) => {
    setLinhas((prev) => {
      const novas = prev.map((item, i) =>
        i === idx ? ({ ...item, ...linhaEditada } as LinhaRelatorio) : item
      );

      // Atualiza no localStorage
      const dados = carregarDados();
      const ex = novas[idx].exercicio;
      const cicloKey = resolveCicloKey(dados[ex], novas[idx]);
      if (ex && cicloKey && dados[ex]?.[cicloKey]) {
        dados[ex][cicloKey] = {
          ...dados[ex][cicloKey],
          data: novas[idx].data,
          pesos: novas[idx].series.map((s) => s.peso),
          reps: novas[idx].series.map((s) => s.rep),
          obs: novas[idx].obs || "",
        };
        salvarDados(dados);

        if (novas[idx].cicloKey !== cicloKey) {
          novas[idx] = { ...novas[idx], cicloKey };
        }
      }

      return novas;
    });
  };

  // 5) Função para excluir uma linha (e sincronizar com storage)
  const excluirLinha = (idx: number) => {
    setLinhas((prev) => {
      const novas = [...prev];
      const lin = novas.splice(idx, 1)[0];

      const dados = carregarDados();
      const ex = lin.exercicio;
      const cicloKey = resolveCicloKey(dados[ex], lin);
      if (ex && cicloKey && dados[ex]?.[cicloKey]) {
        delete dados[ex][cicloKey];
        if (Object.keys(dados[lin.exercicio]).length === 0) {
          delete dados[lin.exercicio];
        }
        salvarDados(dados);
      }

      return novas;
    });
  };

  // 6) Linhas filtradas em função do termo de busca (useMemo para desempenho)
  const linhasFiltradas = useMemo(
    () => {
      const parseToTs = (data: string): number | null => {
        const [diaRaw, mesRaw, anoRaw] = data.split("/");
        const dia = Number(diaRaw);
        const mes = Number(mesRaw);
        const ano = Number(anoRaw);
        if (!dia || !mes || !ano) return null;
        const d = new Date(ano, mes - 1, dia);
        const ts = d.getTime();
        return Number.isNaN(ts) ? null : ts;
      };

      const base = exercicioSelecionado
        ? linhas.filter((l) => l.exercicio === exercicioSelecionado)
        : linhas;

      if (intervalo === "Tudo") return base;

      const tsValidos = base
        .map((l) => parseToTs(l.data))
        .filter((ts): ts is number => typeof ts === "number");
      const nowTs = tsValidos.length ? Math.max(...tsValidos) : 0;
      const cutoff = getCutoffTs(intervalo, nowTs);

      return base.filter((l) => {
        const ts = parseToTs(l.data);
        if (!ts) return true;
        return ts >= cutoff;
      });
    },
    [linhas, exercicioSelecionado, intervalo]
  );

  const exerciciosDisponiveis = useMemo(
    () =>
      [...new Set(linhas.map((l) => l.exercicio))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [linhas]
  );

  return {
    linhas,
    linhasFiltradas,
    exerciciosDisponiveis,
    exercicioSelecionado,
    setExercicioSelecionado,
    intervalo,
    setIntervalo,
    salvarEdicao,
    excluirLinha,
  };
}
