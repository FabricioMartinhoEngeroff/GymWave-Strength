import React, { useMemo, useState, useEffect } from "react";
import { useDadosTreino } from "../../hooks/useDadosTreino";
import { ChartCard } from "./ChartCard";
import { VolumeLoadCard } from "./VolumeLoadCard";
import styled from "styled-components";
import { ROTACAO } from "../../data/cycles";
import { CheckboxGroup } from "../ui/CheckboxGroup";
import { NativeSelect } from "../ui/NativeSelect";
import { getCutoffTs, TIME_INTERVAL_OPTIONS, type TimeInterval } from "../../utils/timeFilter";
import { GRANULARIDADE_OPTIONS, type Granularidade } from "../../utils/volumeBuckets";
import type { RegistroGraficoRaw } from "../../hooks/useDadosTreino";
import { ChartLineUp, Funnel, CaretDown, TrendUp, Barbell } from "phosphor-react";

type Visao = "progressao" | "volume";

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
    padding: 16px 12px;
    border-radius: 0;
    gap: 12px;
  }
`;

const PageTitle = styled.h2`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  width: 100%;
  color: #0d47a1;
  font-size: 20px;
  margin: 0;

  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

const HeaderControls = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 8px;
  align-items: flex-start;
`;

const FiltersToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  align-self: center;
  background: #eef4ff;
  color: #0d47a1;
  border: 1px solid #d3e2fb;
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  svg:last-child {
    transition: transform 0.15s ease;
  }
`;

const FiltersPanel = styled.div<{ $open: boolean }>`
  display: ${({ $open }) => ($open ? "flex" : "none")};
  flex-direction: column;
  gap: 10px;
  width: 100%;
  align-items: flex-start;
`;

const Segmented = styled.div`
  display: flex;
  width: 100%;
  background: #eef1f6;
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
`;

const SegmentButton = styled.button<{ $active: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  border-radius: 9px;
  padding: 9px 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  background: ${({ $active }) => ($active ? "#0d47a1" : "transparent")};
  color: ${({ $active }) => ($active ? "#fff" : "#0d47a1")};
  transition: background 0.15s ease, color 0.15s ease;
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
  const [filtrosAbertos, setFiltrosAbertos] = useState(true);
  const [visao, setVisao] = useState<Visao>("progressao");
  const [granularidade, setGranularidade] = useState<Granularidade>("semana");

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
        <PageTitle>
          <ChartLineUp size={22} weight="duotone" />
          {visao === "progressao" ? "Progressão — Top Set + Back-off" : "Volume Load por período"}
        </PageTitle>

        <Segmented>
          <SegmentButton type="button" $active={visao === "progressao"} onClick={() => setVisao("progressao")}>
            <TrendUp size={15} weight="bold" />
            Progressão
          </SegmentButton>
          <SegmentButton type="button" $active={visao === "volume"} onClick={() => setVisao("volume")}>
            <Barbell size={15} weight="bold" />
            Volume Load
          </SegmentButton>
        </Segmented>

        {visao === "volume" && (
          <Segmented>
            {GRANULARIDADE_OPTIONS.map((opt) => (
              <SegmentButton
                key={opt.value}
                type="button"
                $active={granularidade === opt.value}
                onClick={() => setGranularidade(opt.value)}
              >
                {opt.label}
              </SegmentButton>
            ))}
          </Segmented>
        )}

        <FiltersToggle
          type="button"
          onClick={() => setFiltrosAbertos((v) => !v)}
          aria-expanded={filtrosAbertos}
        >
          <Funnel size={15} weight="bold" />
          {filtrosAbertos ? "Ocultar filtros" : "Mostrar filtros"}
          <CaretDown
            size={13}
            weight="bold"
            style={{ transform: filtrosAbertos ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </FiltersToggle>

        <FiltersPanel $open={filtrosAbertos}>
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
        </FiltersPanel>
      </HeaderControls>

      {exerciciosExibidos.length === 0 && (
        <p style={{ padding: 16, color: "#555" }}>Nenhum exercício encontrado.</p>
      )}

      {visao === "progressao"
        ? exerciciosExibidos.map((ex) => (
            <ChartCard
              key={ex}
              exercicio={ex}
              dados={dadosPorExercicioFiltrados[ex] ?? []}
              ciclosSelecionados={treinosSelecionados}
              isMobile={isMobile}
            />
          ))
        : exerciciosExibidos.map((ex) => (
            <VolumeLoadCard
              key={ex}
              exercicio={ex}
              dados={dadosPorExercicioFiltrados[ex] ?? []}
              ciclosSelecionados={treinosSelecionados}
              granularidade={granularidade}
              isMobile={isMobile}
            />
          ))}

    </GraphicsWrapper>
  );
};
