import styled from "styled-components";
import { ChartBar, Lightning, Repeat } from "phosphor-react";

interface CycleHeaderProps {
  ciclo: string;
  percentual: string;
  reps: string;
}

const HeaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #f1f8ff;
  border-left: 4px solid #2196f3;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  color: #0d47a1;
  margin-bottom: 16px;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 6px;

  svg {
    margin-right: 8px;
  }
`;

export function CycleHeader({ ciclo, percentual, reps }: CycleHeaderProps) {
  return (
    <HeaderContainer>
      <InfoRow>
        <ChartBar size={18} weight="fill" color="#4caf50" />
        <span>Ciclo: <strong>{ciclo}</strong></span>
      </InfoRow>
      <InfoRow>
        <Lightning size={18} weight="fill" color="#ff9800" />
        <span>Intensidade: <strong>{percentual}</strong></span>
      </InfoRow>
      <InfoRow>
        <Repeat size={18} weight="fill" color="#2196f3" />
        <span>Repetições sugeridas: <strong>{reps}</strong></span>
      </InfoRow>
    </HeaderContainer>
  );
}
