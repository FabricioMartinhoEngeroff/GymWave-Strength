import {
  CardContainer,
  SelectorRow,
  ObservationsField,
  ButtonRow,
  DateWrapper,
} from "./CycleCard.styles";

import { Input } from "../ui/Input";
import { CalendarBlank } from "phosphor-react";
import { Button } from "../ui/Button";
import { SaveButton } from "./SaveButton";
import { CycleHeader } from "./CycleHeader";
import { SeriesInputs } from "./SeriesInputs";
import { CycleInstruction } from "./CycleInstruction";
import { useCycleCardLogic } from "./CycleCard.logic";
import { EXERCICIOS } from "../../data/exercise";

interface CycleCardProps {
  ciclo: string;
  percentual: string;
  reps: string;
  value?: {
    data?: string;
    pesos?: string[];
    reps?: string[];
    obs?: string;
    exercicio?: string;
  };
  onSave: (registro: {
    data: string;
    pesos: string[];
    reps: string[];
    obs: string;
    exercicio: string;
  }) => void;
}

export default function CycleCard({
  ciclo,
  percentual,
  reps,
  value,
  onSave,
}: CycleCardProps) {
  const {
    pesos,
    repeticoes,
    obs,
    data,
    salvando,
    selecionando,
    exercicioSelecionado,
    setData,
    setObs,
    setSelecionando,
    setExercicioSelecionado,
    handleArrayChange,
    salvar,
  } = useCycleCardLogic({ ciclo, value, onSave });

  return (
    <CardContainer>
      <CycleInstruction />
      <CycleHeader ciclo={ciclo} percentual={percentual} reps={reps} />

      <SelectorRow>
        {!selecionando ? (
          <Button onClick={() => setSelecionando(true)}>
            {exercicioSelecionado || "Selecione seu exercício"}
          </Button>
        ) : (
          <select
            autoFocus
            value={exercicioSelecionado}
            onChange={(e) => {
              setExercicioSelecionado(e.target.value);
              setSelecionando(false);
            }}
            onBlur={() => setSelecionando(false)}
          >
            <option value="" disabled hidden>
              Selecione seu exercício
            </option>
            {EXERCICIOS.map((ex) => (
              <option key={ex} value={ex}>
                {ex}
              </option>
            ))}
          </select>
        )}

        <DateWrapper>
          <CalendarBlank
            size={18}
            weight="duotone"
            color="#9e9e9e"
            style={{ marginRight: 4 }}
          />
          <Input
            type="text"
            placeholder="DD/MM/AAAA"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
        </DateWrapper>
      </SelectorRow>

      <SeriesInputs
        pesos={pesos}
        reps={repeticoes}
        onPesoChange={(index, val) => handleArrayChange("pesos", index, val)}
        onRepsChange={(index, val) => handleArrayChange("reps", index, val)}
      />

      <ObservationsField>
        <Input
          type="text"
          placeholder="Observações"
          value={obs}
          onChange={(e) => setObs(e.target.value)}
        />
      </ObservationsField>

      <ButtonRow>
        <SaveButton salvando={salvando} onClickSalvar={salvar} />
      </ButtonRow>
    </CardContainer>
  );
}
