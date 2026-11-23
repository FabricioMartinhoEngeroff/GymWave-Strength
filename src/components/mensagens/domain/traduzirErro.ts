import type { IdAviso } from "./catalogo";

const SEM_REDE = /failed to fetch|networkerror|network error|load failed|err_network/i;
const RUIDO = /^(ResizeObserver loop|Script error\.?)/i;

/** Avisos do navegador que não são falha do app. */
export function ehRuido(mensagem: string): boolean {
  return RUIDO.test(mensagem);
}

/** Mensagem amigável equivalente ao erro técnico (EF_09 RG15). */
export function idDoErro(erro: unknown): IdAviso {
  const { name = "", message = "", code = "" } = (typeof erro === "object" && erro !== null ? erro : {}) as {
    name?: unknown;
    message?: unknown;
    code?: unknown;
  };
  if (name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED") return "armazenamento_cheio";
  if (name === "SecurityError") return "armazenamento_bloqueado";
  if (SEM_REDE.test(`${String(message)} ${String(code)}`)) return "sem_conexao";
  if (name === "SyntaxError") return "dados_ilegiveis";
  return "erro_inesperado";
}
