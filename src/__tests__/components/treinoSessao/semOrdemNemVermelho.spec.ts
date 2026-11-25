/**
 * EF_02 RG21 e RG29 — a tela de treino informa, nunca manda; vermelho só para erro de verdade;
 * teto e consolidação só no card "Último treino".
 */
import { describe, it, expect } from "vitest";
import { productionFiles, read, rel } from "../login/helpers/files";

const arquivos = productionFiles().filter((f) => rel(f).includes("components/treinoSessao/"));
const daTela = (padrao: RegExp, filtro: (nome: string) => boolean = () => true) =>
  arquivos.filter((f) => filtro(rel(f)) && padrao.test(read(f))).map(rel);

describe("Tela de treino — regressão estática", () => {
  it("encontra os arquivos da tela (controle)", () => expect(arquivos.length).toBeGreaterThan(10));

  it("nenhum texto com ordem de carga", () => {
    expect(daTela(/SUBIR PESO|CONSOLIDAR CARGA|sobe (o )?peso|sobem de peso|repete a carga|manter peso|defina o peso|Considere um deload/i)).toEqual([]);
  });

  it("vermelho só na borda do campo inválido (TreinoSessao.styles.ts)", () => {
    expect(daTela(/#(dc2626|ef4444|991b1b|b91c1c|fecaca|fef2f2|fca5a5)/i, (f) => !f.endsWith("TreinoSessao.styles.ts"))).toEqual([]);
    expect(daTela(/\$tom="vermelho"|\bvermelho:|tom: "vermelho"/)).toEqual([]);
  });

  describe("status de resultado só no card \"Último treino\" (RG21)", () => {
    const STATUS = /Teto de reps atingido|Teto de reps com esforço|Na faixa de reps|Abaixo da faixa|textoConsolidar|statusTopSet|StatusDoTopSet/i;
    /** O card pode: é onde o aviso mora. */
    const DO_CARD = /(avisosTreino\.ts|UltimoTreinoPanel\.tsx|ProgressBanner\.tsx)$/;

    it("os arquivos do card existem e o aviso de consolidação está lá (controle)", () => {
      expect(arquivos.filter((f) => DO_CARD.test(rel(f)))).toHaveLength(3);
      expect(daTela(STATUS, (f) => DO_CARD.test(f))).toEqual([expect.stringMatching(/avisosTreino\.ts$/)]);
    });

    it("fora do card, nenhum", () => {
      expect(daTela(STATUS, (f) => !DO_CARD.test(f))).toEqual([]);
    });
  });

  it("ProgressBanner e UltimoTreinoPanel sem hex solto", () => {
    expect(daTela(/#[0-9a-f]{3,8}\b/i, (f) => /(ProgressBanner|UltimoTreinoPanel)\.tsx$/.test(f))).toEqual([]);
  });
});
