import styled from "styled-components";
import { Input } from "../ui/Input";

interface SeriesInputsProps {
  pesos: string[];
  reps: string[];
  onPesoChange: (index: number, valor: string) => void;
  onRepsChange: (index: number, valor: string) => void;
}

const SeriesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SerieBlock = styled.div`
  display: flex;
  flex-direction: column;
`;

const SerieLabel = styled.span`
  font-weight: 600;
  margin-bottom: 4px;
  color: #1a237e;
  font-size: 14px;
`;

const InputsRow = styled.div`
  display: flex;
  gap: 8px;
`;

export function SeriesInputs({
  pesos,
  reps,
  onPesoChange,
  onRepsChange,
}: SeriesInputsProps) {
  return (
    <SeriesContainer>
      {Array.from({ length: 3 }).map((_, index) => (
        <SerieBlock key={index}>
          <SerieLabel>Série {index + 1} – insira como foi</SerieLabel>
          <InputsRow>
            <Input
              type="number"
              placeholder={`Peso ${index + 1} (kg)`}
              value={pesos[index]}
              onChange={(e) => onPesoChange(index, e.target.value)}
            />
            <Input
              type="number"
              placeholder={`Reps ${index + 1}`}
              value={reps[index]}
              onChange={(e) => onRepsChange(index, e.target.value)}
            />
          </InputsRow>
        </SerieBlock>
      ))}
    </SeriesContainer>
  );
}
