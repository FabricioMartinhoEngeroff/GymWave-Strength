import styled from "styled-components";

export const Container = styled.div`
  width: 100vw;
  height: calc(var(--vh, 1vh) * 100);
  display: flex;
  flex-direction: column;
  background: #0a0a0a;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  padding-bottom: env(safe-area-inset-bottom);
`;


export const Header = styled.div`
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 10;
  background: #0a0a0a;
  border-bottom: 1px solid #151515;
`;

export const Title = styled.h2`
  font-size: 18px;
  color: #00c853;
  margin: 0;
`;
export const SelectLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #00c853;
  margin-bottom: 2px;
`;

export const TimeFilter = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
`;

export const ChartContainer = styled.div`
  flex: 1;                     /* ← pega todo o espaço livre */
  width: 100%;
  background: #0a0a0a;
  
  display: flex;
  justify-content: center;
  align-items: center;

  overflow: hidden;
  padding: 6px 4px 10px;
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
  border: 1px solid rgba(255, 255, 255, 0.08);

  p {
    margin: 4px 0;
  }
`;
