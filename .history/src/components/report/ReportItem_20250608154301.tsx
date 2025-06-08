import type { LinhaRelatorio, SerieInfo } from "../../types/TrainingData";
import { Button } from "../ui/Button";
import styled from "styled-components";

interface ReportItemProps {
  linha: LinhaRelatorio;
  onEdit: () => void;
  onDelete: () => void;
  isMobile: boolean;
}

const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
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
  margin-top: 6px;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
`;

const Observacoes = styled.div`
  font-size: 13px;
  color: #444;
  margin-top: 12px;
  border-top: 1px solid #e5e7eb;
  padding-top: 10px;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
`;

export function ReportItem({ linha, onEdit, onDelete }: ReportItemProps) {
  return (
    <Card>
      <Label><span>Data:</span> {linha.data}</Label>
      <Label><span>Exercício:</span> {linha.exercicio}</Label>
      <Label><span>Ciclo:</span> {linha.ciclo}</Label>

      {linha.series.map((s: SerieInfo) => (
        <SerieLine key={s.serie}>
          <span>Série {s.serie}</span>
          <span>{s.rep} reps × {s.peso} kg</span>
        </SerieLine>
      ))}

      {linha.obs && (
        <Observacoes>
          <strong>Observações:</strong> {linha.obs}
        </Observacoes>
      )}

      <Actions>
        <Button onClick={onEdit} variant="outline">Editar</Button>
        <Button onClick={onDelete} variant="danger">Excluir</Button>
      </Actions>
    </Card>
  );
}