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
  gap: 16px;
`;

const SerieBloco = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SerieTitulo = styled.span`
  font-weight: 600;
  font-size: 15px;
  color: #0d47a1;
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
        <SerieBloco key={index}>
          <SerieTitulo>Série {index + 1} – insira como foi</SerieTitulo>

          <PesoPicker
            value={Number(pesos[index]) || 0}
            onChange={(value) =>
              onPesoChange(index, value.toString())
            }
          />

          <Input
            type="number"
            placeholder={`Repetições`}
            value={reps[index]}
            onChange={(e) => onRepsChange(index, e.target.value)}
          />
        </SerieBloco>
      ))}
    </SeriesContainer>
  );
}
