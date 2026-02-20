import { useRelatorio } from "../../hooks/useRelatorio";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { ReportList } from "../report/ReportList";
import { PageWrapper, HeaderBox } from "../report/ReportItem";
import { NativeSelect } from "../ui/NativeSelect";
import { TIME_INTERVAL_OPTIONS, type TimeInterval } from "../../utils/timeFilter";
import "./Report.module.css";

export default function ReportPage() {
  const {
    linhasFiltradas,
    salvarEdicao,
    excluirLinha,
    exerciciosDisponiveis,
    exercicioSelecionado,
    setExercicioSelecionado,
    intervalo,
    setIntervalo,
  } = useRelatorio();
  const isMobile = useBreakpoint(600);

return (
    <PageWrapper>
      <HeaderBox>
        <h1>Relatórios de Treinos</h1>
        <div style={{ width: "100%", display: "flex", flexWrap: "wrap", gap: 12 }}>
          <div style={{ flex: 1, minWidth: isMobile ? "100%" : 260 }}>
            <NativeSelect
              label="Exercício"
              value={exercicioSelecionado}
              onChange={setExercicioSelecionado}
              options={[
                { label: "Todos os exercícios", value: "" },
                ...exerciciosDisponiveis.map((ex) => ({ label: ex, value: ex })),
              ]}
            />
          </div>
          <div style={{ flex: 1, minWidth: isMobile ? "100%" : 220 }}>
            <NativeSelect
              label="Período"
              value={intervalo}
              onChange={(v) => setIntervalo(v as TimeInterval)}
              options={TIME_INTERVAL_OPTIONS}
            />
          </div>
        </div>
      </HeaderBox>

      <ReportList
        linhas={linhasFiltradas}
        salvarEdicao={salvarEdicao}
        excluirLinha={excluirLinha}
        isMobile={isMobile}
      />
    </PageWrapper>
  );
}
