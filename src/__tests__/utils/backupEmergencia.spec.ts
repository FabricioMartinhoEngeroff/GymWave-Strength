/**
 * backupEmergencia → utils (EF_09 RG11)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { conteudoBackupEmergencia } from "../../utils/backupEmergencia";
import { lerBackup } from "../../utils/backupJson";
import { setCurrentUser } from "../../utils/storage";

const REG = { id: "a", data: "2026-10-01", sessao: "UA", exercicio: "supino_reto_barra", nome: "Supino reto barra", series: [] };
const gerar = () => JSON.parse(conteudoBackupEmergencia());

describe("backupEmergencia — utils", () => {
  beforeEach(() => setCurrentUser("u1"));
  afterEach(() => setCurrentUser(null));

  it("com dados bons é o mesmo backup do Exportar, sem bruto", () => {
    localStorage.setItem("gw:u1:registros", JSON.stringify([REG]));
    expect(gerar()).toMatchObject({ app: "gymwave", versao: 3, registros: [{ id: "a" }] });
    expect(gerar()).not.toHaveProperty("bruto");
  });

  it.each(["registros", "dadosTreino", "planoTreino", "sessoes_config", "rascunho_treino"])(
    "%s ilegível leva o conteúdo bruto e continua importável", (chave) => {
      localStorage.setItem("gw:u1:registros", JSON.stringify([REG]));
      localStorage.setItem(`gw:u1:${chave}`, "{quebrado");
      expect(gerar().bruto[chave]).toBe("{quebrado");
      expect(() => lerBackup(conteudoBackupEmergencia())).not.toThrow();
    });

  it("leva a cópia guardada do dado corrompido", () => {
    localStorage.setItem("gw:u1:registros_corrompido", "[1,");
    expect(gerar().bruto).toHaveProperty("registros_corrompido", "[1,");
  });

  it("uma chave impossível de ler não impede salvar as outras", () => {
    localStorage.setItem("gw:u1:registros", JSON.stringify([REG]));
    localStorage.setItem("gw:u1:dadosTreino", "{}");
    const original = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (this: Storage, k) {
      if (k.endsWith("dadosTreino")) throw new Error("boom");
      return original.call(this, k);
    });
    expect(JSON.parse(gerar().bruto.registros)).toEqual([REG]);
    expect(lerBackup(conteudoBackupEmergencia()).registros).toHaveLength(1); // continua importável
    vi.restoreAllMocks();
  });

  it("nunca leva senha, sessão nem dados de outro usuário", () => {
    localStorage.setItem("gw:u1:registros", "{quebrado");
    localStorage.setItem("gw:u2:registros", "DO-OUTRO");
    localStorage.setItem("gw:mock:users", "SENHA-HASH");
    localStorage.setItem("gw:u1:escala_esforco", "RIR");
    const texto = conteudoBackupEmergencia();
    expect(texto).not.toMatch(/DO-OUTRO|SENHA-HASH/);
    expect(Object.keys(JSON.parse(texto).bruto)).toEqual(["registros"]);
  });
});
