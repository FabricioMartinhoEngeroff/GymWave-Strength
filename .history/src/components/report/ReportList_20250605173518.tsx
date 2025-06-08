import React, { useState, useEffect } from "react";
import type { LinhaRelatorio } from "./types";
import { ReportItem } from "./ReportItem";
import { EditRow } from "./EditRow";

interface ReportListProps {
  linhas: LinhaRelatorio[];
  salvarEdicao: (idx: number, linhaEditada: Partial<LinhaRelatorio>) => void;
  excluirLinha: (idx: number) => void;
  isMobile: boolean;
}

export function ReportList({
  linhas,
  salvarEdicao,
  excluirLinha,
  isMobile,
}: ReportListProps) {
  const [editandoIdx, setEditandoIdx] = useState<number | null>(null);
  const [linhaEditada, setLinhaEditada] = useState<Partial<LinhaRelatorio>>({});

  // Se o array “linhas” diminuir e o índice em edição for inválido, cancela edição
  useEffect(() => {
    if (editandoIdx !== null && editandoIdx >= linhas.length) {
      setEditandoIdx(null);
    }
  }, [linhas, editandoIdx]);

  return (
    <>
      {linhas.map((l, idx) => (
        <div key={idx}>
          {editandoIdx === idx ? (
            <EditRow
              rowIndex={idx}
              linha={l}
              linhaEditada={linhaEditada}
              setLinhaEditada={setLinhaEditada}
              salvarEdicao={salvarEdicao}
              cancelarEdicao={() => setEditandoIdx(null)}
              isMobile={isMobile}
            />
          ) : (
            <ReportItem
              linha={l}
              onEdit={() => {
                setEditandoIdx(idx);
                setLinhaEditada({ ...l, series: l.series.map((s) => ({ ...s })) });
              }}
              onDelete={() => excluirLinha(idx)}
              isMobile={isMobile}
            />
          )}
        </div>
      ))}
    </>
  );
}