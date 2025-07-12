import { useState, useEffect, useMemo } from "react";
import { carregarDados, salvarDados } from "../utils/storage";
import { DadosTreino } from "../types/TrainingData";
import { CICLOS } from "../data/cycles";
import type { LinhaRelatorio, SerieInfo } from "../types/TrainingData";

export function useRelatorio() {
  // 1) Estado interno das linhas já processadas
  const [linhas, setLinhas] = useState<LinhaRelatorio[]>([]);
  // 2) Termo de busca
  const [busca, setBusca] = useState<string>("");

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
          rep: rep || "-",
          peso: pesos[idx] || "-",
        }));

        geradas.push({ data, exercicio, ciclo: cicloNome, series, obs });
      });
    });

    setLinhas(geradas);
  }, []);

  // 4) Função para salvar edição de uma linha (e sincronizar com storage)
  const salvarEdicao = (idx: number, linhaEditada: Partial<LinhaRelatorio>) => {
    setLinhas((prev) => {
      const novas = prev.map((item, i) =>
        i === idx ? ({ ...item, ...linhaEditada } as LinhaRelatorio) : item
      );

      // Atualiza no localStorage
      const dados = carregarDados();
      const ex = novas[idx].exercicio;
      const cid = CICLOS.find((c) => c.titulo === novas[idx].ciclo)?.id;
      if (ex && cid && dados[ex]?.[cid]) {
        dados[ex][cid] = {
          ...dados[ex][cid],
          data: novas[idx].data,
          pesos: novas[idx].series.map((s) => s.peso),
          reps: novas[idx].series.map((s) => s.rep),
          obs: novas[idx].obs || "",
        };
        salvarDados(dados);
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
      const cid = CICLOS.find((c) => c.titulo === lin.ciclo)?.id;
      if (lin.exercicio && cid && dados[lin.exercicio]?.[cid]) {
        delete dados[lin.exercicio][cid];
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
    () =>
      linhas.filter((l) =>
        l.exercicio.toLowerCase().includes(busca.toLowerCase())
      ),
    [linhas, busca]
  );

  return {
    linhas,
    busca,
    setBusca,
    linhasFiltradas,
    salvarEdicao,
    excluirLinha,
  };
}