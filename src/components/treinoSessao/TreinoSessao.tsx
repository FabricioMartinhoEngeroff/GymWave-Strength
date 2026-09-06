import { useEffect, useMemo, useState, useRef } from "react";
import { ROTACAO } from "../../data/cycles";
import { SESSOES, SESSOES_LABELS, type SessaoTipo, type ExercicioSessao } from "../../data/sessionExercises";
import type { PlanoTreino, RegistroExercicio } from "../../types/TrainingData";
import {
  salvarRegistro,
  ultimoRegistro,
  exercicioDeveSubirPeso,
  carregarHistorico,
  salvarDados,
  carregarDados,
  existeTreinoNaData,
  removerTreinoNaData,
  storageKey,
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
import { ExerciseGif } from "./ExerciseGif";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Per-exercise form state held in memory during a workout session.
 *
 * Modelo de séries v6 (os campos herdam nomes antigos por compatibilidade):
 *   topSetKg/Reps  → Top Set 1
 *   backoffKg/Reps → Top Set 2 (sempre; pesado, na faixa do Top Set)
 *   extraKg/Reps   → Back-off (~50%, só quando seriesValidas === 3)
 *
 * Suggestion pattern (applied to Top Set 1, Top Set 2 and Back-off):
 *   - On session load, every block is pre-filled with the values from the
 *     previous workout (ultimoRegistro) — same weight AND reps.
 *   - The *IsSuggestion / *Suggestion flags drive the blue-border visual hint.
 *   - Each flag is cleared when the user edits the corresponding field, so
 *     the UI distinguishes "carried from history" from "typed right now".
 *   - The *WasUserEdited guards prevent the auto-fill useEffects from
 *     overwriting a value the user already changed.
 *
 * Fallback when there is no previous record:
 *   - Top Set 1 fields are empty (no suggestion).
 *   - Top Set 2 kg mirrors Top Set 1 kg after Top Set 1 is confirmed.
 *   - Back-off kg is auto-calculated as topSetKg × backoffPct (~50%) after
 *     Top Set 2 is confirmed.
 */
interface ExerciseState {
  // ── Input values (all strings so <input> stays controlled) ──────────────
  topSetKg: string;
  topSetReps: string;
  backoffKg: string;
  backoffReps: string;
  extraKg: string;
  extraReps: string;

  // ── Confirmation & technique ─────────────────────────────────────────────
  seriesValidas: 2 | 3;
  topSetConfirmed: boolean;
  backoffConfirmed: boolean;
  tecnica: "RP" | null;
  clusterSeries: { kg: string; reps: string }[];   // Cluster Set — Série 1
  clusterSeries2: { kg: string; reps: string }[];  // Cluster Set — Série 2
  clusterActiveSerie: 1 | 2;                        // qual série está sendo preenchida
  tecnicaConfirmed: boolean;

  // ── Meta ─────────────────────────────────────────────────────────────────
  obs: string;
  skipped: boolean;
  prConfirmado: boolean;
  isDeload: boolean;

  // ── Suggestion flags (blue-border visual hint) ───────────────────────────
  topSetKgIsSuggestion: boolean;    // kg pre-filled from previous workout
  topSetRepsSuggestion: boolean;    // reps pre-filled from previous workout
  backoffKgIsSuggestion: boolean;   // kg pre-filled from previous workout
  backoffRepsSuggestion: boolean;   // reps pre-filled from previous workout
  extraKgIsSuggestion: boolean;     // kg pre-filled from previous workout
  extraRepsSuggestion: boolean;     // reps pre-filled from previous workout

  // ── Edit guards (prevent auto-fill useEffects from overwriting) ──────────
  backoffKgWasUserEdited: boolean;
  extraKgWasUserEdited: boolean;
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

/**
 * Expande um registro do último treino na lista completa de séries feitas,
 * na mesma ordem em que foram registradas (Top Set 1 → Top Set 2 → Back-off,
 * ou os blocos das duas séries quando o exercício foi em Cluster Set).
 */
function seriesDoRegistro(r: RegistroExercicio): { label: string; kg: number; reps: number }[] {
  const linhas: { label: string; kg: number; reps: number }[] = [];

  if (r.tecnica === "RP") {
    [r.clusterSeries, r.clusterSeries2].forEach((blocos, si) => {
      (blocos ?? [])
        .filter((b) => b.kg > 0 && b.reps > 0)
        .forEach((b, i) => linhas.push({ label: `Cluster S${si + 1} · B${i + 1}`, kg: b.kg, reps: b.reps }));
    });
    return linhas;
  }

  if (r.topSetKg > 0 && r.topSetReps > 0) {
    linhas.push({ label: r.isDeload ? "Top Set 1 (deload)" : "Top Set 1", kg: r.topSetKg, reps: r.topSetReps });
  }
  if (r.backoffKg > 0 && r.backoffReps > 0) {
    linhas.push({ label: "Top Set 2", kg: r.backoffKg, reps: r.backoffReps });
  }
  if (r.extraKg && r.extraReps && r.extraKg > 0 && r.extraReps > 0) {
    linhas.push({ label: "Back-off", kg: r.extraKg, reps: r.extraReps });
  }
  return linhas;
}

function getRotacaoId(sessao: SessaoTipo): string {
  const r = ROTACAO.find((rot) => rot.titulo === sessao);
  return r?.id ?? "";
}

/** Returns a blank ExerciseState with all suggestion flags off. */
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
    clusterSeries2: [],
    clusterActiveSerie: 1,
    tecnicaConfirmed: false,
    obs: "",
    skipped: false,
    topSetKgIsSuggestion: false,
    topSetRepsSuggestion: false,
    backoffKgIsSuggestion: false,
    backoffRepsSuggestion: false,
    backoffKgWasUserEdited: false,
    extraKgIsSuggestion: false,
    extraRepsSuggestion: false,
    extraKgWasUserEdited: false,
    prConfirmado: false,
    isDeload: false,
  };
}

