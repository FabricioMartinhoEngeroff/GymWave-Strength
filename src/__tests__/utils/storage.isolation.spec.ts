/**
 * StorageIsolationTest → utils/storage
 * Verifica que cada usuário tem suas chaves de localStorage isoladas,
 * que a migração de dados legados funciona e que não há vazamento entre contas.
 */
import { describe, it, expect, afterEach } from "vitest";
import {
  storageKey,
  setCurrentUser,
  salvarDados,
  carregarDados,
  salvarRegistro,
  carregarHistorico,
} from "../../utils/storage";
import type { DadosTreino, RegistroExercicio } from "../../types/TrainingData";

function makeRegistro(overrides: Partial<RegistroExercicio> = {}): RegistroExercicio {
  return {
    exercicio: "Supino reto barra",
    treinoId: "UA",
    data: "10/06/2026",
    dataTs: 1_000_000,
    topSetKg: 100,
    topSetReps: 7,
    topSetFaixaMin: 5,
    topSetFaixaMax: 9,
    topSetBateuTeto: false,
    backoffKg: 85,
    backoffReps: 12,
    backoffFaixaMin: 9,
    backoffFaixaMax: 15,
    seriesValidas: 2,
    progrediu: false,
    ...overrides,
  };
}

function makeDados(pesos = ["100"], exercicio = "Supino reto barra"): DadosTreino {
  return {
    [exercicio]: {
      UA: { data: "10/06/2026", pesos, reps: ["7"], obs: "", exercicio },
    },
  };
}

// Garante que _userId é resetado entre testes — o beforeEach do setup só limpa
// o localStorage, não a variável de módulo.
afterEach(() => {
  setCurrentUser(null);
});

// ─── storageKey ────────────────────────────────────────────────────────────────

describe("storageKey()", () => {
  it("retorna a chave base sem prefixo quando nenhum usuário está ativo", () => {
    setCurrentUser(null);
    expect(storageKey("logbook")).toBe("logbook");
    expect(storageKey("dadosTreino")).toBe("dadosTreino");
    expect(storageKey("planoTreino")).toBe("planoTreino");
  });

  it("retorna a chave prefixada com o email quando usuário está ativo", () => {
    setCurrentUser("fabricio@gmail.com");
    expect(storageKey("logbook")).toBe("fabricio@gmail.com_logbook");
    expect(storageKey("dadosTreino")).toBe("fabricio@gmail.com_dadosTreino");
    expect(storageKey("planoTreino")).toBe("fabricio@gmail.com_planoTreino");
  });

  it("muda o prefixo ao trocar de usuário", () => {
    setCurrentUser("fabricio@gmail.com");
    expect(storageKey("logbook")).toBe("fabricio@gmail.com_logbook");

    setCurrentUser("amanda@gmail.com");
    expect(storageKey("logbook")).toBe("amanda@gmail.com_logbook");
  });

  it("volta para chave sem prefixo após setCurrentUser(null)", () => {
    setCurrentUser("fabricio@gmail.com");
    setCurrentUser(null);
    expect(storageKey("logbook")).toBe("logbook");
  });
});

// ─── Migração de dados legados ─────────────────────────────────────────────────

