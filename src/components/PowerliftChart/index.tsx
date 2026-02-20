import React, { useState, useMemo, useEffect } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { TooltipContentProps } from "recharts/types/component/Tooltip";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

import {
  Container,
  Header,
  TimeFilter,
  FilterButton,
  ChartContainer,
  Title,
  SelectLabel,
  TooltipBox,
} from "./styles";

import { CustomSelect } from "../ui/Select";
import type { DadosTreino, RegistroTreino } from "../../types/TrainingData";

type PontoSerie = {
  ts: number;
  data: string; // "DD/MM/YYYY"
  topSet: number;
  media4: number;
};

const media = (nums: number[]): number => {
  if (nums.length === 0) return 0;
  return nums.reduce((acc, v) => acc + v, 0) / nums.length;
};

const parseDataBR = (data: string): number | null => {
  const [diaRaw, mesRaw, anoRaw] = data.split("/");
  const dia = Number(diaRaw);
  const mes = Number(mesRaw);
  const ano = Number(anoRaw);
  if (!dia || !mes || !ano) return null;
  const d = new Date(ano, mes - 1, dia);
  const ts = d.getTime();
  return Number.isNaN(ts) ? null : ts;
};

const formatarTick = (ts: number): string => {
  const d = new Date(ts);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}`;
};

const getCutoffTs = (intervalo: string, nowTs: number): number => {
  const day = 24 * 60 * 60 * 1000;
  switch (intervalo) {
    case "1M":
      return nowTs - 30 * day;
    case "6M":
      return nowTs - 182 * day;
    case "1A":
      return nowTs - 365 * day;
    case "3A":
      return nowTs - 3 * 365 * day;
    case "5A":
      return nowTs - 5 * 365 * day;
    default:
      return 0;
  }
};

function useDadosTreinoPorExercicio() {
  return useMemo(() => {
    const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}") as DadosTreino;
    const dados: Record<string, Array<{ ts: number; data: string; topSet: number }>> = {};

    Object.entries(db).forEach(([exercicio, ciclos]) => {
      const porDia = new Map<number, { ts: number; data: string; topSet: number }>();

      for (const [, registro] of Object.entries(ciclos) as Array<
        [string, RegistroTreino]
      >) {
        const { pesos = [], data } = registro;
        if (!data) continue;
        const ts = parseDataBR(data);
        if (!ts) continue;

        const pesosNum = pesos.map((p) => parseFloat(p) || 0).filter((n) => n > 0);
        if (pesosNum.length === 0) continue;

        const topSet = Math.max(...pesosNum);
        const atual = porDia.get(ts);
        if (!atual || topSet > atual.topSet) {
          porDia.set(ts, { ts, data, topSet });
        }
      }

      dados[exercicio] = [...porDia.values()].sort((a, b) => a.ts - b.ts);
    });

    return dados;
  }, []);
}

export const PowerliftingChart: React.FC = () => {
  const [intervalo, setIntervalo] = useState("1M");
  const [exercicioSelecionado, setExercicioSelecionado] = useState<string>("");

  const dadosAgrupados = useDadosTreinoPorExercicio();

  const opcoesExercicio = Object.keys(dadosAgrupados).map((ex) => ({
    label: ex,
    value: ex,
  }));

  const dadosFiltrados: PontoSerie[] = useMemo(() => {
    if (!exercicioSelecionado) return [];
    const raw = dadosAgrupados[exercicioSelecionado] ?? [];
    const nowTs = raw.length ? raw[raw.length - 1].ts : 0;
    const cutoff = getCutoffTs(intervalo, nowTs);

    const filtrados = raw.filter((p) => p.ts >= cutoff);
    return filtrados.map((p, i) => {
      const janela = filtrados.slice(Math.max(0, i - 3), i + 1).map((x) => x.topSet);
      return { ...p, media4: media(janela) };
    });
  }, [dadosAgrupados, exercicioSelecionado, intervalo]);

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
  }: TooltipContentProps<ValueType, NameType>): React.ReactElement | null => {
    if (active && payload && payload.length) {
      const dado = (payload[0] as Payload<ValueType, NameType>)?.payload as
        | PontoSerie
        | undefined;
      if (!dado) return null;
      return (
        <TooltipBox>
          <p><strong>{dado.data}</strong></p>
          <p>Maior peso: {Math.round(dado.topSet)} kg</p>
          <p>Média (4 últimas): {Math.round(dado.media4)} kg</p>
        </TooltipBox>
      );
    }
    return null;
  };

  return (
    <Container>
      <Header>
        <Title>Gráfico Moderno</Title>
        <SelectLabel>Escolha o exercício</SelectLabel>
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
            <ComposedChart
              data={dadosFiltrados}
              margin={{ top: 10, right: 16, left: 6, bottom: 0 }}
            >
              <defs>
                <linearGradient id="areaTopSet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C853" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00C853" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis
                dataKey="ts"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                stroke="#8a8a8a"
                tickFormatter={formatarTick}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#8a8a8a"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${v}kg`}
                tickLine={false}
                axisLine={false}
                width={46}
                domain={[0, "dataMax + 5"]}
              />
              <Tooltip content={(props) => <CustomTooltip {...props} />} />

              <Area
                type="monotone"
                dataKey="topSet"
                stroke="#00C853"
                strokeWidth={2.5}
                fill="url(#areaTopSet)"
                dot={false}
                activeDot={{ r: 5 }}
              />

              <Line
                type="monotone"
                dataKey="media4"
                stroke="#2962FF"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
              />
            </ComposedChart>
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
