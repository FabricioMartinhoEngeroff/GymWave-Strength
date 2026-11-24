import { BatteryCharging, Layers } from "lucide-react";
import type { ExercicioSessao } from "../../data/sessionExercises";
import { rotuloAlvo } from "../../utils/esforco";
import { ExerciseGif } from "./ExerciseGif";
import { ProgressBanner } from "./ProgressBanner";
import {
  Badge, ExerciseCard, ExHeader, ExName, ExSub, GhostBtn, ObsInput, PrimaryBtn,
  TecnicaCard, TecnicaChip, TecnicaLabel,
} from "./TreinoSessao.styles";
import { BackoffBlock } from "./blocks/BackoffBlock";
import { ClusterBlock } from "./blocks/ClusterBlock";
import { DeloadBlock } from "./blocks/DeloadBlock";
import { SeriesExtrasBlock } from "./blocks/SeriesExtrasBlock";
import { TopSet2Block } from "./blocks/TopSet2Block";
import { TopSetBlock } from "./blocks/TopSetBlock";
import { rpeAlvoDoExercicio } from "./domain/rpeAlvo";
import type { SessaoTreino } from "./hooks/useSessaoTreino";

const COR_BADGE = {
  1: { background: "#f3f4f6", color: "#6b7280" },
  2: { background: "#f3f4f6", color: "#6b7280" },
  3: { background: "#dcfce7", color: "#166534" },
  4: { background: "#dbeafe", color: "#1e40af" },
};

/** Card do exercício aberto: cabeçalho, modo (padrão, Cluster ou Deload), observação e navegação. */
export function ExercicioCard({ treino, ex }: { treino: SessaoTreino; ex: ExercicioSessao }) {
  const { state, avisos, treinoId, atualizar } = treino;
  const escala = { escala: treino.escala, onTrocarEscala: treino.alternarEscala };
  const rpeAlvo = rpeAlvoDoExercicio(ex);
  const bloco = { ...escala, ex, state, onChange: atualizar, semEsforco: treino.semEsforco };
  const topSet = {
    ...bloco,
    aviso: avisos.topSet,
    onChange: treino.editarTopSet,
    onConfirmar: treino.confirmTopSet,
    onEditar: () => atualizar({ topSetConfirmed: false, prConfirmado: false }),
  };
  const topSetsFeitos = state.topSetConfirmed && state.backoffConfirmed;

  return (
    <ExerciseCard>
      <ExHeader>
        <div>
          <ExName>
            {ex.nome}
            {treino.concluido(ex.nome) && <span style={{ color: "#16a34a", fontSize: 13, marginLeft: 6 }}>✓</span>}
          </ExName>
          <ExSub>{ex.grupo} · {ex.cue}</ExSub>
          <ExSub>
            Top Sets: {ex.faixaTopSet[0]}–{ex.faixaTopSet[1]} reps · alvo {rotuloAlvo(rpeAlvo, treino.escala)}
            {state.seriesValidas === 3 && ` · Back-off (${Math.round(ex.backoffPct * 100)}%): ${ex.faixaBackoff[0]}–${ex.faixaBackoff[1]} reps`}
            {state.seriesValidas === 4 && " · Séries 3 e 4: mesma carga e reps do último treino"}
          </ExSub>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
          <Badge>{treinoId}</Badge>
          <span style={{
            fontSize: 10, padding: "2px 6px", borderRadius: 6, fontWeight: 600, whiteSpace: "nowrap",
            ...COR_BADGE[state.seriesValidas],
          }}>
            {state.seriesValidas} {state.seriesValidas === 1 ? "válida" : "válidas"}
          </span>
        </div>
      </ExHeader>

      <ExerciseGif exerciseName={ex.nome} />

      <ProgressBanner ultimo={treino.ultimo} prAtivo={treino.prAtivo} fadiga={treino.fadiga} rpeAlvo={rpeAlvo} escala={treino.escala} />

      {/* Chips sempre visíveis; o Cluster substitui os Top Sets quando ativo */}
      <TecnicaCard style={{ background: "#fafafa" }}>
        <TecnicaLabel>Técnicas</TecnicaLabel>
        <div style={{ display: "flex", gap: 8, marginBottom: state.tecnica ? 12 : 0 }}>
          <TecnicaChip $active={state.tecnica === "RP"} onClick={treino.alternarCluster} type="button">
            <Layers size={14} strokeWidth={1.8} aria-hidden />
            Cluster Set
          </TecnicaChip>
          <TecnicaChip $active={state.isDeload} onClick={treino.alternarDeload} type="button">
            <BatteryCharging size={14} strokeWidth={1.8} aria-hidden />
            Deload
          </TecnicaChip>
        </div>
        {state.tecnica && (
          <ClusterBlock
            {...bloco}
            aviso={avisos.tecnica}
            onAbrirSerie={treino.abrirSerieCluster}
            onFinalizarSerie1={() => treino.abrirSerieCluster(2)}
            onConfirmar={treino.confirmTecnica}
          />
        )}
      </TecnicaCard>

      {!state.tecnica && state.isDeload && <DeloadBlock {...topSet} />}

      {!state.tecnica && !state.isDeload && (
        <>
          <TopSetBlock {...topSet} />
          {state.topSetConfirmed && state.seriesValidas !== 1 && (
            <TopSet2Block
              {...bloco}
              aviso={avisos.backoff}
              onChange={treino.editarTopSet2}
              onConfirmar={treino.confirmBackoff}
              onEditar={() => atualizar({ backoffConfirmed: false })}
            />
          )}
          {topSetsFeitos && state.seriesValidas === 3 && <BackoffBlock {...bloco} />}
          {topSetsFeitos && state.seriesValidas === 4 && <SeriesExtrasBlock {...bloco} />}
        </>
      )}

      <div style={{ marginTop: 8 }}>
        <ObsInput
          rows={2}
          placeholder="Observação do exercício..."
          value={state.obs}
          onChange={(e) => atualizar({ obs: e.target.value })}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <GhostBtn type="button" onClick={treino.skipExercise} style={{ flex: 1 }}>Pular</GhostBtn>
        <PrimaryBtn
          type="button"
          onClick={treino.isLastExercise ? treino.abrirRevisao : treino.avancar}
          style={{ flex: 2 }}
        >
          {treino.isLastExercise ? "Ver Resumo" : "Próximo"}
        </PrimaryBtn>
      </div>
    </ExerciseCard>
  );
}