describe("setCurrentUser() — migração de dados legados", () => {
  it("migra logbook, dadosTreino, planoTreino e sessoes_config para a chave do usuário", () => {
    localStorage.setItem("logbook", JSON.stringify({ Supino: [{ topSetKg: 100 }] }));
    localStorage.setItem("dadosTreino", JSON.stringify({ Supino: { UA: {} } }));
    localStorage.setItem("planoTreino", JSON.stringify({ "Upper A": {} }));
    localStorage.setItem("sessoes_config", JSON.stringify({ "Upper A": [{ nome: "Supino" }] }));

    setCurrentUser("fabricio@gmail.com");

    expect(localStorage.getItem("fabricio@gmail.com_logbook")).not.toBeNull();
    expect(localStorage.getItem("fabricio@gmail.com_dadosTreino")).not.toBeNull();
    expect(localStorage.getItem("fabricio@gmail.com_planoTreino")).not.toBeNull();
    expect(localStorage.getItem("fabricio@gmail.com_sessoes_config")).not.toBeNull();
  });

  it("o conteúdo migrado é idêntico ao original", () => {
    const original = JSON.stringify({ Supino: [{ topSetKg: 100 }] });
    localStorage.setItem("logbook", original);

    setCurrentUser("fabricio@gmail.com");

    expect(localStorage.getItem("fabricio@gmail.com_logbook")).toBe(original);
  });

  it("não sobrescreve dados já existentes na chave do usuário", () => {
    localStorage.setItem("logbook", JSON.stringify({ Supino: [] }));
    const jaMigrado = JSON.stringify({ Terra: [{ topSetKg: 200 }] });
    localStorage.setItem("fabricio@gmail.com_logbook", jaMigrado);

    setCurrentUser("fabricio@gmail.com");

    expect(localStorage.getItem("fabricio@gmail.com_logbook")).toBe(jaMigrado);
  });

  it("não migra chave cujo valor é '{}'", () => {
    localStorage.setItem("logbook", "{}");
    localStorage.setItem("dadosTreino", "{}");

    setCurrentUser("fabricio@gmail.com");

    expect(localStorage.getItem("fabricio@gmail.com_logbook")).toBeNull();
    expect(localStorage.getItem("fabricio@gmail.com_dadosTreino")).toBeNull();
  });

  it("não migra chave cujo valor é '[]'", () => {
    localStorage.setItem("logbook", "[]");

    setCurrentUser("fabricio@gmail.com");

    expect(localStorage.getItem("fabricio@gmail.com_logbook")).toBeNull();
  });

  it("migra apenas as chaves que têm conteúdo real", () => {
    localStorage.setItem("logbook", JSON.stringify({ Supino: [{ topSetKg: 100 }] }));
    // dadosTreino ausente — não deve criar chave vazia

    setCurrentUser("fabricio@gmail.com");

    expect(localStorage.getItem("fabricio@gmail.com_logbook")).not.toBeNull();
    expect(localStorage.getItem("fabricio@gmail.com_dadosTreino")).toBeNull();
  });
});

// ─── salvarDados / carregarDados ───────────────────────────────────────────────

describe("salvarDados / carregarDados — isolamento por usuário", () => {
  it("salva na chave prefixada do usuário ativo, não na chave global", () => {
    setCurrentUser("fabricio@gmail.com");
    salvarDados(makeDados());

    expect(localStorage.getItem("fabricio@gmail.com_dadosTreino")).not.toBeNull();
    expect(localStorage.getItem("dadosTreino")).toBeNull();
  });

  it("carrega exatamente o que foi salvo para o usuário ativo", () => {
    setCurrentUser("fabricio@gmail.com");
    salvarDados(makeDados(["100"]));

    const loaded = carregarDados();
    expect(loaded["Supino reto barra"]["UA"].pesos[0]).toBe("100");
  });

  it("usuário A não enxerga dados do usuário B", () => {
    setCurrentUser("fabricio@gmail.com");
    salvarDados(makeDados(["100"]));

    setCurrentUser("amanda@gmail.com");
    expect(carregarDados()).toEqual({});
  });

  it("os dois usuários têm dados independentes e corretos", () => {
    setCurrentUser("fabricio@gmail.com");
    salvarDados(makeDados(["100"]));

    setCurrentUser("amanda@gmail.com");
    salvarDados(makeDados(["60"]));

    setCurrentUser("fabricio@gmail.com");
    expect(carregarDados()["Supino reto barra"]["UA"].pesos[0]).toBe("100");

    setCurrentUser("amanda@gmail.com");
    expect(carregarDados()["Supino reto barra"]["UA"].pesos[0]).toBe("60");
  });

  it("dados legados são migrados para o usuário que faz login", () => {
    // Dado existente antes da funcionalidade de multi-usuário
    localStorage.setItem("dadosTreino", JSON.stringify(makeDados(["999"])));

    setCurrentUser("fabricio@gmail.com");

    // O Fabricio deve ver seus dados antigos após migração
    expect(carregarDados()["Supino reto barra"]["UA"].pesos[0]).toBe("999");
  });

  it("dados migrados do legado não aparecem para outro usuário", () => {
    localStorage.setItem("dadosTreino", JSON.stringify(makeDados(["999"])));

    // Fabricio loga e migra os dados
    setCurrentUser("fabricio@gmail.com");
    expect(carregarDados()["Supino reto barra"]).toBeDefined();

    // Amanda loga — não deve ver os dados do Fabricio
    setCurrentUser("amanda@gmail.com");
    expect(carregarDados()).toEqual({});
  });
});

// ─── sessoes_config — isolamento por usuário ──────────────────────────────────

