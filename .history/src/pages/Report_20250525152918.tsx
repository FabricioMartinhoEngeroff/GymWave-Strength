import { useEffect, useState } from "react";
import { carregarDados, salvarDados } from "../utils/storage";
import { DadosTreino } from "../types/TrainingData";
import { CICLOS } from "../data/cycles";
import {
  import { useEffect, useState } from "react";
import {
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  Bar,
  Line,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {  
  MagnifyingGlass,
  ChartBar,
  CalendarBlank
} from "phosphor-react";
import type { TooltipProps } from "recharts";
import { CICLOS } from "../data/cycles";

interface RegistroTreino {
  data: string;
  pesos: string[];
  reps: string[];
  exercicio?: string;
}

interface LinhaGrafico {
  data: string;
  pesoTotal: number;    // soma das 3 séries
  cargaMedia: number;   // média = soma/3
  serie1: number;
  serie2: number;
  serie3: number;
  pesoUsado: number[];  // pesos em cada série
}

// Tooltip personalizado
const CustomTooltip = (props: TooltipProps<number, string>) => {
  const { active, payload, label } = props;
  if (!active || !payload?.length) return null;
  const { pesoUsado } = payload[0].payload as LinhaGrafico;
  return (
    <div style={{
      background: "#2e2e2e",
      padding: 12,
      borderRadius: 8,
      fontSize: 13,
      color: "#fff",
    }}>
      <p>
        <CalendarBlank size={16} weight="duotone" className="inline-block mr-1" />{" "}
        <strong>Data:</strong> {label}
      </p>
      {[0,1,2].map(i => (
        <p key={i}>
          <strong>Série {i+1}:</strong> {pesoUsado[i] ?? "-"} kg
        </p>
      ))}
      <p><strong>Total:</strong> {pesoUsado.reduce((a,b)=>a+b,0)} kg</p>
      <p><strong>Média:</strong> {(pesoUsado.reduce((a,b)=>a+b,0)/pesoUsado.length).toFixed(1)} kg</p>
    </div>
  );
};

export default function Graphics() {
  const [dadosAgrupados, setDadosAgrupados] = useState<Record<string,LinhaGrafico[]>>({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);

    const bruto = JSON.parse(localStorage.getItem("dadosTreino")||"{}");
    const porExe: Record<string,LinhaGrafico[]> = {};

    Object.entries(bruto).forEach(([exe, ciclos]) => {
      Object.entries(ciclos as Record<string, RegistroTreino>).forEach(
        ([cicloKey, reg]) => {
          const pesosNum = (reg.pesos||[]).map(p => parseFloat(p)||0);
          if (!pesosNum.length) return;

          const pesoTotal = pesosNum.reduce((a,b)=>a+b, 0);
          const cargaMedia = +(pesoTotal / pesosNum.length).toFixed(1);
          const cicloInfo = CICLOS.find(c=>c.id===cicloKey);
          const dataLabel = `${reg.data.slice(0,5)} (${cicloInfo?.id||cicloKey})`;
          const nomeExe = reg.exercicio||exe;

          porExe[nomeExe] = porExe[nomeExe]||[];
          porExe[nomeExe].push({
            data: dataLabel,
            pesoTotal,
            cargaMedia,
            serie1: pesosNum[0]||0,
            serie2: pesosNum[1]||0,
            serie3: pesosNum[2]||0,
            pesoUsado: pesosNum,
          });
        }
      );
    });

    // ordenar por data
    Object.values(porExe).forEach(arr =>
      arr.sort((a,b)=>{
        const [dA,mA] = a.data.match(/\d{2}\/\d{2}/)![0].split("/").map(Number);
        const [dB,mB] = b.data.match(/\d{2}\/\d{2}/)![0].split("/").map(Number);
        return new Date(2025,mA-1,dA).getTime() - new Date(2025,mB-1,dB).getTime();
      })
    );

    setDadosAgrupados(porExe);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filtrados = Object.keys(dadosAgrupados)
    .filter(ex => ex.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div style={{
      width: "100vw",
      margin: 0,
      padding: 0,
      boxSizing: "border-box"
    }}>
      {/* Busca */}
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "12px"
      }}>
        <MagnifyingGlass size={20} weight="duotone" />
        <input
          style={{
            flex: 1,
            marginLeft: 8,
            padding: "8px",
            borderRadius: 4,
            border: "1px solid #444",
            background: isMobile ? "#222" : "#fff",
            color: isMobile ? "#fff" : "#000"
          }}
          placeholder="Pesquisar exercício..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </div>

      {filtrados.map(ex => {
        const dados = dadosAgrupados[ex];
        return (
          <div key={ex} style={{
            background: "#1f1f1f",
            marginBottom: 24,
          }}>
            <h2 style={{
              margin: 0,
              padding: "12px",
              color: "#fff",
              textAlign: "center",
              fontSize: 18
            }}>
              <ChartBar size={20} weight="duotone" className="inline-block mr-2" />
              Progresso — {ex}
            </h2>
            <div style={{
              width: "100%",
              height: isMobile ? 260 : 360
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={dados}
                  margin={{ top: 16, right: 16, left: 0, bottom: isMobile ? 40 : 60 }}
                >
                  <CartesianGrid stroke="#333" strokeDasharray="3 3" />

                  <YAxis
                    yAxisId="media"
                    orientation="left"
                    tick={{ fill: "#fff" }}
                    tickFormatter={v => `${v} kg`}
                    tickCount={5}
                    domain={[0, "dataMax + 10"]}
                    axisLine={{ stroke: "#555" }}
                    tickLine={{ stroke: "#555" }}
                  />

                  <YAxis
                    yAxisId="total"
                    orientation="right"
                    tick={{ fill: "#fff" }}
                    tickFormatter={v => `${v} kg`}
                    tickCount={5}
                    domain={[0, "dataMax + 20"]}
                    axisLine={{ stroke: "#555" }}
                    tickLine={{ stroke: "#555" }}
                  />

                  <RechartsTooltip content={<CustomTooltip />} wrapperStyle={{ border: "none" }} />

                  <Legend verticalAlign="top" wrapperStyle={{ color: "#fff" }} />

                  <Bar
                    yAxisId="media"
                    dataKey="cargaMedia"
                    name="Média por série"
                    barSize={isMobile ? 16 : 24}
                    fill="#3B82F6"
                  />

                  <Line
                    yAxisId="total"
                    dataKey="pesoTotal"
                    name="Total das 3 séries"
                    type="monotone"
                    stroke="#fff"
                    dot={{ stroke: "#fff", fill: "#fff" }}
                  />

                  <XAxis
                    dataKey="data"
                    interval={0}
                    height={isMobile ? 50 : 80}
                    tick={{ fill: "#fff", fontSize: 12 }}
                    axisLine={{ stroke: "#555" }}
                    tickLine={{ stroke: "#555" }}
                    angle={-45}
                    textAnchor="end"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}

      {filtrados.length === 0 && (
        <p style={{ textAlign: "center", color: "#888", padding: 20 }}>
          Nenhum exercício encontrado.
        </p>
      )}
    </div>
  );
}


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
        const cicloId = ciclo.startsWith("Ciclo ") ? `C${ciclo.split(" ")[1]}` : ciclo;
        const cicloNome = CICLOS.find(c => c.id === cicloId)?.titulo || "Ciclo não identificado";
        const series = reps.map((rep, idx) => ({
          serie: idx + 1,
          rep: rep || "-",
          peso: pesos[idx] || "-"
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
    const cid = CICLOS.find(c => c.titulo === novas[idx].ciclo)?.id;
    if (ex && cid && dados[ex]?.[cid]) {
      dados[ex][cid] = {
        ...dados[ex][cid],
        data: novas[idx].data,
        pesos: novas[idx].series.map(s => s.peso),
        reps: novas[idx].series.map(s => s.rep),
        obs: novas[idx].obs || ""
      };
      salvarDados(dados);
    }
  };

  const excluirLinha = (idx: number) => {
    const novas = [...linhas];
    const lin = novas.splice(idx, 1)[0];
    setLinhas(novas);

    const dados = carregarDados();
    const cid = CICLOS.find(c => c.titulo === lin.ciclo)?.id;
    if (lin.exercicio && cid && dados[lin.exercicio]?.[cid]) {
      delete dados[lin.exercicio][cid];
      if (Object.keys(dados[lin.exercicio]).length === 0) delete dados[lin.exercicio];
      salvarDados(dados);
    }
  };

  const linhasFiltradas = linhas.filter(l =>
    l.exercicio.toLowerCase().includes(busca.toLowerCase())
  );

  const iniciarEdicao = (l: LinhaRelatorio): LinhaRelatorio => ({
    ...l,
    series: l.series.map(s => ({ ...s }))
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", padding: 20 }}>
      <h1 style={{ textAlign: "center", fontSize: 24, fontWeight: "bold", marginBottom: 24 }}>
        <Clipboard weight="duotone" className="inline-block mr-2" size={24} />
        Relatório de Treinos
      </h1>

      {/* Container de busca */}
      <div
        style={{
          width: isMobile ? "100%" : 500,
          margin: "0 auto",
          position: "relative",
          marginBottom: 24
        }}
      >
        <MagnifyingGlass
          size={20}
          weight="duotone"
          style={{ position: "absolute", top: 10, left: 12, color: "#aaa" }}
        />
        <input
          type="text"
          placeholder="Buscar exercício..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px 10px 36px",
            borderRadius: 9999,
            border: "1px solid #ccc",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}
        />
      </div>

      {/* Container dos cards */}
      <div style={{ width: isMobile ? "100%" : 500, margin: "0 auto" }}>
        {linhasFiltradas.map((l, idx) => (
          <div
            key={idx}
            style={{
              width: "100%",
              background: "#fff",
              padding: 16,
              borderRadius: 12,
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
              marginBottom: 20,
              border: "1px solid #e2e8f0"
            }}
          >
            {editandoIdx === idx ? (
              <>
                {/* Modo edição */}
                <label style={{ display: "flex", alignItems: "center", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                  <CalendarBlank weight="duotone" className="mr-2" size={16} />
                  Data
                </label>
                <input
                  value={linhaEditada.data || l.data}
                  onChange={e => setLinhaEditada(p => ({ ...p, data: e.target.value }))}
                  placeholder="DD/MM/AAAA"
                  style={{ width: "100%", marginBottom: 12, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                />

                {l.series.map((s, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <label style={{ display: "flex", alignItems: "center", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                      <Star weight="duotone" className="mr-2" size={16} />
                      Série {i + 1}
                    </label>
                    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "flex", alignItems: "center", fontSize: 12, color: "#555", marginBottom: 2 }}>
                          <ArrowsClockwise weight="duotone" className="mr-1" size={14} />
                          Repetições
                        </label>
                        <input
                          value={linhaEditada.series?.[i]?.rep || s.rep}
                          onChange={e => {
                            const arr = [...(linhaEditada.series || l.series)];
                            arr[i] = { ...arr[i], rep: e.target.value };
                            setLinhaEditada(p => ({ ...p, series: arr }));
                          }}
                          placeholder="Ex.: 8 reps"
                          style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "flex", alignItems: "center", fontSize: 12, color: "#555", marginBottom: 2 }}>
                          <Dumbbell weight="duotone" className="mr-1" size={14} />
                          Peso
                        </label>
                        <input
                          value={linhaEditada.series?.[i]?.peso || s.peso}
                          onChange={e => {
                            const arr = [...(linhaEditada.series || l.series)];
                            arr[i] = { ...arr[i], peso: e.target.value };
                            setLinhaEditada(p => ({ ...p, series: arr }));
                          }}
                          placeholder="Ex.: 100 kg"
                          style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <label style={{ display: "flex", alignItems: "center", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                  <FileText weight="duotone" className="mr-2" size={16} />
                  Observações
                </label>
                <input
                  value={linhaEditada.obs || l.obs || ""}
                  onChange={e => setLinhaEditada(p => ({ ...p, obs: e.target.value }))}
                  placeholder="Digite observações"
                  style={{ width: "100%", marginBottom: 12, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                />

                <button
                  style={{ width: isMobile ? "100%" : "auto", marginBottom: isMobile ? 8 : 0 }}
                  onClick={() => salvarEdicao(idx)}
                >
                  <FloppyDisk weight="duotone" className="inline-block mr-1" size={16} />
                  Salvar
                </button>
                <button
                  style={{ width: isMobile ? "100%" : "auto" }}
                  onClick={() => setEditandoIdx(null)}
                >
                  <X weight="duotone" className="inline-block mr-1" size={16} />
                  Cancelar
                </button>
              </>
            ) : (
              <>
                {/* Modo exibição */}
                <p>
                  <CalendarBlank weight="duotone" className="inline-block mr-1" size={16} />
                  <strong>Data:</strong> {l.data}
                </p>
                <p>
                  <Dumbbell weight="duotone" className="inline-block mr-1" size={16} />
                  <strong>Exercício:</strong> {l.exercicio}
                </p>
                <p>
                  <Tag weight="duotone" className="inline-block mr-1" size={16} />
                  <strong>Ciclo:</strong> {l.ciclo}
                </p>
                <p style={{ fontSize: 13, color: "#888" }}>
                  <Star weight="duotone" className="inline-block mr-1" size={14} />
                  Série <ArrowsClockwise weight="duotone" className="inline-block mx-1" size={14} />Reps · <Dumbbell weight="duotone" className="inline-block mx-1" size={14} />Peso
                </p>
                {l.series.map(s => (
                  <p
                    key={s.serie}
                    style={{
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      padding: "8px 12px",
                      borderRadius: 6,
                      marginBottom: 6,
                      fontSize: 14,
                      color: "#333"
                    }}
                  >
                    Série {s.serie}: {s.rep} reps x {s.peso} kg
                  </p>
                ))}
                {l.obs && (
                  <p style={{ fontSize: 13, color: "#555", borderTop: "1px solid #eee", marginTop: 12, paddingTop: 10 }}>
                    <FileText weight="duotone" className="inline-block mr-1" size={14} /> <strong>Observações:</strong> {l.obs}
                  </p>
                )}
                <div
                  style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    justifyContent: "space-between",
                    gap: 10,
                    marginTop: 10
                  }}
                >
                  <button
                    style={{ width: isMobile ? "100%" : "auto", marginBottom: isMobile ? 8 : 0 }}
                    onClick={() => {
                      setEditandoIdx(idx);
                      setLinhaEditada(iniciarEdicao(l));
                    }}
                  >
                    <PencilSimple weight="duotone" className="inline-block mr-1" size={16} />
                    Editar
                  </button>
                  <button
                    style={{
                      width: isMobile ? "100%" : "auto",
                      backgroundColor: "#e11d48"
                    }}
                    onClick={() => excluirLinha(idx)}
                  >
                    <Trash weight="duotone" className="inline-block mr-1" size={16} />
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
