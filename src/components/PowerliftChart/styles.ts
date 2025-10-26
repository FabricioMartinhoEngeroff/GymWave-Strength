import styled from "styled-components";

export const Container = styled.div`
  width: 100%;
  min-height: 100vh;
  background: #0a0a0a;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  box-sizing: border-box;
`;

export const Header = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
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

export const ChartWrapper = styled.div<{ $isLandscape: boolean }>`
  width: 100%;
  height: ${({ $isLandscape }) => ($isLandscape ? "70vh" : "50vh")};
  background: #121212;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
  transition: height 0.3s ease-in-out;
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
