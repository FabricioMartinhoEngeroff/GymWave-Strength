import { DadosTreino } from "../types/TrainingData";

export const salvarDados = (dados: DadosTreino) => {
  localStorage.setItem("dadosTreino", JSON.stringify(dados));
};

export const carregarDados = (): DadosTreino => {
  const local = localStorage.getItem("dadosTreino");
  return local ? JSON.parse(local) : {};
};