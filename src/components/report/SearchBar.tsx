import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import styled from "styled-components";
import { Input } from "../ui/Input";

interface SearchBarProps {
  busca: string;
  setBusca: (novo: string) => void;
  isMobile: boolean;
}

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 480px;
  margin: 0 auto 24px;
  position: relative;
`;

const IconWrapper = styled.div`
  position: absolute;
  left: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  svg {
    color: #6b7280;
  }
`;

export function SearchBar({ busca, setBusca, isMobile }: SearchBarProps) {
  return (
    <SearchContainer>
      <IconWrapper>
        <MagnifyingGlassIcon size={20} weight="bold" />
      </IconWrapper>
      <Input
        type="text"
        placeholder="Buscar exercício..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        isMobile={isMobile}
        styleProps={{ paddingLeft: 40 }}
      />
    </SearchContainer>
  );
}
