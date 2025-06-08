// src/components/Graphics/SearchBar.tsx
import React from "react";
import { MagnifyingGlass } from "phosphor-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

interface SearchBarProps {
  value: string;
  onChange: (newValue: string) => void;
  isMobile: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, isMobile }) => (
  <div style={{ display: "flex", alignItems: "center", padding: "12px 0" }}>
    <MagnifyingGlass size={20} weight="duotone" />

    {/* Wrapper para “empurrar” o Input e aplicar flex:1 + margem */}
    <div style={{ flex: 1, marginLeft: 8 }}>
      <Input
        type="text"
        placeholder="Pesquisar exercício..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>

    {/* Botão “Limpar” */}
    <div style={{ marginLeft: 8 }}>
      <Button text="Limpar" onClick={() => onChange("")} />
    </div>
  </div>
);
