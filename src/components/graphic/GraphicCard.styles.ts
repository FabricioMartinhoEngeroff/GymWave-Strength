import styled from "styled-components";

export const Card = styled.div`
  background: linear-gradient(165deg, #232323 0%, #191919 100%);
  border: 1px solid #2c2c2c;
  border-radius: 20px;
  padding: 18px;
  margin: 0 auto 20px;
  width: 100%;
  max-width: 600px;
  box-sizing: border-box;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);

  @media (max-width: 480px) {
    padding: 14px 12px;
    border-radius: 16px;
  }
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 10px;
  margin-bottom: 4px;
  border-bottom: 1px solid #2c2c2c;
`;

export const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

export const Title = styled.h2`
  margin: 0;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 480px) {
    font-size: 15px;
  }
`;

export const TrendChip = styled.span<{ $tone: "up" | "down" | "flat" }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: ${({ $tone }) =>
    $tone === "up"
      ? "rgba(0, 200, 83, 0.15)"
      : $tone === "down"
      ? "rgba(239, 68, 68, 0.15)"
      : "rgba(255, 255, 255, 0.08)"};
  color: ${({ $tone }) =>
    $tone === "up" ? "#00E676" : $tone === "down" ? "#FF6B6B" : "#aaa"};
`;

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

export const ToolbarButton = styled.button`
  background: rgba(255, 255, 255, 0.06);
  border: none;
  border-radius: 10px;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.14);
    color: #fff;
  }

  &:active {
    transform: scale(0.94);
  }
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 16px;
  color: #888;
  text-align: center;

  svg {
    opacity: 0.5;
  }
`;
