import React, { useState, useEffect, useMemo } from "react";
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

import { SearchBar } from "../graphic/SearchBar";

// Tipo base
interface DadoTreino {
  data: string;
  topSet: number;
  pesoTotal: number;
}

// Lê e organiza os dados do localStorage
function useDadosTreino() {
  return useMemo(() => {
    const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
    const dados: Record<string, DadoTreino[]> = {};

    Object.keys(db).forEach((exercicio) => {
      const ciclos = db[exercicio];
      const pontos: DadoTreino[] = [];

      Object.entries(ciclos).forEach(([ciclo, registro]: any) => {
        const { pesos = [], datas = [] } = registro;
        if (pesos.length && datas.length) {
          const max = Math.max(...pesos.map((p: string) => parseFloat(p) || 0));
          const total = pesos.reduce((a: number, p: string) => a + parseFloat(p || "0"), 0);
          pontos.push({
            data: datas[0] || ciclo,
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
  const [busca, setBusca] = useState("");
  const [intervalo, setIntervalo] = useState("1M");
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

  const dadosAgrupados = useDadosTreino();

  // Filtra exercícios pelo termo da busca
  const exercicioEncontrado = Object.keys(dadosAgrupados).find((ex) =>
    ex.toLowerCase().includes(busca.toLowerCase())
  );

  const dadosFiltrados = exercicioEncontrado
    ? dadosAgrupados[exercicioEncontrado]
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

        {/* 🔍 Barra de busca reutilizada */}
        <SearchBar value={busca} onChange={setBusca} />

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
        ) : (
          <p style={{ color: "#999", textAlign: "center" }}>
            Nenhum exercício encontrado. Tente buscar pelo nome salvo.
          </p>
        )}
      </ChartWrapper>
    </Container>
  );
};
