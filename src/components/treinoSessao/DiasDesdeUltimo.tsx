import { useMemo } from "react";
import { ROTACAO } from "../../data/cycles";
import { ultimoRegistro } from "../../utils/storage";
import { daysSince } from "./domain/datas";
import type { SessaoTreino } from "./hooks/useSessaoTreino";

/** "N dias desde Upper A", contado do treino mais recente de qualquer exercício da sessão. */
export function DiasDesdeUltimo({ treino }: { treino: SessaoTreino }) {
  const { sessao, treinoId, exercicios } = treino;
  const dias = useMemo(() => {
    const ts = Math.max(0, ...exercicios.map((ex) => ultimoRegistro(ex.nome, treinoId)?.dataTs ?? 0));
    return ts > 0 ? daysSince(ts) : null;
  }, [exercicios, treinoId]);

  if (!sessao || dias === null) return null;
  const rotacao = ROTACAO.find((r) => r.id === treinoId);
  return (
    <p style={{ fontSize: 11, color: "#6b7280", margin: "4px 0 0" }}>
      {dias} dias desde {rotacao?.titulo ?? sessao}
    </p>
  );
}
