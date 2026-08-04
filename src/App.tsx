import { useState, useCallback } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import TreinoSessao from "./components/treinoSessao/TreinoSessao";
import VolumeLoad from "./components/volumeLoad/VolumeLoad";
import Exportar from "./components/exportar/Exportar";
import BottomNav, { type Tab } from "./components/layout/BottomNav";
import { GraphicsContainer } from "./components/graphic/GraphicsContainer";
import ReportPage from "./components/report";
import { HARDCODED_USERS } from "./data/users";
import { setCurrentUser } from "./utils/storage";

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100dvh;
  overflow: hidden;
  background: #f5f6fa;
`;

const TopBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 40px;
  background: #1e40af;
  flex-shrink: 0;
`;

const UserLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #dbeafe;
`;

const LogoutBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  color: #dbeafe;
  font-size: 12px;
  padding: 4px 6px;
  border-radius: 6px;
  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
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
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const navigate = useNavigate();

  const email = localStorage.getItem("email") ?? "";
  const currentUser = HARDCODED_USERS.find((u) => u.email === email);

  const handleTabChange = useCallback(
    (newTab: Tab) => {
      if (newTab !== "registrar" && unsavedChanges) {
        if (!window.confirm("Você tem alterações não salvas. Sair mesmo assim?")) return;
      }
      setTab(newTab);
    },
    [unsavedChanges]
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    setCurrentUser(null);
    navigate("/");
  };

  return (
    <Shell>
      <TopBar>
        <UserLabel>Olá, {currentUser?.name ?? "Usuário"}</UserLabel>
        <LogoutBtn onClick={handleLogout}>
          <LogOut size={14} />
          Sair
        </LogoutBtn>
      </TopBar>
      <TabContent>
        {tab === "registrar" && <TreinoSessao onUnsavedChanges={setUnsavedChanges} />}
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
      <BottomNav active={tab} onChange={handleTabChange} />
    </Shell>
  );
}
