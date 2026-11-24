import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const CHAVE = "VITE_RAPIDAPI_KEY";
const URL_GIF = "https://cdn.example.com/bench.gif";

const resposta = (corpo: unknown, ok = true) => ({ ok, json: () => Promise.resolve(corpo) });
const comGif = (gifUrl = URL_GIF) => resposta([{ gifUrl }]);

const fetchMock = vi.fn();
let fetchExerciseGif: (nome: string) => Promise<string | null>;

describe("exerciseDbService — fetchExerciseGif", () => {
  // O cache vive no módulo: recarregar a cada teste impede que um influencie o outro.
  beforeEach(async () => {
    vi.resetModules();
    fetchMock.mockReset().mockResolvedValue(comGif());
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv(CHAVE, "test-api-key");
    ({ fetchExerciseGif } = await import("../../services/exerciseDbService"));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe("chave da API", () => {
    it.each([["vazia", ""], ["não definida", undefined]])("%s: retorna null e não chama a API", async (_nome, chave) => {
      vi.stubEnv(CHAVE, chave);
      expect(await fetchExerciseGif("Supino reto barra")).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("é lida a cada chamada, não quando o arquivo carrega", async () => {
      vi.stubEnv(CHAVE, "");
      expect(await fetchExerciseGif("Supino reto barra")).toBeNull();
      vi.stubEnv(CHAVE, "chave-nova");
      expect(await fetchExerciseGif("Supino reto barra")).toBe(URL_GIF);
      expect(fetchMock.mock.calls[0]?.[1].headers["X-RapidAPI-Key"]).toBe("chave-nova");
    });
  });

  describe("requisição", () => {
    it("busca pelo termo em inglês, com a chave e o host nos cabeçalhos", async () => {
      await fetchExerciseGif("Supino reto barra");
      expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
        "https://exercisedb.p.rapidapi.com/exercises/name/barbell%20bench%20press?limit=1&offset=0",
        { headers: { "X-RapidAPI-Key": "test-api-key", "X-RapidAPI-Host": "exercisedb.p.rapidapi.com" } },
      );
    });

    it("exercício sem termo de busca: retorna null e não chama a API", async () => {
      expect(await fetchExerciseGif("Exercicio inventado")).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("exercício com outro nome usa o termo do catálogo", async () => {
      await fetchExerciseGif("Extensão de pernas"); // = Cadeira extensora
      expect(fetchMock.mock.calls[0]?.[0]).toContain("/leg%20extension?");
    });
  });

  describe("resposta", () => {
    it.each([
      ["lista", [{ gifUrl: URL_GIF }]],
      ["lista dentro de data", { data: [{ gifUrl: URL_GIF }] }],
    ])("%s: retorna o gifUrl", async (_nome, corpo) => {
      fetchMock.mockResolvedValue(resposta(corpo));
      expect(await fetchExerciseGif("Stiff")).toBe(URL_GIF);
    });

    it("com vários exercícios, usa o primeiro", async () => {
      fetchMock.mockResolvedValue(resposta([{ gifUrl: URL_GIF }, { gifUrl: "https://cdn.example.com/outro.gif" }]));
      expect(await fetchExerciseGif("Stiff")).toBe(URL_GIF);
    });

    it.each([
      ["lista vazia", []],
      ["exercício sem gifUrl", [{ id: "123", name: "sumo deadlift" }]],
      ["gifUrl vazio", [{ gifUrl: "" }]],
      ["objeto sem data", { message: "ok" }],
      ["data que não é lista", { data: { 0: { gifUrl: URL_GIF } } }],
      ["null", null],
    ])("%s: retorna null", async (_nome, corpo) => {
      fetchMock.mockResolvedValue(resposta(corpo));
      expect(await fetchExerciseGif("Terra sumô")).toBeNull();
    });

    it("resposta não-ok: retorna null mesmo que o corpo tenha GIF", async () => {
      fetchMock.mockResolvedValue(resposta([{ gifUrl: URL_GIF }], false));
      expect(await fetchExerciseGif("Cadeira extensora")).toBeNull();
    });

    it("falha de rede: repassa o erro (quem chama mostra o estado de erro)", async () => {
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
      await expect(fetchExerciseGif("Stiff")).rejects.toThrow("Failed to fetch");
    });
  });

  describe("cache", () => {
    it("segunda busca do mesmo exercício não chama a API de novo", async () => {
      expect(await fetchExerciseGif("Stiff")).toBe(URL_GIF);
      expect(await fetchExerciseGif("Stiff")).toBe(URL_GIF);
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    it("cada exercício tem o próprio GIF", async () => {
      fetchMock.mockResolvedValueOnce(comGif("https://cdn.example.com/a.gif")).mockResolvedValueOnce(comGif("https://cdn.example.com/b.gif"));
      expect(await fetchExerciseGif("Stiff")).toBe("https://cdn.example.com/a.gif");
      expect(await fetchExerciseGif("Terra sumô")).toBe("https://cdn.example.com/b.gif");
      expect(await fetchExerciseGif("Stiff")).toBe("https://cdn.example.com/a.gif");
    });

    it.each([
      ["resposta não-ok", () => fetchMock.mockResolvedValueOnce(resposta([], false))],
      ["lista vazia", () => fetchMock.mockResolvedValueOnce(resposta([]))],
      ["falha de rede", () => fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"))],
    ])("não guarda fracasso (%s): a próxima busca tenta de novo", async (_nome, falhar) => {
      falhar();
      await fetchExerciseGif("Stiff").catch(() => null);
      expect(await fetchExerciseGif("Stiff")).toBe(URL_GIF);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});
