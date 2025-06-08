import React, { useState, useEffect } from "react";
import { useDadosTreino } from "../../hooks/useDadosTreino";
import { SearchBar } from "./SearchBar";
import { ChartCard } from "./ChartCard";
import { Button } from "../ui/Button";
import styles from "../../styles/Graphics.module.css";

export const GraphicsContainer: React.FC = () => {
  const dadosAgrupados = useDadosTreino();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [busca, setBusca] = useState("");
  const filtrados = Object.keys(dadosAgrupados).filter(ex =>
    ex.toLowerCase().includes(busca.toLowerCase())
  );

  

   return (
    <div className={styles.container}>
      {/* Botão Reutilizado: */}
      <Button text="Atualizar Dados" onClick={atualizarDados} />

      {/* Campo de busca */}
      <SearchBar value={busca} onChange={setBusca} isMobile={isMobile} />

      {/* Se não houver resultados: */}
      {filtrados.length === 0 && (
        <p className={styles.noDataText}>Nenhum exercício encontrado.</p>
      )}

      {/* Renderiza um ChartCard para cada exercício filtrado */}
      {filtrados.map((ex) => (
        <ChartCard
          key={ex}
          exercicio={ex}
          dados={dadosAgrupados[ex]}
          isMobile={isMobile}
        />
      ))}
    </div>
  );
};