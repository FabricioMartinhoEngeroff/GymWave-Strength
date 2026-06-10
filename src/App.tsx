import { useState } from "react";
import styled from "styled-components";
import TreinoSessao from "./components/treinoSessao/TreinoSessao";
import VolumeLoad from "./components/volumeLoad/VolumeLoad";
import Exportar from "./components/exportar/Exportar";
import BottomNav, { type Tab } from "./components/layout/BottomNav";
import { GraphicsContainer } from "./components/graphic/GraphicsContainer";
import ReportPage from "./components/report";

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100dvh;
  overflow: hidden;
  background: #f5f6fa;
`;

const TabContent = styled.div`
  flex: 1;
  overflow: hidden;
  position: relative;
`;

const Scrollable = styled.div`
  width: 100%;
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

export default function App() {
  const [tab, setTab] = useState<Tab>("registrar");

  return (
    <Shell>
      <TabContent>
        {tab === "registrar" && <TreinoSessao />}
        {tab === "graficos" && (
          <Scrollable>
            <GraphicsContainer />
          </Scrollable>
        )}
        {tab === "volume" && <VolumeLoad />}
        {tab === "relatorio" && (
          <Scrollable>
            <ReportPage />
          </Scrollable>
        )}
        {tab === "exportar" && <Exportar />}
      </TabContent>
      <BottomNav active={tab} onChange={setTab} />
    </Shell>
  );
}
