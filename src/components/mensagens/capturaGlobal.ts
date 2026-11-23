import { ouvirDadosCorrompidos } from "../../utils/storage";
import { avisarErro } from "./avisarErro";
import { ehRuido } from "./domain/traduzirErro";
import { mensagens } from "./mensagens";

/** Erros fora do React (cliques, promessas, leitura de dados) viram mensagem amigável (EF_09 RG12/RG15). */
export function instalarCapturaGlobal(): () => void {
  const aoErro = (e: ErrorEvent) => {
    if (!ehRuido(e.message)) avisarErro("erro não tratado", e.error);
  };
  const aoRejeitar = (e: PromiseRejectionEvent) => avisarErro("promessa rejeitada", e.reason);

  window.addEventListener("error", aoErro);
  window.addEventListener("unhandledrejection", aoRejeitar);
  const pararDeOuvir = ouvirDadosCorrompidos(() => mensagens.mostrar("dados_corrompidos"));

  return () => {
    window.removeEventListener("error", aoErro);
    window.removeEventListener("unhandledrejection", aoRejeitar);
    pararDeOuvir();
  };
}
