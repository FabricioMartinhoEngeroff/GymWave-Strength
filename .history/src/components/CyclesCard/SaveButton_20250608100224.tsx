import { WarningCircle, CheckCircle } from "phosphor-react";
import styled from "styled-components";
import { Button } from "../ui/Button";

interface SaveButtonProps {
  salvando: boolean;
  onClickSalvar: () => void;
}

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`;

export function SaveButton({ salvando, onClickSalvar }: SaveButtonProps) {
  return (
    <Wrapper>
      <Button
        onClick={onClickSalvar}
        type="button"
        variant={salvando ? "primary" : "outline"}
        fullWidth
      >
        {salvando ? (
          <>
            <CheckCircle
              size={12}
              weight="fill"
              color="#ffffff"
              style={{ marginRight: 12}}
            />
            Salvo!
          </>
        ) : (
          <>
            <WarningCircle
              size={18}
              weight="duotone"
              color="#0066cc"
              style={{ marginRight: 6 }}
            />
            Salvar
          </>
        )}
      </Button>
    </Wrapper>
  );
}
