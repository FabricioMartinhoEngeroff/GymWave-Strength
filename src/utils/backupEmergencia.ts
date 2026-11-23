import { BACKUP_APP, BACKUP_VERSAO, montarBackup } from "./backupJson";
import { baixarArquivo } from "./baixarArquivo";
import { storageKey } from "./storage";

// Backup da tela de erro (EF_09 RG11): o mesmo JSON do Exportar e, se algo estiver
// ilegível, também o conteúdo bruto dos dados de treino deste usuário.

const CHAVES = ["registros", "logbook", "dadosTreino", "planoTreino", "sessoes_config", "rascunho_treino"];

function ilegivel(texto: string): boolean {
  try {
    JSON.parse(texto);
    return false;
  } catch {
    return true;
  }
}

/** Uma chave impossível de ler não pode impedir o backup das outras. */
function lerTexto(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

/** Dados de treino do usuário como estão guardados; `soIlegiveis` deixa de fora o que abre normalmente. */
function lerBruto(soIlegiveis: boolean): Record<string, string> {
  const bruto: Record<string, string> = {};
  const prefixo = storageKey("");
  for (const chave of Object.keys(localStorage)) {
    if (!chave.startsWith(prefixo)) continue;
    const base = chave.slice(prefixo.length);
    const copia = CHAVES.some((c) => base.startsWith(`${c}_corrompido`));
    const texto = lerTexto(chave);
    if (texto === null || !(copia || CHAVES.includes(base))) continue;
    if (copia || !soIlegiveis || ilegivel(texto)) bruto[base] = texto;
  }
  return bruto;
}

export function conteudoBackupEmergencia(): string {
  // O bruto é lido antes: montar o backup pode copiar dados corrompidos.
  const problemas = lerBruto(true);
  try {
    const backup = montarBackup();
    return JSON.stringify(Object.keys(problemas).length > 0 ? { ...backup, bruto: problemas } : backup);
  } catch {
    // O que estiver legível também vai no formato do backup, para poder ser importado.
    const bruto = lerBruto(false);
    const legiveis = Object.entries(bruto).filter(([base, texto]) => CHAVES.includes(base) && !ilegivel(texto));
    return JSON.stringify({
      ...Object.fromEntries(legiveis.map(([base, texto]) => [base, JSON.parse(texto)])),
      app: BACKUP_APP,
      versao: BACKUP_VERSAO,
      exportadoEm: new Date().toISOString(),
      bruto,
    });
  }
}

export function baixarBackupEmergencia(): void {
  baixarArquivo(`gymwave_backup_${new Date().toISOString().slice(0, 10)}.json`, conteudoBackupEmergencia(), "application/json");
}
