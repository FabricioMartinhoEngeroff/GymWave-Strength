import {
  CardContainer,
  ObservationsField,
  ButtonRow,
  TituloPrincipal,
  Bloco,
  MensagemMotivacional,
} from "./CycleCard.styles";

import { useCycleCardLogic } from "./CycleCard.logic";
import { CheckboxGroup } from "../ui/CheckboxGroup";
import { CustomSelect } from "../ui/Select";
import { DatePicker } from "../ui/DatePicker";
import { PesoPicker } from "../ui/PesoPicker";
import { Input } from "../ui/Input";
import { SaveButton } from "./SaveButton";

import { EXERCICIOS } from "../../data/exercise";
import { CICLOS, CicloInfo } from "../../data/cycles";
import { RegistroTreino } from "../../types/TrainingData";

import { useMemo, useState } from "react";

interface CycleCardProps {
  value?: RegistroTreino;
  onSave: (registro: RegistroTreino) => void;
}

export default function CycleCard({ value, onSave }: CycleCardProps) {
  const [cicloSelecionado, setCicloSelecionado] = useState<string>(CICLOS[0].id);

  const cicloInfo = CICLOS.find((c) => c.id === cicloSelecionado) || CICLOS[0];

  const {
    pesos,
    repeticoes,
    obs,
    data,
    salvando,
    exercicioSelecionado,
    setObs,
    setData,
    setExercicioSelecionado,
    handleArrayChange,
    salvar,
  } = useCycleCardLogic({ ciclo: cicloSelecionado, value, onSave });

  const exercicioOptions = useMemo(
    () => EXERCICIOS.map((ex) => ({ label: ex, value: ex })),
    []
  );

  const sugestaoPeso = calcularPesoSugestivo(cicloInfo);

  return (
    <CardContainer>
      <TituloPrincipal>Registre seu Treino Ondulatório</TituloPrincipal>

      <Bloco>
        <p>Escolha o ciclo que você vai registrar hoje:</p>
        <CheckboxGroup
          options={CICLOS.map((c) => c.id)}
          selected={cicloSelecionado}
          onChange={setCicloSelecionado}
        />
      </Bloco>

      <Bloco>
        <p>Escolha seu exercício:</p>
        <CustomSelect
          options={exercicioOptions}
          value={
            exercicioSelecionado
              ? { label: exercicioSelecionado, value: exercicioSelecionado }
              : null
          }
          onChange={(option) =>
            setExercicioSelecionado(option?.value || "")
          }
        />
      </Bloco>

      <MensagemMotivacional>
        Com base no seu histórico, você deve fazer {cicloInfo.reps} com cerca de {sugestaoPeso} kg
      </MensagemMotivacional>

      <Bloco>
        <p>Data</p>
        <DatePicker
          selected={parseData(data)}
          onChange={(date) => setData(date ? formatarData(date) : "")}
        />
      </Bloco>

      {[0, 1, 2].map((i) => (
        <Bloco key={i}>
          <p>Série {i + 1} – insira como foi</p>
          <PesoPicker
            value={Number(pesos[i]) || 0}
            onChange={(val) => handleArrayChange("pesos", i, val.toString())}
          />
          <Input
            type="number"
            placeholder={`Repetições`}
            value={repeticoes[i]}
            onChange={(e) => handleArrayChange("reps", i, e.target.value)}
          />
        </Bloco>
      ))}

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

function calcularPesoSugestivo(ciclo: CicloInfo): number {
  // Simulação: pegando último pico como 100kg
  const pico = 100;
  if (ciclo.percentual.includes("-17%")) return Math.round(pico * 0.83);
  if (ciclo.percentual.includes("-10%")) return Math.round(pico * 0.9);
  if (ciclo.percentual.includes("0%")) return pico;
  if (ciclo.percentual.includes("+5%")) return Math.round(pico * 1.05);
  return 60;
}

function parseData(data: string): Date | null {
  const [dia, mes, ano] = data.split("/");
  return new Date(`${ano}-${mes}-${dia}`);
}

function formatarData(date: Date): string {
  return date.toLocaleDateString("pt-BR");
}
