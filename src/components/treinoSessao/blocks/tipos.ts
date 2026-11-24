import type { ExercicioSessao } from "../../../data/sessionExercises";
import type { EscalaEsforco } from "../../../utils/esforco";
import type { CampoRpe, ExerciseState, PatchExercicio } from "../domain/estadoExercicio";

/** Escala em que o esforço aparece na tela e o botão de troca. */
export interface EscalaProps {
  escala: EscalaEsforco;
  onTrocarEscala: () => void;
}

export interface BlocoProps extends EscalaProps {
  ex: ExercicioSessao;
  state: ExerciseState;
  onChange: (patch: PatchExercicio) => void;
  /** Séries que bloquearam o avanço por falta de esforço (RG27). */
  semEsforco: CampoRpe[];
}

/** Bloco com botão de confirmar e aviso de preenchimento. */
export interface BlocoConfirmavelProps extends BlocoProps {
  aviso: boolean;
  onConfirmar: () => void;
  onEditar: () => void;
}
