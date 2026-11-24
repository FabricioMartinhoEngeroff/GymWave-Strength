import { useEffect, useMemo, useRef, useState } from "react";
import type { ExercicioSessao } from "../../../data/sessionExercises";
import { hojeBR, parseDataBR } from "../../../utils/datas";
import { calcEpley, extractReferenceBlock } from "../../../utils/epleyCalc";
import { detectarFadiga, deveSubirPeso } from "../../../utils/esforco";
import { idDaSessao, listarSessoes } from "../../../utils/planilhaSessoes";
import {
  carregarDados,
  carregarHistorico,
  carregarLogbookCompleto,
  carregarRegistros,
  emTransacao,
  existeTreinoNaData,
  removerTreinoNaData,
  salvarDados,
  salvarRegistro,
  referenciaDoExercicio,
  ultimoTreinoNormal,
} from "../../../utils/storage";
import { useEscalaEsforco } from "./useEscalaEsforco";
import { avisarErro } from "../../mensagens/avisarErro";
import { mensagens } from "../../mensagens/mensagens";
import { conquistasDoTreino } from "../domain/conquistas";
import {
  ativarCluster,
  ativarDeload,
  clusterCompleto,
  desativarCluster,
  desativarDeload,
  emptyExerciseState,
  espelharPesos,
  estadoInicial,
  exercicioConcluido,
  serieClusterTemBloco,
  serieValida,
  seriesExtrasDoTopSet,
  temProgresso,
  temTopSet2,
  topSet2Feito,
  topSet2NaoFeito,
  topSetFeito,
  type PatchExercicio,
} from "../domain/estadoExercicio";
import { montarRegistro } from "../domain/montarRegistro";
import { pendenciasDoTreino } from "../domain/pendencias";
import { clearDraft, loadDraft, rascunhoCombina, saveDraft, type EstadosDaSessao } from "../domain/rascunho";
import { exerciciosDaSessao, lerSessoesConfig } from "../domain/sessoes";

export interface ResumoTreino {
  feitos: number;
  total: number;
  subirPeso: number;
}

const SEM_AVISOS = { topSet: false, backoff: false, tecnica: false };
type Avisos = typeof SEM_AVISOS;

const VAZIO = emptyExerciseState();

