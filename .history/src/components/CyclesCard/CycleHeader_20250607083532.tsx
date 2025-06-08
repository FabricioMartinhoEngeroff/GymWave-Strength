import { ChartBar, Lightning, Repeat } from "phosphor-react";
import styled from "styled-components";

interface CycleHeaderProps {
  ciclo: string;
  percentual: string;
  reps: string;
}

const Header = styled.div`
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 10px;
  color: #1a237e;

  span {
    margin-right: 6px;
  }

  .divider {
    margin: 0 8px;
    color: #90a4ae;
  }
`;

export function CycleHeader({ ciclo, percentual, reps }: CycleHeaderProps) {
  return (
    <Header>
      <ChartBar size={20} weight="fill" color="#4caf50" />
      <span>{ciclo}</span>
      <span className="divider">|</span>

      <Lightning size={20} weight="fill" color="#ffeb3b" />
      <span>{percentual}</span>
      <span className="divider">|</span>

      <Repeat size={20} weight="fill" color="#2196f3" />
      <span>{reps}</span>
    </Header>
  );
}
