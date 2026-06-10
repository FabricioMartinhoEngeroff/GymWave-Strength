import styled from "styled-components";

export type Tab =
  | "registrar"
  | "graficos"
  | "volume"
  | "relatorio"
  | "exportar";

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const Nav = styled.nav`
  position: relative;
  height: 62px;
  background: #ffffff;
  border-top: 0.5px solid rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 4px calc(8px + env(safe-area-inset-bottom));
  flex-shrink: 0;
`;

const NavItem = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 10px;
  flex: 1;
  border: none;
  background: ${(p) => (p.$active ? "#eff6ff" : "none")};
`;

const NavIcon = styled.span<{ $active: boolean }>`
  font-size: 20px;
  color: ${(p) => (p.$active ? "#2563eb" : "#9ca3af")};
  line-height: 1;
`;

const NavLabel = styled.span<{ $active: boolean }>`
  font-size: 10px;
  color: ${(p) => (p.$active ? "#2563eb" : "#9ca3af")};
  font-weight: ${(p) => (p.$active ? "500" : "400")};
`;

const ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: "registrar", label: "Registrar", icon: "➕" },
  { id: "graficos", label: "Gráficos", icon: "📈" },
  { id: "volume", label: "Volume", icon: "⚡" },
  { id: "relatorio", label: "Relatórios", icon: "📋" },
  { id: "exportar", label: "Exportar", icon: "⬇" },
];

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <Nav aria-label="Navegação principal">
      {ITEMS.map((item) => (
        <NavItem
          key={item.id}
          $active={active === item.id}
          onClick={() => onChange(item.id)}
        >
          <NavIcon $active={active === item.id}>{item.icon}</NavIcon>
          <NavLabel $active={active === item.id}>{item.label}</NavLabel>
        </NavItem>
      ))}
    </Nav>
  );
}
