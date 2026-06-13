import React, { useMemo, useState, useEffect } from "react";
import { useDadosTreino } from "../../hooks/useDadosTreino";
import { ChartCard } from "./ChartCard";
import styled from "styled-components";
import { ROTACAO } from "../../data/cycles";
import { CheckboxGroup } from "../ui/CheckboxGroup";
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
  const [treinosSelecionados, setTreinosSelecionados] = useState<string[]>(
    () => ROTACAO.map((r) => r.id)
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
      let filtered = arr;

      // Filter by selected training sessions
      filtered = filtered.filter((d) => treinosSelecionados.includes(d.cicloId));

      if (intervalo !== "Tudo") {
        const nowTs = filtered.length ? filtered[filtered.length - 1].dataTs : 0;
        const cutoff = getCutoffTs(intervalo, nowTs);
        filtered = filtered.filter((p) => p.dataTs >= cutoff);
      }

      out[ex] = filtered;
    });
    return out;
  }, [dadosAgrupados, exercicios, intervalo, treinosSelecionados]);

  const exerciciosExibidos = exercicioSelecionado
    ? [exercicioSelecionado]
    : exercicios;

  return (
    <GraphicsWrapper>
      <HeaderControls>
       <h2 style={{ textAlign: "center", width: "100%", color: "#0d47a1", fontSize: "20px", margin: 0 }}>
  Progressão — Top Set + Back-off
</h2>
        <p style={{ margin: 0, color: "#0d47a1", fontWeight: 600 }}>
          Filtrar por treino:
        </p>
        <CheckboxGroup
          options={ROTACAO.map((r) => ({
            linhaCima: r.titulo,
            linhaBaixo: r.dia,
            value: r.id,
          }))}
          selected={treinosSelecionados}
          onChange={setTreinosSelecionados}
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
          ciclosSelecionados={treinosSelecionados}
          isMobile={isMobile}
        />
      ))}

    </GraphicsWrapper>
  );
};
