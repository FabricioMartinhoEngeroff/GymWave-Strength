import { useEffect, useState, useRef } from "react";
import { ROTACAO } from "../../data/cycles";
import { SESSOES, SESSOES_LABELS, type SessaoTipo, type ExercicioSessao } from "../../data/sessionExercises";
import type { RegistroExercicio } from "../../types/TrainingData";
import {
  salvarRegistro,
  ultimoRegistro,
  exercicioDeveSubirPeso,
  salvarDados,
  carregarDados,
} from "../../utils/storage";
import {
  Screen,
  TopBar,
  TopBarTitle,
  DateInput,
  Content,
  Card,
  Label,
  SessaoRow,
  CycleChip,
  ExerciseCard,
  ExHeader,
  ExName,
  ExSub,
  Badge,
  SeriesGrid,
  SerieRow,
  SerieLabel,
  InputBox,
  InputSm,
  Unit,
  ObsInput,
  SaveBtn,
  ToastBanner,
} from "./TreinoSessao.styles";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExerciseState {
  topSetKg: string;
  topSetReps: string;
  backoffKg: string;
  backoffReps: string;
  extraKg: string;
  extraReps: string;
  seriesValidas: 2 | 3;
  topSetConfirmed: boolean;
  backoffConfirmed: boolean;
  tecnica: "BC" | "RP" | null;
  clusterReps: string[];
  obs: string;
  skipped: boolean;
  topSetKgIsSuggestion: boolean;
  backoffKgIsSuggestion: boolean;
}

