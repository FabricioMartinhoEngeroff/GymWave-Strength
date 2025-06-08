import React from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { Input } from "../ui/Input";

interface SearchBarProps {
  busca: string;
  setBusca: (novo: string) => void;
  isMobile: boolean;
}

export function SearchBar({ busca, setBusca, isMobile }: SearchBarProps) {
  return (
    <div className="report-search-container">
      <MagnifyingGlassIcon
        size={isMobile ? 18 : 20}
        weight="fill"
        color="#6B7280"
        className="report-search-icon"
      />
      <Input
        type="text"
        placeholder="Buscar exercício..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        isMobile={isMobile}
        styleProps={{ paddingLeft: isMobile ? 32 : 36 }} 
        // supondo que seu Input possa receber um styleProps (opcional)
      />
    </div>
  );
}