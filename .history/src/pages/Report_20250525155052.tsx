// src/pages/Report.tsx
import { useEffect, useState } from "react";
import { carregarDados, salvarDados } from "../utils/storage";
import { DadosTreino } from "../types/TrainingData";
import { CICLOS } from "../data/cycles";
import {
  MagnifyingGlassIcon,
  ClipboardIcon,
  CalendarBlankIcon,
  ArrowsClockwiseIcon,
  TagIcon,
  StarIcon,
  FileTextIcon,
  FloppyDiskIcon,
  XIcon,
  PencilSimpleIcon,
  TrashIcon,
  BarbellIcon
} from "@phosphor-icons/react";

import "./Report.css";  // <-- nosso CSS

interface LinhaRelatorio {
  data: string;
  exercicio: string;
  ciclo: string;
  series: {
    serie: number;
    rep: string;
    peso: string;
  }[];
  obs?: string;
}

export default function Report() {
  const [linhas, setLinhas] = useState<LinhaRelatorio[]>([]);
  const [busca, setBusca] = useState("");
  const [editandoIdx, setEditandoIdx] = useState<number | null>(null);
  const [linhaEditada, setLinhaEditada] = useState<Partial<LinhaRelatorio>>({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const bruto: DadosTreino = carregarDados();
    const geradas: LinhaRelatorio[] = [];

    Object.entries(bruto).forEach(([exercicio, ciclos]) => {
      Object.entries(ciclos).forEach(([ciclo, registro]) => {
        const { pesos = [], reps = [], obs = "", data = "" } = registro;
        const cicloId = ciclo.startsWith("Ciclo ")
          ? `C${ciclo.split(" ")[1]}`
          : ciclo;
        const cicloNome =
          CICLOS.find((c) => c.id === cicloId)?.titulo ||
          "Ciclo não identificado";
        const series = reps.map((rep, idx) => ({
          serie: idx + 1,
          rep: rep || "-",
          peso: pesos[idx] || "-",
        }));
        geradas.push({ data, exercicio, ciclo: cicloNome, series, obs });
      });
    });

    setLinhas(geradas);
  }, []);

  const salvarEdicao = (idx: number) => {
    const novas = [...linhas];
    novas[idx] = { ...novas[idx], ...linhaEditada } as LinhaRelatorio;
    setLinhas(novas);
    setEditandoIdx(null);

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
  };

  const excluirLinha = (idx: number) => {
    const novas = [...linhas];
    const lin = novas.splice(idx, 1)[0];
    setLinhas(novas);

    const dados = carregarDados();
    const cid = CICLOS.find((c) => c.titulo === lin.ciclo)?.id;
    if (lin.exercicio && cid && dados[lin.exercicio]?.[cid]) {
      delete dados[lin.exercicio][cid];
      if (Object.keys(dados[lin.exercicio]).length === 0)
        delete dados[lin.exercicio];
      salvarDados(dados);
    }
  };

  const linhasFiltradas = linhas.filter((l) =>
    l.exercicio.toLowerCase().includes(busca.toLowerCase())
  );

  const iniciarEdicao = (l: LinhaRelatorio): LinhaRelatorio => ({
    ...l,
    series: l.series.map((s) => ({ ...s })),
  });

  return (
    <div className="report-container">
      <h1 className="report-header">
        <ClipboardIcon weight="duotone" size={24} className="icon" />
        Relatório de Treinos
      </h1>

      <div className="search-container">
        <MagnifyingGlassIcon
          weight="duotone"
          size={20}
          className="icon search-icon"
        />
        <input
          className="search-input"
          type="text"
          placeholder="Buscar exercício..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="cards-wrapper">
        {linhasFiltradas.map((l, idx) => (
          <div key={idx} className="card">
            {editandoIdx === idx ? (
              <>
                <label className="field-label">
                  <CalendarBlankIcon weight="duotone" size={16} className="icon" />
                  Data
                </label>
                <input
                  className="field-input"
                  value={linhaEditada.data || l.data}
                  onChange={(e) =>
                    setLinhaEditada((p) => ({ ...p, data: e.target.value }))
                  }
                  placeholder="DD/MM/AAAA"
                />

                {l.series.map((s, i) => (
                  <div key={i} className="series-row">
                    <label className="field-label">
                      <StarIcon weight="duotone" size={16} className="icon" />
                      Série {i + 1}
                    </label>
                    <div className="series-inputs">
                      <div className="series-field">
                        <label className="mini-label">
                          <ArrowsClockwiseIcon
                            weight="duotone"
                            size={14}
                            className="icon"
                          />
                          Repetições
                        </label>
                        <input
                          className="field-input"
                          value={linhaEditada.series?.[i]?.rep || s.rep}
                          onChange={(e) => {
                            const arr = [...(linhaEditada.series || l.series)];
                            arr[i] = { ...arr[i], rep: e.target.value };
                            setLinhaEditada((p) => ({ ...p, series: arr }));
                          }}
                          placeholder="Ex.: 8 reps"
                        />
                      </div>
                      <div className="series-field">
                        <label className="mini-label">
                          <BarbellIcon weight="duotone" size={14} className="icon" />
                          Peso
                        </label>
                        <input
                          className="field-input"
                          value={linhaEditada.series?.[i]?.peso || s.peso}
                          onChange={(e) => {
                            const arr = [...(linhaEditada.series || l.series)];
                            arr[i] = { ...arr[i], peso: e.target.value };
                            setLinhaEditada((p) => ({ ...p, series: arr }));
                          }}
                          placeholder="Ex.: 100 kg"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <label className="field-label">
                  <FileTextIcon weight="duotone" size={16} className="icon" />
                  Observações
                </label>
                <input
                  className="field-input"
                  value={linhaEditada.obs || l.obs || ""}
                  onChange={(e) =>
                    setLinhaEditada((p) => ({ ...p, obs: e.target.value }))
                  }
                  placeholder="Digite observações"
                />

                <div className="actions">
                  <button className="btn save" onClick={() => salvarEdicao(idx)}>
                    <FloppyDiskIcon weight="duotone" size={16} className="icon" />
                    Salvar
                  </button>
                  <button className="btn cancel" onClick={() => setEditandoIdx(null)}>
                    <XIcon weight="duotone" size={16} className="icon" />
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="field-read">
                  <CalendarBlankIcon weight="duotone" size={16} className="icon" />
                  <strong>Data:</strong> {l.data}
                </p>
                <p className="field-read">
                  <BarbellIcon weight="duotone" size={16} className="icon" />
                  <strong>Exercício:</strong> {l.exercicio}
                </p>
                <p className="field-read">
                  <TagIcon weight="duotone" size={16} className="icon" />
                  <strong>Ciclo:</strong> {l.ciclo}
                </p>

                <p className="series-summary">
                  <StarIcon weight="duotone" size={14} className="icon" />
                  Série
                  <ArrowsClockwiseIcon
                    weight="duotone"
                    size={14}
                    className="icon inline"
                  />
                  Reps ·
                  <BarbellIcon weight="duotone" size={14} className="icon inline" />
                  Peso
                </p>

                {l.series.map((s) => (
                  <p key={s.serie} className="series-read">
                    Série {s.serie}: {s.rep} reps x {s.peso} kg
                  </p>
                ))}

                {l.obs && (
                  <p className="obs-read">
                    <FileTextIcon weight="duotone" size={14} className="icon" />
                    <strong>Observações:</strong> {l.obs}
                  </p>
                )}

                <div className="actions">
                  <button
                    className="btn edit"
                    onClick={() => {
                      setEditandoIdx(idx);
                      setLinhaEditada(iniciarEdicao(l));
                    }}
                  >
                    <PencilSimpleIcon weight="duotone" size={16} className="icon" />
                    Editar
                  </button>
                  <button
                    className="btn delete"
                    onClick={() => excluirLinha(idx)}
                  >
                    <TrashIcon weight="duotone" size={16} className="icon" />
                    Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
