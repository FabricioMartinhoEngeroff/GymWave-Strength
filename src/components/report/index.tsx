import { useRelatorio } from "../../hooks/useRelatorio";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { SearchBar } from "../report/SearchBar";
import { ReportList } from "../report/ReportList";
import { PageWrapper, HeaderBox } from "../report/ReportItem";
import "./Report.module.css";

export default function ReportPage() {
  const { linhasFiltradas, busca, setBusca, salvarEdicao, excluirLinha } = useRelatorio();
  const isMobile = useBreakpoint(600);

return (
    <PageWrapper>
      <HeaderBox>
        <h1>Relatório de Treinos</h1>
        <SearchBar busca={busca} setBusca={setBusca} isMobile={isMobile} />
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
