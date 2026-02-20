import styled from "styled-components";

export const Container = styled.div`
  width: 100vw;
  height: calc(var(--vh, 1vh) * 100);
  display: flex;
  flex-direction: column;
  background: #2f2f2f;
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
  background: #2f2f2f;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

export const Title = styled.h2`
  font-size: 18px;
  color: #ffffff;
  margin: 0;
`;

export const SelectLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #e5e7eb;
  margin-bottom: 2px;
`;

export const FiltersRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: flex-end;
  width: 100%;

  > * {
    flex: 1;
    min-width: 220px;
  }

  @media (max-width: 420px) {
    > * {
      min-width: 100%;
    }
  }
`;

export const Content = styled.div`
  flex: 1;
  width: 100%;
  overflow: auto;
  padding: 10px 10px 14px;
  box-sizing: border-box;
`;

export const PanelsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  width: 100%;
  max-width: 980px;
  margin: 0 auto;

  @media (orientation: landscape) {
    grid-template-columns: 1fr 1fr;
  }
`;

export const Panel = styled.section`
  background: #343434;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 10px;
  box-sizing: border-box;
  overflow: hidden;
`;

export const PanelTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 8px;

  h3 {
    margin: 0;
    font-size: 14px;
    color: #ffffff;
    letter-spacing: 0.2px;
  }

  p {
    margin: 0;
    font-size: 12px;
    color: #d1d5db;
  }
`;

export const ChartBox = styled.div`
  width: 100%;
  height: 320px;

  @media (orientation: landscape) {
    height: calc((var(--vh, 1vh) * 100) - 160px);
    min-height: 220px;
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
