import { useEffect, useId, useRef, useSyncExternalStore, type KeyboardEvent } from "react";
import { CircleAlert, CircleCheck, CircleHelp, Info, TriangleAlert, Trophy, X, type LucideIcon } from "lucide-react";
import { DURACAO_MS, type TipoAviso } from "./domain/catalogo";
import { mensagens, type Aviso, type Dialogo } from "./mensagens";
import { AvisoBox, Botao, Botoes, Caixa, FecharBtn, Fundo, IconeRedondo, Itens, Pilha, Texto, Textos, Titulo } from "./Mensagens.styles";

const MAX_VISIVEIS = 3;

const ICONES: Record<TipoAviso, LucideIcon> = {
  sucesso: CircleCheck,
  info: Info,
  aviso: TriangleAlert,
  conquista: Trophy,
  erro: CircleAlert,
};

function AvisoNaTela({ aviso }: { aviso: Aviso }) {
  const { chave, tipo, renovacao } = aviso;
  const Icone = ICONES[tipo];

  useEffect(() => {
    const duracao = DURACAO_MS[tipo];
    if (duracao === null) return;
    const timer = setTimeout(() => mensagens.fechar(chave), duracao);
    return () => clearTimeout(timer);
  }, [chave, tipo, renovacao]);

  return (
    <AvisoBox $tipo={tipo} role={tipo === "erro" ? "alert" : "status"}>
      <Icone size={18} strokeWidth={1.8} aria-hidden />
      <Textos>
        <strong>{aviso.titulo}</strong>
        <span>{aviso.texto}</span>
      </Textos>
      <FecharBtn type="button" aria-label="Fechar mensagem" onClick={() => mensagens.fechar(chave)}>
        <X size={16} strokeWidth={1.8} aria-hidden />
      </FecharBtn>
    </AvisoBox>
  );
}

function DialogoNaTela({ dialogo }: { dialogo: Dialogo }) {
  const tituloId = useId();
  const textoId = useId();
  const caixaRef = useRef<HTMLDivElement>(null);
  const seguroRef = useRef<HTMLButtonElement>(null);
  const Icone = dialogo.perigo ? TriangleAlert : CircleHelp;

  // Abre no botão seguro e, ao fechar, devolve o foco para onde estava.
  useEffect(() => {
    const antes = document.activeElement;
    seguroRef.current?.focus();
    return () => {
      if (antes instanceof HTMLElement) antes.focus();
    };
  }, []);

  function aoTeclar(e: KeyboardEvent) {
    if (e.key === "Escape") return mensagens.responder(false);
    if (e.key !== "Tab") return;
    e.preventDefault();
    const botoes = [...(caixaRef.current?.querySelectorAll("button") ?? [])];
    const atual = botoes.findIndex((b) => b === document.activeElement);
    const passo = e.shiftKey ? -1 : 1;
    botoes[(atual + passo + botoes.length) % botoes.length]?.focus();
  }

  return (
    <Fundo onClick={(e) => e.target === e.currentTarget && mensagens.responder(false)}>
      <Caixa ref={caixaRef} role="alertdialog" aria-modal="true" aria-labelledby={tituloId} aria-describedby={textoId} onKeyDown={aoTeclar}>
        <IconeRedondo $perigo={dialogo.perigo}>
          <Icone size={20} strokeWidth={1.8} aria-hidden />
        </IconeRedondo>
        <Titulo id={tituloId}>{dialogo.titulo}</Titulo>
        <Texto id={textoId}>{dialogo.texto}</Texto>
        {dialogo.itens && dialogo.itens.length > 0 && (
          <Itens>{dialogo.itens.map((item) => <li key={item}>{item}</li>)}</Itens>
        )}
        <Botoes>
          <Botao ref={seguroRef} type="button" $estilo="neutro" onClick={() => mensagens.responder(false)}>
            {dialogo.cancelar}
          </Botao>
          <Botao type="button" $estilo={dialogo.perigo ? "perigo" : "primario"} onClick={() => mensagens.responder(true)}>
            {dialogo.confirmar}
          </Botao>
        </Botoes>
      </Caixa>
    </Fundo>
  );
}

/** Desenha avisos, conquistas e confirmações de todo o app. Montada uma vez, na raiz (EF_09). */
export function CentralDeMensagens() {
  const { avisos, dialogo } = useSyncExternalStore(mensagens.assinar, mensagens.estado);

  return (
    <>
      <Pilha>
        {avisos.slice(0, MAX_VISIVEIS).map((a) => <AvisoNaTela key={a.chave} aviso={a} />)}
      </Pilha>
      {dialogo && <DialogoNaTela key={dialogo.chave} dialogo={dialogo} />}
    </>
  );
}
