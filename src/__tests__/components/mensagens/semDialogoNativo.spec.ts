/**
 * EF_09 RG1 — toda mensagem passa pelo módulo: nada de alert/confirm do navegador.
 */
import { describe, it, expect } from "vitest";
import { productionFiles, read, rel } from "../login/helpers/files";

describe("Mensagens — regressão estática", () => {
  it("nenhum alert( ou confirm( nativo em src/", () => {
    const nativo = /(^|[^\w.])(window\.)?(alert|confirm|prompt)\s*\(/m;
    expect(productionFiles().filter((f) => nativo.test(read(f))).map(rel)).toEqual([]);
  });
});
