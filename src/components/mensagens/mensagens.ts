import { AVISOS, CONFIRMACOES, type IdAviso, type IdConfirmacao, type TextoAviso, type TextoConfirmacao } from "./domain/catalogo";

// Store global: qualquer parte do app (tela, hook ou utilitário) fala com o atleta por aqui.
// Quem desenha é a CentralDeMensagens, montada uma vez na raiz.

export interface Aviso extends TextoAviso {
  chave: number;
  id: IdAviso;
  /** Aumenta quando a mesma mensagem se repete, para reiniciar o tempo na tela. */
  renovacao: number;
}

interface OpcoesConfirmacao {
  itens?: string[];
  aoConfirmar: () => void;
  aoCancelar?: () => void;
}

export interface Dialogo extends TextoConfirmacao, OpcoesConfirmacao {
  chave: number;
  id: IdConfirmacao;
}

export interface EstadoMensagens {
  avisos: Aviso[];
  dialogo: Dialogo | null;
}

const VAZIO: EstadoMensagens = { avisos: [], dialogo: null };

let estado = VAZIO;
let fila: Dialogo[] = [];
let proximaChave = 1;
const assinantes = new Set<() => void>();

function mudar(novo: EstadoMensagens) {
  estado = novo;
  assinantes.forEach((fn) => fn());
}

export const mensagens = {
  mostrar(id: IdAviso, texto: Partial<Pick<TextoAviso, "titulo" | "texto">> = {}) {
    const novo = { ...AVISOS[id], ...texto };
    const igual = estado.avisos.find((a) => a.id === id && a.titulo === novo.titulo && a.texto === novo.texto);
    mudar({
      ...estado,
      avisos: igual
        ? estado.avisos.map((a) => (a === igual ? { ...a, renovacao: a.renovacao + 1 } : a))
        : [...estado.avisos, { ...novo, id, chave: proximaChave++, renovacao: 0 }],
    });
  },

  fechar(chave: number) {
    mudar({ ...estado, avisos: estado.avisos.filter((a) => a.chave !== chave) });
  },

  /** Abre o diálogo (um por vez; o próximo espera na fila). */
  confirmar(id: IdConfirmacao, opcoes: OpcoesConfirmacao) {
    const dialogo: Dialogo = { ...CONFIRMACOES[id], ...opcoes, id, chave: proximaChave++ };
    if (estado.dialogo) fila.push(dialogo);
    else mudar({ ...estado, dialogo });
  },

  responder(confirmou: boolean) {
    const atual = estado.dialogo;
    if (!atual) return;
    mudar({ ...estado, dialogo: fila.shift() ?? null });
    if (confirmou) atual.aoConfirmar();
    else atual.aoCancelar?.();
  },

  limpar() {
    fila = [];
    if (estado !== VAZIO) mudar(VAZIO);
  },

  estado: () => estado,

  assinar(fn: () => void) {
    assinantes.add(fn);
    return () => {
      assinantes.delete(fn);
    };
  },
};