// ─── Draft persistence ───────────────────────────────────────────────────────

const DRAFT_KEY = () => storageKey("rascunho_treino");

interface DraftPayload {
  states: Record<string, ExerciseState>;
  currentIdx: number;
}

type DraftStore = Partial<Record<SessaoTipo, DraftPayload>>;

function loadDraftStore(): DraftStore {
  try {
    const raw = localStorage.getItem(DRAFT_KEY());
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as DraftStore;
  } catch {
    return {};
  }
}

function saveDraftStore(store: DraftStore) {
  localStorage.setItem(DRAFT_KEY(), JSON.stringify(store));
}

function saveDraft(sessao: SessaoTipo, states: Record<string, ExerciseState>, idx: number) {
  const store = loadDraftStore();
  store[sessao] = { states, currentIdx: idx };
  saveDraftStore(store);
}

function clearDraft(sessao: SessaoTipo) {
  const store = loadDraftStore();
  delete store[sessao];
  if (Object.keys(store).length === 0) {
    localStorage.removeItem(DRAFT_KEY());
  } else {
    saveDraftStore(store);
  }
}

function sanitizeExerciseState(raw: Partial<ExerciseState>): ExerciseState {
  const base = emptyExerciseState();
  return {
    ...base,
    ...raw,
    topSetKg: raw.topSetKg ?? base.topSetKg,
    topSetReps: raw.topSetReps ?? base.topSetReps,
    backoffKg: raw.backoffKg ?? base.backoffKg,
    backoffReps: raw.backoffReps ?? base.backoffReps,
    extraKg: raw.extraKg ?? base.extraKg,
    extraReps: raw.extraReps ?? base.extraReps,
    obs: raw.obs ?? base.obs,
    clusterSeries: Array.isArray(raw.clusterSeries) ? raw.clusterSeries : base.clusterSeries,
    clusterSeries2: Array.isArray(raw.clusterSeries2) ? raw.clusterSeries2 : base.clusterSeries2,
    clusterActiveSerie: raw.clusterActiveSerie === 2 ? 2 : 1,
    seriesValidas: (raw.seriesValidas === 3 ? 3 : 2) as 2 | 3,
  };
}

