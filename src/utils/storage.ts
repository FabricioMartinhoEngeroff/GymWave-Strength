import { DadosTreino } from "../types/TrainingData";

/**
 * Salva os dados de treino no localStorage, ignorando ciclos vazios.
 */
export const salvarDados = (dados: DadosTreino) => {
  const dadosFiltrados: DadosTreino = {};

  for (const exercicio in dados) {
    dadosFiltrados[exercicio] = {};

    for (const ciclo in dados[exercicio]) {
      const reg = dados[exercicio][ciclo];
      const pesos = reg.pesos || [];
      const reps = reg.reps || [];
      const obs = reg.obs?.trim() || "";

      const isVazio =
        pesos.every(p => !p || p.trim() === "") &&
        reps.every(r => !r || r.trim() === "") &&
        obs === "";

      if (!isVazio) {
        dadosFiltrados[exercicio][ciclo] = reg;
      }
    }

    // Remove o exercício se não sobrou nenhum ciclo válido
    if (Object.keys(dadosFiltrados[exercicio]).length === 0) {
      delete dadosFiltrados[exercicio];
    }
  }

  console.log("💾 salvando dados no localStorage (filtrados):", dadosFiltrados);
  localStorage.setItem("dadosTreino", JSON.stringify(dadosFiltrados));
};

/**
 * Carrega os dados de treino do localStorage.
 */
export const carregarDados = (): DadosTreino => {
  const local = localStorage.getItem("dadosTreino");
  if (local) {
    console.log("📥 carregando dados do localStorage:", JSON.parse(local));
    return JSON.parse(local);
  }

  console.warn("⚠️ Nenhum dado encontrado no localStorage. Retornando objeto vazio.");
  return {};
};
