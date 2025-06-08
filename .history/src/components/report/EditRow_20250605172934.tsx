// Dentro do seu componente EditRow:
import type { LinhaRelatorio, SerieInfo } from "../../types/TrainingData";
// …

// Função que garante um array de SerieInfo:
const getSeries = (): SerieInfo[] =>
  linhaEditada.series ?? linha.series;

// Na renderização, especifique o tipo de "s" como SerieInfo:
{getSeries().map((s: SerieInfo, i: number) => (
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
          value={s.rep}
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
          value={s.peso}
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
