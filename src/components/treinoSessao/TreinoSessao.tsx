import { useEffect, useRef, useState } from "react";
import { CICLOS } from "../../data/cycles";
import { EXERCICIOS } from "../../data/exercise";
import { SESSOES, SESSOES_LABELS, type SessaoTipo } from "../../data/sessionExercises";
import {
  Screen,
  TopBar,
  TopBarTitle,
  DateInput,
  Content,
  Card,
  Label,
  CycleCheckboxRow,
  CycleChip,
  SessaoRow,
  MultiSelectWrapper,
  MultiSelectInput,
  DropdownList,
  DropdownItem,
  TagsRow,
  ExerciseTag,
  TagRemove,
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

interface SerieInput {
  peso: string;
  reps: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayBR(): string {
  return new Date().toLocaleDateString("pt-BR");
}

function carregarDados(): Record<string, Record<string, { pesos?: string[]; reps?: string[]; obs?: string; data?: string; exercicio?: string }>> {
  return JSON.parse(localStorage.getItem("dadosTreino") || "{}");
}

function carregarUltimaSerie(exercicio: string, cicloId: string): SerieInput[] {
  const dados = carregarDados();
  const entry = dados[exercicio]?.[cicloId];
  const empty = (): SerieInput => ({ peso: "", reps: "" });
  if (!entry) return [empty(), empty(), empty()];
  const pesos = entry.pesos ?? [];
  const reps = entry.reps ?? [];
  return [0, 1, 2].map((i) => ({ peso: pesos[i] ?? "", reps: reps[i] ?? "" }));
}

function serieIsInvalid(s: SerieInput): boolean {
  const p = parseFloat(s.peso);
  const r = parseFloat(s.reps);
  return isNaN(p) || p <= 0 || isNaN(r) || r <= 0;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TreinoSessao() {
  const [cicloId, setCicloId] = useState<string>(() => {
    return localStorage.getItem("gymwave_ciclo") || "C1";
  });
  const [sessao, setSessao] = useState<SessaoTipo | null>(null);
  const [exerciciosSelecionados, setExerciciosSelecionados] = useState<string[]>([]);
  const [series, setSeries] = useState<Record<string, SerieInput[]>>({});
  const [obs, setObs] = useState("");
  const [data, setData] = useState(getTodayBR());
  const [salvo, setSalvo] = useState(false);
  const [showInvalid, setShowInvalid] = useState(false);

  const [busca, setBusca] = useState("");
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const cicloInfo = CICLOS.find((c) => c.id === cicloId) || CICLOS[0];

  useEffect(() => {
    localStorage.setItem("gymwave_ciclo", cicloId);
  }, [cicloId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setDropdownAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Auto-load exercises when session is selected
  useEffect(() => {
    if (!sessao) return;
    const exsDaSessao = SESSOES[sessao].map((e) => e.nome);
    setExerciciosSelecionados(exsDaSessao);
    const loaded: Record<string, SerieInput[]> = {};
    exsDaSessao.forEach((ex) => {
      loaded[ex] = carregarUltimaSerie(ex, cicloId);
    });
    setSeries(loaded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessao]);

  // Reload history when ciclo changes
  useEffect(() => {
    if (exerciciosSelecionados.length === 0) return;
    setSeries((prev) => {
      const next = { ...prev };
      exerciciosSelecionados.forEach((ex) => {
        next[ex] = carregarUltimaSerie(ex, cicloId);
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cicloId]);

  const exerciciosFiltrados = EXERCICIOS.filter(
    (ex) =>
      ex.toLowerCase().includes(busca.toLowerCase()) &&
      !exerciciosSelecionados.includes(ex)
  ).slice(0, 30);

  function adicionarExercicio(ex: string) {
    setExerciciosSelecionados((prev) => [...prev, ex]);
    setSeries((prev) => ({
      ...prev,
      [ex]: carregarUltimaSerie(ex, cicloId),
    }));
    setBusca("");
    setDropdownAberto(false);
    inputRef.current?.focus();
  }

  function removerExercicio(ex: string) {
    setExerciciosSelecionados((prev) => prev.filter((e) => e !== ex));
    setSeries((prev) => {
      const next = { ...prev };
      delete next[ex];
      return next;
    });
  }

  function handleSerie(ex: string, serieIdx: number, campo: "peso" | "reps", valor: string) {
    setSeries((prev) => {
      const seriesEx = prev[ex]
        ? [...prev[ex]]
        : [{ peso: "", reps: "" }, { peso: "", reps: "" }, { peso: "", reps: "" }];
      seriesEx[serieIdx] = { ...seriesEx[serieIdx], [campo]: valor };
      return { ...prev, [ex]: seriesEx };
    });
  }

  function canSave(): boolean {
    if (exerciciosSelecionados.length === 0) return false;
    return exerciciosSelecionados.every((ex) => {
      const s = series[ex];
      if (!s || !s[0]) return false;
      return !serieIsInvalid(s[0]);
    });
  }

  function handleSalvar() {
    if (!canSave()) {
      setShowInvalid(true);
      return;
    }
    const db = carregarDados();
    exerciciosSelecionados.forEach((ex) => {
      if (!db[ex]) db[ex] = {};
      const seriesEx = series[ex] || [];
      db[ex][cicloId] = {
        data,
        pesos: seriesEx.map((s) => s.peso.trim()),
        reps: seriesEx.map((s) => s.reps.trim()),
        obs: obs.trim(),
        exercicio: ex,
      };
    });
    localStorage.setItem("dadosTreino", JSON.stringify(db));
    setSalvo(true);
    setShowInvalid(false);
    setExerciciosSelecionados([]);
    setSeries({});
    setSessao(null);
    setObs("");
    setData(getTodayBR());
    setTimeout(() => setSalvo(false), 3000);
  }

  function isFieldInvalid(ex: string, serieIdx: number, campo: "peso" | "reps"): boolean {
    if (!showInvalid) return false;
    if (serieIdx !== 0) return false;
    const s = series[ex];
    if (!s || !s[0]) return true;
    if (campo === "peso") {
      const p = parseFloat(s[0].peso);
      return isNaN(p) || p <= 0;
    }
    const r = parseFloat(s[0].reps);
    return isNaN(r) || r <= 0;
  }

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
      </TopBar>

      <Content>
        {salvo && <ToastBanner>Treino salvo com sucesso!</ToastBanner>}

        {/* Seletor de sessão */}
        <Card>
          <Label>Sessão</Label>
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

        {/* Seletor de ciclo + busca */}
        <Card>
          <Label>Ciclo e exercício</Label>

          <CycleCheckboxRow>
            {CICLOS.map((c) => (
              <CycleChip
                key={c.id}
                $active={cicloId === c.id}
                onClick={() => setCicloId(c.id)}
                type="button"
              >
                {c.id}
                <br />
                <span style={{ fontSize: 10, fontWeight: 400 }}>{c.sigla}</span>
              </CycleChip>
            ))}
          </CycleCheckboxRow>

          <div style={{ marginTop: 12 }}>
            <MultiSelectWrapper>
              <MultiSelectInput
                ref={inputRef}
                type="text"
                placeholder="Buscar e adicionar exercício…"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setDropdownAberto(true);
                }}
                onFocus={() => setDropdownAberto(true)}
                aria-label="Buscar exercício"
              />
              {dropdownAberto && exerciciosFiltrados.length > 0 && (
                <DropdownList ref={dropdownRef}>
                  {exerciciosFiltrados.map((ex) => (
                    <DropdownItem
                      key={ex}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        adicionarExercicio(ex);
                      }}
                    >
                      {ex}
                    </DropdownItem>
                  ))}
                </DropdownList>
              )}
            </MultiSelectWrapper>

            {exerciciosSelecionados.length > 0 && (
              <TagsRow>
                {exerciciosSelecionados.map((ex) => (
                  <ExerciseTag key={ex}>
                    {ex}
                    <TagRemove
                      type="button"
                      onClick={() => removerExercicio(ex)}
                      aria-label={`Remover ${ex}`}
                    >
                      ×
                    </TagRemove>
                  </ExerciseTag>
                ))}
              </TagsRow>
            )}
          </div>
        </Card>

        {/* Cards de exercício com séries dinâmicas */}
        {exerciciosSelecionados.map((ex) => {
          const seriesEx = series[ex] || [
            { peso: "", reps: "" },
            { peso: "", reps: "" },
            { peso: "", reps: "" },
          ];
          return (
            <ExerciseCard key={ex}>
              <ExHeader>
                <div>
                  <ExName>{ex}</ExName>
                  <ExSub>
                    {cicloInfo.repMin}–{cicloInfo.repMax} reps · 3 séries (3ª opcional)
                  </ExSub>
                </div>
                <Badge>{cicloInfo.sigla}</Badge>
              </ExHeader>

              <SeriesGrid>
                {[0, 1, 2].map((i) => (
                  <SerieRow key={i}>
                    <SerieLabel>Série {i + 1}</SerieLabel>
                    <InputBox
                      type="number"
                      placeholder="kg"
                      value={seriesEx[i]?.peso ?? ""}
                      onChange={(e) => handleSerie(ex, i, "peso", e.target.value)}
                      $invalid={isFieldInvalid(ex, i, "peso")}
                      aria-label={`Peso série ${i + 1} de ${ex}`}
                    />
                    <InputSm
                      type="number"
                      placeholder="reps"
                      value={seriesEx[i]?.reps ?? ""}
                      onChange={(e) => handleSerie(ex, i, "reps", e.target.value)}
                      $invalid={isFieldInvalid(ex, i, "reps")}
                      aria-label={`Reps série ${i + 1} de ${ex}`}
                    />
                    <Unit>reps</Unit>
                  </SerieRow>
                ))}
              </SeriesGrid>
            </ExerciseCard>
          );
        })}

        {/* Observações */}
        <Card>
          <Label>Observações</Label>
          <ObsInput
            rows={3}
            placeholder="Como foi o treino? Alguma observação?"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
          />
        </Card>

        <SaveBtn
          $disabled={!canSave()}
          disabled={!canSave()}
          onClick={handleSalvar}
          type="button"
        >
          Salvar treino
        </SaveBtn>
      </Content>
    </Screen>
  );
}
