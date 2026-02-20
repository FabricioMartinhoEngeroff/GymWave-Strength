import React, { useMemo, useState, useEffect } from "react";
import { useDadosTreino } from "../../hooks/useDadosTreino";
import { ChartCard } from "./ChartCard";
import styled from "styled-components";
import { CheckboxGroup } from "../ui/CheckboxGroup";
import { CICLOS } from "../../data/cycles";
import { NativeSelect } from "../ui/NativeSelect";
import { getCutoffTs, TIME_INTERVAL_OPTIONS, type TimeInterval } from "../../utils/timeFilter";
import type { RegistroGraficoRaw } from "../../hooks/useDadosTreino";

const GraphicsWrapper = styled.div`
  background: #ffffff;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.05);
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin: 0 auto;

  @media (max-width: 480px) {
    padding: 16px;
    border-radius: 0;
  }
`;

const HeaderControls = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 8px;
  align-items: flex-start;
`;

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
  align-items: flex-end;

  > * {
    flex: 1;
    min-width: 220px;
  }

  @media (max-width: 480px) {
    > * {
      min-width: 100%;
    }
  }
`;

export const GraphicsContainer: React.FC = () => {
  const dadosAgrupados = useDadosTreino();
  const computeIsMobile = () => Math.min(window.innerWidth, window.innerHeight) < 768;
  const [isMobile, setIsMobile] = useState(computeIsMobile());
  const [exercicioSelecionado, setExercicioSelecionado] = useState<string>("");
  const [intervalo, setIntervalo] = useState<TimeInterval>("Tudo");
  const [ciclosSelecionados, setCiclosSelecionados] = useState<string[]>(
    () => CICLOS.map((c) => c.id)
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(computeIsMobile());
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  const exercicios = useMemo(
    () => Object.keys(dadosAgrupados).sort((a, b) => a.localeCompare(b)),
    [dadosAgrupados]
  );

  const dadosPorExercicioFiltrados = useMemo(() => {
    const out: Record<string, RegistroGraficoRaw[]> = {};
    exercicios.forEach((ex) => {
      const arr = dadosAgrupados[ex] ?? [];
      if (intervalo === "Tudo") {
        out[ex] = arr;
        return;
      }
      const nowTs = arr.length ? arr[arr.length - 1].dataTs : 0;
      const cutoff = getCutoffTs(intervalo, nowTs);
      out[ex] = arr.filter((p) => p.dataTs >= cutoff);
    });
    return out;
  }, [dadosAgrupados, exercicios, intervalo]);

  const exerciciosExibidos = exercicioSelecionado
    ? [exercicioSelecionado]
    : exercicios;

  return (
    <GraphicsWrapper>
      <HeaderControls>
       <h2 style={{ textAlign: "center", width: "100%", color: "#0d47a1", fontSize: "20px", margin: 0 }}>
  Gráficos de Intensidade
</h2>
        <p style={{ margin: 0, color: "#0d47a1", fontWeight: 600 }}>
          Selecione os ciclos para comparar:
        </p>
        <CheckboxGroup
          options={CICLOS.map((c, i) => {
            const partes = c.titulo.split(" ");
            return {
              linhaCima: `Ciclo ${i + 1}`,
              linhaBaixo: partes.slice(1).join(" "),
              value: c.id,
            };
          })}
          selected={ciclosSelecionados}
          onChange={setCiclosSelecionados}
          multiple
        />
        <FilterRow>
          <NativeSelect
            label="Exercício"
            value={exercicioSelecionado}
            onChange={setExercicioSelecionado}
            options={[
              { label: "Todos os exercícios", value: "" },
              ...exercicios.map((ex) => ({ label: ex, value: ex })),
            ]}
          />
          <NativeSelect
            label="Período"
            value={intervalo}
            onChange={(v) => setIntervalo(v as TimeInterval)}
            options={TIME_INTERVAL_OPTIONS}
          />
        </FilterRow>
      </HeaderControls>

      {exerciciosExibidos.length === 0 && (
        <p style={{ padding: 16, color: "#555" }}>Nenhum exercício encontrado.</p>
      )}

      {exerciciosExibidos.map((ex) => (
        <ChartCard
          key={ex}
          exercicio={ex}
          dados={dadosPorExercicioFiltrados[ex] ?? []}
          ciclosSelecionados={ciclosSelecionados}
          isMobile={isMobile}
        />
      ))}

    </GraphicsWrapper>
  );
};
