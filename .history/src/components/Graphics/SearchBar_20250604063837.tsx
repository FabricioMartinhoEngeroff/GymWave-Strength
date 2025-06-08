import React from "react";
import { MagnifyingGlass } from "phosphor-react";
import { Button } from "../ui/Button";

interface SearchBarProps {
  value: string;
  onChange: (newValue: string) => void;
  isMobile: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, isMobile }) => (
  <div style={{ display: "flex", alignItems: "center", padding: "12px 0" }}>
    <MagnifyingGlass size={20} weight="duotone" />
    <input
      style={{
        flex: 1,
        marginLeft: 8,
        padding: "8px",
        borderRadius: 4,
        border: "1px solid #444",
        background: isMobile ? "#222" : "#fff",
        color: isMobile ? "#fff" : "#000",
        boxSizing: "border-box",
      }}
      placeholder="Pesquisar exercício..."
      value={value}
      onChange={e => onChange(e.target.value)}
    />
     <Buttonimport React from "react";
import { MagnifyingGlass } from "phosphor-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

interface SearchBarProps {
  value: string;
  onChange: (newValue: string) => void;
  isMobile: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => (
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

      text="Limpar"
      onClick={() => onChange("")}
      // Ajusta largura do botão para não ficar 100% (pode personalizar)
      // Usando styled-components diretamente, você poderia passar uma prop extra,
      // mas aqui é só um exemplo rápido
      // EX: você poderia criar um StyledButtonMinimo no seu Button.tsx
    />
  </div>
);
  