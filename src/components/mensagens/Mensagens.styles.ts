import styled, { keyframes } from "styled-components";
import type { TipoAviso } from "./domain/catalogo";

const entrar = keyframes`
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: none; }
`;

const CORES: Record<TipoAviso, { fundo: string; borda: string; texto: string }> = {
  sucesso: { fundo: "#dcfce7", borda: "#86efac", texto: "#166534" },
  info: { fundo: "#eff6ff", borda: "#bfdbfe", texto: "#1d4ed8" },
  aviso: { fundo: "#fefce8", borda: "#fde68a", texto: "#92400e" },
  erro: { fundo: "#fef2f2", borda: "#fecaca", texto: "#991b1b" },
  conquista: { fundo: "linear-gradient(135deg, #166534, #d97706)", borda: "#d4af37", texto: "#ffffff" },
};

export const Pilha = styled.div`
  position: fixed;
  top: calc(52px + env(safe-area-inset-top));
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  pointer-events: none;
`;

export const AvisoBox = styled.div<{ $tipo: TipoAviso }>`
  pointer-events: auto;
  width: 100%;
  max-width: 440px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid ${(p) => CORES[p.$tipo].borda};
  border-radius: 14px;
  background: ${(p) => CORES[p.$tipo].fundo};
  color: ${(p) => CORES[p.$tipo].texto};
  box-shadow: 0 6px 20px rgba(17, 24, 39, 0.12);
  animation: ${entrar} 0.2s ease-out;
  svg {
    flex-shrink: 0;
    margin-top: 1px;
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const Textos = styled.div`
  flex: 1;
  min-width: 0;
  font-size: 12px;
  line-height: 1.4;
  overflow-wrap: anywhere;
  strong {
    display: block;
    font-size: 13px;
    font-weight: 600;
  }
`;

/* && vence o estilo global de button (index.css). */
export const FecharBtn = styled.button`
  && {
    width: auto;
    margin: -4px -6px 0 0;
    padding: 6px;
    display: flex;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
`;

export const Fundo = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(17, 24, 39, 0.5);
`;

export const Caixa = styled.div`
  width: 100%;
  max-width: 380px;
  max-height: 85dvh;
  overflow-y: auto;
  padding: 20px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 16px 40px rgba(17, 24, 39, 0.25);
  animation: ${entrar} 0.2s ease-out;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const IconeRedondo = styled.span<{ $perigo?: boolean }>`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-bottom: 12px;
  background: ${(p) => (p.$perigo ? "#fef2f2" : "#eff6ff")};
  color: ${(p) => (p.$perigo ? "#dc2626" : "#2563eb")};
`;

export const Titulo = styled.h2`
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
`;

export const Texto = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #6b7280;
`;

export const Itens = styled.ul`
  margin: 10px 0 0;
  padding: 10px 12px;
  list-style: none;
  border-radius: 10px;
  background: #f5f6fa;
  font-size: 12px;
  line-height: 1.6;
  color: #374151;
  max-height: 180px;
  overflow-y: auto;
`;

export const Botoes = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
`;

const FUNDO_BOTAO = { primario: "#2563eb", perigo: "#dc2626", neutro: "#ffffff" };

export const Botao = styled.button<{ $estilo: keyof typeof FUNDO_BOTAO }>`
  && {
    flex: 1 1 140px;
    width: auto;
    margin: 0;
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: 1px solid ${(p) => (p.$estilo === "neutro" ? "#d1d5db" : FUNDO_BOTAO[p.$estilo])};
    border-radius: 10px;
    background: ${(p) => FUNDO_BOTAO[p.$estilo]};
    color: ${(p) => (p.$estilo === "neutro" ? "#374151" : "#ffffff")};
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    &:focus-visible {
      outline: 2px solid #93c5fd;
      outline-offset: 2px;
    }
  }
`;

export const TelaCheia = styled.div<{ $inteira?: boolean }>`
  width: 100%;
  height: 100%;
  min-height: ${(p) => (p.$inteira ? "90dvh" : "320px")};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  background: #f5f6fa;
`;
