import type { LinhaRelatorio, SerieInfo } from "../../types/TrainingData";
import {
  CalendarBlankIcon,
  BarbellIcon,
  TagIcon,
  StarIcon,
  ArrowsClockwiseIcon,
  FileTextIcon,
} from "@phosphor-icons/react";
import { Button } from "../ui/Button";

interface ReportItemProps {
  linha: LinhaRelatorio;
  onEdit: () => void;
  onDelete: () => void;
  isMobile: boolean;
}

export function ReportItem({
  linha,
  onEdit,
  onDelete,
  isMobile,
}: ReportItemProps) {
  return (
    <div className="report-card">
      <p>
        <CalendarBlankIcon
          size={isMobile ? 14 : 16}
          weight="duotone"
          className="report-icon"
        />
        <strong>Data:</strong> {linha.data}
      </p>
      <p>
        <BarbellIcon
          size={isMobile ? 14 : 16}
          weight="fill"
          color="#EF4444"
          className="report-icon"
        />
        <strong>Exercício:</strong> {linha.exercicio}
      </p>
      <p>
        <TagIcon
          size={isMobile ? 14 : 16}
          weight="duotone"
          className="report-icon"
        />
        <strong>Ciclo:</strong> {linha.ciclo}
      </p>
      <p className="report-series-header">
        <StarIcon
          size={14}
          weight="fill"
          color="#FBBF24"
          className="report-icon"
        />
        Série{" "}
        <ArrowsClockwiseIcon
          size={14}
          weight="fill"
          color="#3B82F6"
          className="inline-block mx-1"
        />
        Reps ·{" "}
        <BarbellIcon
          size={14}
          weight="fill"
          color="#EF4444"
          className="inline-block mx-1"
        />
        Peso
      </p>

      {linha.series.map((s: SerieInfo) => (
        <p key={s.serie} className="report-series-line">
          Série {s.serie}: {s.rep} reps × {s.peso} kg
        </p>
      ))}

      {linha.obs && (
        <p className="report-obs-line">
          <FileTextIcon
            size={14}
            weight="duotone"
            className="report-icon"
          />
          <strong>Observações:</strong> {linha.obs}
        </p>
      )}

      <div
        className="report-action-buttons"
        style={{
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 8 : 16,
        }}
      >
        <Button onClick={onEdit} text="Editar" />
        <Button onClick={onDelete} text="Excluir" />
      </div>
    </div>
  );
}
