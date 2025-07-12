import React from "react";
import styled from "styled-components";
import { MagnifyingGlass } from "phosphor-react";
import { Input } from "../ui/Input";


interface SearchBarProps {
  value: string;
  onChange: (newValue: string) => void;
  isMobile?: boolean;
}

const SearchWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const InputContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 200px;

  svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #777;
    pointer-events: none;
  }

  input {
    width: 100%;
    padding-left: 40px !important;
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
  </SearchWrapper>
);