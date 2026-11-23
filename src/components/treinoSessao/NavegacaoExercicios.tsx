import { NavBtn } from "./TreinoSessao.styles";
import type { SessaoTreino } from "./hooks/useSessaoTreino";

/** Anterior / contador / Próximo e os pontos de progresso. */
export function NavegacaoExercicios({ treino }: { treino: SessaoTreino }) {
  const { exercicios, currentIdx, concluido, irPara, prevExercise, nextExercise, isLastExercise } = treino;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
        <NavBtn type="button" onClick={prevExercise} disabled={currentIdx === 0} aria-label="Exercício anterior">
          ‹ Anterior
        </NavBtn>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", whiteSpace: "nowrap" }}>
          {currentIdx + 1} / {exercicios.length}
        </span>
        <NavBtn type="button" onClick={nextExercise} disabled={isLastExercise} aria-label="Próximo exercício">
          Próximo ›
        </NavBtn>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", maxWidth: 280 }}>
        {exercicios.map((ex, idx) => {
          const feito = concluido(ex.nome);
          const atual = idx === currentIdx;
          return (
            <div
              key={ex.nome}
              onClick={() => irPara(idx)}
              title={`${ex.nome}${feito ? " ✓" : ""}`}
              style={{
                width: 10, height: 10, borderRadius: "50%", cursor: "pointer",
                background: atual ? "#2563eb" : feito ? "#16a34a" : "#d1d5db",
                border: atual ? "2px solid #1d4ed8" : "2px solid transparent",
                transition: "background 0.15s",
                flexShrink: 0,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
