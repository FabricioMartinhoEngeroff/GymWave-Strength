import { avisarErro } from "./avisarErro";
import { mensagens } from "./mensagens";

interface Destino<T> {
  /** Transforma o conteúdo lido em linhas da prévia. */
  extrair: (conteudo: unknown) => T[];
  aoLer: (linhas: T[]) => void;
  /** Nada aproveitável: a tela sai do estado "Lendo…". */
  aoDescartar: () => void;
}

/** Arquivo ilegível ou sem linhas avisa em vez de travar a tela de importação (EF_09 RG16). */
export function lerPlanilha<T>(reader: FileReader, { extrair, aoLer, aoDescartar }: Destino<T>): void {
  const falhar = (motivo: string) => {
    avisarErro("ler planilha", new Error(motivo), "arquivo_invalido");
    aoDescartar();
  };
  reader.onload = (e) => {
    let linhas: T[];
    try {
      linhas = extrair(e.target?.result);
    } catch {
      return falhar("arquivo ilegível");
    }
    aoLer(linhas);
    if (linhas.length > 0) return;
    aoDescartar();
    mensagens.mostrar("planilha_vazia");
  };
  reader.onerror = () => falhar("falha do leitor");
}
