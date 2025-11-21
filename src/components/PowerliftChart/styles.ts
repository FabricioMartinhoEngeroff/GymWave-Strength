import styled from "styled-components";

export const Container = styled.div`
  width: 100vw;
  height: calc(var(--vh) * 100);
  display: flex;
  flex-direction: column;
  background: #0a0a0a;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
`;


export const Header = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 10;
  background: #0a0a0a;
`;

export const Title = styled.h2`
  font-size: 20px;
  color: #00c853;
  margin: 0;
`;

export const TimeFilter = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
`;

export const ChartContainer = styled.div`
  flex: 1;                     /* ← pega todo o espaço livre */
  width: 100%;
  background: #0a0a0a;
  
  display: flex;
  justify-content: center;
  align-items: center;

  overflow: hidden;
`;

export const FilterButton = styled.button<{ $ativo: boolean }>`
  background: ${({ $ativo }) => ($ativo ? "#00C853" : "#1f1f1f")};
  color: ${({ $ativo }) => ($ativo ? "#fff" : "#aaa")};
  border: none;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${({ $ativo }) => ($ativo ? "#00E676" : "#333")};
  }
`;



export const TooltipBox = styled.div`
  background: #222;
  border-radius: 8px;
  padding: 8px 12px;
  color: #fff;
  font-size: 13px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

  p {
    margin: 4px 0;
  }
`;
