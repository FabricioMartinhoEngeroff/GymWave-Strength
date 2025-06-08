
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
        text={salvando ? "Salvo!" : "Salvar"}
        onClick={onClickSalvar}
        type="button"
        disabled={false}
      >
        {/* Para exibir o ícone ao lado do texto, podemos envolver o Button via styled-component
            ou simplesmente confiar que o Button receba o ícone dentro de children. Aqui, 
            exemplificamos passando o ícone como children: */}
        {salvando ? (
          <CheckCircle
            size={18}
            weight="fill"
            color="#cddc39"
            style={{ marginRight: 6 }}
          />
        ) : (
          <WarningCircle
            size={18}
            weight="duotone"
            color="transparent"
            style={{ marginRight: 6 }}
          />
        )}
      </Button>
    </div>
  );
}