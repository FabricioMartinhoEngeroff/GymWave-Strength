// src/components/graphic/SearchBar.tsx
import React from "react";
import styled from "styled-components";
import { MagnifyingGlass } from "phosphor-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

interface SearchBarProps {
  value: string;
  onChange: (newValue: string) => void;
  isMobile?: boolean;
}

const SearchWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const InputContainer = styled.div`
  position: relative;
  width: 240px;

  svg {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #777;
    pointer-events: none;
  }

  input {
    width: 100%;
    padding-left: 36px !important;
  }
`;

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => (
  <SearchWrapper>
    <InputContainer>
      <MagnifyingGlass size={18} weight="duotone" />
      <Input
        type="text"
        placeholder="Pesquisar exercício..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </InputContainer>

    <Button onClick={() => onChange("")}>Limpar</Button>
  </SearchWrapper>
);
