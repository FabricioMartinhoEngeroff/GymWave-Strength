import { rotuloEsforco } from "../../../utils/esforco";
import { AvisoInline, GhostBtn, PrimaryBtn } from "../TreinoSessao.styles";
import { blocoValido, serieClusterTemBloco, volumeBlocos, type BlocoCluster } from "../domain/estadoExercicio";
import { EsforcoInput } from "./EsforcoInput";
import { SerieInputs } from "./SerieInputs";
import type { BlocoProps } from "./tipos";

interface ClusterBlockProps extends BlocoProps {
  aviso: boolean;
  onAbrirSerie: (n: 1 | 2) => void;
  onFinalizarSerie1: () => void;
  onConfirmar: () => void;
}

/** Técnica Cluster Set (RG16): até 2 séries quebradas em blocos. */
export function ClusterBlock(props: ClusterBlockProps) {
  return props.state.tecnicaConfirmed ? <ClusterConfirmado {...props} /> : <ClusterEmEdicao {...props} />;
}

function ClusterEmEdicao({ ex, state, aviso, onChange, onAbrirSerie, onFinalizarSerie1, onConfirmar, escala, onTrocarEscala }: ClusterBlockProps) {
  const serie = state.clusterActiveSerie;
  const umaSerie = state.seriesValidas === 1;
  const chave = serie === 1 ? "clusterSeries" : "clusterSeries2";
  const chaveRpe = serie === 1 ? "clusterRpe" : "clusterRpe2";
  const blocos = state[chave];
  const editarBloco = (i: number, patch: Partial<BlocoCluster>) =>
    onChange({ [chave]: blocos.map((b, j) => (j === i ? { ...b, ...patch } : b)) });

  return (
    <>
      {/* Navegação entre as 2 séries cluster (não aparece com 1 válida) */}
      <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
        {(umaSerie ? [] : ([1, 2] as const)).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onAbrirSerie(n)}
            style={{
              flex: 1, padding: "6px 8px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              cursor: "pointer",
              border: serie === n ? "1px solid #2563eb" : "1px solid #d1d5db",
              background: serie === n ? "#eff6ff" : "#fff",
              color: serie === n ? "#1d4ed8" : "#6b7280",
            }}
          >
            Série {n}
            {serieClusterTemBloco(n === 1 ? state.clusterSeries : state.clusterSeries2) ? " ✓" : ""}
          </button>
        ))}
      </div>

      {blocos.map((bloco, i) => (
        <div key={i}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#374151", margin: "8px 0 4px" }}>Bloco {i + 1}</p>
          <SerieInputs
            titulo={`Série ${serie} bloco ${i + 1}`}
            exercicio={ex.nome}
            kg={bloco.kg}
            reps={bloco.reps}
            onKg={(kg) => editarBloco(i, { kg })}
            onReps={(reps) => editarBloco(i, { reps })}
          />
        </div>
      ))}

      <EsforcoInput
        serie={`Cluster Série ${serie}`}
        exercicio={ex.nome}
        valor={state[chaveRpe]}
        onChange={(rpe) => onChange({ [chaveRpe]: rpe })}
        escala={escala}
        onTrocarEscala={onTrocarEscala}
      />

      <p style={{ fontSize: 12, color: "#6b7280", margin: "8px 0 4px" }}>
        Total Série {serie}: {volumeBlocos(blocos)} kg·reps
        {serie === 2 && <> · Geral: {volumeBlocos(state.clusterSeries) + volumeBlocos(blocos)} kg·reps</>}
      </p>

      {serie === 1 && !umaSerie ? (
        <PrimaryBtn type="button" onClick={onFinalizarSerie1} style={{ marginTop: 4 }}>
          Finalizar Série 1 → Série 2
        </PrimaryBtn>
      ) : (
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          {!umaSerie && (
            <GhostBtn type="button" onClick={() => onAbrirSerie(1)} style={{ flex: "0 0 auto", width: "auto", padding: "10px 14px" }}>
              ← Série 1
            </GhostBtn>
          )}
          <PrimaryBtn type="button" $variant="green" onClick={onConfirmar} style={{ flex: 1 }}>
            Confirmar Cluster
          </PrimaryBtn>
        </div>
      )}
      {aviso && <AvisoInline>⚠ Preencha pelo menos um bloco (peso e reps) em cada série.</AvisoInline>}
    </>
  );
}

function ClusterConfirmado({ ex, state, onChange, escala, onTrocarEscala, semEsforco }: ClusterBlockProps) {
  const series = [
    { n: 1, blocos: state.clusterSeries, chaveRpe: "clusterRpe" },
    { n: 2, blocos: state.clusterSeries2, chaveRpe: "clusterRpe2" },
  ] as const;

  return (
    <>
      {series.map(({ n, blocos, chaveRpe }) => {
        const validos = blocos.filter(blocoValido);
        if (validos.length === 0) return null;
        const rpe = state[chaveRpe];
        return (
          <div key={n} style={{ fontSize: 12, color: "#374151", marginBottom: 6 }}>
            <strong style={{ color: "#1d4ed8", marginRight: 6 }}>S{n}:</strong>
            {validos.map((b, i) => (
              <span key={i} style={{ marginRight: 8 }}>
                B{i + 1}: {b.kg}kg × {b.reps}reps
              </span>
            ))}
            {rpe !== null ? (
              <span style={{ color: "#6b7280" }}>@ {rotuloEsforco(rpe, escala)}</span>
            ) : (
              <EsforcoInput
                serie={`Cluster Série ${n}`}
                exercicio={ex.nome}
                valor={rpe}
                onChange={(v) => onChange({ [chaveRpe]: v })}
                escala={escala}
                onTrocarEscala={onTrocarEscala}
                aviso={semEsforco.includes(chaveRpe)}
              />
            )}
          </div>
        );
      })}
      <GhostBtn type="button" $compacto onClick={() => onChange({ tecnicaConfirmed: false })}>
        Editar Técnica
      </GhostBtn>
    </>
  );
}
