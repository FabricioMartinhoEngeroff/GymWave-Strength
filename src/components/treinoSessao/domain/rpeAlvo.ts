import { RPE_ALVO, SESSOES, type ExercicioSessao } from "../../../data/sessionExercises";
import { faixaValida, type FaixaRpe } from "../../../utils/esforco";
import { slugExercicio } from "../../../utils/registros";

const BASICO_LIVRE = /^(agachamento|supino|(levantamento )?terra)\b/i;
const EM_MAQUINA = /m[áa]quina|smith|hack|sissy|articulad|cabo|polia/i;

/** Esforço alvo do exercício (RG28). Sem alvo no plano (rpe_alvo da planilha), vale o do cadastro ou o do tipo. */
export function rpeAlvoDoExercicio(ex: Pick<ExercicioSessao, "nome" | "rpeAlvo">): FaixaRpe {
  if (faixaValida(ex.rpeAlvo)) return ex.rpeAlvo;
  const slug = slugExercicio(ex.nome);
  const doCadastro = Object.values(SESSOES).flat().find((e) => slugExercicio(e.nome) === slug);
  if (doCadastro?.rpeAlvo) return doCadastro.rpeAlvo;
  return BASICO_LIVRE.test(ex.nome) && !EM_MAQUINA.test(ex.nome) ? RPE_ALVO.composto : RPE_ALVO.isolador;
}
