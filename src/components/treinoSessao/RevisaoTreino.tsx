import { rotuloEsforco, type EscalaEsforco } from "../../utils/esforco";
import { Card, GhostBtn, Label, SaveBtn } from "./TreinoSessao.styles";
import { blocoValido, topSetFeito, type ExerciseState } from "./domain/estadoExercicio";
import { seriesFeitas } from "./domain/seriesFeitas";
import type { SessaoTreino } from "./hooks/useSessaoTreino";

const esforco = (rpe: number | null, escala: EscalaEsforco) => (rpe === null ? "" : ` @ ${rotuloEsforco(rpe, escala)}`);

function resumoSeries(s: ExerciseState, escala: EscalaEsforco): string {
  const rotulos = { top1: "Top 1", top2: "Top 2", extra: s.seriesValidas === 4 ? "Série 3" : "Back-off", serie4: "Série 4" };
  return seriesFeitas(s)
    .map(({ tipo, kg, reps, rpe }) => `${rotulos[tipo]}: ${kg}kg × ${reps}reps${esforco(rpe, escala)}`)
    .join(" · ");
}

function resumoCluster(s: ExerciseState, escala: EscalaEsforco): string {
  return [
    { blocos: s.clusterSeries, rpe: s.clusterRpe },
    { blocos: s.clusterSeries2, rpe: s.clusterRpe2 },
  ]
    .map(({ blocos, rpe }) => ({
      txt: blocos.filter(blocoValido).map((b, i) => `B${i + 1}: ${b.kg}kg × ${b.reps}reps`).join(" · "),
      rpe,
    }))
    .filter(({ txt }) => txt !== "")
    .map(({ txt, rpe }, si) => `Cluster S${si + 1} — ${txt}${esforco(rpe, escala)}`)
    .join("  |  ");
}

const CINZA = { margin: "2px 0 0", fontSize: 11, color: "#9ca3af" };
const DETALHE = { ...CINZA, color: "#6b7280" };

function LinhaResumo({ state, escala }: { state: ExerciseState | undefined; escala: EscalaEsforco }) {
  if (state?.skipped) return <p style={CINZA}>Pulado</p>;
  if (!state || (!topSetFeito(state) && !state.tecnicaConfirmed)) return <p style={CINZA}>Não preenchido</p>;
  return (
    <>
      {!state.tecnica && (
        <p style={DETALHE}>
          {resumoSeries(state, escala)}
          {state.isDeload && <span style={{ color: "#dc2626" }}> · Deload</span>}
        </p>
      )}
      {state.tecnicaConfirmed && state.tecnica && <p style={DETALHE}>{resumoCluster(state, escala)}</p>}
    </>
  );
}

export function RevisaoTreino({ treino }: { treino: SessaoTreino }) {
  const { exercicios, states, treinoId, data } = treino;

  if (treino.confirmarSubstituir) {
    return (
      <Card>
        <Label>Atenção</Label>
        <div style={{
          background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8,
          padding: "10px 12px", fontSize: 13, color: "#c2410c", marginBottom: 12, lineHeight: 1.5,
        }}>
          ⚠ Já existe um treino de <strong>{treinoId}</strong> salvo em <strong>{data}</strong>. Salvar novamente vai substituir o registro desse dia — não será criado um treino duplicado.
        </div>
        <SaveBtn onClick={() => treino.salvar(true)} type="button">Substituir registro do dia</SaveBtn>
        <GhostBtn type="button" onClick={treino.cancelarSubstituicao} style={{ marginTop: 8 }}>Cancelar</GhostBtn>
      </Card>
    );
  }

  return (
    <Card>
      <Label>Revisar antes de salvar</Label>
      {exercicios.map((ex, idx) => {
        const done = treino.concluido(ex.nome);
        return (
          <div
            key={ex.nome}
            onClick={() => treino.editarDaRevisao(idx)}
            style={{
              padding: "10px 0",
              borderBottom: idx < exercicios.length - 1 ? "0.5px solid #e5e7eb" : "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}
            aria-label={`Editar ${ex.nome}`}
          >
            <span style={{ color: done ? "#16a34a" : "#9ca3af", fontSize: 14, width: 16, flexShrink: 0, marginTop: 2 }}>
              {done ? "✓" : "○"}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#111827" }}>{ex.nome}</p>
              <LinhaResumo state={states[ex.nome]} escala={treino.escala} />
            </div>
            <span style={{ fontSize: 11, color: "#2563eb", flexShrink: 0 }}>Editar</span>
          </div>
        );
      })}
      <SaveBtn onClick={treino.pedirSalvar} type="button" style={{ marginTop: 12 }}>
        Confirmar e Salvar Treino
      </SaveBtn>
      <GhostBtn type="button" onClick={treino.fecharRevisao} style={{ marginTop: 8 }}>
        Voltar ao exercício
      </GhostBtn>
    </Card>
  );
}
