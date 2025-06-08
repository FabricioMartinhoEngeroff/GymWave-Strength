import { WarningCircle, CheckCircle } from "phosphor-react";
import { Button } from "../ui/Button";

interface SaveButtonProps {
  salvando: boolean;
  onClickSalvar: () => void;
}

export default function SaveButton({
  salvando,
  onClickSalvar,
}: SaveButtonProps) {
  return (
    <div style={{ marginTop: 12 }}>
      <Button
        text={
          <>
            {salvando ? (
              <CheckCircle
                size={18}
                weight="fill"
                color="#cddc39"
                style={{ marginRight: 6, verticalAlign: "middle" }}
              />
            ) : (
              <WarningCircle
                size={18}
                weight="duotone"
                color="transparent"
                style={{ marginRight: 6, verticalAlign: "middle" }}
              />
            )}
            {salvando ? "Salvo!" : "Salvar"}
          </>
        }
        onClick={onClickSalvar}
        type="button"
        disabled={false}
      />
    </div>
  );
}