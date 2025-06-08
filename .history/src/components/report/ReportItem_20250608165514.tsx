// Refatorado: ReportItem.tsx com botões maiores, campo observação com margem e ícone

import type { LinhaRelatorio, SerieInfo } from "../../types/TrainingData";
import { Button } from "../ui/Button";
import styled from "styled-components";
import { FileTextIcon } from "@phosphor-icons/react";

interface ReportItemProps {
  linha: LinhaRelatorio;
  onEdit: () => void;
  onDelete: () => void;
  isMobile: boolean;
}

export const HeaderBox = styled.div`
  background: #ffffff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
  width: 100%;

  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: 480px) {
    padding: 12px;
    border-radius: 0;
  }

  h1 {
    margin-bottom: 12px;
    font-size: 22px;
    color: #003366;
    text-align: center;
  }
`;

const Card = styled.div`
  background: #fff;
  border-radius: 20px;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 40px;
  border: 1px solid #e2e8f0;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 480px) {
    border-radius: 0;
    padding: 16px;
  }
`;

const Label = styled.p`
  font-size: 14px;
  margin: 6px 0;
  color: #333;
  span {
    font-weight: bold;
    color: #004080;
  }
`;

const SerieLine = styled.div`
  background-color: #f1f5f9;
  padding: 8px 12px;
  border-radius: 6px;
  margin-top: 5px;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
`;

const Observacoes = styled.div`
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  padding: 10px 12px;
  border-radius: 8px;
  margin-top: 16px;
  display: flex;
  align-items: flex-start;
  gap: 8px;

  font-size: 14px;
  color: #444;

  word-break: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  max-width: 100%;

  svg {
    margin-top: 2px;
    color: #6b7280;
    flex-shrink: 0;
  }

  span {
    flex: 1;
  }

  strong {
    color: #333;
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;

  button {
    flex: 1;
    min-width: 120px;
    max-width: 200px;
    font-size: 16px;
    padding: 12px;
  }
`;

export const PageWrapper = styled.div`
  max-width: 100%;
  margin: 0 auto;
  padding: 16px;
  box-sizing: border-box;
  width: 100%;
  background: #f2f6fc;

  @media (max-width: 480px) {
    border-radius: 0;
    padding: 12px;
  }
`;

export function ReportItem({ linha, onEdit, onDelete }: ReportItemProps) {
  return (
    <Card>
      <Label><span>Data:</span> {linha.data}</Label>
      <Label><span>Exercício:</span> {linha.exercicio}</Label>
      <Label><span>Ciclo:</span> {linha.ciclo}</Label>
      <Label><span>Observações:</span></Label>

      {linha.series.map((s: SerieInfo) => (
        <SerieLine key={s.serie}>
          <span>Série {s.serie}</span>
          <span>{s.rep} reps × {s.peso} kg</span>
        </SerieLine>
      ))}

      {linha.obs && (
        <Observacoes>
  <FileTextIcon size={16} weight="duotone" />
  <span>{linha.obs}</span>
</Observacoes>
      )}

      <Actions>
        <Button onClick={onEdit} variant="outline">Editar</Button>
        <Button onClick={onDelete} variant="danger">Excluir</Button>
      </Actions>
    </Card>
  );
}