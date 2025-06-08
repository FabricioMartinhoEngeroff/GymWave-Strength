import { useEffect, useRef, useState } from "react";
import { EXERCICIOS } from "../../data/exercise";
import { carregarDados, salvarDados } from "../../utils/storage";
import { DadosTreino, RegistroTreino } from "../../types/TrainingData";
import CicloCard from ".";
import { Button, Bu } from "../ui/Button";

export default function ExerciciosSection() {
  const [dados, setDados] = useState<DadosTreino>(() =>
    carregarDados() || EXERCICIOS.reduce((acc, exercicio) => {
      acc[exercicio] = {};
      return acc;
    }, {} as DadosTreino)
  );

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    salvarDados(dados);
  }, [dados]);

  const salvarNoLocalStorage = (registro: RegistroTreino & { ciclo: string }) => {
    const { ciclo, exercicio, ...resto } = registro;

    const atualizados: DadosTreino = {
      ...dados,
      [String(exercicio)]: {
        ...dados[String(exercicio)],
        [ciclo]: { exercicio, ...resto },
      },
    };

    salvarDados(atualizados);
    setDados(atualizados);
  };

  const exportarDados = () => {
    const blob = new Blob([JSON.stringify(dados, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dados_treino.json";
    a.click();
  };

  const abrirGraficos = () => {
    salvarDados(dados);
    requestAnimationFrame(() => window.open("/graficos", "_blank"));
  };

  const abrirRelatorio = () => {
    window.open("/relatorio", "_blank");
  };

  const resetarDados = () => {
    localStorage.clear();
    const dadosZerados = EXERCICIOS.reduce((acc, exercicio) => {
      acc[exercicio] = {};
      return acc;
    }, {} as DadosTreino);
    setDados(dadosZerados);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow space-y-6 max-w-md mx-auto">
      <CicloCard onSave={salvarNoLocalStorage} />

      <ButtonGroup>
        <Button type="button" onClick={exportarDados}>
          Exportar Dados
        </Button>
        <Button type="button" onClick={abrirGraficos}>
          Ver Gráficos
        </Button>
        <Button type="button" onClick={abrirRelatorio}>
          Ver Relatório
        </Button>
        <Button type="button" onClick={resetarDados} variant="danger">
          Zerar Dados
        </Button>
      </ButtonGroup>
    </div>
  );
}
