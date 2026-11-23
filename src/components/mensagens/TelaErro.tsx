import { useState } from "react";
import { Download, HeartCrack, RefreshCw } from "lucide-react";
import { baixarBackupEmergencia } from "../../utils/backupEmergencia";
import { getCurrentUser } from "../../utils/storage";
import { logErro } from "../login/security/logger";
import { Botao, Botoes, Caixa, IconeRedondo, TelaCheia, Texto, Titulo } from "./Mensagens.styles";

const RETORNO = { ok: "Backup baixado", falha: "Não foi possível gerar o backup." };

/** Tela amigável no lugar da tela branca (EF_09 RG10). Não depende de rota, sessão nem da central de mensagens. */
export function TelaErro({ inteira = false }: { inteira?: boolean }) {
  const [backup, setBackup] = useState<keyof typeof RETORNO | null>(null);

  function baixar() {
    try {
      baixarBackupEmergencia();
      setBackup("ok");
    } catch (erro) {
      logErro("backup de emergência", erro);
      setBackup("falha");
    }
  }

  return (
    <TelaCheia $inteira={inteira}>
      <Caixa role="alert">
        <IconeRedondo $perigo>
          <HeartCrack size={20} strokeWidth={1.8} aria-hidden />
        </IconeRedondo>
        <Titulo>Algo deu errado</Titulo>
        <Texto>Seus dados estão salvos neste aparelho. Recarregue para continuar; se o erro voltar, baixe um backup.</Texto>
        <Botoes>
          <Botao type="button" $estilo="primario" onClick={() => window.location.reload()}>
            <RefreshCw size={16} strokeWidth={1.8} aria-hidden />
            Recarregar
          </Botao>
          {getCurrentUser() && (
            <Botao type="button" $estilo="neutro" onClick={baixar}>
              <Download size={16} strokeWidth={1.8} aria-hidden />
              Baixar backup
            </Botao>
          )}
        </Botoes>
        {backup && <Texto style={{ marginTop: 10 }}>{RETORNO[backup]}</Texto>}
      </Caixa>
    </TelaCheia>
  );
}
