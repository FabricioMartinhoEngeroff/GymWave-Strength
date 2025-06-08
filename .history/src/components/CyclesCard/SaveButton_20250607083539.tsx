import { WarningCircle, CheckCircle } from "phosphor-react";
import styled from "styled-components";
import { Button } from "../ui/Button";

interface SaveButtonProps {
  salvando: boolean;
  onClickSalvar: () => void;
}

const Wrapper = styled.div`
  margin-top: 16px;
  width: 100%;
`;

export function SaveButton({ salvando, onClickSalvar }: SaveButtonProps) {
  return (
    <Wrapper>
      <Button
        text={salvando ? "Salvo!" : "Salvar"}
        onClick={onClickSalvar}
        type="button"
      >
        {salvando ? (
          <CheckCircle
            size={18}
            weight="fill"
            color="#4caf50"
            style={{ marginRight: 6 }}
          />
        ) : (
          <WarningCircle
            size={18}
            weight="duotone"
            color="#2196f3"
            style={{ marginRight: 6 }}
          />
        )}
      </Button>
    </Wrapper>
  );
}
