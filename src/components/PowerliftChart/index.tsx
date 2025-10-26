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

// Simulação de dados
interface DadoTreino {
  data: string;
  topSet: number;
  pesoTotal: number;
}

const dadosSimulados: DadoTreino[] = [
  { data: "01/01", topSet: 180, pesoTotal: 800 },
  { data: "08/01", topSet: 190, pesoTotal: 850 },
  { data: "15/01", topSet: 200, pesoTotal: 900 },
  { data: "22/01", topSet: 195, pesoTotal: 880 },
  { data: "29/01", topSet: 205, pesoTotal: 920 },
  { data: "05/02", topSet: 210, pesoTotal: 940 },
];

export const PowerliftingChart: React.FC = () => {
  const [intervalo, setIntervalo] = useState("1M");
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleFiltro = (periodo: string) => {
    setIntervalo(periodo);
    // Aqui você pode filtrar os dados conforme o período selecionado
  };

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
          <LineChart
            data={dadosSimulados}
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
