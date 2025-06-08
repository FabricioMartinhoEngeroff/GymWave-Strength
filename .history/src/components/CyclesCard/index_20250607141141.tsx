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
import { Button } from "../ui/Button";
import { SaveButton } from "./SaveButton";

import { EXERCICIOS } from "../../data/exercise";
import { useMemo } from "react";

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
    exercicioSelecionado,
    setObs,
    setData,
    setExercicioSelecionado,
    handleArrayChange,
    salvar,
  } = useCycleCardLogic({ ciclo, value, onSave });

  const exercicioOptions = useMemo(
    () =>
      EXERCICIOS.map((ex) => ({
        label: ex,
        value: ex,
      })),
    []
  );

  return (
    <CardContainer>
      <TituloPrincipal>Registre seu Treino Ondulatório</TituloPrincipal>

      <Bloco>
        <p>Escolha o ciclo que você vai registrar hoje:</p>
        <CheckboxGroup
          options={["Ciclo 0", "Ciclo 1", "Ciclo 2", "Ciclo 3", "Ciclo 4"]}
          selected={ciclo}
          onChange={(v) => console.log("Futuro ciclo:", v)}
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
        Com base no seu histórico, você deve fazer {reps} repetições de{" "}
        {pesoSugestivo(ciclo)} kg
      </MensagemMotivacional>

      <Bloco>
        <p>Data</p>
        <DatePicker
          selected={parseData(data)}
          onChange={(date) =>
            setData(date ? formatarData(date) : "")
          }
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
            onChange={(e) =>
              handleArrayChange("reps", i, e.target.value)
            }
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

// Funções utilitárias
function parseData(data: string): Date | null {
  const [dia, mes, ano] = data.split("/");
  return new Date(`${ano}-${mes}-${dia}`);
}

function formatarData(date: Date): string {
  return date.toLocaleDateString("pt-BR");
}

function pesoSugestivo(ciclo: string): number {
  // Lógica temporária para exemplo, substitua por sua lógica real
  if (ciclo === "Ciclo 4") return 80;
  if (ciclo === "Ciclo 3") return 72;
  return 60;
}
