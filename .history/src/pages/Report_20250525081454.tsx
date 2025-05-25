import { useEffect, useState } from "react";
import { carregarDados, salvarDados } from "../utils/storage";
import { DadosTreino } from "../types/TrainingData";
import { CICLOS } from "../data/cycles";
import {
  Search,
  Clipboard,
  Calendar,
  Barbell,
  Repeat,
  Tag,
  FileText,
  Edit2,
  Trash2
} from "lucide-react";

// Estrutura de cada linha do relatório...
interface LinhaRelatorio { /* ...igual*/ }

export default function Report() {
  const [linhas, setLinhas] = useState<LinhaRelatorio[]>([]);
  const [busca, setBusca] = useState("");
  const [editandoIdx, setEditandoIdx] = useState<number | null>(null);
  const [linhaEditada, setLinhaEditada] = useState<Partial<LinhaRelatorio>>({});

  useEffect(() => {
    // carrega e mapeia DadosTreino → linhas
  }, []);

  const salvarEdicao = (idx: number) => { /* ...igual*/ };
  const excluirLinha  = (idx: number) => { /* ...igual*/ };
  const iniciarEdicao = (linha: LinhaRelatorio): LinhaRelatorio => { /* ...igual*/ };

  const linhasFiltradas = linhas.filter(l =>
    l.exercicio.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", padding: "20px" }}>
      {/* Título */}
      <h1
        style={{
          textAlign: "center",
          fontSize: "24px",
          fontWeight: "bold",
          marginBottom: "24px"
        }}
      >
        <Clipboard size={24} className="inline-block mr-2" />
        Relatório de Treinos
      </h1>

      {/* Campo de busca */}
      <div
        style={{
          maxWidth: "500px",
          margin: "0 auto",
          position: "relative",
          marginBottom: "24px"
        }}
      >
        <Search
          size={20}
          style={{ position: "absolute", top: "10px", left: "12px", color: "#aaa" }}
        />
        <input
          type="text"
          placeholder="Buscar exercício..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px 10px 36px",
            borderRadius: "9999px",
            border: "1px solid #ccc",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}
        />
      </div>

      {/* Lista de relatórios */}
      <div style={{ maxWidth: "500px", margin: "0 auto" }}>
        {linhasFiltradas.map((linha, idx) => (
          <div
            key={idx}
            style={{
              background: "#fff",
              padding: "16px",
              borderRadius: "12px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
              marginBottom: "20px",
              border: "1px solid #e2e8f0"
            }}
          >
            {editandoIdx === idx ? (
              /* --- modo Edição (igual ao seu código) --- */
              <></>
            ) : (
              <>
                <p>
                  <Calendar className="inline-block mr-1" size={16} />
                  <strong>Data:</strong> {linha.data}
                </p>
                <p>
                  <Barbell className="inline-block mr-1" size={16} />
                  <strong>Exercício:</strong> {linha.exercicio}
                </p>
                <p>
                  <Tag className="inline-block mr-1" size={16} />
                  <strong>Ciclo:</strong> {linha.ciclo}
                </p>

                {/* legenda de colunas */}
                <p style={{ fontSize: "13px", color: "#888" }}>
                  <Repeat className="inline-block mr-1" size={14} />
                  Reps &nbsp;·&nbsp;
                  <Barbell className="inline-block mr-1" size={14} />
                  Peso
                </p>

                {linha.series.map((serie) => (
                  <p
                    key={serie.serie}
                    style={{
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      marginBottom: "6px",
                      fontSize: "14px",
                      color: "#333"
                    }}
                  >
                    Série {serie.serie}: {serie.rep} reps x {serie.peso} kg
                  </p>
                ))}

                {linha.obs && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#555",
                      borderTop: "1px solid #eee",
                      marginTop: "12px",
                      paddingTop: "10px"
                    }}
                  >
                    <FileText className="inline-block mr-1" size={14} />
                    <strong>Observações:</strong> {linha.obs}
                  </p>
                )}

                {/* botões */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    marginTop: "10px"
                  }}
                >
                  <button
                    onClick={() => {
                      setEditandoIdx(idx);
                      setLinhaEditada(iniciarEdicao(linha));
                    }}
                  >
                    <Edit2 className="inline-block mr-1" size={16} />
                    Editar
                  </button>
                  <button
                    onClick={() => excluirLinha(idx)}
                    style={{ backgroundColor: "#e11d48" }}
                  >
                    <Trash2 className="inline-block mr-1" size={16} />
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
