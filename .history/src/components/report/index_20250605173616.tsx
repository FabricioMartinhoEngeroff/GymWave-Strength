import React from "react";
import { useRelatorio } from "./hooks/useRelatorio";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { SearchBar } from "./SearchBar";
import { ReportList } from "./ReportList";
import "./Report.module.css"; 

export default function ReportPage() {
  const { linhasFiltradas, busca, setBusca, salvarEdicao, excluirLinha } = useRelatorio();
  const isMobile = useBreakpoint(600);

  return (
    <div className="report-container">
      <h1 className="report-title">Relatório de Treinos</h1>

      <SearchBar busca={busca} setBusca={setBusca} isMobile={isMobile} />

      <ReportList
        linhas={linhasFiltradas}
        salvarEdicao={salvarEdicao}
        excluirLinha={excluirLinha}
        isMobile={isMobile}
      />
    </div>
  );
}