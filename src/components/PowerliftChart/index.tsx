import React, { useState, useEffect } from "react";
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
  ChartWrapper,
  Title,
  TooltipBox,
} from "./styles";

import { CustomSelect } from "../ui/Select";
import { useDadosTreino } from "../../hooks/useDadosTreino";

export const PowerliftingChart: React.FC = () => {
  const [intervalo, setIntervalo] = useState("1M");
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  const [exercicioSelecionado, setExercicioSelecionado] = useState<string>("");

  const dadosAgrupados = useDadosTreino(); // 🔹 pega todos os dados salvos no localStorage
  const opcoesExercicio = Object.keys(dadosAgrupados).map((ex) => ({
    label: ex,
    value: ex,
  }));

  const dadosFiltrados = exercicioSelecionado
    ? dadosAgrupados[exercicioSelecionado] || []
    : [];

  useEffect(() => {
    const handleResize = () => setIsLandscape(window.innerWidth > window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleFiltro = (periodo: string) => setIntervalo(periodo);

  const CustomTooltip = ({ active, payload }: any) => {
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

  {/* 🔹 Select reutilizando seu componente */}
  <div style={{ width: "100%", maxWidth: "400px" }}>
    <CustomSelect
      options={opcoesExercicio}
      value={
        exercicioSelecionado
          ? { label: exercicioSelecionado, value: exercicioSelecionado }
          : null
      }
      onChange={(option) => setExercicioSelecionado(option?.value || "")}
      placeholder="Escolha um exercício..."
      label="Exercício"
    />
  </div>

  <TimeFilter>
    {["1M", "6M", "1A", "3A", "5A"].map((filtro) => (
      <FilterButton
        key={filtro}
        $ativo={intervalo === filtro}
        onClick={() => handleFiltro(filtro)}
      >
        {filtro}
      </FilterButton>
    ))}
  </TimeFilter>
</Header>


      <ChartWrapper $isLandscape={isLandscape}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dadosFiltrados}
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
            <Tooltip content={<CustomTooltip />} />
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
      </ChartWrapper>
    </Container>
  );
};
