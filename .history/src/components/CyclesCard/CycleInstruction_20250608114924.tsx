import { useEffect, useState } from "react";
import styled from "styled-components";
import { Info } from "phosphor-react";
import { Button } from "../ui/Button";
import type { DadosTreino } from "../types/TrainingData"

const CloudContainer = styled.div`
  position: relative;
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
  padding: 16px;
  border-radius: 10px;
  color: #0d47a1;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const CloudHeader = styled.div`
  display: flex;
  align-items: center;
  font-size: 15px;

  svg {
    margin-right: 10px;
    flex-shrink: 0;
  }

  strong {
    margin-left: 4px;
  }
`;



export function CycleInstruction() {
  const [show, setShow] = useState(false);

 useEffect(() => {
  const jaViu = localStorage.getItem("instrucoesVistas");
  const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");

  // mostra apenas se ainda não viu e não há base no C4
  const temCiclo4 = Object.values(db).some(
    (ex: Record<string, { pesos?: string[] }>) => ex?.C4 && ex.C4.pesos?.length
  );

  if (!jaViu && !temCiclo4) setShow(true);
}, []);

  const fecharInstrucao = () => {
    setShow(false);
    localStorage.setItem("instrucoesVistas", "true");
  };

  if (!show) return null;

  return (
    <CloudContainer>
      <CloudHeader>
        <Info size={22} weight="duotone" />
        Para que possamos sugerir a carga ideal nos próximos ciclos, registre primeiro o{" "}
        <strong> Ciclo 4 </strong> de pelo menos um exercício.
      </CloudHeader>
      <div style={{ textAlign: "right" }}>
        <Button variant="outline" onClick={fecharInstrucao}>
          Ok, entendi
        </Button>
      </div>
    </CloudContainer>
  );
}
