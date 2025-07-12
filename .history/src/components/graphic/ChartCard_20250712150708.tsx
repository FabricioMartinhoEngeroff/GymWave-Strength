import React, { useState, ReactElement } from "react";
import {
  ComposedChart,
  XAxis,
  YAxis,
  Legend,
  Bar,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  TooltipProps,
} from "recharts";
import { ChartBar, CalendarBlank } from "phosphor-react";
import type { LinhaGrafico } from "../../hooks/useDadosTreino";

// ... [funções auxiliares mantidas iguais: calcularTotal, calcularMedia, renderizarLinhasSeries, CustomTooltip, renderizarTickX]

export function ChartCard({ exercicio, dados, isMobile }: ChartCardProps) {
  const [visivel, setVisivel] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);

  if (!visivel) return null;

  return (
    <div
      style={{
        background: "#1f1f1f",
        borderRadius: 8,
        padding: 16,
        margin: "0 auto 24px",
        width: "100%",
        maxWidth: 600,
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      <h2
        style={{
          margin: 0,
          paddingBottom: 8,
          color: "#fff",
          textAlign: "center",
          fontSize: 18,
          borderBottom: "1px solid #333",
        }}
      >
        <ChartBar size={20} weight="duotone" className="inline-block mr-2" />
        Progresso — {exercicio}
      </h2>

      <div
        style={{
          width: "100%",
          height: isMobile ? 300 : 350,
          boxSizing: "border-box",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dados} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#333" strokeDasharray="3 3" horizontal vertical={false} />
            <YAxis
              yAxisId="media"
              orientation="left"
              width={50}
              tick={{ fill: "#fff", fontSize: 11 }}
              tickFormatter={(v) => `${v}kg`}
              tickCount={12}
              domain={[0, "dataMax + 5"]}
              axisLine={false}
              tickLine={false}
            />
            <YAxis yAxisId="total" orientation="right" hide />
            <Legend
              verticalAlign="top"
              align="center"
              height={24}
              wrapperStyle={{ color: "#fff", padding: 0, marginBottom: 4 }}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <Bar
              yAxisId="media"
              dataKey="cargaMedia"
              name="Média"
              barSize={isMobile ? 16 : 20}
              fill="#3B82F6"
            />
            <Line
              yAxisId="total"
              dataKey="pesoTotal"
              name="Total"
              type="monotone"
              stroke="#fff"
              dot={false}
            />
            <XAxis
              dataKey="data"
              interval={0}
              height={isMobile ? 60 : 80}
              axisLine={false}
              tickLine={false}
              tick={renderizarTickX}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Botões "Atualizar" e "Excluir" */}
      <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button
          onClick={() => alert("Atualizar gráfico...")}
          style={{
            padding: "8px 16px",
            background: "#3B82F6",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Atualizar
        </button>
        <button
          onClick={() => setMostrarModal(true)}
          style={{
            padding: "8px 16px",
            background: "#991b1b",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Excluir
        </button>
      </div>

      {/* Modal de confirmação */}
      {mostrarModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 8,
              minWidth: 300,
              maxWidth: 360,
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginTop: 0, color: "#b91c1c" }}>⚠ Atenção</h3>
            <p>Deseja realmente excluir este item?</p>
            <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 16 }}>
              <button
                onClick={() => setMostrarModal(false)}
                style={{
                  padding: "6px 16px",
                  background: "#e5e5e5",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setMostrarModal(false);
                  setVisivel(false);
                }}
                style={{
                  padding: "6px 16px",
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
