import React, { useState, useMemo, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import {
  Container,
  Header,
  TimeFilter,
  FilterButton,
    ChartContainer,
  Title,
  TooltipBox,
} from "./styles";

import { CustomSelect } from "../ui/Select";

// Tipo base
interface DadoTreino {
  data: string;
  topSet: number;
  pesoTotal: number;
}

// Hook para ler dados do LocalStorage
function useDadosTreino() {
  return useMemo(() => {
    const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
    const dados: Record<string, DadoTreino[]> = {};

    Object.keys(db).forEach((exercicio) => {
      const ciclos = db[exercicio];
      const pontos: DadoTreino[] = [];

      Object.entries(ciclos).forEach(([ciclo, registro]: any) => {
        const { pesos = [], data } = registro;
        if (pesos.length) {
          const max = Math.max(...pesos.map((p: string) => parseFloat(p) || 0));
          const total = pesos.reduce(
            (a: number, p: string) => a + parseFloat(p || "0"),
            0
          );
          pontos.push({
            data: data || ciclo,
            topSet: max,
            pesoTotal: total,
          });
        }
      });

      dados[exercicio] = pontos;
    });

    return dados;
  }, []);
}

export const PowerliftingChart: React.FC = () => {
  const [intervalo, setIntervalo] = useState("1M");
  const [exercicioSelecionado, setExercicioSelecionado] = useState<string>("");

  const dadosAgrupados = useDadosTreino();

  const opcoesExercicio = Object.keys(dadosAgrupados).map((ex) => ({
    label: ex,
    value: ex,
  }));

  const dadosFiltrados = exercicioSelecionado
    ? dadosAgrupados[exercicioSelecionado]
    : [];

 useEffect(() => {
  function updateVH() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  updateVH();
  window.addEventListener("resize", updateVH);
  window.addEventListener("orientationchange", updateVH);

  return () => {
    window.removeEventListener("resize", updateVH);
    window.removeEventListener("orientationchange", updateVH);
  };
}, []);

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: any[];
  }) => {
    if (active && payload && payload.length) {
      const dado = payload[0].payload;
      return (
        <TooltipBox>
          <p><strong>{dado.data}</strong></p>
          <p>Top Set: {dado.topSet} kg</p>
          <p>Peso Total: {dado.pesoTotal} kg</p>
        </TooltipBox>
      );
    }
    return null;
  };

  return (
    <Container>
      <Header>
        <Title>Desempenho Powerlifter</Title>

        <CustomSelect
          options={opcoesExercicio}
          value={
            exercicioSelecionado
              ? {
                  label: exercicioSelecionado,
                  value: exercicioSelecionado,
                }
              : null
          }
          onChange={(option) =>
            setExercicioSelecionado(option?.value || "")
          }
          placeholder="Selecione um exercício..."
          label="Exercício"
        />

        <TimeFilter>
          {(["1M", "6M", "1A", "3A", "5A"] as const).map((filtro) => (
            <FilterButton
              key={filtro}
              $ativo={intervalo === filtro}
              onClick={() => setIntervalo(filtro)}
            >
              {filtro}
            </FilterButton>
          ))}
        </TimeFilter>
      </Header>

      <ChartContainer>
        {dadosFiltrados.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={dadosFiltrados}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="lineTopSet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C853" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#00C853" stopOpacity={0} />
                </linearGradient>

                <linearGradient id="linePesoTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2962FF" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#2962FF" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="data" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip content={(props) => <CustomTooltip {...props} />} />

              <Line
                type="monotone"
                dataKey="topSet"
                stroke="url(#lineTopSet)"
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />

              <Line
                type="monotone"
                dataKey="pesoTotal"
                stroke="url(#linePesoTotal)"
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: "#999", textAlign: "center" }}>
            Selecione um exercício para visualizar o gráfico.
          </p>
        )}
      </ChartContainer>
    </Container>
  );
};
