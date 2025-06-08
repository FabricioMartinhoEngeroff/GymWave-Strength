import { PageWrapper } from "../ui/PageWrapper";
import { HeaderBox } from "./ReportHeaderBox"; // ou dentro do próprio componente

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
