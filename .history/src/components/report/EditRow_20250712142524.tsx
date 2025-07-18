
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
  margin: 1px 0 4px; /* ↑ ↓ controla espaçamento superior e inferior */
  display: block;
`;

const FieldGroup = styled.div`
  margin-bottom: -16px;
`;

const SeriesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px; 
  margin-bottom: 16px;
`;

const SerieFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0px; 
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 2px;
  margin-top: 10px;

  button {
    flex: 1;
    min-width: 120px;
    max-width: 200px;
    font-size: 16px;
    padding: 12px;
  }
`;

const EditContainer = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin: 20px ;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
  max-width: 100%;
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
       <EditContainer>
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
      value={s.rep}
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
      value={s.peso}
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
        <Button
  onClick={() => {
    salvarEdicao(rowIndex, linhaEditada);
    cancelarEdicao(); // <- Sai do modo edição após salvar
  }}
>
  Salvar
</Button>
      </ActionButtons>
      </EditContainer>
    </div>
  );
}
