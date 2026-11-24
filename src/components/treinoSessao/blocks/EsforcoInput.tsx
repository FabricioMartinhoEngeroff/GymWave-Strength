import { ArrowLeftRight, Gauge } from "lucide-react";
import { rotuloChip, rotuloEsforco, RPES } from "../../../utils/esforco";
import { EscalaBtn, EsforcoAcoes, EsforcoChip, EsforcoChips, EsforcoTitulo, EsforcoTopo } from "../TreinoSessao.styles";
import { AjudaEsforco } from "./AjudaEsforco";
import type { EscalaProps } from "./tipos";

interface EsforcoInputProps extends EscalaProps {
  serie: string;
  exercicio: string;
  valor: number | null;
  onChange: (rpe: number | null) => void;
}

const nivel = (rpe: number) => (rpe < 8 ? "leve" : rpe < 9 ? "moderado" : "alto");

/** Esforço da série num toque (RG20). Opcional: tocar no chip marcado desmarca. */
export function EsforcoInput({ serie, exercicio, valor, onChange, escala, onTrocarEscala }: EsforcoInputProps) {
  const outra = escala === "RPE" ? "RIR" : "RPE";

  return (
    <div role="group" aria-label={`Esforço ${serie} ${exercicio}`}>
      <EsforcoTopo>
        <EsforcoTitulo>
          <Gauge size={14} strokeWidth={1.8} aria-hidden />
          {escala === "RPE" ? "Esforço (RPE)" : "Reps na reserva (RIR)"}
        </EsforcoTitulo>
        <EsforcoAcoes>
          <EscalaBtn type="button" onClick={onTrocarEscala} aria-label={`Trocar para ${outra}`}>
            <ArrowLeftRight size={12} strokeWidth={1.8} aria-hidden />
            {outra}
          </EscalaBtn>
          <AjudaEsforco />
        </EsforcoAcoes>
      </EsforcoTopo>
      <EsforcoChips>
        {RPES.map((rpe) => (
          <EsforcoChip
            key={rpe}
            type="button"
            $ativo={valor === rpe}
            $nivel={nivel(rpe)}
            aria-pressed={valor === rpe}
            aria-label={rotuloEsforco(rpe, escala)}
            onClick={() => onChange(valor === rpe ? null : rpe)}
          >
            {rotuloChip(rpe, escala)}
          </EsforcoChip>
        ))}
      </EsforcoChips>
    </div>
  );
}
