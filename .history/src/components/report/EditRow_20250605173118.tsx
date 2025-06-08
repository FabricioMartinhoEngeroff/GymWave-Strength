import React from "react";
import type { LinhaRelatorio, SerieInfo } from "../../types/TrainingData";
import {
  CalendarBlankIcon,
  StarIcon,
  ArrowsClockwiseIcon,
  BarbellIcon,
  FileTextIcon,
} from "@phosphor-icons/react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

interface EditRowProps {
  rowIndex: number;
  linha: LinhaRelatorio;
  linhaEditada: Partial<LinhaRelatorio>;
  setLinhaEditada: React.Dispatch<React.SetStateAction<Partial<LinhaRelatorio>>>;
  salvarEdicao: (idx: number, linhaEditada: Partial<LinhaRelatorio>) => void;
  cancelarEdicao: () => void;
  isMobile: boolean;
}

export function EditRow({
  rowIndex,
  linha,
  linhaEditada,
  setLinhaEditada,
  salvarEdicao,
  cancelarEdicao,
  isMobile,
}: EditRowProps) {
  const getSeries = (): SerieInfo[] =>
    linhaEditada.series ?? linha.series;

  return (
    <div className="report-card">
      {/* Campo Data */}
      <label className="report-label">
        <CalendarBlankIcon
          size={isMobile ? 16 : 18}
          weight="duotone"
          color="#10B981"
          className="report-icon"
        />
        Data
      </label>
      <Input
        type="text"
        placeholder="DD/MM/AAAA"
        value={linhaEditada.data ?? linha.data}
        onChange={(e) =>
          setLinhaEditada((p) => ({ ...p, data: e.target.value }))
        }
        isMobile={isMobile}
      />

      {/* Campos de série */}
      {getSeries().map((s: s, i) => (
        <div
          key={i}
          className="report-serie-container"
          style={{
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 8 : 16,
          }}
        >
          <label className="report-label">
            <StarIcon
              size={isMobile ? 16 : 18}
              weight="fill"
              color="#FBBF24"
              className="report-icon"
            />
            Série {i + 1}
          </label>

          <div className="report-serie-inputs">
            <div className="report-serie-field">
              <label className="report-sublabel">
                <ArrowsClockwiseIcon
                  size={16}
                  weight="fill"
                  color="#3B82F6"
                  className="mr-1"
                />
                Repetições
              </label>
              <Input
                type="text"
                placeholder="Ex.: 8 reps"
                value={getSeries()[i].rep}
                onChange={(e) => {
                  const arr = getSeries().map((x) => ({ ...x }));
                  arr[i].rep = e.target.value;
                  setLinhaEditada((p) => ({ ...p, series: arr }));
                }}
                isMobile={isMobile}
              />
            </div>

            <div className="report-serie-field">
              <label className="report-sublabel">
                <BarbellIcon
                  size={16}
                  weight="fill"
                  color="#EF4444"
                  className="mr-1"
                />
                Peso
              </label>
              <Input
                type="text"
                placeholder="Ex.: 100 kg"
                value={getSeries()[i].peso}
                onChange={(e) => {
                  const arr = getSeries().map((x) => ({ ...x }));
                  arr[i].peso = e.target.value;
                  setLinhaEditada((p) => ({ ...p, series: arr }));
                }}
                isMobile={isMobile}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Campo Observações */}
      <label className="report-label">
        <FileTextIcon
          size={isMobile ? 16 : 18}
          weight="duotone"
          className="report-icon"
        />
        Observações
      </label>
      <Input
        type="text"
        placeholder="Digite observações"
        value={linhaEditada.obs ?? linha.obs ?? ""}
        onChange={(e) => setLinhaEditada((p) => ({ ...p, obs: e.target.value }))}
        isMobile={isMobile}
      />

      {/* Botões Salvar / Cancelar */}
      <div
        className="report-action-buttons"
        style={{ flexDirection: isMobile ? "column" : "row", gap: 12 }}
      >
        <Button onClick={() => salvarEdicao(rowIndex, linhaEditada)} text="Salvar" />
        <Button onClick={cancelarEdicao} text="Cancelar" />
      </div>
    </div>
  );
}