describe("sessoes_config — isolamento por usuário", () => {
  it("planilha importada como Fabricio não aparece para Amanda", () => {
    setCurrentUser("treino@gmail.com");
    localStorage.setItem(storageKey("sessoes_config"), JSON.stringify({ "Upper A": [{ nome: "Supino" }] }));

    setCurrentUser("amanda@treino.com");
    expect(localStorage.getItem(storageKey("sessoes_config"))).toBeNull();
  });

  it("planilha importada como Amanda não aparece para Fabricio", () => {
    setCurrentUser("amanda@treino.com");
    localStorage.setItem(storageKey("sessoes_config"), JSON.stringify({ "Upper A": [{ nome: "Remada" }] }));

    setCurrentUser("treino@gmail.com");
    expect(localStorage.getItem(storageKey("sessoes_config"))).toBeNull();
  });

  it("cada usuário tem seu sessoes_config independente e correto", () => {
    const configFabricio = JSON.stringify({ "Upper A": [{ nome: "Supino" }] });
    const configAmanda = JSON.stringify({ "Upper A": [{ nome: "Remada" }] });

    setCurrentUser("treino@gmail.com");
    localStorage.setItem(storageKey("sessoes_config"), configFabricio);

    setCurrentUser("amanda@treino.com");
    localStorage.setItem(storageKey("sessoes_config"), configAmanda);

    setCurrentUser("treino@gmail.com");
    expect(localStorage.getItem(storageKey("sessoes_config"))).toBe(configFabricio);

    setCurrentUser("amanda@treino.com");
    expect(localStorage.getItem(storageKey("sessoes_config"))).toBe(configAmanda);
  });

  it("migra sessoes_config legado para o primeiro usuário que logar", () => {
    const configAntigo = JSON.stringify({ "Lower A": [{ nome: "Agachamento" }] });
    localStorage.setItem("sessoes_config", configAntigo);

    setCurrentUser("treino@gmail.com");

    expect(localStorage.getItem("treino@gmail.com_sessoes_config")).toBe(configAntigo);
    expect(localStorage.getItem("sessoes_config")).toBeNull();
  });

  it("sessoes_config migrado não é herdado pelo segundo usuário", () => {
    const configAntigo = JSON.stringify({ "Lower A": [{ nome: "Agachamento" }] });
    localStorage.setItem("sessoes_config", configAntigo);

    setCurrentUser("treino@gmail.com");

    setCurrentUser("amanda@treino.com");
    expect(localStorage.getItem(storageKey("sessoes_config"))).toBeNull();
  });
});

// ─── salvarRegistro / carregarHistorico ────────────────────────────────────────

describe("salvarRegistro / carregarHistorico — isolamento por usuário", () => {
  it("salva o logbook na chave prefixada do usuário ativo", () => {
    setCurrentUser("fabricio@gmail.com");
    salvarRegistro(makeRegistro());

    expect(localStorage.getItem("fabricio@gmail.com_logbook")).not.toBeNull();
    expect(localStorage.getItem("logbook")).toBeNull();
  });

  it("carrega histórico correto para o usuário ativo", () => {
    setCurrentUser("fabricio@gmail.com");
    salvarRegistro(makeRegistro({ topSetKg: 100 }));

    const hist = carregarHistorico("Supino reto barra");
    expect(hist).toHaveLength(1);
    expect(hist[0].topSetKg).toBe(100);
  });

  it("usuário A não enxerga o logbook do usuário B", () => {
    setCurrentUser("fabricio@gmail.com");
    salvarRegistro(makeRegistro({ topSetKg: 100 }));

    setCurrentUser("amanda@gmail.com");
    expect(carregarHistorico("Supino reto barra")).toEqual([]);
  });

  it("planilha importada como Amanda não aparece na conta do Fabricio", () => {
    setCurrentUser("amanda@gmail.com");
    salvarRegistro(makeRegistro({ exercicio: "Agachamento livre", topSetKg: 80 }));

    setCurrentUser("fabricio@gmail.com");
    expect(carregarHistorico("Agachamento livre")).toEqual([]);
  });

  it("acumula múltiplos registros por usuário de forma independente", () => {
    setCurrentUser("fabricio@gmail.com");
    salvarRegistro(makeRegistro({ dataTs: 1000, topSetKg: 100 }));
    salvarRegistro(makeRegistro({ dataTs: 2000, topSetKg: 102 }));

    setCurrentUser("amanda@gmail.com");
    salvarRegistro(makeRegistro({ dataTs: 1000, topSetKg: 60 }));

    setCurrentUser("fabricio@gmail.com");
    expect(carregarHistorico("Supino reto barra")).toHaveLength(2);

    setCurrentUser("amanda@gmail.com");
    expect(carregarHistorico("Supino reto barra")).toHaveLength(1);
    expect(carregarHistorico("Supino reto barra")[0].topSetKg).toBe(60);
  });
});
