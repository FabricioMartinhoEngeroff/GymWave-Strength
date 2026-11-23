import { logErro } from "../login/security/logger";
import { idDoErro } from "./domain/traduzirErro";
import type { IdAviso } from "./domain/catalogo";
import { mensagens } from "./mensagens";

/** Registra o erro e mostra a mensagem amigável; `padrao` vale quando o erro não tem tradução própria. */
export function avisarErro(contexto: string, erro: unknown, padrao: IdAviso = "erro_inesperado"): void {
  logErro(contexto, erro);
  const id = idDoErro(erro);
  mensagens.mostrar(id === "erro_inesperado" ? padrao : id);
}
