import { useEffect, useState } from "react";
import { carregarDados, salvarDados } from "../utils/storage";
import { DadosTreino } from "../types/TrainingData";
import { CICLOS } from "../data/cycles";
import {
  Search,
  Calendar,
  Dumbbell,
  Tag,
  Star,
  Repeat,
  FileText,
  Edit,
  Trash2
} from "lucide-react";

// Estrutura de cada linha do relatório
type LinhaRelatorio = {
  data: string;
  exercicio: string;
  ciclo: string;
  series: {
    serie: number;
    rep: string;
    peso: string;
  }[];
  obs?: string;
};

export default function Report() {
  const [linhas, setLinhas] = useState<LinhaRelatorio[]>([]);
  const [busca, setBusca] = useState("");
  const [editandoIdx, setEditandoIdx] = useState<number | null>(null);
  const [linhaEditada, setLinhaEditada] = useState<Partial<LinhaRelatorio>>({});

  useEffect(() => {
    const bruto: DadosTreino = carregarDados();
    const geradas: LinhaRelatorio[] = [];

    Object.entries(bruto).forEach(([exercicio, ciclos]) => {
      Object.entries(ciclos).forEach(([ciclo, registro]) => {
        const { pesos = [], reps = [], obs = "", data = "" } = registro;
        const cicloId = ciclo.startsWith("Ciclo ") ? `C${ciclo.split(" ")[1]}` : ciclo;
        const cicloNome = CICLOS.find((c) => c.id === cicloId)?.titulo || "Ciclo não identificado";
        const series = reps.map((rep, index) => ({
          serie: index + 1,
          rep: rep || "-",
          peso: pesos[index] || "-",
        }));
        geradas.push({ data, exercicio, ciclo: cicloNome, series, obs });
      });
    });

    setLinhas(geradas);
  }, []);

  const salvarEdicao = (idx: number) => {
    const novasLinhas = [...linhas];
    novasLinhas[idx] = { ...novasLinhas[idx], ...linhaEditada };
    setLinhas(novasLinhas);
    setEditandoIdx(null);

    const dados = carregarDados();
    const exercicio = novasLinhas[idx].exercicio;
    const cicloOriginal = CICLOS.find(c => c.titulo === novasLinhas[idx].ciclo)?.id;

    if (exercicio && cicloOriginal && dados[exercicio]?.[cicloOriginal]) {
      dados[exercicio][cicloOriginal] = {
        ...dados[exercicio][cicloOriginal],
        data: novasLinhas[idx].data,
        pesos: novasLinhas[idx].series.map(s => s.peso),
        reps: novasLinhas[idx].series.map(s => s.rep),
        obs: novasLinhas[idx].obs || "",
      };
      salvarDados(dados);
    }
  };

  const excluirLinha = (idx: number) => {
    const novasLinhas = [...linhas];
    const linha = novasLinhas[idx];
    novasLinhas.splice(idx, 1);
    setLinhas(novasLinhas);

    const dados = carregarDados();
    const cicloId = CICLOS.find(c => c.titulo === linha.ciclo)?.id;

    if (linha.exercicio && cicloId && dados[linha.exercicio]?.[cicloId]) {
      delete dados[linha.exercicio][cicloId];
      if (!Object.keys(dados[linha.exercicio]).length) {
        delete dados[linha.exercicio];
      }
      salvarDados(dados);
    }
  };

  const linhasFiltradas = linhas.filter((linha) =>
    linha.exercicio.toLowerCase().includes(busca.toLowerCase())
  );

  const iniciarEdicao = (linha: LinhaRelatorio): LinhaRelatorio => ({
    ...linha,
    series: linha.series.map((s) => ({ ...s }))
  });

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-center text-2xl font-bold mb-6 flex items-center justify-center gap-2">
        <FileText size={24} /> Relatório de Treinos
      </h1>

      <div className="max-w-md mx-auto relative mb-6">
        <Search size={20} className="absolute top-3 left-3 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar exercício..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 bg-white shadow-sm"
        />
      </div>

      <div className="max-w-md mx-auto space-y-4">
        {linhasFiltradas.map((linha, idx) => (
          <div
            key={idx}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
          >
            {editandoIdx === idx ? (
              <>                
                <div className="mb-2">
                  <Calendar size={18} className="inline-block mr-2 text-gray-600" />
                  <input
                    value={linhaEditada.data || linha.data}
                    onChange={(e) => setLinhaEditada((prev) => ({ ...prev, data: e.target.value }))}
                    className="w-full p-1 border border-gray-300 rounded"
                  />
                </div>

                {linha.series.map((serie, sIdx) => (
                  <div key={sIdx} className="flex gap-2 mb-2">
                    <input
                      value={linhaEditada.series?.[sIdx]?.rep ?? serie.rep}
                      onChange={(e) => {
                        const novas = [...(linhaEditada.series || linha.series)];
                        novas[sIdx] = { ...novas[sIdx], rep: e.target.value };
                        setLinhaEditada((prev) => ({ ...prev, series: novas }));
                      }}
                      className="flex-1 p-1 border border-gray-300 rounded"
                    />
                    <input
                      value={linhaEditada.series?.[sIdx]?.peso ?? serie.peso}
                      onChange={(e) => {
                        const novas = [...(linhaEditada.series || linha.series)];
                        novas[sIdx] = { ...novas[sIdx], peso: e.target.value };
                        setLinhaEditada((prev) => ({ ...prev, series: novas }));
                      }}
                      className="flex-1 p-1 border border-gray-300 rounded"
                    />
                  </div>
                ))}

                <div className="mb-2">
                  <textarea
                    value={linhaEditada.obs || linha.obs || ""}
                    onChange={(e) => setLinhaEditada((prev) => ({ ...prev, obs: e.target.value }))}
                    placeholder="Observações"
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>

                <div className="flex gap-2">
                  <button onClick={() => salvarEdicao(idx)} className="flex items-center gap-1">
                    <Edit size={18} /> Salvar
                  </button>
                  <button onClick={() => setEditandoIdx(null)} className="flex items-center gap-1">
                    <Trash2 size={18} /> Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="flex items-center gap-1 mb-1"><Calendar size={16} /> <span className="font-semibold">Data:</span> {linha.data}</p>
                <p className="flex items-center gap-1 mb-1"><Dumbbell size={16} /> <span className="font-semibold">Exercício:</span> {linha.exercicio}</p>
                <p className="flex items-center gap-1 mb-2"><Tag size={16} /> <span className="font-semibold">Ciclo:</span> {linha.ciclo}</p>
                <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                  <Star size={14} /> Série <Repeat size={14} /> Repetição <Tag size={14} /> Peso
                </p>
                {linha.series.map((serie) => (
                  <p key={serie.serie} className="bg-gray-50 border border-gray-200 p-2 rounded mb-1 text-sm text-gray-700">
                    Série {serie.serie}: {serie.rep} reps x {serie.peso} kg
                  </p>
                ))}

                {linha.obs && (
                  <p className="flex items-start gap-1 text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200">
                    <FileText size={14} /> <span className="font-semibold">Observações:</span> {linha.obs}
                  </p>
                )}

                <div className="mt-3 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setEditandoIdx(idx);
                      setLinhaEditada(iniciarEdicao(linha));
                    }}
                    className="flex items-center gap-1 text-blue-600"
                  >
                    <Edit size={16} /> Editar
                  </button>
                  <button
                    onClick={() => excluirLinha(idx)}
                    className="flex items-center gap-1 text-red-600"
                  >
                    <Trash2 size={16} /> Excluir
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