/** Sessão de treino: sugestão do último treino, espelho de peso, rascunho, navegação e salvamento. */
export function useSessaoTreino(onUnsavedChanges?: (has: boolean) => void) {
  const [sessao, setSessao] = useState<string | null>(null);
  const [data, setData] = useState(hojeBR);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [states, setStates] = useState<EstadosDaSessao>({});
  // As 4 sessões fixas, ou as sessões da planilha importada (ex.: protocolo de 6 dias).
  const sessoesDisponiveis = useMemo(() => listarSessoes(lerSessoesConfig()), []);
  const [confirmarSubstituir, setConfirmarSubstituir] = useState(false);
  const [resumo, setResumo] = useState<ResumoTreino | null>(null);
  const [mostrarRevisao, setMostrarRevisao] = useState(false);
  const { escala, alternarEscala } = useEscalaEsforco();
  const [avisos, setAvisos] = useState<Avisos>(SEM_AVISOS);

  const exercicios = useMemo(() => (sessao ? exerciciosDaSessao(sessao) : []), [sessao]);
  // Sessões fixas usam o id da rotação (UA, LB…); sessões da planilha, o id do rótulo ("S1 Seg · Pull" → S1SEG).
  const treinoId = sessao ? idDaSessao(sessao) : "";
  const currentEx: ExercicioSessao | null = exercicios[currentIdx] ?? null;
  const state = (currentEx && states[currentEx.nome]) ?? VAZIO;

  // Último estado renderizado, para o efeito de troca de sessão não ler valores velhos.
  const atualRef = useRef({ states, currentIdx });
  useEffect(() => {
    atualRef.current = { states, currentIdx };
  }, [states, currentIdx]);

  // ── Rascunho (RG12) ───────────────────────────────────────────────────────

  const rascunhosRef = useRef<Partial<Record<string, EstadosDaSessao>>>({});
  const prevSessaoRef = useRef<string | null>(null);
  // Sessão a que `states` pertence: evita gravar o rascunho de uma sessão na outra.
  const statesSessaoRef = useRef<string | null>(null);

  useEffect(() => {
    if (!sessao || resumo) return;
    if (statesSessaoRef.current !== sessao) return;
    if (!Object.values(states).some(temProgresso)) return;
    if (!saveDraft(sessao, states, currentIdx)) mensagens.mostrar("rascunho_nao_salvo");
  }, [states, currentIdx, sessao, resumo]);

  // Carrega a sessão: rascunho em memória → rascunho salvo → último treino.
  useEffect(() => {
    if (!sessao) return;

    const anterior = prevSessaoRef.current;
    if (anterior !== null && anterior !== sessao) {
      rascunhosRef.current[anterior] = atualRef.current.states;
      if (Object.values(atualRef.current.states).some(temProgresso)) {
        saveDraft(anterior, atualRef.current.states, atualRef.current.currentIdx);
      }
    }
    prevSessaoRef.current = sessao;

    const abrir = (novos: EstadosDaSessao, idx: number) => {
      setStates(novos);
      setCurrentIdx(idx);
      setMostrarRevisao(false);
      setResumo(null);
      setConfirmarSubstituir(false);
      statesSessaoRef.current = sessao;
    };
    const nomes = new Set(exercicios.map((e) => e.nome));

    const emMemoria = rascunhosRef.current[sessao];
    if (emMemoria) {
      if (rascunhoCombina(emMemoria, nomes)) return abrir(emMemoria, 0);
      delete rascunhosRef.current[sessao];
    }

    const salvoNoAparelho = loadDraft(sessao);
    if (salvoNoAparelho) {
      if (rascunhoCombina(salvoNoAparelho.states, nomes)) {
        if (Object.values(salvoNoAparelho.states).some(temProgresso)) mensagens.mostrar("rascunho_restaurado");
        // O rascunho pode ser de um plano com mais ou menos exercícios que o atual.
        const completos = Object.fromEntries(
          exercicios.map((ex) => [ex.nome, salvoNoAparelho.states[ex.nome] ?? estadoInicial(ex, referenciaDoExercicio(ex.nome, idDaSessao(sessao)))]),
        );
        return abrir(completos, Math.min(Math.max(salvoNoAparelho.currentIdx, 0), exercicios.length - 1));
      }
      clearDraft(sessao);
    }

    const id = idDaSessao(sessao);
    abrir(Object.fromEntries(exercicios.map((ex) => [ex.nome, estadoInicial(ex, referenciaDoExercicio(ex.nome, id))])), 0);
  }, [sessao, exercicios]);

  // ── Alterações não salvas (RG9) ───────────────────────────────────────────

  const hasUnsavedChanges = sessao !== null && resumo === null && Object.values(states).some(temProgresso);

  useEffect(() => {
    onUnsavedChanges?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  // ── Espelho de peso (RG6/RG14) ────────────────────────────────────────────

  useEffect(() => {
    if (!currentEx) return;
    const atual = states[currentEx.nome];
    const patch = atual && espelharPesos(atual, currentEx);
    if (patch) setStates((prev) => ({ ...prev, [currentEx.nome]: { ...atual, ...prev[currentEx.nome], ...patch } }));
  }, [currentEx, states]);

  // ── Edição ────────────────────────────────────────────────────────────────

  function atualizar(patch: PatchExercicio) {
    if (!currentEx) return;
    const { nome } = currentEx;
    setStates((prev) => ({ ...prev, [nome]: { ...(prev[nome] ?? VAZIO), ...patch } }));
  }

  const avisar = (tipo: keyof Avisos, valor: boolean) => setAvisos((prev) => ({ ...prev, [tipo]: valor }));

  function editarTopSet(patch: PatchExercicio) {
    avisar("topSet", false);
    atualizar(patch);
  }

  function editarTopSet2(patch: PatchExercicio) {
    avisar("backoff", false);
    atualizar(patch);
  }

  // PR: 1RM de hoje contra o maior 1RM do histórico do exercício (RG13).
  // Só com peso e reps feitos: RPE é autoavaliação e não cria recorde.
  const historico = useMemo(() => (currentEx ? carregarHistorico(currentEx.nome) : []), [currentEx]);
  const maxHistPr = useMemo(
    () =>
      historico.reduce((max, r) => {
        const ref = extractReferenceBlock(r);
        return ref ? Math.max(max, calcEpley(ref.peso, ref.reps)) : max;
      }, 0),
    [historico],
  );
  const topKg = parseFloat(state.topSetKg) || 0;
  const topReps = parseInt(state.topSetReps) || 0;
  // Deload não é desempenho: não disputa recorde (RG15).
  const superaPr = !state.isDeload && maxHistPr > 0 && topKg > 0 && topReps > 0 && calcEpley(topKg, topReps) > maxHistPr;
  // Banner ao vivo: teto da faixa OU superação do PR histórico.
  const prAtivo =
    !!currentEx && !state.isDeload && !state.topSetConfirmed && topKg > 0 && topReps > 0 &&
    (topReps >= currentEx.faixaTopSet[1] || superaPr);

  const fadiga = useMemo(() => detectarFadiga(historico, treinoId), [historico, treinoId]);
  const ultimo = useMemo(() => (currentEx ? ultimoTreinoNormal(currentEx.nome, treinoId) : null), [currentEx, treinoId]);
  // Valores que voltam aos campos ao trocar de modo.
  const referencia = useMemo(() => (currentEx ? referenciaDoExercicio(currentEx.nome, treinoId) : null), [currentEx, treinoId]);

  // ── Confirmações ──────────────────────────────────────────────────────────

  function confirmTopSet() {
    const ok = serieValida(state.topSetKg, state.topSetReps);
    avisar("topSet", !ok);
    // prConfirmado só quando supera PR histórico (teto sem histórico = "Teto atingido" normal)
    if (ok) atualizar({ topSetConfirmed: true, skipped: false, prConfirmado: superaPr, ...seriesExtrasDoTopSet(state, topKg, topReps) });
  }

  function confirmBackoff() {
    const ok = serieValida(state.backoffKg, state.backoffReps);
    avisar("backoff", !ok);
    if (ok) atualizar({ backoffConfirmed: true });
  }

  /** Abre a série do cluster; a Série 2 exige ao menos um bloco válido na Série 1. */
  function abrirSerieCluster(n: 1 | 2) {
    const ok = n === 1 || serieClusterTemBloco(state.clusterSeries);
    avisar("tecnica", !ok);
    if (ok) atualizar({ clusterActiveSerie: n });
  }

  function confirmTecnica() {
    const ok = clusterCompleto(state);
    avisar("tecnica", !ok);
    if (ok) atualizar({ tecnicaConfirmed: true, skipped: false });
  }

  function alternarCluster() {
    if (!currentEx) return;
    avisar("tecnica", false);
    atualizar(state.tecnica ? desativarCluster(state, currentEx, referencia) : ativarCluster(state, currentEx));
  }

  function alternarDeload() {
    if (!currentEx) return;
    atualizar(state.isDeload ? desativarDeload(state, currentEx, referencia) : ativarDeload(state, currentEx, referencia));
  }

  // ── Navegação ─────────────────────────────────────────────────────────────

  // Avisos são do exercício aberto: zeram ao trocar de exercício ou de sessão (RG8).
  useEffect(() => {
    setAvisos(SEM_AVISOS);
  }, [currentIdx, sessao]);

  const isLastExercise = currentIdx === exercicios.length - 1;

  function irPara(idx: number) {
    if (idx < 0 || idx >= exercicios.length) return;
    setCurrentIdx(idx);
  }
  const nextExercise = () => irPara(currentIdx + 1);
  const prevExercise = () => irPara(currentIdx - 1);

  function skipExercise() {
    atualizar({ skipped: true });
    nextExercise();
  }

  function avancar() {
    if (state.tecnica) {
      if (!state.tecnicaConfirmed) return avisar("tecnica", true);
    } else {
      if (!topSetFeito(state)) {
        atualizar({ topSetConfirmed: false });
        return avisar("topSet", true);
      }
      if (temTopSet2(state) && !topSet2Feito(state) && !topSet2NaoFeito(state)) {
        atualizar({ backoffConfirmed: false });
        return avisar("backoff", true);
      }
    }
    nextExercise();
  }

  function editarDaRevisao(idx: number) {
    irPara(idx);
    setMostrarRevisao(false);
  }

  function fecharRevisao() {
    setMostrarRevisao(false);
    setConfirmarSubstituir(false);
  }

  // ── Salvar ────────────────────────────────────────────────────────────────

  /** Data inválida não salva (RG26): o treino sumiria do histórico. */
  function dataServe(): boolean {
    const serve = parseDataBR(data) !== null;
    if (!serve) mensagens.mostrar("data_invalida");
    return serve;
  }

  function salvar(forcarSubstituicao = false) {
    if (!sessao || !dataServe()) return;

    if (!forcarSubstituicao && existeTreinoNaData(treinoId, data)) {
      setConfirmarSubstituir(true);
      return;
    }

    try {
      // Tudo ou nada: uma falha no meio não deixa o treino pela metade (EF_09 RG13).
      const { salvos, historico: antes } = emTransacao(() => {
        if (forcarSubstituicao) removerTreinoNaData(treinoId, data);
        const historicoAntes = carregarLogbookCompleto();
        const dadosDb = carregarDados();
        const prontos = exercicios.flatMap((ex) => {
          const st = states[ex.nome];
          const pronto = st && montarRegistro({ ex, state: st, treinoId, data, ultimo: ultimoTreinoNormal(ex.nome, treinoId) });
          if (!pronto) return [];
          salvarRegistro(pronto.registro);
          (dadosDb[ex.nome] ??= {})[treinoId] = pronto.legado;
          return [pronto.registro];
        });
        salvarDados(dadosDb);
        return { salvos: prontos, historico: historicoAntes };
      });

      delete rascunhosRef.current[sessao];
      clearDraft(sessao);

      mensagens.mostrar("treino_salvo");
      conquistasDoTreino({
        salvos,
        historico: antes,
        completo: salvos.length === exercicios.length && pendenciasDoTreino(exercicios, states).length === 0,
        totalTreinos: new Set(carregarRegistros().map((r) => `${r.sessao}|${r.data}`)).size,
      }).forEach(({ id, ...texto }) => mensagens.mostrar(id, texto));

      const subirPeso = salvos.filter((r) => deveSubirPeso(r.topSetBateuTeto, r.topSetRpe)).length;
      setConfirmarSubstituir(false);
      setMostrarRevisao(false);
      setResumo({ feitos: salvos.length, total: exercicios.length, subirPeso });
      setSessao(null);
      setStates({});
      setCurrentIdx(0);
    } catch (err) {
      avisarErro("salvar treino", err, "treino_nao_salvo");
    }
  }

  /** Antes de salvar, avisa o que ficou por fazer (EF_09 RG8). */
  function pedirSalvar() {
    if (!dataServe()) return;
    const algumaFeita = exercicios.some((ex) => {
      const st = states[ex.nome];
      return st && montarRegistro({ ex, state: st, treinoId, data, ultimo: null });
    });
    if (!algumaFeita) return mensagens.mostrar("nenhuma_serie_feita");
    const itens = pendenciasDoTreino(exercicios, states);
    if (itens.length === 0) return salvar();
    mensagens.confirmar("series_nao_feitas", { itens, aoConfirmar: () => salvar() });
  }

  return {
    // sessão
    sessao, sessoesDisponiveis, data, setData, treinoId, exercicios,
    alternarSessao: (s: string) => setSessao(sessao === s ? null : s),
    // exercício aberto
    currentIdx, currentEx, state, states, ultimo, prAtivo, fadiga, escala, alternarEscala, avisos, isLastExercise,
    concluido: (nome: string) => exercicioConcluido(states[nome]),
    // edição
    atualizar, editarTopSet, editarTopSet2,
    confirmTopSet, confirmBackoff, abrirSerieCluster, confirmTecnica, alternarCluster, alternarDeload,
    // navegação
    irPara, nextExercise, prevExercise, skipExercise, avancar,
    mostrarRevisao, abrirRevisao: () => setMostrarRevisao(true), fecharRevisao, editarDaRevisao,
    // salvar
    salvar, pedirSalvar, resumo, confirmarSubstituir,
    cancelarSubstituicao: () => setConfirmarSubstituir(false),
  };
}

export type SessaoTreino = ReturnType<typeof useSessaoTreino>;
