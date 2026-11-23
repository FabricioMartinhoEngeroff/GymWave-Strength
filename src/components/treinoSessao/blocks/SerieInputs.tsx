import { InputBox, InputSm, SerieLabel, SerieRow, SeriesGrid, Unit } from "../TreinoSessao.styles";

interface SerieInputsProps {
  /** Prefixo dos aria-labels: "Top Set 1", "Série 2 bloco 3"… */
  titulo: string;
  exercicio: string;
  kg: string;
  reps: string;
  onKg: (v: string) => void;
  onReps: (v: string) => void;
  sugestao?: boolean;
  /** Destaca em vermelho os campos sem valor válido. */
  aviso?: boolean;
}

export function SerieInputs({ titulo, exercicio, kg, reps, onKg, onReps, sugestao = false, aviso = false }: SerieInputsProps) {
  return (
    <SeriesGrid>
      <SerieRow>
        <SerieLabel>Peso</SerieLabel>
        <InputBox
          type="number"
          placeholder="kg"
          value={kg}
          onChange={(e) => onKg(e.target.value)}
          $invalid={aviso && !(parseFloat(kg) > 0)}
          $isSuggestion={sugestao}
          data-suggestion={sugestao ? "true" : undefined}
          aria-label={`${titulo} kg ${exercicio}`}
        />
        <Unit>kg</Unit>
      </SerieRow>
      <SerieRow>
        <SerieLabel>Reps</SerieLabel>
        <InputSm
          type="number"
          placeholder="reps"
          value={reps}
          onChange={(e) => onReps(e.target.value)}
          $invalid={aviso && !(parseInt(reps) > 0)}
          aria-label={`${titulo} reps ${exercicio}`}
        />
        <Unit>reps</Unit>
      </SerieRow>
    </SeriesGrid>
  );
}
