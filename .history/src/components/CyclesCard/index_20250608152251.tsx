import {
  CardContainer,
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
import { CheckCircle } from "phosphor-react";

import { EXERCICIOS } from "../../data/exercise";
import { CICLOS, CicloInfo } from "../../data/cycles";
import { RegistroTreino } from "../../types/TrainingData";
import { useMemo, useState } from "react";

interface CycleCardProps {
  value?: RegistroTreino;
  onSave: (registro: RegistroTreino & { ciclo: string }) => void;
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
  } = useCycleCardLogic({
    ciclo: cicloSelecionado,
    value,
    onSave: (registroBase) => {
      onSave({ ...registroBase, ciclo: cicloSelecionado });
    },
  });

  const exercicioOptions = useMemo(
    () => EXERCICIOS.map((ex) => ({ label: ex, value: ex })),
    []
  );

  const sugestaoPeso = calcularPesoSugestivo(cicloInfo, exercicioSelecionado);

  const exportarDados = () => {
    const blob = new Blob([JSON.stringify(localStorage.getItem("dadosTreino") || {}, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dados_treino.json";
    a.click();
  };

  const abrirGraficos = () => {
    requestAnimationFrame(() => window.open("/graficos", "_blank"));
  };

  const abrirRelatorio = () => {
    window.open("/relatorio", "_blank");
  };

  const resetarDados = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
  <CardContainer as="form" onSubmit={(e) => { e.preventDefault(); salvar(); }}>
    <Bloco>
      <TituloPrincipal>Registre seu Treino Ondulatório</TituloPrincipal>

      <p style={{ marginBottom: "1px" }}>
        Escolha o ciclo que você vai registrar hoje:
      </p>
      <CheckboxGroup
  options={CICLOS.map((c, i) => {
    const partes = c.titulo.split(" ");
    return {
      linhaCima: `Ciclo ${i + 1}`,
      linhaBaixo: partes.slice(1).join(" "),
      value: c.id,
    };
  })}
  selected={[cicloSelecionado]}
  onChange={([value]) => setCicloSelecionado(value)}
/>

      <p>Escolha seu exercício:</p>
      <CustomSelect
        options={exercicioOptions}
        value={
          exercicioSelecionado
            ? { label: exercicioSelecionado, value: exercicioSelecionado }
            : null
        }
        onChange={(option) => setExercicioSelecionado(option?.value || "")}
      />

     <MensagemMotivacional>
  {exercicioSelecionado && sugestaoPeso > 0 ? (
    <>
      Hora de evoluir! Com base nas suas <strong>séries válidas anteriores</strong> e no ciclo atual, a sugestão para hoje é em torno de{" "}
      <span style={{ fontWeight: "bold", fontSize: "1.2em" }}>{sugestaoPeso} kg</span>.
      <br />
      <em>{cicloInfo.objetivo}</em>
      <br />
      <strong>Força, guerreiro! 💪</strong>
    </>
  ) : (
    <>
      Selecione um exercício e registre o Ciclo 4 para receber sugestões personalizadas de carga.
    </>
  )}
</MensagemMotivacional>


      <DatePicker
  selected={parseData(data)}
  onChange={(date) => setData(date ? formatarData(date) : "")}
/>

      {[0, 1, 2].map((i) => (
  <div key={i}>
    <p>Série {i + 1} – insira o peso utilizado</p>
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
        </div>
      ))}

      {/* Observações e botão Salvar um abaixo do outro */}
      <div style={{ marginTop: "24px" }}>
        <label htmlFor="obs" style={{ fontWeight: "bold", fontSize: "16px" }}>Observações</label>
        <textarea
          id="obs"
          rows={3}
          placeholder="Digite suas observações"
          style={{ marginTop: "1px", width: "100%", height: "80px", resize: "vertical", fontSize: "15px", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
          value={obs}
          onChange={(e) => setObs(e.target.value)}
        />

        <div style={{ marginTop: "0px", display: "flex", justifyContent: "center" }}>
          <Button
            onClick={salvar}
            type="button"
            style={{
              padding: "2px 170px",
              fontSize: "28px",
              backgroundColor: "#e6f0ff",
              color: "#005bb5",
              border: "2px solid #b3d1ff",
              borderRadius: "19px"
            }}
          >
            {salvando ? (
              <>
                <CheckCircle size={14} weight="fill" color="#005bb5" style={{ marginRight: 6 }} />
                Salvo!
              </>
            ) : (
              <>
                Salvar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Botões extras */}
      <ButtonRow style={{ marginTop: "0px", flexDirection: "column", gap: "1px" }}>
        <Button type="button" variant="outline" fullWidth onClick={exportarDados}>
          Exportar Dados
        </Button>
        <Button type="button" variant="outline" fullWidth onClick={abrirGraficos}>
          Ver Gráficos
        </Button>
        <Button type="button" variant="outline" fullWidth onClick={abrirRelatorio}>
          Ver Relatório
        </Button>
        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={resetarDados}
          style={{ color: "#b02a37", borderColor: "#b02a37",  backgroundColor: "#fff5f5"}}
        >
          Zerar Dados
        </Button>
      </ButtonRow>
    </Bloco>
  </CardContainer>
);

}

// --- Utils ---
function parseData(data: string): Date | null {
  if (!data) return null;
  const [day, month, year] = data.split("/");
  if (!day || !month || !year) return null;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function formatarData(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function calcularPesoSugestivo(ciclo: CicloInfo, exercicio: string): number {
  const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");

  // Sempre usa os dados do ciclo 4 como base
  const ciclo4 = db?.[exercicio]?.["C4"];
  if (!ciclo4 || !ciclo4.pesos) return 0;

  const pesos = ciclo4.pesos
    .map((p: string) => parseFloat(p))
    .filter((n: number) => !isNaN(n));

  const pico = pesos.length
    ? pesos.reduce((a: number, b: number) => a + b, 0) / pesos.length
    : 0;

  if (!pico) return 0;

  // Define os multiplicadores para cada ciclo
  const multiplicadores: Record<string, number> = {
    C1: 0.8,   
    C2: 0.9,   
    C3: 0.95,  
    C4: 1.05,  
  };

  const fator = multiplicadores[ciclo.id] ?? 1; // fallback para 1.0 (sem alteração)

  return Math.round(pico * fator);
}
