import { useState, useEffect } from "react";
import {
  ClipboardIcon,
  MagnifyingGlassIcon,
  CalendarBlankIcon,
  StarIcon,
  ArrowsClockwiseIcon,
  BarbellIcon,
  FileTextIcon,
  PencilSimpleIcon,
  XIcon,
  TrashIcon,
  FloppyDiskIcon
} from "phosphor-react";

interface Serie {
  serie: number;
  rep: string;
  peso: string;
}

interface Linha {
  data: string;
  exercicio: string;
  ciclo: string;
  series: Serie[];
  obs?: string;
}

interface ReportProps {
  linhas: Linha[];
  editarLinha: (idx: number) => void;
  excluirLinha: (idx: number) => void;
  salvarEdicao: (idx: number) => void;
  iniciarEdicao: (l: Linha) => Linha;
  linhasFiltradas: Linha[];
}

export default function Report({
  linhasFiltradas,
  editarLinha,
  excluirLinha,
  salvarEdicao,
  iniciarEdicao
}: ReportProps) {
  const [busca, setBusca] = useState("");
  const [editandoIdx, setEditandoIdx] = useState<number | null>(null);
  const [linhaEditada, setLinhaEditada] = useState<Linha>({} as Linha);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", padding: 20 }}>
      <h1 style={{ textAlign: "center", fontSize: 24, fontWeight: "bold", marginBottom: 24 }}>
        <ClipboardIcon size={28} weight="duotone" color="#7950F2" className="inline-block mr-2" />
        Relatório de Treinos
      </h1>

      {/* Buscador */}
      <div
        style={{
          width: "100%",
          maxWidth: 500,
          margin: "0 auto 20px",
          position: "relative"
        }}
      >
        <MagnifyingGlassIcon size={20} weight="fill" color="#6B7280" style={{ position: "absolute", top: 10, left: 12 }} />
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

      {/* Cards */}
      <div style={{ width: "100%", maxWidth: 500, margin: "0 auto" }}>
        {linhasFiltradas.map((l, idx) => (
          <div
            key={idx}
            style={{
              background: "#fff",
              padding: 16,
              borderRadius: 12,
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
              marginBottom: 20,
              border: "1px solid #e2e8f0"
            }}
          >
            {editandoIdx === idx ? (
              // Modo edição
              <>
                <label style={{ display: "flex", alignItems: "center", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                  <CalendarBlankIcon size={18} weight="duotone" color="#10B981" className="mr-2" />
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
                      <StarIcon size={18} weight="fill" color="#FBBF24" className="mr-2" />
                      Série {i + 1}
                    </label>
                    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "flex", alignItems: "center", fontSize: 12, color: "#555", marginBottom: 2 }}>
                          <ArrowsClockwiseIcon size={16} weight="fill" color="#3B82F6" className="mr-1" />
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
                          <BarbellIcon size={16} weight="fill" color="#EF4444" className="mr-1" />
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
                  <FileTextIcon size={18} weight="duotone" className="mr-2" />
                  Observações
                </label>
                <input
                  value={linhaEditada.obs || l.obs || ""}
                  onChange={e => setLinhaEditada(p => ({ ...p, obs: e.target.value }))}
                  placeholder="Digite observações"
                  style={{ width: "100%", marginBottom: 12, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                />

                <button
                  style={{ width: isMobile ? "100%" : undefined, marginBottom: isMobile ? 8 : 0 }}
                  onClick={() => salvarEdicao(idx)}
                >
                  <FloppyDiskIcon size={16} weight="fill" color="#10B981" className="inline-block mr-1" />
                  Salvar
                </button>
                <button
                  style={{ width: isMobile ? "100%" : undefined }}
                  onClick={() => setEditandoIdx(null)}
                >
                  <XIcon size={16} weight="fill" color="#6B7280" className="inline-block mr-1" />
                  Cancelar
                </button>
              </>
            ) : (
              // Modo exibição
              <>
               <p><CalendarBlankIcon size={16} weight="duotone" className="inline-block mr-1" /><strong>Data:</strong> {l.data}</p>
                 <p><BarbellIcon size={16} weight="fill" color="#EF4444" className="inline-block mr-1" /><strong>Exercício:</strong> {l.exercicio}</p>
                <p><TagIcon size={16} weight="duotone" className="inline-block mr-1" /><strong>Ciclo:</strong> {l.ciclo}</p>
                <p style={{ fontSize: 13, color: "#888" }}>
                  <StarIcon size={14} weight="fill" color="#FBBF24" className="inline-block mr-1" />
                  Série <ArrowsClockwiseIcon size={14} weight="fill" color="#3B82F6" className="inline-block mx-1" />Reps · <BarbellIcon size={14} weight="fill" color="#EF4444" className="inline-block mx-1" />Peso
                </p>
                {l.series.map(s => (
                  <p key={s.serie} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", padding: "8px 12px", borderRadius: 6, marginBottom: 6, fontSize: 14, color: "#333" }}>
                    Série {s.serie}: {s.rep} reps x {s.peso} kg
                  </p>
                ))}
                {l.obs && <p style={{ fontSize: 13, color: "#555", borderTop: "1px solid #eee", marginTop: 12, paddingTop: 10 }}><FileTextIcon size={14} weight="duotone" className="inline-block mr-1" /><strong> Observações:</strong> {l.obs}</p>}
                <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", gap: 10, marginTop: 10 }}>
                  <button style={{ width: isMobile ? "100%" : undefined, marginBottom: isMobile ? 8 : 0 }} onClick={() => { editarLinha(idx); setLinhaEditada(iniciarEdicao(l)); }}>
                    <PencilSimpleIcon size={16} weight="fill" color="#F59E0B" className="inline-block mr-1" /> Editar
                  </button>
                  <button style={{ width: isMobile ? "100%" : undefined, backgroundColor: "#E11D48" }} onClick={() => excluirLinha(idx)}>
                    <TrashIcon size={16} weight="duotone" className="inline-block mr-1" /> Excluir
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