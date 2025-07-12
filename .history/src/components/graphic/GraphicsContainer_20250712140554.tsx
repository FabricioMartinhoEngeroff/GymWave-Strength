import React, { useState, useEffect } from "react";
import { useDadosTreino } from "../../hooks/useDadosTreino";
import { SearchBar } from "./SearchBar";
import { ChartCard } from "./ChartCard";
import { Button } from "../ui/Button";
import styled from "styled-components";

const GraphicsWrapper = styled.div`
  background: #ffffff;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.05);
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin: 0 auto;

  @media (max-width: 480px) {
    padding: 16px;
    border-radius: 0;
  }
`;

const HeaderControls = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 8px;
  align-items: flex-start;
`;

export const GraphicsContainer: React.FC = () => {
  const dadosAgrupados = useDadosTreino();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filtrados = Object.keys(dadosAgrupados).filter((ex) =>
    ex.toLowerCase().includes(busca.toLowerCase())
  );

  const atualizarDados = () => {
    window.location.reload();
  };

  return (
    <GraphicsWrapper>
      <HeaderControls>
  <h2 style={{ color: "#0d47a1", fontSize: 20, margin: 0 }}>
    Gráficos de Intensidade
  </h2>
  <SearchBar value={busca} onChange={setBusca} isMobile={isMobile} />
</HeaderControls>

      {filtrados.length === 0 && (
        <p style={{ padding: 16, color: "#555" }}>Nenhum exercício encontrado.</p>
      )}

      {filtrados.map((ex) => (
        <ChartCard
          key={ex}
          exercicio={ex}
          dados={dadosAgrupados[ex]}
          isMobile={isMobile}
        />
      ))}


      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Button onClick={atualizarDados}>🔄 Atualizar Dados</Button>
      </div>
    </GraphicsWrapper>
  );
};

