import { useCycleCardLogic } from "./CycleCard.logic";

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