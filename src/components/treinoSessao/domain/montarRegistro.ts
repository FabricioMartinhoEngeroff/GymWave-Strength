import type { ExercicioSessao } from "../../../data/sessionExercises";
import type { RegistroExercicio, RegistroTreino } from "../../../types/TrainingData";
import { parseDateBRToTs } from "./datas";
import { seriesFeitas, type SerieDoTreino } from "./seriesFeitas";
import { blocoValido, type BlocoCluster, type ExerciseState } from "./estadoExercicio";

interface Entrada {
  ex: ExercicioSessao;
  state: ExerciseState;
  treinoId: string;
  data: string;
  ultimo: RegistroExercicio | null;
}

interface Saida {
  registro: RegistroExercicio;
  /** Linha equivalente no dadosTreino (gráficos e relatórios antigos). */
  legado: RegistroTreino;
}

const num = (v: string) => parseFloat(v) || 0;
const int = (v: string) => parseInt(v) || 0;

const paraBlocos = (blocos: BlocoCluster[]) =>
  blocos.filter(blocoValido).map((b) => ({ kg: num(b.kg), reps: int(b.reps) }));

/** Registro do exercício feito, ou null quando não há nada a salvar (pulado, sem confirmar, sem série feita). */
export function montarRegistro({ ex, state, treinoId, data, ultimo }: Entrada): Saida | null {
  if (state.skipped) return null;
  const emCluster = state.tecnica !== null && state.tecnicaConfirmed;

  const cluster1 = emCluster ? paraBlocos(state.clusterSeries) : [];
  const cluster2 = emCluster ? paraBlocos(state.clusterSeries2) : [];
  const series = seriesFeitas(state);
  const feitas = emCluster ? [...cluster1, ...cluster2] : series;
  if (feitas.length === 0) return null;

  const slot = (tipo: SerieDoTreino["tipo"]) => {
    const s = series.find((f) => f.tipo === tipo);
    return { kg: s?.kg, reps: s?.reps, rpe: s?.rpe ?? undefined };
  };
  const top1 = slot("top1");
  const top2 = slot("top2");
  const extra = slot("extra");
  const serie4 = slot("serie4");
  const topKg = top1.kg ?? 0;
  const topReps = top1.reps ?? 0;
  const obs = state.obs.trim();

  return {
    registro: {
      exercicio: ex.nome,
      treinoId,
      data,
      dataTs: parseDateBRToTs(data),
      topSetKg: topKg,
      topSetReps: topReps,
      topSetFaixaMin: ex.faixaTopSet[0],
      topSetFaixaMax: ex.faixaTopSet[1],
      topSetBateuTeto: !emCluster && !state.isDeload && topReps >= ex.faixaTopSet[1],
      backoffKg: top2.kg ?? 0,
      backoffReps: top2.reps ?? 0,
      backoffFaixaMin: ex.faixaBackoff[0],
      backoffFaixaMax: ex.faixaBackoff[1],
      seriesValidas: state.isDeload ? 1 : state.seriesValidas,
      extraKg: extra.kg,
      extraReps: extra.reps,
      serie4Kg: serie4.kg,
      serie4Reps: serie4.reps,
      topSetRpe: top1.rpe,
      backoffRpe: top2.rpe,
      extraRpe: extra.rpe,
      serie4Rpe: serie4.rpe,
      clusterRpe: (cluster1.length > 0 ? state.clusterRpe : null) ?? undefined,
      clusterRpe2: (cluster2.length > 0 ? state.clusterRpe2 : null) ?? undefined,
      tecnica: state.tecnica,
      clusterSeries: emCluster ? cluster1 : undefined,
      clusterSeries2: cluster2.length > 0 ? cluster2 : undefined,
      pesoAnterior: ultimo?.topSetKg,
      repsAnterior: ultimo?.topSetReps,
      progrediu: ultimo && !state.isDeload ? topKg > ultimo.topSetKg : false,
      isDeload: state.isDeload,
      obs: obs || undefined,
    },
    legado: {
      data,
      pesos: feitas.map((s) => String(s.kg)),
      reps: feitas.map((s) => String(s.reps)),
      obs,
      exercicio: ex.nome,
    },
  };
}