function loadDraft(sessao: SessaoTipo): DraftPayload | null {
  const store = loadDraftStore();
  const payload = store[sessao];
  if (!payload || typeof payload !== "object") return null;
  if (!payload.states || typeof payload.states !== "object") return null;
  const sanitized: Record<string, ExerciseState> = {};
  for (const [key, val] of Object.entries(payload.states)) {
    sanitized[key] = sanitizeExerciseState(val as Partial<ExerciseState>);
  }
  return { states: sanitized, currentIdx: payload.currentIdx ?? 0 };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TreinoSessao({ onUnsavedChanges }: TreinoSessaoProps = {}) {
  const [sessao, setSessao] = useState<SessaoTipo | null>(null);
  const [data, setData] = useState(getTodayBR());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [exerciseStates, setExerciseStates] = useState<Record<string, ExerciseState>>({});
  const [salvo, setSalvo] = useState(false);
  const [salvarErro, setSalvarErro] = useState<string | null>(null);
  const [confirmarSubstituir, setConfirmarSubstituir] = useState(false);
  const [resumo, setResumo] = useState<{ feitos: number; total: number; subirPeso: number } | null>(null);
  const [mostrarRevisao, setMostrarRevisao] = useState(false);
  const [topSetWarning, setTopSetWarning] = useState(false);
  const [backoffWarning, setBackoffWarning] = useState(false);
  const [tecnicaWarning, setTecnicaWarning] = useState(false);

  // Refs to avoid stale closures in effects
  const exerciseStatesRef = useRef(exerciseStates);
  exerciseStatesRef.current = exerciseStates;
  const currentIdxRef = useRef(currentIdx);
  currentIdxRef.current = currentIdx;

  // Draft storage (in-memory only, per session type)
  const rascunhosRef = useRef<Partial<Record<SessaoTipo, Record<string, ExerciseState>>>>({});
  const prevSessaoRef = useRef<SessaoTipo | null>(null);

  const sessaoRef = useRef(sessao);
  sessaoRef.current = sessao;

  // Track which session the current exerciseStates belong to
  const statesSessaoRef = useRef<SessaoTipo | null>(null);

  // Persist draft to localStorage whenever exerciseStates or currentIdx change
  useEffect(() => {
    if (!sessao || resumo) return;
    // Only persist when states belong to the current session
    if (statesSessaoRef.current !== sessao) return;
    const hasData = Object.values(exerciseStates).some(
      (s) =>
        s.topSetKg !== "" || s.topSetReps !== "" || s.topSetConfirmed ||
        s.backoffConfirmed || s.skipped || s.obs !== "" ||
        s.clusterSeries.some((b) => b.kg !== "" || b.reps !== "") ||
        s.clusterSeries2.some((b) => b.kg !== "" || b.reps !== "")
    );
    if (hasData) {
      saveDraft(sessao, exerciseStates, currentIdx);
    }
  }, [exerciseStates, currentIdx, sessao, resumo]);

  const exercicios = useMemo(() => {
    if (!sessao) return [] as ExercicioSessao[];
    const configRaw = localStorage.getItem(storageKey("sessoes_config"));
    const sessoesConfig: Record<string, ExercicioSessao[]> = configRaw ? JSON.parse(configRaw) : {};
    const base = sessoesConfig[sessao] ? [...sessoesConfig[sessao]] : [...SESSOES[sessao]];
    const plano: PlanoTreino = JSON.parse(localStorage.getItem(storageKey("planoTreino")) || "{}");
    const sp = plano[sessao];
    if (!sp) return base;
    const updated = base.map((ex) => {
      const p = sp[ex.nome];
      if (!p) return ex;
      return { ...ex, seriesValidas: (p.series_validas === 3 ? 3 : 2) as 2 | 3 };
    });
    updated.sort((a, b) => {
      const ao = sp[a.nome]?.ordem ?? Infinity;
      const bo = sp[b.nome]?.ordem ?? Infinity;
      return ao - bo;
    });
    return updated;
  }, [sessao]);
  const currentEx = exercicios[currentIdx] ?? null;
  const treinoId = sessao ? getRotacaoId(sessao) : "";

  // Unsaved changes: session selected + not yet saved (no resumo) + has some data
  const hasUnsavedChanges =
    sessao !== null &&
    resumo === null &&
    Object.values(exerciseStates).some(
      (s) =>
        s.topSetKg !== "" || s.topSetReps !== "" || s.topSetConfirmed || s.backoffConfirmed ||
        s.clusterSeries.some((b) => b.kg !== "" || b.reps !== "") ||
        s.clusterSeries2.some((b) => b.kg !== "" || b.reps !== "")
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

    // Save draft of previous session before switching (memory + localStorage)
    if (prevSessaoRef.current !== null && prevSessaoRef.current !== sessao) {
      rascunhosRef.current[prevSessaoRef.current] = exerciseStatesRef.current;
      saveDraft(prevSessaoRef.current, exerciseStatesRef.current, currentIdxRef.current);
    }
    prevSessaoRef.current = sessao;

    // Restore from in-memory draft (same app session, switching tabs)
    const currentExNames = new Set(exercicios.map((e) => e.nome));
    const memDraft = rascunhosRef.current[sessao];
    if (memDraft) {
      const draftNames = Object.keys(memDraft);
      const draftMatchesCurrent = draftNames.length > 0 && draftNames.some((n) => currentExNames.has(n));
      if (draftMatchesCurrent) {
        setExerciseStates(memDraft);
        setCurrentIdx(0);
        setMostrarRevisao(false);
        setResumo(null);
        setSalvo(false);
        setSalvarErro(null);
        setConfirmarSubstituir(false);
        statesSessaoRef.current = sessao;
        return;
      }
      delete rascunhosRef.current[sessao];
    }

    // Restore from localStorage draft (app was closed/reopened)
    const lsDraft = loadDraft(sessao);
    if (lsDraft) {
      const draftNames = Object.keys(lsDraft.states);
      const draftMatchesCurrent = draftNames.length > 0 && draftNames.some((n) => currentExNames.has(n));
      if (draftMatchesCurrent) {
        setExerciseStates(lsDraft.states);
        setCurrentIdx(lsDraft.currentIdx);
        setMostrarRevisao(false);
        setResumo(null);
        setSalvo(false);
        setSalvarErro(null);
        setConfirmarSubstituir(false);
        statesSessaoRef.current = sessao;
        return;
      }
      clearDraft(sessao);
    }

    // Load from history
    const states: Record<string, ExerciseState> = {};
    const exs = exercicios;
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
        state.topSetReps = String(ultimo.topSetReps);
        state.topSetRepsSuggestion = true;
        if (ultimo.backoffKg > 0) {
          state.backoffKg = String(ultimo.backoffKg);
          state.backoffKgIsSuggestion = true;
        }
        if (ultimo.backoffReps > 0) {
          state.backoffReps = String(ultimo.backoffReps);
          state.backoffRepsSuggestion = true;
        }
        if (ultimo.extraKg && ultimo.extraKg > 0) {
          state.extraKg = String(ultimo.extraKg);
          state.extraKgIsSuggestion = true;
        }
        if (ultimo.extraReps && ultimo.extraReps > 0) {
          state.extraReps = String(ultimo.extraReps);
          state.extraRepsSuggestion = true;
        }
      }
      states[ex.nome] = state;
    });
    setExerciseStates(states);
    setCurrentIdx(0);
    setMostrarRevisao(false);
    setResumo(null);
    setSalvo(false);
    setSalvarErro(null);
    setConfirmarSubstituir(false);
    statesSessaoRef.current = sessao;
  }, [sessao, exercicios]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset validation warnings when navigating between exercises or sessions
  useEffect(() => {
    setTopSetWarning(false);
    setBackoffWarning(false);
    setTecnicaWarning(false);
  }, [currentIdx, sessao]);

  // Fallback: suggest Top Set 2 kg mirroring Top Set 1 kg when there is no
  // previous record (backoffKg stayed empty after session load) and the user
  // hasn't typed anything yet.  Skipped when it's already pre-filled from the
  // previous workout.  (backoffKg slot = Top Set 2 no modelo v6.)
  useEffect(() => {
    if (!currentEx) return;
    const state = exerciseStates[currentEx.nome];
    if (!state?.topSetConfirmed || state.isDeload || state.backoffKg || state.backoffKgWasUserEdited) return;
    const topKg = parseFloat(state.topSetKg);
    if (!isNaN(topKg) && topKg > 0) {
      setExerciseStates((prev) => ({
        ...prev,
        [currentEx.nome]: {
          ...prev[currentEx.nome],
          backoffKg: String(topKg),
          backoffKgIsSuggestion: true,
        },
      }));
    }
  }, [currentEx, exerciseStates]);

  // Fallback: suggest Back-off kg as topSetKg × backoffPct (~50%) when the
  // back-off block first appears (3 válidas) and the user hasn't typed anything
  // yet.  Skipped when it's already pre-filled from the previous workout.
  // (extraKg slot = Back-off no modelo v6.)
  useEffect(() => {
    if (!currentEx) return;
    const state = exerciseStates[currentEx.nome];
    if (!state?.backoffConfirmed || state.extraKg !== "" || state.seriesValidas !== 3 || state.extraKgWasUserEdited) return;
    const topKg = parseFloat(state.topSetKg);
    if (!isNaN(topKg) && topKg > 0) {
      const suggested = Math.round(topKg * currentEx.backoffPct);
      setExerciseStates((prev) => ({
        ...prev,
        [currentEx.nome]: {
          ...prev[currentEx.nome],
          extraKg: String(suggested),
          extraKgIsSuggestion: true,
        },
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

  function serieClusterTemBloco(blocos: { kg: string; reps: string }[]): boolean {
    return blocos.some((b) => parseFloat(b.kg) > 0 && parseInt(b.reps) > 0);
  }

  function canConfirmTecnica(): boolean {
    if (!currentEx) return false;
    const s = exerciseStates[currentEx.nome];
    if (!s || !s.tecnica) return false;
    // Cluster Set tem sempre 2 séries: ambas precisam de ao menos um bloco válido.
    return serieClusterTemBloco(s.clusterSeries) && serieClusterTemBloco(s.clusterSeries2);
  }

  /** Avança da Série 1 para a Série 2 (exige ao menos um bloco válido na Série 1). */
  function finalizarSerieCluster1() {
    if (!currentEx) return;
    const s = exerciseStates[currentEx.nome];
    if (!s || !serieClusterTemBloco(s.clusterSeries)) {
      setTecnicaWarning(true);
      return;
    }
    setTecnicaWarning(false);
    updateState(currentEx.nome, { clusterActiveSerie: 2 });
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
    if (state.isDeload) return state.topSetConfirmed;
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

  function handleSalvarTreino(forcarSubstituicao = false) {
    if (!sessao) return;

    if (!forcarSubstituicao && existeTreinoNaData(treinoId, data)) {
      setConfirmarSubstituir(true);
      return;
    }

    try {
      if (forcarSubstituicao) {
        removerTreinoNaData(treinoId, data);
      }

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

        const parseCluster = (blocos: { kg: string; reps: string }[]) =>
          blocos
            .map((b) => ({ kg: parseFloat(b.kg) || 0, reps: parseInt(b.reps) || 0 }))
            .filter((b) => b.kg > 0 && b.reps > 0);
        const clusterData = isTecnicaMode ? parseCluster(state.clusterSeries) : undefined;
        const clusterData2 = isTecnicaMode ? parseCluster(state.clusterSeries2) : undefined;

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
          clusterSeries2: clusterData2 && clusterData2.length > 0 ? clusterData2 : undefined,
          pesoAnterior: ultimo?.topSetKg,
          repsAnterior: ultimo?.topSetReps,
          progrediu: ultimo ? topKg > ultimo.topSetKg : false,
          isDeload: state.isDeload,
          obs: state.obs.trim() || undefined,
        };

        salvarRegistro(registro);
        feitos++;

        const allClusterBlocks = isTecnicaMode
          ? [...clusterData!, ...(clusterData2 ?? [])]
          : [];
        const legacyPesos = isTecnicaMode
          ? allClusterBlocks.map((b) => String(b.kg))
          : [String(topKg), String(boKg), ...(extraKg > 0 ? [String(extraKg)] : [])];
        const legacyReps = isTecnicaMode
          ? allClusterBlocks.map((b) => String(b.reps))
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

      // Clear draft after saving (memory + localStorage)
      if (sessao) {
        delete rascunhosRef.current[sessao];
        clearDraft(sessao);
      }

      setConfirmarSubstituir(false);
      setSalvarErro(null);
      setMostrarRevisao(false);
      setResumo({ feitos, total: exercicios.length, subirPeso });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 5000);
      setSessao(null);
      setExerciseStates({});
      setCurrentIdx(0);
    } catch (err) {
      console.error("Erro ao salvar treino:", err);
      setSalvarErro("Não foi possível salvar o treino. Tente novamente.");
      setTimeout(() => setSalvarErro(null), 8000);
    }
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  function renderDaysSince() {
    if (!sessao || !treinoId) return null;
    let lastDate: string | undefined;
    exercicios.forEach((ex) => {
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

  /**
   * Painel "Último treino": lista TODAS as séries do treino anterior deste
   * exercício (Top Set 1, Top Set 2, Back-off — ou os blocos do Cluster Set),
   * para decidir entre subir a carga ou manter e buscar mais reps.
   */
  function renderUltimoTreinoDetalhe(ultimo: RegistroExercicio) {
    const linhas = seriesDoRegistro(ultimo);
    if (linhas.length === 0) return null;
    const volume = linhas.reduce((sum, l) => sum + l.kg * l.reps, 0);

    return (
      <div
        data-testid="ultimo-treino-detalhe"
        style={{
          background: "#f0f9ff", border: "0.5px solid #bae6fd", borderRadius: 8,
          padding: "8px 10px", marginBottom: 8,
        }}
      >
        <div style={{
          display: "flex", alignItems: "baseline", justifyContent: "space-between",
          gap: 8, marginBottom: 4,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#0369a1", letterSpacing: 0.3 }}>
            ÚLTIMO TREINO
          </span>
          <span style={{ fontSize: 10, color: "#0284c7" }}>{ultimo.data}</span>
        </div>

        {linhas.map((l, i) => (
          <div
            key={`${l.label}-${i}`}
            style={{
              display: "flex", alignItems: "baseline", justifyContent: "space-between",
              gap: 8, padding: "3px 0",
              borderTop: i === 0 ? "none" : "0.5px solid #d8eefc",
            }}
          >
            <span style={{ fontSize: 11, color: "#0369a1" }}>{l.label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#075985", whiteSpace: "nowrap" }}>
              {l.kg}kg × {l.reps} reps
            </span>
          </div>
        ))}

        <div style={{ fontSize: 10, color: "#0284c7", marginTop: 4 }}>
          {linhas.length} série(s) · volume {volume} kg·reps
        </div>

        {ultimo.obs && (
          <p style={{ fontSize: 11, color: "#0369a1", margin: "4px 0 0", fontStyle: "italic" }}>
            “{ultimo.obs}”
          </p>
        )}
      </div>
    );
  }

  function renderProgressBanner(ex: ExercicioSessao, prAtivo: boolean) {
    const deveSubir = exercicioDeveSubirPeso(ex.nome, treinoId);
    const ultimo = ultimoRegistro(ex.nome, treinoId);

    return (
      <>
        {prAtivo && (
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
        )}

        {!ultimo && (
          <div style={{
            background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8,
            padding: "8px 10px", fontSize: 12, color: "#1d4ed8", marginBottom: 8,
          }}>
            Primeiro registro — defina o peso
          </div>
        )}

        {ultimo && !prAtivo && deveSubir && (
          <div style={{
            background: "#fefce8", border: "1px solid #fde68a", borderRadius: 8,
            padding: "8px 10px", fontSize: 12, color: "#92400e", marginBottom: 8,
          }}>
            SUBIR PESO HOJE (teto atingido: {ultimo.topSetKg}kg x {ultimo.topSetReps}reps)
          </div>
        )}

        {ultimo && renderUltimoTreinoDetalhe(ultimo)}
      </>
    );
  }

  function renderRevisao() {
    if (confirmarSubstituir) {
      return (
        <Card>
          <Label>Atenção</Label>
          <div style={{
            background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8,
            padding: "10px 12px", fontSize: 13, color: "#c2410c", marginBottom: 12, lineHeight: 1.5,
          }}>
            ⚠ Já existe um treino de <strong>{treinoId}</strong> salvo em <strong>{data}</strong>. Salvar novamente vai substituir o registro desse dia — não será criado um treino duplicado.
          </div>
          <SaveBtn
            $disabled={false}
            disabled={false}
            onClick={() => handleSalvarTreino(true)}
            type="button"
          >
            Substituir registro do dia
          </SaveBtn>
          <button
            type="button"
            onClick={() => setConfirmarSubstituir(false)}
            style={{
              width: "100%", padding: 10, marginTop: 8, border: "1px solid #d1d5db",
              borderRadius: 8, background: "#fff", color: "#6b7280", fontSize: 13, cursor: "pointer",
            }}
          >
            Cancelar
          </button>
        </Card>
      );
    }

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
                    Top 1: {state.topSetKg}kg × {state.topSetReps}reps
                    {state.backoffConfirmed && ` · Top 2: ${state.backoffKg}kg × ${state.backoffReps}reps`}
                    {state.seriesValidas === 3 && state.extraKg && ` · Back-off: ${state.extraKg}kg × ${state.extraReps}reps`}
                    {state?.isDeload && <span style={{ color: "#dc2626" }}> · Deload</span>}
                  </p>
                )}
                {!state?.skipped && state?.tecnicaConfirmed && state?.tecnica && (
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280" }}>
                    {[state.clusterSeries ?? [], state.clusterSeries2 ?? []]
                      .map((blocos) =>
                        blocos
                          .filter((b) => parseFloat(b.kg) > 0 && parseInt(b.reps) > 0)
                          .map((b, i) => `B${i + 1}: ${b.kg}kg × ${b.reps}reps`)
                          .join(" · ")
                      )
                      .filter((s) => s !== "")
                      .map((serieTxt, si) => `Cluster S${si + 1} — ${serieTxt}`)
                      .join("  |  ")}
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
          onClick={() => handleSalvarTreino()}
          type="button"
          style={{ marginTop: 12 }}
        >
          Confirmar e Salvar Treino
        </SaveBtn>
        <button
          type="button"
          onClick={() => { setMostrarRevisao(false); setConfirmarSubstituir(false); }}
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
        {salvo && (
          <ToastBanner $variant="success" role="status">
            ✅ Treino finalizado! Registro salvo com sucesso.
          </ToastBanner>
        )}
        {salvarErro && (
          <ToastBanner $variant="error" role="alert">
            ❌ {salvarErro}
          </ToastBanner>
        )}

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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 8 }}>
              {/* Anterior / contador / Próximo */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                <button
                  type="button"
                  onClick={prevExercise}
                  disabled={currentIdx === 0}
                  style={{
                    flex: 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                    padding: "8px 0",
                    borderRadius: 10,
                    border: "1.5px solid",
                    borderColor: currentIdx === 0 ? "#e5e7eb" : "#2563eb",
                    background: currentIdx === 0 ? "#f9fafb" : "#eff6ff",
                    color: currentIdx === 0 ? "#d1d5db" : "#2563eb",
                    fontSize: 13, fontWeight: 600,
                    cursor: currentIdx === 0 ? "default" : "pointer",
                  }}
                  aria-label="Exercício anterior"
                >
                  ‹ Anterior
                </button>

                <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", whiteSpace: "nowrap" }}>
                  {currentIdx + 1} / {exercicios.length}
                </span>

                <button
                  type="button"
                  onClick={nextExercise}
                  disabled={currentIdx === exercicios.length - 1}
                  style={{
                    flex: 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                    padding: "8px 0",
                    borderRadius: 10,
                    border: "1.5px solid",
                    borderColor: currentIdx === exercicios.length - 1 ? "#e5e7eb" : "#2563eb",
                    background: currentIdx === exercicios.length - 1 ? "#f9fafb" : "#eff6ff",
                    color: currentIdx === exercicios.length - 1 ? "#d1d5db" : "#2563eb",
                    fontSize: 13, fontWeight: 600,
                    cursor: currentIdx === exercicios.length - 1 ? "default" : "pointer",
                  }}
                  aria-label="Próximo exercício"
                >
                  Próximo ›
                </button>
              </div>

              {/* Progress dots */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", maxWidth: 280 }}>
                {exercicios.map((ex, idx) => (
                  <div
                    key={ex.nome}
                    onClick={() => setCurrentIdx(idx)}
                    title={`${ex.nome}${isExerciseDone(ex.nome) ? " ✓" : ""}`}
                    style={{
                      width: 10, height: 10, borderRadius: "50%", cursor: "pointer",
                      background: idx === currentIdx
                        ? "#2563eb"
                        : isExerciseDone(ex.nome)
                        ? "#16a34a"
                        : "#d1d5db",
                      border: idx === currentIdx ? "2px solid #1d4ed8" : "2px solid transparent",
                      transition: "background 0.15s",
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
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
                        Top Sets: {currentEx.faixaTopSet[0]}–{currentEx.faixaTopSet[1]} reps
                        {state.seriesValidas === 3 && ` · Back-off (${Math.round(currentEx.backoffPct * 100)}%): ${currentEx.faixaBackoff[0]}–${currentEx.faixaBackoff[1]} reps`}
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

                  <ExerciseGif exerciseName={currentEx.nome} />

                  {renderProgressBanner(currentEx, prAtivo)}

                  {/* Técnica — chips sempre visíveis, substitui Top Set/Back-off quando ativo */}
                  <Card style={{ background: "#fafafa" }}>
                    <Label>Técnica</Label>
                    <div style={{ display: "flex", gap: 8, marginBottom: (state.tecnica || state.isDeload) ? 12 : 0 }}>
                      <CycleChip
                        $active={state.tecnica === "RP"}
                        onClick={() => {
                          setTecnicaWarning(false);
                          if (state.tecnica === "RP") {
                            // Restore last workout values when disabling Rest Pause
                            const ultimo = ultimoRegistro(currentEx.nome, treinoId);
                            const restored: Partial<ExerciseState> = {
                              tecnica: null,
                              clusterSeries: [],
                              clusterSeries2: [],
                              clusterActiveSerie: 1,
                              tecnicaConfirmed: false,
                              topSetConfirmed: false,
                              backoffConfirmed: false,
                              topSetKg: "",
                              topSetReps: "",
                              backoffKg: "",
                              backoffReps: "",
                              topSetKgIsSuggestion: false,
                              topSetRepsSuggestion: false,
                              backoffKgIsSuggestion: false,
                              backoffRepsSuggestion: false,
                              backoffKgWasUserEdited: false,
                            };
                            if (ultimo) {
                              let suggestedKg = ultimo.topSetKg;
                              if (ultimo.topSetBateuTeto) {
                                const increment = ultimo.topSetKg >= 40 ? 2 : 1;
                                suggestedKg = ultimo.topSetKg + increment;
                              }
                              restored.topSetKg = String(suggestedKg);
                              restored.topSetKgIsSuggestion = true;
                              restored.topSetReps = String(ultimo.topSetReps);
                              restored.topSetRepsSuggestion = true;
                              if (ultimo.backoffKg > 0) {
                                restored.backoffKg = String(ultimo.backoffKg);
                                restored.backoffKgIsSuggestion = true;
                              }
                              if (ultimo.backoffReps > 0) {
                                restored.backoffReps = String(ultimo.backoffReps);
                                restored.backoffRepsSuggestion = true;
                              }
                            }
                            updateState(currentEx.nome, restored);
                          } else {
                            updateState(currentEx.nome, {
                              tecnica: "RP",
                              isDeload: false,
                              clusterSeries: [{ kg: "", reps: "" }, { kg: "", reps: "" }, { kg: "", reps: "" }, { kg: "", reps: "" }],
                              clusterSeries2: [{ kg: "", reps: "" }, { kg: "", reps: "" }, { kg: "", reps: "" }, { kg: "", reps: "" }],
                              clusterActiveSerie: 1,
                              topSetKg: "", topSetReps: "", backoffKg: "", backoffReps: "",
                              topSetConfirmed: false, backoffConfirmed: false,
                              topSetKgIsSuggestion: false, backoffKgIsSuggestion: false, backoffKgWasUserEdited: false,
                              tecnicaConfirmed: false,
                            });
                          }
                        }}
                        type="button"
                      >
                        Cluster Set
                      </CycleChip>
                      <CycleChip
                        $active={state.isDeload}
                        onClick={() => {
                          if (state.isDeload) {
                            // Disable deload — restore back-off from last workout
                            const ultimo = ultimoRegistro(currentEx.nome, treinoId);
                            const restored: Partial<ExerciseState> = {
                              isDeload: false,
                              backoffConfirmed: false,
                              backoffKg: "",
                              backoffReps: "",
                              backoffKgIsSuggestion: false,
                              backoffRepsSuggestion: false,
                              backoffKgWasUserEdited: false,
                            };
                            if (ultimo && ultimo.backoffKg > 0) {
                              restored.backoffKg = String(ultimo.backoffKg);
                              restored.backoffKgIsSuggestion = true;
                            }
                            if (ultimo && ultimo.backoffReps > 0) {
                              restored.backoffReps = String(ultimo.backoffReps);
                              restored.backoffRepsSuggestion = true;
                            }
                            updateState(currentEx.nome, restored);
                          } else {
                            // Enable deload — disable RP if active, clear back-off
                            updateState(currentEx.nome, {
                              isDeload: true,
                              tecnica: null,
                              clusterSeries: [],
                              clusterSeries2: [],
                              clusterActiveSerie: 1,
                              tecnicaConfirmed: false,
                              backoffKg: "",
                              backoffReps: "",
                              backoffConfirmed: false,
                              backoffKgIsSuggestion: false,
                              backoffRepsSuggestion: false,
                              backoffKgWasUserEdited: false,
                            });
                          }
                        }}
                        type="button"
                      >
                        Deload
                      </CycleChip>
                    </div>

                    {state.isDeload && (
                      <p style={{ fontSize: 12, color: "#dc2626", margin: "0 0 8px", fontWeight: 500 }}>
                        Deload — apenas 1 série válida (Top Set), mesmo peso do último treino
                      </p>
                    )}

                    {state.tecnica && !state.tecnicaConfirmed && (() => {
                      const serie = state.clusterActiveSerie;
                      const activeKey = serie === 1 ? "clusterSeries" : "clusterSeries2";
                      const activeBlocks = serie === 1 ? state.clusterSeries : state.clusterSeries2;
                      const setBlocks = (blocos: { kg: string; reps: string }[]) =>
                        updateState(currentEx.nome, { [activeKey]: blocos } as Partial<ExerciseState>);
                      const serie1Total = state.clusterSeries.reduce(
                        (sum, b) => sum + (parseFloat(b.kg) || 0) * (parseInt(b.reps) || 0), 0);
                      return (
                      <>
                        {/* Navegação entre as 2 séries cluster */}
                        <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                          {[1, 2].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => {
                                setTecnicaWarning(false);
                                // Só permite ir para a Série 2 se a Série 1 tiver um bloco válido
                                if (n === 2 && !serieClusterTemBloco(state.clusterSeries)) {
                                  setTecnicaWarning(true);
                                  return;
                                }
                                updateState(currentEx.nome, { clusterActiveSerie: n as 1 | 2 });
                              }}
                              style={{
                                flex: 1, padding: "6px 8px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                                cursor: "pointer",
                                border: serie === n ? "1px solid #2563eb" : "1px solid #d1d5db",
                                background: serie === n ? "#eff6ff" : "#fff",
                                color: serie === n ? "#1d4ed8" : "#6b7280",
                              }}
                            >
                              Série {n}
                              {n === 1 && serieClusterTemBloco(state.clusterSeries) ? " ✓" : ""}
                              {n === 2 && serieClusterTemBloco(state.clusterSeries2) ? " ✓" : ""}
                            </button>
                          ))}
                        </div>

                        {activeBlocks.map((bloco, i) => (
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
                                    const cs = [...activeBlocks];
                                    cs[i] = { ...cs[i], kg: e.target.value };
                                    setBlocks(cs);
                                  }}
                                  $invalid={false}
                                  aria-label={`Série ${serie} bloco ${i + 1} kg ${currentEx.nome}`}
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
                                    const cs = [...activeBlocks];
                                    cs[i] = { ...cs[i], reps: e.target.value };
                                    setBlocks(cs);
                                  }}
                                  $invalid={false}
                                  aria-label={`Série ${serie} bloco ${i + 1} reps ${currentEx.nome}`}
                                />
                                <Unit>reps</Unit>
                              </SerieRow>
                            </SeriesGrid>
                          </div>
                        ))}
                        <p style={{ fontSize: 12, color: "#6b7280", margin: "8px 0 4px" }}>
                          Total Série {serie}: {activeBlocks.reduce((sum, b) => {
                            return sum + (parseFloat(b.kg) || 0) * (parseInt(b.reps) || 0);
                          }, 0)} kg·reps
                          {serie === 2 && (
                            <> · Geral: {serie1Total + activeBlocks.reduce((sum, b) =>
                              sum + (parseFloat(b.kg) || 0) * (parseInt(b.reps) || 0), 0)} kg·reps</>
                          )}
                        </p>

                        {serie === 1 ? (
                          <button
                            type="button"
                            onClick={finalizarSerieCluster1}
                            style={{
                              width: "100%", padding: 10, marginTop: 4, border: "none", borderRadius: 8,
                              background: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                            }}
                          >
                            Finalizar Série 1 → Série 2
                          </button>
                        ) : (
                          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                            <button
                              type="button"
                              onClick={() => {
                                setTecnicaWarning(false);
                                updateState(currentEx.nome, { clusterActiveSerie: 1 });
                              }}
                              style={{
                                flex: "0 0 auto", padding: "10px 14px", border: "1px solid #d1d5db",
                                borderRadius: 8, background: "#fff", color: "#6b7280", fontSize: 13, cursor: "pointer",
                              }}
                            >
                              ← Série 1
                            </button>
                            <button
                              type="button"
                              onClick={confirmTecnica}
                              style={{
                                flex: 1, padding: 10, border: "none", borderRadius: 8,
                                background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                              }}
                            >
                              Confirmar Cluster
                            </button>
                          </div>
                        )}
                        {tecnicaWarning && (
                          <div style={{
                            background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8,
                            padding: "9px 12px", fontSize: 12, color: "#c2410c", marginTop: 8,
                            display: "flex", alignItems: "center", gap: 6, fontWeight: 500,
                          }}>
                            ⚠ Preencha pelo menos um bloco (peso e reps) em cada série.
                          </div>
                        )}
                      </>
                      );
                    })()}

                    {state.tecnica && state.tecnicaConfirmed && (
                      <>
                        {[state.clusterSeries, state.clusterSeries2].map((blocos, si) => {
                          const validos = blocos.filter((b) => parseFloat(b.kg) > 0 && parseInt(b.reps) > 0);
                          if (validos.length === 0) return null;
                          return (
                            <div key={si} style={{ fontSize: 12, color: "#374151", marginBottom: 6 }}>
                              <strong style={{ color: "#1d4ed8", marginRight: 6 }}>S{si + 1}:</strong>
                              {validos.map((b, i) => (
                                <span key={i} style={{ marginRight: 8 }}>
                                  B{i + 1}: {b.kg}kg × {b.reps}reps
                                </span>
                              ))}
                            </div>
                          );
                        })}
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
                  {/* TOP SET 1 block */}
                  <Card style={{ background: "#fafafa" }}>
                    <Label>Top Set 1</Label>
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
                          aria-label={`Top Set 1 kg ${currentEx.nome}`}
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
                          aria-label={`Top Set 1 reps ${currentEx.nome}`}
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
                          Confirmar Top Set 1
                        </button>
                        {topSetWarning && (
                          <div style={{
                            background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8,
                            padding: "9px 12px", fontSize: 12, color: "#c2410c", marginTop: 8,
                            display: "flex", alignItems: "center", gap: 6, fontWeight: 500,
                          }}>
                            ⚠ Preencha o peso e as repetições do Top Set 1 antes de confirmar.
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
                          Editar Top Set 1
                        </button>
                      </>
                    )}
                  </Card>

                  {/* TOP SET 2 block (after Top Set 1 confirmed, hidden in deload mode) */}
                  {state.topSetConfirmed && !state.isDeload && (
                    <Card style={{ background: "#fafafa" }}>
                      <Label>Top Set 2</Label>
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
                            aria-label={`Top Set 2 kg ${currentEx.nome}`}
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
                            aria-label={`Top Set 2 reps ${currentEx.nome}`}
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
                            Confirmar Top Set 2
                          </button>
                          {backoffWarning && (
                            <div style={{
                              background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8,
                              padding: "9px 12px", fontSize: 12, color: "#c2410c", marginTop: 8,
                              display: "flex", alignItems: "center", gap: 6, fontWeight: 500,
                            }}>
                              ⚠ Preencha o peso e as repetições do Top Set 2 antes de confirmar.
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
                          Editar Top Set 2
                        </button>
                      )}
                    </Card>
                  )}

                  {/* BACK-OFF block (only when 3 válidas — carga leve ~50% até a falha) */}
                  {state.topSetConfirmed && state.backoffConfirmed && state.seriesValidas === 3 && (
                    <Card style={{ background: "#fafafa" }}>
                      <Label>Back-off ({Math.round(currentEx.backoffPct * 100)}%)</Label>
                      <SeriesGrid>
                        <SerieRow>
                          <SerieLabel>Peso</SerieLabel>
                          <InputBox
                            type="number"
                            placeholder="kg"
                            value={state.extraKg}
                            onChange={(e) => updateState(currentEx.nome, { extraKg: e.target.value, extraKgIsSuggestion: false, extraKgWasUserEdited: true })}
                            $invalid={false}
                            $isSuggestion={state.extraKgIsSuggestion}
                            aria-label={`Back-off kg ${currentEx.nome}`}
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
                            aria-label={`Back-off reps ${currentEx.nome}`}
                          />
                          <Unit>reps</Unit>
                        </SerieRow>
                      </SeriesGrid>
                      <p style={{ fontSize: 11, color: "#6b7280", margin: "4px 0 0" }}>
                        Carga leve (~{Math.round(currentEx.backoffPct * 100)}% do Top Set) até a falha · {currentEx.faixaBackoff[0]}–{currentEx.faixaBackoff[1]}+ reps · não conta para teto
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
                            if (!state.isDeload && !state.backoffConfirmed) { setBackoffWarning(true); return; }
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
