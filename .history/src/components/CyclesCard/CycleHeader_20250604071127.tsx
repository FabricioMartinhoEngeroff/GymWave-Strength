import React from "react";
import { ChartBar, Lightning, Repeat } from "phosphor-react";

interface CycleHeaderProps {
  ciclo: string;
  percentual: string;
  reps: string;
}

export default function CycleHeader({
  ciclo,
  percentual,
  reps,
}: CycleHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        fontWeight: "bold",
        fontSize: 15,
        marginBottom: 10,
      }}
    >
      <ChartBar
        size={20}
        weight="fill"
        color="#4caf50"
        style={{ marginRight: 6 }}
      />
      <span>{ciclo}</span>
      <span style={{ margin: "0 8px" }}>|</span>

      <Lightning
        size={20}
        weight="fill"
        color="#ffeb3b"
        style={{ marginRight: 6 }}
      />
      <span>{percentual}</span>
      <span style={{ margin: "0 8px" }}>|</span>

      <Repeat
        size={20}
        weight="fill"
        color="#2196f3"
        style={{ marginRight: 6 }}
      />
      <span>{reps}</span>
    </div>
  );
}