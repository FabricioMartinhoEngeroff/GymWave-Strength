import {
  CardContainer,
  ButtonRow,
  TituloPrincipal,
  Bloco,
  MensagemMotivacional,
} from "./CycleCard.styles";

import {
  useCycleCardLogic,
  parseData,
  formatarData,
  useSugestaoDePeso
} from "./CycleCard.logic";


import { CheckboxGroup } from "../ui/CheckboxGroup";
import { CustomSelect } from "../ui/Select";
import { DatePicker } from "../ui/DatePicker";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { CheckCircle } from "phosphor-react";


import { EXERCICIOS } from "../../data/exercise";
import { ROTACAO } from "../../data/cycles";
import type { RegistroTreino } from "../../types/TrainingData";
import { useMemo, useState } from "react";

interface CycleCardProps {
  value?: RegistroTreino;
  onSave: (registro: RegistroTreino & { ciclo: string }) => void;
}

export default function CycleCard({ value, onSave }: CycleCardProps) {
  const [cicloSelecionado, setCicloSelecionado] = useState<string>(ROTACAO[0].id);

  const cicloInfo = ROTACAO.find((c) => c.id === cicloSelecionado) || ROTACAO[0];

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

  const { pesoMaximo, sugestaoPeso } = useSugestaoDePeso(cicloInfo, exercicioSelecionado);

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

  const abrirGraficoPowerlifter = () => {
  window.open("/grafico-powerlifter", "_blank");
};

  const abrirRelatorio = () => {
    window.open("/relatorio", "_blank");
  };

  return (
  <CardContainer as="form" onSubmit={(e) => { e.preventDefault(); salvar(); }}>
    <Bloco>
      <TituloPrincipal>Registre seu Treino Ondulatório</TituloPrincipal>

      <p style={{ marginBottom: "1px" }}>
        Escolha o ciclo que você vai registrar hoje:
      </p>
      <CheckboxGroup
  options={ROTACAO.map((r) => ({
    linhaCima: r.titulo,
    linhaBaixo: r.dia,
    value: r.id,
  }))}
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
      Série máxima registrada: <strong>{pesoMaximo} kg</strong>
      <br />
      Sugestão para o ciclo atual:{" "}
      <span style={{ fontWeight: "bold", fontSize: "1.2em" }}>{sugestaoPeso} kg</span>.
      <br />
      <em>{cicloInfo.titulo}</em>
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
  <div key={i} style={{ marginBottom: "16px" }}>
    <p style={{ marginBottom: "6px", fontWeight: "bold", fontSize: "18px" }}>
  {i === 0 && "1ª Série - Top Set."}
{i === 1 && "2ª Série - Down Set."}
{i === 2 && "3ª Série - Down Set."}
</p>
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
  <label style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "-9px" }}>Peso (kg)</label>
  <Input
    type="number"
    placeholder="Digite o peso"
    value={pesos[i]}
    onChange={(e) => handleArrayChange("pesos", i, e.target.value)}
  />

  <label style={{ fontWeight: "bold", fontSize: "12px", marginBottom: "-9px" }}>Repetições</label>
  <Input
    type="number"
    placeholder="Digite as repetições"
    value={repeticoes[i]}
    onChange={(e) => handleArrayChange("reps", i, e.target.value)}
  />
</div>
  </div>
))}

{/* Observações separadas com margem antes do botão */}
<div style={{ marginTop: "-20px", marginBottom: "-19px" }}>
  <label htmlFor="obs" style={{ fontWeight: "bold", fontSize: "16px", marginBottom: "6px", display: "block" }}>
    Observações
  </label>
  <textarea
    id="obs"
    rows={3}
    placeholder="Digite suas observações"
    style={{
       width: "100%",
  maxWidth: "100%", // Evita ultrapassar o container
  boxSizing: "border-box", // Inclui padding na largura total
  height: "80px",
  resize: "vertical",
  fontSize: "15px",
  padding: "8px",
  borderRadius: "6px",
  border: "2px solid #ccc"
    }}
    value={obs}
    onChange={(e) => setObs(e.target.value)}
  />
</div>

<div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", padding: "0 8px" }}>
  <Button
    onClick={salvar}
    type="button"
    style={{
      width: "100%", // Garante que se ajuste ao container sem quebrar
  maxWidth: "400px", // Limita o tamanho em telas grandes
  padding: "12px 24px", // Padding proporcional e acessível
  fontSize: "22px",
  backgroundColor: "#e6f0ff",
  color: "#005bb5",
  border: "2px solid #b3d1ff",
  borderRadius: "12px",
  boxSizing: "border-box" // Garante que padding não ultrapasse o limite
}}
  >
    {salvando ? (
      <>
        <CheckCircle size={14} weight="fill" color="#005bb5" style={{ marginRight: 6 }} />
        Salvo!
      </>
    ) : (
      <>Salvar</>
    )}
  </Button>
</div>

      {/* Botões extras */}
    <ButtonRow
  style={{
    marginTop: "0px",
    flexDirection: "column",
    gap: "1px",
    padding: "0 8px",
  }}
>
  <Button type="button" variant="outline" fullWidth onClick={exportarDados}>
    Exportar Dados
  </Button>

  <Button type="button" variant="outline" fullWidth onClick={abrirGraficos}>
    Ver Gráficos
  </Button>

  {/* 🔹 NOVO BOTÃO COM A FUNÇÃO CRIADA */}
  <Button
    type="button"
    variant="outline"
    fullWidth
    onClick={abrirGraficoPowerlifter}
  >
    Ver Gráfico Moderno
  </Button>

  <Button type="button" variant="outline" fullWidth onClick={abrirRelatorio}>
    Ver Relatório
  </Button>
</ButtonRow>

    </Bloco>
  </CardContainer>
);

}
