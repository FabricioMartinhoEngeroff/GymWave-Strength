import React from "react";
import type { LinhaRelatorio, SerieInfo } from "../../types/TrainingData";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { DatePicker } from "../ui/DatePicker";
import styled from "styled-components";

const Label = styled.label`
  font-weight: bold;
  font-size: 14px;
  color: #004080;
  margin-bottom: 4px;
  display: block;
`;

const FieldGroup = styled.div`
  margin-bottom: 16px;
`;

const SeriesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SerieFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;

  button {
    flex: 1;
    min-width: 120px;
    max-width: 200px;
    font-size: 16px;
    padding: 12px;
  }
`;

interface EditRowProps {
  rowIndex: number;
  linha: LinhaRelatorio;
  linhaEditada: Partial<LinhaRelatorio>;
  setLinhaEditada: React.Dispatch<React.SetStateAction<Partial<LinhaRelatorio>>>;
  salvarEdicao: (idx: number, linhaEditada: Partial<LinhaRelatorio>) => void;
  cancelarEdicao: () => void;
  isMobile: boolean;
}

export function EditRow({
  rowIndex,
  linha,
  linhaEditada,
  setLinhaEditada,
  salvarEdicao,
  cancelarEdicao,
  isMobile,
}: EditRowProps) {
  const getSeries = (): SerieInfo[] => linhaEditada.series ?? linha.series;

  const parseDate = (text: string): Date | null => {
    const [day, month, year] = text.split("/").map(Number);
    if (!day || !month || !year) return null;
    return new Date(year, month - 1, day);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <div className="report-card">
      <FieldGroup>
        <DatePicker
          selected={parseDate(linhaEditada.data ?? linha.data)}
          onChange={(date) => {
            setLinhaEditada((prev) => ({ ...prev, data: date ? formatDate(date) : "" }));
          }}
          label="Data"
        />
      </FieldGroup>

      <SeriesContainer>
        {getSeries().map((s: SerieInfo, i: number) => (
          <SerieFields key={i}>
            <Label>Série {i + 1}</Label>

            <Label>Repetições</Label>
            <Input
              type="text"
              placeholder="Ex.: 8 reps"
              value={getSeries()[i].rep}
              onChange={(e) => {
                const arr = getSeries().map((x) => ({ ...x }));
                arr[i].rep = e.target.value;
                setLinhaEditada((p) => ({ ...p, series: arr }));
              }}
              isMobile={isMobile}
            />

            <Label>Peso</Label>
            <Input
              type="text"
              placeholder="Ex.: 100 kg"
              value={getSeries()[i].peso}
              onChange={(e) => {
                const arr = getSeries().map((x) => ({ ...x }));
                arr[i].peso = e.target.value;
                setLinhaEditada((p) => ({ ...p, series: arr }));
              }}
              isMobile={isMobile}
            />
          </SerieFields>
        ))}
      </SeriesContainer>

      <FieldGroup>
        <Label>Observações</Label>
        <Input
          type="text"
          placeholder="Digite observações"
          value={linhaEditada.obs ?? linha.obs ?? ""}
          onChange={(e) => setLinhaEditada((p) => ({ ...p, obs: e.target.value }))}
          isMobile={isMobile}
        />
      </FieldGroup>

      <ActionButtons>
        <Button onClick={() => salvarEdicao(rowIndex, linhaEditada)}>Salvar</Button>
        <Button onClick={cancelarEdicao} variant="outline">Cancelar</Button>
      </ActionButtons>
    </div>
  );
}
