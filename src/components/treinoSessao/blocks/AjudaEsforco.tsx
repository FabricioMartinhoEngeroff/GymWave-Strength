import { useEffect, useId, useRef, useState } from "react";
import { CircleHelp, X } from "lucide-react";
import { RPE_ALVO } from "../../../data/sessionExercises";
import { rotuloAlvo, type FaixaRpe } from "../../../utils/esforco";
import { AjudaBalao, AjudaBtn, AjudaFecharBtn, AjudaTitulo } from "../TreinoSessao.styles";

const nasDuasEscalas = (alvo: FaixaRpe) => `${rotuloAlvo(alvo, "RPE")} (${rotuloAlvo(alvo, "RIR")})`;

/** Botão "?" com o balão que explica RPE e RIR (RG25). Só leitura: não mexe no treino. */
export function AjudaEsforco() {
  const [aberto, setAberto] = useState(false);
  const balaoId = useId();
  const areaRef = useRef<HTMLSpanElement>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const balaoRef = useRef<HTMLDivElement>(null);

  function fecharComFoco() {
    setAberto(false);
    botaoRef.current?.focus();
  }

  useEffect(() => {
    if (!aberto) return;
    balaoRef.current?.scrollIntoView({ block: "nearest" });

    // "click" e não "pointerdown": arrastar para rolar a tela não pode fechar o balão.
    const aoClicar = (e: MouseEvent) => {
      if (e.target instanceof Node && !areaRef.current?.contains(e.target)) setAberto(false);
    };
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") fecharComFoco();
    };
    document.addEventListener("click", aoClicar);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("click", aoClicar);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  return (
    <span ref={areaRef}>
      <AjudaBtn
        ref={botaoRef}
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-label="O que é RPE e RIR?"
        aria-expanded={aberto}
        aria-controls={aberto ? balaoId : undefined}
      >
        <CircleHelp size={16} strokeWidth={1.8} aria-hidden />
      </AjudaBtn>
      {aberto && (
        <AjudaBalao ref={balaoRef} id={balaoId} role="note">
          <AjudaTitulo>
            RPE e RIR: quão perto da falha
            <AjudaFecharBtn type="button" onClick={fecharComFoco} aria-label="Fechar ajuda">
              <X size={14} strokeWidth={1.8} aria-hidden />
            </AjudaFecharBtn>
          </AjudaTitulo>
          <p><strong>RPE</strong> (esforço percebido): nota de 6 a 10. 10 é a falha, não sairia mais nenhuma rep.</p>
          <p><strong>RIR</strong> (reps na reserva): quantas reps ainda sairiam. 0 é a falha.</p>
          <p>É a mesma medida: RIR = 10 − RPE. Ex.: RPE 8 = RIR 2.</p>
          <p>
            <strong>Para que serve:</strong> bateu o teto de reps no Top Set 1 com esforço igual ou abaixo do alvo do
            exercício, dá para subir a carga; se passou do alvo, carga em consolidação. É só um aviso: o peso não muda
            sozinho.
          </p>
          <p>
            <strong>Alvo:</strong> agacho, supino, terra e barra fixa, {nasDuasEscalas(RPE_ALVO.composto)}. Máquinas, cabos e
            isoladores, {nasDuasEscalas(RPE_ALVO.isolador)}.
          </p>
          <p>A mesma carga e as mesmas reps pesando mais por 2 treinos seguidos geram o alerta de fadiga.</p>
          <p>Obrigatório: marque ao terminar a série.</p>
        </AjudaBalao>
      )}
    </span>
  );
}
