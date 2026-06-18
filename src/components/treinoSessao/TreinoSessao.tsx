import { useEffect, useState, useRef } from "react";
import { ROTACAO } from "../../data/cycles";
import { SESSOES, SESSOES_LABELS, type SessaoTipo, type ExercicioSessao } from "../../data/sessionExercises";
import type { RegistroExercicio } from "../../types/TrainingData";
import {
  salvarRegistro,
  ultimoRegistro,
  exercicioDeveSubirPeso,
  carregarHistorico,
  salvarDados,
  carregarDados,
} from "../../utils/storage";
import { calcEpley, extractReferenceBlock } from "../../utils/epleyCalc";
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
  clusterSeries: { kg: string; reps: string }[];
  tecnicaConfirmed: boolean;
  obs: string;
  skipped: boolean;
  topSetKgIsSuggestion: boolean;
  backoffKgIsSuggestion: boolean;
  backoffKgWasUserEdited: boolean;
  prConfirmado: boolean;
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
    clusterSeries: [],
    tecnicaConfirmed: false,
    obs: "",
    skipped: false,
    topSetKgIsSuggestion: false,
    backoffKgIsSuggestion: false,
    backoffKgWasUserEdited: false,
    prConfirmado: false,
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
  const [topSetWarning, setTopSetWarning] = useState(false);
  const [backoffWarning, setBackoffWarning] = useState(false);
  const [tecnicaWarning, setTecnicaWarning] = useState(false);

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
      (s) =>
        s.topSetKg !== "" || s.topSetReps !== "" || s.topSetConfirmed || s.backoffConfirmed ||
        s.clusterSeries.some((b) => b.kg !== "" || b.reps !== "")
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

  // Reset validation warnings when navigating between exercises or sessions
  useEffect(() => {
    setTopSetWarning(false);
    setBackoffWarning(false);
    setTecnicaWarning(false);
  }, [currentIdx, sessao]);

  // Suggest backoff kg when top set is confirmed and backoff is still empty (and user hasn't manually edited it)
  useEffect(() => {
    if (!currentEx) return;
    const state = exerciseStates[currentEx.nome];
    if (!state?.topSetConfirmed || state.backoffKg || state.backoffKgWasUserEdited) return;
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
    if (!canConfirmTopSet()) {
      setTopSetWarning(true);
      return;
    }
    setTopSetWarning(false);
    const s = exerciseStates[currentEx.nome];
    const kg = parseFloat(s?.topSetKg ?? "") || 0;
    const reps = parseInt(s?.topSetReps ?? "") || 0;
    const historico = carregarHistorico(currentEx.nome);
    const maxHistPr = historico.reduce((max, r) => {
      const ref = extractReferenceBlock(r);
      return ref ? Math.max(max, calcEpley(ref.peso, ref.reps)) : max;
    }, 0);
    const current1RM = kg > 0 && reps > 0 ? calcEpley(kg, reps) : 0;
    // prConfirmado somente quando supera PR historico existente (teto sem historico = "Teto atingido" normal)
    const prConfirmado = maxHistPr > 0 && current1RM > maxHistPr;
    updateState(currentEx.nome, { topSetConfirmed: true, prConfirmado });
  }

  function confirmBackoff() {
    if (!currentEx) return;
    if (!canConfirmBackoff()) {
      setBackoffWarning(true);
      return;
    }
    setBackoffWarning(false);
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

  function canConfirmTecnica(): boolean {
    if (!currentEx) return false;
    const s = exerciseStates[currentEx.nome];
    if (!s || !s.tecnica) return false;
    return s.clusterSeries.some((b) => parseFloat(b.kg) > 0 && parseInt(b.reps) > 0);
  }

  function confirmTecnica() {
    if (!currentEx) return;
    if (!canConfirmTecnica()) {
      setTecnicaWarning(true);
      return;
    }
    setTecnicaWarning(false);
    updateState(currentEx.nome, { tecnicaConfirmed: true });
  }

  function isExerciseDone(nome: string): boolean {
    const state = exerciseStates[nome];
    if (!state) return false;
    if (state.skipped) return true;
    if (state.tecnica) return state.tecnicaConfirmed;
    return state.topSetConfirmed && state.backoffConfirmed;
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

      const isTecnicaMode = state.tecnica !== null && state.tecnicaConfirmed;
      if (!isTecnicaMode && !state.topSetConfirmed) return;

      const topKg = parseFloat(state.topSetKg) || 0;
      const topReps = parseInt(state.topSetReps) || 0;
      const boKg = parseFloat(state.backoffKg) || 0;
      const boReps = parseInt(state.backoffReps) || 0;
      if (!isTecnicaMode && topKg <= 0) return;

      const extraKg = state.seriesValidas === 3 ? (parseFloat(state.extraKg) || 0) : 0;
      const extraReps = state.seriesValidas === 3 ? (parseInt(state.extraReps) || 0) : 0;

      const clusterData = isTecnicaMode
        ? state.clusterSeries
            .map((b) => ({ kg: parseFloat(b.kg) || 0, reps: parseInt(b.reps) || 0 }))
            .filter((b) => b.kg > 0 && b.reps > 0)
        : undefined;

      const ultimo = ultimoRegistro(ex.nome, treinoId);
      const bateuTeto = !isTecnicaMode && topReps >= ex.faixaTopSet[1];
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
        clusterSeries: clusterData,
        pesoAnterior: ultimo?.topSetKg,
        repsAnterior: ultimo?.topSetReps,
        progrediu: ultimo ? topKg > ultimo.topSetKg : false,
        obs: state.obs.trim() || undefined,
      };

      salvarRegistro(registro);
      feitos++;

      const legacyPesos = isTecnicaMode
        ? clusterData!.map((b) => String(b.kg))
        : [String(topKg), String(boKg), ...(extraKg > 0 ? [String(extraKg)] : [])];
      const legacyReps = isTecnicaMode
        ? clusterData!.map((b) => String(b.reps))
        : [String(topReps), String(boReps), ...(extraReps > 0 ? [String(extraReps)] : [])];
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

  function renderProgressBanner(ex: ExercicioSessao, prAtivo: boolean) {
    if (prAtivo) {
      return (
        <div
          data-testid="banner-pr"
          style={{
            background: "linear-gradient(135deg, #166534, #d97706)",
            border: "1px solid #D4AF37",
            borderRadius: 8,
            padding: "8px 10px",
            fontSize: 12,
            color: "#fff",
            marginBottom: 8,
            fontWeight: 600,
            animation: "pulse 1.4s infinite",
          }}
        >
          🔥 Ritmo de Recorde Pessoal! Confirme para validar o PR.
        </div>
      );
    }

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
                {!state?.skipped && state?.tecnicaConfirmed && state?.tecnica && (
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280" }}>
                    {state.tecnica}:{" "}
                    {(state.clusterSeries ?? [])
                      .filter((b) => parseFloat(b.kg) > 0 && parseInt(b.reps) > 0)
                      .map((b, i) => `R${i + 1}: ${b.kg}kg × ${b.reps}reps`)
                      .join(" · ")}
                  </p>
                )}
                {!state?.skipped && !state?.topSetConfirmed && !state?.tecnicaConfirmed && (
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

              // PR detection — recalculated on every render from live inputs
              const tsKg = parseFloat(state.topSetKg) || 0;
              const tsReps = parseInt(state.topSetReps) || 0;
              const historicoPr = carregarHistorico(currentEx.nome);
              const maxHistPr = historicoPr.reduce((max, r) => {
                const ref = extractReferenceBlock(r);
                return ref ? Math.max(max, calcEpley(ref.peso, ref.reps)) : max;
              }, 0);
              const current1RM = tsKg > 0 && tsReps > 0 ? calcEpley(tsKg, tsReps) : 0;
              // Live banner: teto da faixa OU superação do PR histórico (requer histórico existente)
              const prAtivo =
                !state.topSetConfirmed &&
                tsKg > 0 &&
                tsReps > 0 &&
                (tsReps >= currentEx.faixaTopSet[1] || (maxHistPr > 0 && current1RM > maxHistPr));

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

                  {renderProgressBanner(currentEx, prAtivo)}

                  {/* Técnica — chips sempre visíveis, substitui Top Set/Back-off quando ativo */}
                  <Card style={{ background: "#fafafa" }}>
                    <Label>Técnica</Label>
                    <div style={{ display: "flex", gap: 8, marginBottom: state.tecnica ? 12 : 0 }}>
                      <CycleChip
                        $active={state.tecnica === "BC"}
                        onClick={() => {
                          setTecnicaWarning(false);
                          if (state.tecnica === "BC") {
                            updateState(currentEx.nome, { tecnica: null, clusterSeries: [], tecnicaConfirmed: false });
                          } else {
                            updateState(currentEx.nome, {
                              tecnica: "BC",
                              clusterSeries: [{ kg: "", reps: "" }, { kg: "", reps: "" }, { kg: "", reps: "" }, { kg: "", reps: "" }],
                              topSetKg: "", topSetReps: "", backoffKg: "", backoffReps: "",
                              topSetConfirmed: false, backoffConfirmed: false,
                              topSetKgIsSuggestion: false, backoffKgIsSuggestion: false, backoffKgWasUserEdited: false,
                              tecnicaConfirmed: false,
                            });
                          }
                        }}
                        type="button"
                      >
                        BC
                      </CycleChip>
                      <CycleChip
                        $active={state.tecnica === "RP"}
                        onClick={() => {
                          setTecnicaWarning(false);
                          if (state.tecnica === "RP") {
                            updateState(currentEx.nome, { tecnica: null, clusterSeries: [], tecnicaConfirmed: false });
                          } else {
                            updateState(currentEx.nome, {
                              tecnica: "RP",
                              clusterSeries: [{ kg: "", reps: "" }, { kg: "", reps: "" }],
                              topSetKg: "", topSetReps: "", backoffKg: "", backoffReps: "",
                              topSetConfirmed: false, backoffConfirmed: false,
                              topSetKgIsSuggestion: false, backoffKgIsSuggestion: false, backoffKgWasUserEdited: false,
                              tecnicaConfirmed: false,
                            });
                          }
                        }}
                        type="button"
                      >
                        RP
                      </CycleChip>
                    </div>

                    {state.tecnica && !state.tecnicaConfirmed && (
                      <>
                        {state.clusterSeries.map((bloco, i) => (
                          <div key={i}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: "#374151", margin: "8px 0 4px" }}>
                              Bloco {i + 1}
                            </p>
                            <SeriesGrid>
                              <SerieRow>
                                <SerieLabel>Peso</SerieLabel>
                                <InputBox
                                  type="number"
                                  placeholder="kg"
                                  value={bloco.kg}
                                  onChange={(e) => {
                                    const cs = [...state.clusterSeries];
                                    cs[i] = { ...cs[i], kg: e.target.value };
                                    updateState(currentEx.nome, { clusterSeries: cs });
                                  }}
                                  $invalid={false}
                                  aria-label={`Bloco ${i + 1} kg ${currentEx.nome}`}
                                />
                                <Unit>kg</Unit>
                              </SerieRow>
                              <SerieRow>
                                <SerieLabel>Reps</SerieLabel>
                                <InputSm
                                  type="number"
                                  placeholder="reps"
                                  value={bloco.reps}
                                  onChange={(e) => {
                                    const cs = [...state.clusterSeries];
                                    cs[i] = { ...cs[i], reps: e.target.value };
                                    updateState(currentEx.nome, { clusterSeries: cs });
                                  }}
                                  $invalid={false}
                                  aria-label={`Bloco ${i + 1} reps ${currentEx.nome}`}
                                />
                                <Unit>reps</Unit>
                              </SerieRow>
                            </SeriesGrid>
                          </div>
                        ))}
                        <p style={{ fontSize: 12, color: "#6b7280", margin: "8px 0 4px" }}>
                          Total: {state.clusterSeries.reduce((sum, b) => {
                            return sum + (parseFloat(b.kg) || 0) * (parseInt(b.reps) || 0);
                          }, 0)} kg·reps
                        </p>
                        <button
                          type="button"
                          onClick={confirmTecnica}
                          style={{
                            width: "100%", padding: 10, marginTop: 4, border: "none", borderRadius: 8,
                            background: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                          }}
                        >
                          Confirmar Técnica
                        </button>
                        {tecnicaWarning && (
                          <div style={{
                            background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8,
                            padding: "9px 12px", fontSize: 12, color: "#c2410c", marginTop: 8,
                            display: "flex", alignItems: "center", gap: 6, fontWeight: 500,
                          }}>
                            ⚠ Preencha pelo menos um bloco com peso e repetições.
                          </div>
                        )}
                      </>
                    )}

                    {state.tecnica && state.tecnicaConfirmed && (
                      <>
                        <div style={{ fontSize: 12, color: "#374151", marginBottom: 6 }}>
                          {state.clusterSeries
                            .filter((b) => parseFloat(b.kg) > 0 && parseInt(b.reps) > 0)
                            .map((b, i) => (
                              <span key={i} style={{ marginRight: 8 }}>
                                R{i + 1}: {b.kg}kg × {b.reps}reps
                              </span>
                            ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => updateState(currentEx.nome, { tecnicaConfirmed: false })}
                          style={{
                            width: "100%", padding: 8, border: "1px solid #d1d5db",
                            borderRadius: 8, background: "#fff", color: "#6b7280",
                            fontSize: 12, cursor: "pointer",
                          }}
                        >
                          Editar Técnica
                        </button>
                      </>
                    )}
                  </Card>

                  {/* TOP SET / BACK-OFF / EXTRA — ocultos quando técnica está ativa */}
                  {!state.tecnica && (
                  <>
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
                          onChange={(e) => {
                            setTopSetWarning(false);
                            updateState(currentEx.nome, {
                              topSetKg: e.target.value,
                              topSetKgIsSuggestion: false,
                            });
                          }}
                          $invalid={topSetWarning && !(parseFloat(state.topSetKg) > 0)}
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
                          onChange={(e) => {
                            setTopSetWarning(false);
                            updateState(currentEx.nome, { topSetReps: e.target.value });
                          }}
                          $invalid={topSetWarning && !(parseInt(state.topSetReps) > 0)}
                          aria-label={`Top Set reps ${currentEx.nome}`}
                        />
                        <Unit>reps</Unit>
                      </SerieRow>
                    </SeriesGrid>

                    {!state.topSetConfirmed ? (
                      <>
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
                        {topSetWarning && (
                          <div style={{
                            background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8,
                            padding: "9px 12px", fontSize: 12, color: "#c2410c", marginTop: 8,
                            display: "flex", alignItems: "center", gap: 6, fontWeight: 500,
                          }}>
                            ⚠ Preencha o peso e as repetições do Top Set antes de confirmar.
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {state.prConfirmado ? (
                          <div style={{
                            background: "linear-gradient(135deg, #166534, #d97706)",
                            border: "1px solid #D4AF37", borderRadius: 8,
                            padding: "6px 10px", fontSize: 12, color: "#fff", marginTop: 8, textAlign: "center",
                            fontWeight: 600,
                          }}>
                            🔥 PR Confirmado!
                          </div>
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
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => updateState(currentEx.nome, { topSetConfirmed: false, prConfirmado: false })}
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
                            onChange={(e) => {
                              setBackoffWarning(false);
                              updateState(currentEx.nome, {
                                backoffKg: e.target.value,
                                backoffKgIsSuggestion: false,
                                backoffKgWasUserEdited: true,
                              });
                            }}
                            $invalid={backoffWarning && !(parseFloat(state.backoffKg) > 0)}
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
                            onChange={(e) => {
                              setBackoffWarning(false);
                              updateState(currentEx.nome, { backoffReps: e.target.value });
                            }}
                            $invalid={backoffWarning && !(parseInt(state.backoffReps) > 0)}
                            aria-label={`Back-off reps ${currentEx.nome}`}
                          />
                          <Unit>reps</Unit>
                        </SerieRow>
                      </SeriesGrid>

                      {!state.backoffConfirmed ? (
                        <>
                          <button
                            type="button"
                            onClick={confirmBackoff}
                            style={{
                              width: "100%", padding: 10, marginTop: 8, border: "none", borderRadius: 8,
                              background: "#2563eb", color: "#fff",
                              fontSize: 13, fontWeight: 600, cursor: "pointer",
                            }}
                          >
                            Confirmar Back-off
                          </button>
                          {backoffWarning && (
                            <div style={{
                              background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8,
                              padding: "9px 12px", fontSize: 12, color: "#c2410c", marginTop: 8,
                              display: "flex", alignItems: "center", gap: 6, fontWeight: 500,
                            }}>
                              ⚠ Preencha o peso e as repetições do Back-off antes de confirmar.
                            </div>
                          )}
                        </>
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
                  </>
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
                        onClick={() => {
                          if (state.tecnica) {
                            if (!state.tecnicaConfirmed) { setTecnicaWarning(true); return; }
                          } else {
                            if (!state.topSetConfirmed) { setTopSetWarning(true); return; }
                            if (!state.backoffConfirmed) { setBackoffWarning(true); return; }
                          }
                          nextExercise();
                        }}
                        style={{
                          flex: 2, padding: 10, border: "none", borderRadius: 8,
                          background: "#2563eb", color: "#fff",
                          fontSize: 13, fontWeight: 600, cursor: "pointer",
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
