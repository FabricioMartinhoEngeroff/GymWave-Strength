import { Info } from "phosphor-react";
import styled from "styled-components";

const InstructionContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  color: #0d47a1;
  margin-bottom: 12px;

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

export function CycleInstruction() {
  return (
    <InstructionContainer>
      <Info size={20} weight="duotone" style={{ marginRight: 8 }} />
      Para iniciar este exercício, registre primeiro o <strong> Ciclo 4 </strong> para criar sua base de comparação.
    </InstructionContainer>
  );
}
