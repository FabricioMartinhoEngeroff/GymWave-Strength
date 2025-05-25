
type AxiosError = {
  isAxiosError: boolean;
  response?: {
    status: number;
    data: { message?: string; [key: string]: unknown };
  };
  request?: unknown;
  message: string;
};

/**
 * Verifica se o erro é um erro do Axios.
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as AxiosError).isAxiosError === true
  );
}

/**
 * Trata erros da API (Axios) ou JS comum:
 * - Loga detalhes no console
 * - Exibe alert para usuário
 * - Relança o erro para tratamento externo
 */
export function handleApiError(error: unknown, defaultMessage: string): void {
  // Erro padrão; pode ser sobrescrito por mensagens da API
  let message = defaultMessage;

  if (isAxiosError(error)) {
    // --- Erro Axios ---
    console.error("🚨 Erro Axios:", error.message);

    if (error.response) {
      // Resposta com status code e body
      console.error(`❌ Status ${error.response.status}`, error.response.data);
      message = error.response.data?.message ?? defaultMessage;
    } else if (error.request) {
      // Requisição enviada, mas sem resposta
      console.error("⚠️ Sem resposta do servidor");
    }
  } else if (error instanceof Error) {
    // --- Erro JS padrão ---
    console.error("🚨 Erro:", error.message);
    message = error.message;
  } else {
    // --- Outro tipo de erro inesperado ---
    console.error("🚨 Erro desconhecido:", error);
  }

  // Notifica o usuário
  alert(message);

  // Relança para que camadas superiores possam tratar
  throw error;
}