interface TreinoSessaoProps {
  onUnsavedChanges?: (has: boolean) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayBR(): string {
  return new Date().toLocaleDateString("pt-BR");
}

function parseDateBRToTs(data: string): number {
  const [d, m, y] = data.split("/").map(Number);
  if (!d || !m || !y) return Date.now();
  return new Date(y, m - 1, d).getTime();
}

function daysSince(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  const ts = parseDateBRToTs(dateStr);
  const now = Date.now();
  return Math.floor((now - ts) / (1000 * 60 * 60 * 24));
}

function getRotacaoId(sessao: SessaoTipo): string {
  const r = ROTACAO.find((rot) => rot.titulo === sessao);
  return r?.id ?? "";
}

function emptyExerciseState(): ExerciseState {
  return {
    topSetKg: "",
    topSetReps: "",
    backoffKg: "",
    backoffReps: "",
    extraKg: "",
    extraReps: "",
    seriesValidas: 2,
    topSetConfirmed: false,
    backoffConfirmed: false,
    tecnica: null,
    clusterReps: ["", "", ""],
    obs: "",
    skipped: false,
    topSetKgIsSuggestion: false,
    backoffKgIsSuggestion: false,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TreinoSessao({ onUnsavedChanges }: TreinoSessaoProps = {}) {
  const [sessao, setSessao] = useState<SessaoTipo | null>(null);
  const [data, setData] = useState(getTodayBR());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [exerciseStates, setExerciseStates] = useState<Record<string, ExerciseState>>({});
  const [salvo, setSalvo] = useState(false);
  const [resumo, setResumo] = useState<{ feitos: number; total: number; subirPeso: number } | null>(null);
  const [mostrarRevisao, setMostrarRevisao] = useState(false);

  // Refs to avoid stale closures in effects
  const exerciseStatesRef = useRef(exerciseStates);
  exerciseStatesRef.current = exerciseStates;

  // Draft storage (in-memory only, per session type)
  const rascunhosRef = useRef<Partial<Record<SessaoTipo, Record<string, ExerciseState>>>>({});
  const prevSessaoRef = useRef<SessaoTipo | null>(null);

  const exercicios: ExercicioSessao[] = sessao ? SESSOES[sessao] : [];
  const currentEx = exercicios[currentIdx] ?? null;
  const treinoId = sessao ? getRotacaoId(sessao) : "";

  // Unsaved changes: session selected + not yet saved (no resumo) + has some data
  const hasUnsavedChanges =
    sessao !== null &&
    resumo === null &&
    Object.values(exerciseStates).some(
      (s) => s.topSetKg !== "" || s.topSetReps !== "" || s.topSetConfirmed || s.backoffConfirmed
    );

  // Notify parent of unsaved state
  useEffect(() => {
    onUnsavedChanges?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onUnsavedChanges]);

  // Browser-level beforeunload guard
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  // Load session data (also saves draft of previous session)
  useEffect(() => {
    if (!sessao) return;

    // Save draft of previous session before switching
    if (prevSessaoRef.current !== null && prevSessaoRef.current !== sessao) {
      rascunhosRef.current[prevSessaoRef.current] = exerciseStatesRef.current;
    }
    prevSessaoRef.current = sessao;

    // Restore draft if switching back
    const draft = rascunhosRef.current[sessao];
    if (draft) {
      setExerciseStates(draft);
      setCurrentIdx(0);
      setMostrarRevisao(false);
      setResumo(null);
      setSalvo(false);
      return;
    }

    // Load from history
    const states: Record<string, ExerciseState> = {};
    const exs = SESSOES[sessao];
    const tId = getRotacaoId(sessao);
    exs.forEach((ex) => {
      const state = emptyExerciseState();
      state.seriesValidas = ex.seriesValidas;
      const ultimo = ultimoRegistro(ex.nome, tId);
      if (ultimo) {
        let suggestedKg = ultimo.topSetKg;
        if (ultimo.topSetBateuTeto) {
          const increment = ultimo.topSetKg >= 40 ? 2 : 1;
          suggestedKg = ultimo.topSetKg + increment;
        }
        state.topSetKg = String(suggestedKg);
        state.topSetKgIsSuggestion = true;
        state.seriesValidas = (ultimo.seriesValidas ?? ex.seriesValidas) as 2 | 3;
      }
      states[ex.nome] = state;
    });
    setExerciseStates(states);
    setCurrentIdx(0);
    setMostrarRevisao(false);
    setResumo(null);
    setSalvo(false);
  }, [sessao]); // eslint-disable-line react-hooks/exhaustive-deps

  // Suggest backoff kg when top set is confirmed and backoff is still empty
  useEffect(() => {
    if (!currentEx) return;
    const state = exerciseStates[currentEx.nome];
    if (!state?.topSetConfirmed || state.backoffKg) return;
    const topKg = parseFloat(state.topSetKg);
    if (!isNaN(topKg) && topKg > 0) {
      const suggested = Math.round(topKg * currentEx.backoffPct);
      setExerciseStates((prev) => ({
        ...prev,
        [currentEx.nome]: {
          ...prev[currentEx.nome],
          backoffKg: String(suggested),
          backoffKgIsSuggestion: true,
        },
      }));
    }
  }, [currentEx, exerciseStates]);

  // Auto-fill extra kg from backoff when extra block appears
  useEffect(() => {
    if (!currentEx) return;
    const state = exerciseStates[currentEx.nome];
    if (!state?.backoffConfirmed || state.extraKg !== "" || state.seriesValidas !== 3) return;
    if (state.backoffKg) {
      setExerciseStates((prev) => ({
        ...prev,
        [currentEx.nome]: { ...prev[currentEx.nome], extraKg: state.backoffKg },
      }));
    }
  }, [currentEx, exerciseStates]);

  function updateState(nome: string, partial: Partial<ExerciseState>) {
    setExerciseStates((prev) => ({
      ...prev,
      [nome]: { ...prev[nome], ...partial },
    }));
  }

  function confirmTopSet() {
    if (!currentEx) return;
    updateState(currentEx.nome, { topSetConfirmed: true });
  }

  function confirmBackoff() {
    if (!currentEx) return;
    updateState(currentEx.nome, { backoffConfirmed: true });
  }

  function canConfirmTopSet(): boolean {
    if (!currentEx) return false;
    const s = exerciseStates[currentEx.nome];
    if (!s) return false;
    const kg = parseFloat(s.topSetKg);
    const reps = parseFloat(s.topSetReps);
    return !isNaN(kg) && kg > 0 && !isNaN(reps) && reps > 0;
  }

  function canConfirmBackoff(): boolean {
    if (!currentEx) return false;
    const s = exerciseStates[currentEx.nome];
    if (!s) return false;
    const kg = parseFloat(s.backoffKg);
    const reps = parseFloat(s.backoffReps);
    return !isNaN(kg) && kg > 0 && !isNaN(reps) && reps > 0;
  }

  function isExerciseDone(nome: string): boolean {
    const state = exerciseStates[nome];
    if (!state) return false;
    return state.skipped || (state.topSetConfirmed && state.backoffConfirmed);
  }

  function nextExercise() {
    if (currentIdx < exercicios.length - 1) setCurrentIdx(currentIdx + 1);
  }

  function prevExercise() {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  }

  function skipExercise() {
    if (!currentEx) return;
    updateState(currentEx.nome, { skipped: true });
    nextExercise();
  }

  function isLastExercise(): boolean {
    return currentIdx === exercicios.length - 1;
  }

  function getTopSetStatus(ex: ExercicioSessao, state: ExerciseState): "teto" | "abaixo" | "faixa" | null {
    if (!state.topSetConfirmed) return null;
    const reps = parseInt(state.topSetReps);
    if (isNaN(reps)) return null;
    if (reps >= ex.faixaTopSet[1]) return "teto";
    if (reps < ex.faixaTopSet[0]) return "abaixo";
    return "faixa";
  }

  function handleSalvarTreino() {
    if (!sessao) return;
    const ts = parseDateBRToTs(data);
    let feitos = 0;
    let subirPeso = 0;

    const dadosDb = carregarDados();

    exercicios.forEach((ex) => {
      const state = exerciseStates[ex.nome];
      if (!state || state.skipped) return;
      if (!state.topSetConfirmed) return;

      const topKg = parseFloat(state.topSetKg) || 0;
      const topReps = parseInt(state.topSetReps) || 0;
      const boKg = parseFloat(state.backoffKg) || 0;
      const boReps = parseInt(state.backoffReps) || 0;
      if (topKg <= 0) return;

      const extraKg = state.seriesValidas === 3 ? (parseFloat(state.extraKg) || 0) : 0;
      const extraReps = state.seriesValidas === 3 ? (parseInt(state.extraReps) || 0) : 0;

      const ultimo = ultimoRegistro(ex.nome, treinoId);
      const bateuTeto = topReps >= ex.faixaTopSet[1];
      if (bateuTeto) subirPeso++;

      const registro: RegistroExercicio = {
        exercicio: ex.nome,
        treinoId,
        data,
        dataTs: ts,
        topSetKg: topKg,
        topSetReps: topReps,
        topSetFaixaMin: ex.faixaTopSet[0],
        topSetFaixaMax: ex.faixaTopSet[1],
        topSetBateuTeto: bateuTeto,
        backoffKg: boKg,
        backoffReps: boReps,
        backoffFaixaMin: ex.faixaBackoff[0],
        backoffFaixaMax: ex.faixaBackoff[1],
        seriesValidas: state.seriesValidas,
        extraKg: extraKg > 0 ? extraKg : undefined,
        extraReps: extraReps > 0 ? extraReps : undefined,
        tecnica: state.tecnica,
        clusterReps: state.tecnica
          ? state.clusterReps.map(Number).filter((n) => n > 0)
          : undefined,
        pesoAnterior: ultimo?.topSetKg,
        repsAnterior: ultimo?.topSetReps,
        progrediu: ultimo ? topKg > ultimo.topSetKg : false,
        obs: state.obs.trim() || undefined,
      };

      salvarRegistro(registro);
      feitos++;

      const legacyPesos = [String(topKg), String(boKg), ...(extraKg > 0 ? [String(extraKg)] : [])];
      const legacyReps = [String(topReps), String(boReps), ...(extraReps > 0 ? [String(extraReps)] : [])];
      if (!dadosDb[ex.nome]) dadosDb[ex.nome] = {};
      dadosDb[ex.nome][treinoId] = {
        data,
        pesos: legacyPesos,
        reps: legacyReps,
        obs: state.obs.trim(),
        exercicio: ex.nome,
      };
    });

    salvarDados(dadosDb);

    // Clear draft after saving
    if (sessao) delete rascunhosRef.current[sessao];

    setMostrarRevisao(false);
    setResumo({ feitos, total: exercicios.length, subirPeso });
    setSalvo(true);
    setTimeout(() => setSalvo(false), 5000);
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  function renderDaysSince() {
    if (!sessao || !treinoId) return null;
    const exs = SESSOES[sessao];
    let lastDate: string | undefined;
    exs.forEach((ex) => {
      const u = ultimoRegistro(ex.nome, treinoId);
      if (u && (!lastDate || u.dataTs > parseDateBRToTs(lastDate))) {
        lastDate = u.data;
      }
    });
    const days = daysSince(lastDate);
    if (days === null) return null;
    const rotacao = ROTACAO.find((r) => r.id === treinoId);
    return (
      <p style={{ fontSize: 11, color: "#6b7280", margin: "4px 0 0" }}>
        {days} dias desde {rotacao?.titulo ?? treinoId}
      </p>
    );
  }

  function renderProgressBanner(ex: ExercicioSessao) {
    const deveSubir = exercicioDeveSubirPeso(ex.nome, treinoId);
    const ultimo = ultimoRegistro(ex.nome, treinoId);

    if (!ultimo) {
      return (
        <div style={{
          background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8,
          padding: "8px 10px", fontSize: 12, color: "#1d4ed8", marginBottom: 8,
        }}>
          Primeiro registro — defina o peso
        </div>
      );
    }

    if (deveSubir) {
      return (
        <div style={{
          background: "#fefce8", border: "1px solid #fde68a", borderRadius: 8,
          padding: "8px 10px", fontSize: 12, color: "#92400e", marginBottom: 8,
        }}>
          SUBIR PESO HOJE (teto atingido: {ultimo.topSetKg}kg x {ultimo.topSetReps}reps)
        </div>
      );
    }

    return (
      <div style={{
        background: "#f0f9ff", border: "0.5px solid #bae6fd", borderRadius: 8,
        padding: "8px 10px", fontSize: 12, color: "#0369a1", marginBottom: 8,
      }}>
        Anterior: {ultimo.topSetKg}kg x {ultimo.topSetReps}reps
      </div>
    );
  }

  function renderRevisao() {
    return (
      <Card>
        <Label>Revisar antes de salvar</Label>
        {exercicios.map((ex, idx) => {
          const state = exerciseStates[ex.nome];
          const done = isExerciseDone(ex.nome);
          return (
            <div
              key={ex.nome}
              onClick={() => { setCurrentIdx(idx); setMostrarRevisao(false); }}
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
                {state?.skipped && (
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>Pulado</p>
                )}
                {!state?.skipped && state?.topSetConfirmed && (
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280" }}>
                    Top: {state.topSetKg}kg × {state.topSetReps}reps
                    {state.backoffConfirmed && ` · Back-off: ${state.backoffKg}kg × ${state.backoffReps}reps`}
                    {state.seriesValidas === 3 && state.extraKg && ` · Extra: ${state.extraKg}kg × ${state.extraReps}reps`}
                  </p>
                )}
                {!state?.skipped && !state?.topSetConfirmed && (
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>Não preenchido</p>
                )}
              </div>
              <span style={{ fontSize: 11, color: "#2563eb", flexShrink: 0 }}>Editar</span>
            </div>
          );
        })}
        <SaveBtn
          $disabled={false}
          disabled={false}
          onClick={handleSalvarTreino}
          type="button"
          style={{ marginTop: 12 }}
        >
          Confirmar e Salvar Treino
        </SaveBtn>
        <button
          type="button"
          onClick={() => setMostrarRevisao(false)}
          style={{
            width: "100%", padding: 10, marginTop: 8, border: "1px solid #d1d5db",
            borderRadius: 8, background: "#fff", color: "#6b7280", fontSize: 13, cursor: "pointer",
          }}
        >
          Voltar ao exercício
        </button>
      </Card>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <Screen>
      <TopBar>
        <TopBarTitle>GymWave Strength</TopBarTitle>
        <DateInput
          type="text"
          value={data}
          onChange={(e) => setData(e.target.value)}
          aria-label="Data do treino"
        />
        {renderDaysSince()}
      </TopBar>

      <Content>
        {salvo && <ToastBanner>Treino salvo com sucesso!</ToastBanner>}

        {/* Session selector */}
        <Card>
          <Label>Treino</Label>
          <SessaoRow>
            {SESSOES_LABELS.map((s) => (
              <CycleChip
                key={s}
                $active={sessao === s}
                onClick={() => setSessao(sessao === s ? null : s)}
                type="button"
              >
                {s}
              </CycleChip>
            ))}
          </SessaoRow>
        </Card>

        {/* Summary after save */}
        {resumo && (
          <Card>
            <Label>Resumo do treino</Label>
            <p style={{ fontSize: 13, color: "#111827", margin: "4px 0" }}>
              {resumo.feitos}/{resumo.total} exercícios registrados
            </p>
            {resumo.subirPeso > 0 && (
              <p style={{ fontSize: 12, color: "#16a34a", margin: "4px 0" }}>
                {resumo.subirPeso} exercício(s) sobem de peso no próximo ciclo
              </p>
            )}
          </Card>
        )}

        {/* Pre-save review screen */}
        {sessao && mostrarRevisao && !resumo && renderRevisao()}

        {/* Exercise navigation */}
        {sessao && exercicios.length > 0 && !resumo && !mostrarRevisao && (
          <>
            {/* Navigation with progress dots */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <button
                type="button"
                onClick={prevExercise}
                disabled={currentIdx === 0}
                style={{
                  background: "none", border: "none", fontSize: 20,
                  cursor: currentIdx === 0 ? "default" : "pointer",
                  color: currentIdx === 0 ? "#d1d5db" : "#2563eb", padding: "4px 12px",
                }}
                aria-label="Exercício anterior"
              >
                ‹
              </button>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#6b7280" }}>
                  {currentIdx + 1} / {exercicios.length}
                </span>
                <div style={{ display: "flex", gap: 5 }}>
                  {exercicios.map((ex, idx) => (
                    <div
                      key={ex.nome}
                      onClick={() => setCurrentIdx(idx)}
                      title={`${ex.nome}${isExerciseDone(ex.nome) ? " ✓" : ""}`}
                      style={{
                        width: 8, height: 8, borderRadius: "50%", cursor: "pointer",
                        background: idx === currentIdx
                          ? "#2563eb"
                          : isExerciseDone(ex.nome)
                          ? "#16a34a"
                          : "#d1d5db",
                        boxSizing: "border-box",
                        border: idx === currentIdx ? "1.5px solid #1d4ed8" : "1.5px solid transparent",
                        transition: "background 0.15s",
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={nextExercise}
                disabled={currentIdx === exercicios.length - 1}
                style={{
                  background: "none", border: "none", fontSize: 20,
                  cursor: currentIdx === exercicios.length - 1 ? "default" : "pointer",
                  color: currentIdx === exercicios.length - 1 ? "#d1d5db" : "#2563eb", padding: "4px 12px",
                }}
                aria-label="Próximo exercício"
              >
                ›
              </button>
            </div>

            {/* Current exercise card */}
            {currentEx && (() => {
              const state = exerciseStates[currentEx.nome] ?? emptyExerciseState();
              const topStatus = getTopSetStatus(currentEx, state);
              const done = isExerciseDone(currentEx.nome);

              return (
                <ExerciseCard key={currentEx.nome}>
                  <ExHeader>
                    <div>
                      <ExName>
                        {currentEx.nome}
                        {done && (
                          <span style={{ color: "#16a34a", fontSize: 13, marginLeft: 6 }}>✓</span>
                        )}
                      </ExName>
                      <ExSub>{currentEx.grupo} · {currentEx.cue}</ExSub>
                      <ExSub>
                        Top Set: {currentEx.faixaTopSet[0]}–{currentEx.faixaTopSet[1]} reps · Back-off: {currentEx.faixaBackoff[0]}–{currentEx.faixaBackoff[1]} reps
                      </ExSub>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                      <Badge>{treinoId}</Badge>
                      <span style={{
                        fontSize: 10, padding: "2px 6px", borderRadius: 6, fontWeight: 600, whiteSpace: "nowrap",
                        background: state.seriesValidas === 3 ? "#dcfce7" : "#f3f4f6",
                        color: state.seriesValidas === 3 ? "#166534" : "#6b7280",
                      }}>
                        {state.seriesValidas === 3 ? "3 válidas" : "2 válidas"}
                      </span>
                    </div>
                  </ExHeader>

                  {renderProgressBanner(currentEx)}

                  {/* TOP SET block */}
                  <Card style={{ background: "#fafafa" }}>
                    <Label>Top Set</Label>
                    <SeriesGrid>
                      <SerieRow>
                        <SerieLabel>Peso</SerieLabel>
                        <InputBox
                          type="number"
                          placeholder="kg"
                          value={state.topSetKg}
                          onChange={(e) =>
                            updateState(currentEx.nome, {
                              topSetKg: e.target.value,
                              topSetKgIsSuggestion: false,
                            })
                          }
                          $invalid={false}
                          $isSuggestion={state.topSetKgIsSuggestion && !state.topSetConfirmed}
                          data-suggestion={state.topSetKgIsSuggestion && !state.topSetConfirmed ? "true" : undefined}
                          aria-label={`Top Set kg ${currentEx.nome}`}
                        />
                        <Unit>kg</Unit>
                      </SerieRow>
                      <SerieRow>
                        <SerieLabel>Reps</SerieLabel>
                        <InputSm
                          type="number"
                          placeholder="reps"
                          value={state.topSetReps}
                          onChange={(e) => updateState(currentEx.nome, { topSetReps: e.target.value })}
                          $invalid={false}
                          aria-label={`Top Set reps ${currentEx.nome}`}
                        />
                        <Unit>reps</Unit>
                      </SerieRow>
                    </SeriesGrid>

                    {!state.topSetConfirmed ? (
                      <button
                        type="button"
                        onClick={confirmTopSet}
                        disabled={!canConfirmTopSet()}
                        style={{
                          width: "100%", padding: 10, marginTop: 8, border: "none", borderRadius: 8,
                          background: canConfirmTopSet() ? "#2563eb" : "#e5e7eb",
                          color: canConfirmTopSet() ? "#fff" : "#9ca3af",
                          fontSize: 13, fontWeight: 600, cursor: canConfirmTopSet() ? "pointer" : "not-allowed",
                        }}
                      >
                        Confirmar Top Set
                      </button>
                    ) : (
                      <>
                        {topStatus === "teto" && (
                          <div style={{
                            background: "#dcfce7", border: "1px solid #86efac", borderRadius: 8,
                            padding: "6px 10px", fontSize: 12, color: "#166534", marginTop: 8, textAlign: "center",
                          }}>
                            Teto atingido — sobe peso no próximo
                          </div>
                        )}
                        {topStatus === "abaixo" && (
                          <div style={{
                            background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
                            padding: "6px 10px", fontSize: 12, color: "#991b1b", marginTop: 8, textAlign: "center",
                          }}>
                            Abaixo da faixa
                          </div>
                        )}
                        {topStatus === "faixa" && (
                          <div style={{
                            background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8,
                            padding: "6px 10px", fontSize: 12, color: "#1d4ed8", marginTop: 8, textAlign: "center",
                          }}>
                            Na faixa — manter peso
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => updateState(currentEx.nome, { topSetConfirmed: false })}
                          style={{
                            width: "100%", padding: 8, marginTop: 6, border: "1px solid #d1d5db",
                            borderRadius: 8, background: "#fff", color: "#6b7280",
                            fontSize: 12, cursor: "pointer",
                          }}
                        >
                          Editar Top Set
                        </button>
                      </>
                    )}
                  </Card>

                  {/* BACK-OFF block (after top set confirmed) */}
                  {state.topSetConfirmed && (
                    <Card style={{ background: "#fafafa" }}>
                      <Label>Back-off ({Math.round(currentEx.backoffPct * 100)}%)</Label>
                      <SeriesGrid>
                        <SerieRow>
                          <SerieLabel>Peso</SerieLabel>
                          <InputBox
                            type="number"
                            placeholder="kg"
                            value={state.backoffKg}
                            onChange={(e) =>
                              updateState(currentEx.nome, {
                                backoffKg: e.target.value,
                                backoffKgIsSuggestion: false,
                              })
                            }
                            $invalid={false}
                            $isSuggestion={state.backoffKgIsSuggestion && !state.backoffConfirmed}
                            aria-label={`Back-off kg ${currentEx.nome}`}
                          />
                          <Unit>kg</Unit>
                        </SerieRow>
                        <SerieRow>
                          <SerieLabel>Reps</SerieLabel>
                          <InputSm
                            type="number"
                            placeholder="reps"
                            value={state.backoffReps}
                            onChange={(e) => updateState(currentEx.nome, { backoffReps: e.target.value })}
                            $invalid={false}
                            aria-label={`Back-off reps ${currentEx.nome}`}
                          />
                          <Unit>reps</Unit>
                        </SerieRow>
                      </SeriesGrid>

                      {!state.backoffConfirmed ? (
                        <button
                          type="button"
                          onClick={confirmBackoff}
                          disabled={!canConfirmBackoff()}
                          style={{
                            width: "100%", padding: 10, marginTop: 8, border: "none", borderRadius: 8,
                            background: canConfirmBackoff() ? "#2563eb" : "#e5e7eb",
                            color: canConfirmBackoff() ? "#fff" : "#9ca3af",
                            fontSize: 13, fontWeight: 600, cursor: canConfirmBackoff() ? "pointer" : "not-allowed",
                          }}
                        >
                          Confirmar Back-off
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateState(currentEx.nome, { backoffConfirmed: false })}
                          style={{
                            width: "100%", padding: 8, marginTop: 6, border: "1px solid #d1d5db",
                            borderRadius: 8, background: "#fff", color: "#6b7280",
                            fontSize: 12, cursor: "pointer",
                          }}
                        >
                          Editar Back-off
                        </button>
                      )}
                    </Card>
                  )}

                  {/* EXTRA block */}
                  {state.topSetConfirmed && state.backoffConfirmed && state.seriesValidas === 3 && (
                    <Card style={{ background: "#fafafa" }}>
                      <Label>Série Extra (volume)</Label>
                      <SeriesGrid>
                        <SerieRow>
                          <SerieLabel>Peso</SerieLabel>
                          <InputBox
                            type="number"
                            placeholder="kg"
                            value={state.extraKg}
                            onChange={(e) => updateState(currentEx.nome, { extraKg: e.target.value })}
                            $invalid={false}
                            aria-label={`Extra kg ${currentEx.nome}`}
                          />
                          <Unit>kg</Unit>
                        </SerieRow>
                        <SerieRow>
                          <SerieLabel>Reps</SerieLabel>
                          <InputSm
                            type="number"
                            placeholder="reps"
                            value={state.extraReps}
                            onChange={(e) => updateState(currentEx.nome, { extraReps: e.target.value })}
                            $invalid={false}
                            aria-label={`Extra reps ${currentEx.nome}`}
                          />
                          <Unit>reps</Unit>
                        </SerieRow>
                      </SeriesGrid>
                      <p style={{ fontSize: 11, color: "#6b7280", margin: "4px 0 0" }}>
                        Faixa: {currentEx.faixaBackoff[0]}–{currentEx.faixaBackoff[1]} reps · não conta para teto
                      </p>
                    </Card>
                  )}

                  {/* Technique block */}
                  {state.topSetConfirmed && state.backoffConfirmed && (
                    <Card style={{ background: "#fafafa" }}>
                      <Label>Técnica (opcional)</Label>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <CycleChip
                          $active={state.tecnica === "BC"}
                          onClick={() => updateState(currentEx.nome, { tecnica: state.tecnica === "BC" ? null : "BC" })}
                          type="button"
                        >
                          BC
                        </CycleChip>
                        <CycleChip
                          $active={state.tecnica === "RP"}
                          onClick={() => updateState(currentEx.nome, { tecnica: state.tecnica === "RP" ? null : "RP" })}
                          type="button"
                        >
                          RP
                        </CycleChip>
                      </div>

                      {state.tecnica && (
                        <SeriesGrid>
                          {(state.tecnica === "BC" ? [0, 1, 2] : [0, 1]).map((i) => (
                            <SerieRow key={i}>
                              <SerieLabel>R{i + 1}</SerieLabel>
                              <InputSm
                                type="number"
                                placeholder="reps"
                                value={state.clusterReps[i] ?? ""}
                                onChange={(e) => {
                                  const cr = [...state.clusterReps];
                                  cr[i] = e.target.value;
                                  updateState(currentEx.nome, { clusterReps: cr });
                                }}
                                $invalid={false}
                                aria-label={`Cluster reps ${i + 1} ${currentEx.nome}`}
                              />
                              <Unit>reps</Unit>
                            </SerieRow>
                          ))}
                          <p style={{ fontSize: 11, color: "#6b7280", margin: "4px 0 0" }}>
                            Total: {state.clusterReps.map(Number).filter((n) => n > 0).reduce((a, b) => a + b, 0)} reps
                          </p>
                        </SeriesGrid>
                      )}
                    </Card>
                  )}

                  {/* Observations */}
                  <div style={{ marginTop: 8 }}>
                    <ObsInput
                      rows={2}
                      placeholder="Observação do exercício..."
                      value={state.obs}
                      onChange={(e) => updateState(currentEx.nome, { obs: e.target.value })}
                    />
                  </div>

                  {/* Navigation buttons */}
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button
                      type="button"
                      onClick={skipExercise}
                      style={{
                        flex: 1, padding: 10, border: "1px solid #d1d5db", borderRadius: 8,
                        background: "#fff", color: "#6b7280", fontSize: 13, cursor: "pointer",
                      }}
                    >
                      Pular
                    </button>
                    {!isLastExercise() ? (
                      <button
                        type="button"
                        onClick={nextExercise}
                        disabled={!state.topSetConfirmed}
                        style={{
                          flex: 2, padding: 10, border: "none", borderRadius: 8,
                          background: state.topSetConfirmed ? "#2563eb" : "#e5e7eb",
                          color: state.topSetConfirmed ? "#fff" : "#9ca3af",
                          fontSize: 13, fontWeight: 600,
                          cursor: state.topSetConfirmed ? "pointer" : "not-allowed",
                        }}
                      >
                        Próximo
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setMostrarRevisao(true)}
                        style={{
                          flex: 2, padding: 10, border: "none", borderRadius: 8,
                          background: "#2563eb", color: "#fff",
                          fontSize: 13, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        Ver Resumo
                      </button>
                    )}
                  </div>
                </ExerciseCard>
              );
            })()}
          </>
        )}

        {/* No session selected */}
        {!sessao && (
          <Card>
            <p style={{ fontSize: 13, color: "#6b7280", textAlign: "center" }}>
              Selecione um treino para começar
            </p>
          </Card>
        )}
      </Content>
    </Screen>
  );
}
