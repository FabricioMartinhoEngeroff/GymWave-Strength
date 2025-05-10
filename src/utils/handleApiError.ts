/**
 * Tipo manual para representar erros do Axios (fallback para versões antigas).
 */
type AxiosError = {
  isAxiosError: boolean;
  response?: {
    status: number;
    data: {
      message?: string;
      [key: string]: unknown;
    };
  };
  request?: unknown;
  message: string;
};

/**
 * ✅ Verifica se o erro é um erro do Axios.
 * - Checa pela flag `isAxiosError`
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === "object" &&
    error !== null &&
    "isAxiosError" in error &&
    (error as AxiosError).isAxiosError === true
  );
}

/**
 * ✅ Função para tratar erros da API (Axios) ou JS comum.
 * - Exibe no console
 * - Alerta o usuário
 * - Relança o erro para tratamento externo
 */
export function handleApiError(error: unknown, defaultMessage: string): void {
  console.error("🚨 Erro na API:", error);

  let message = defaultMessage;

  if (isAxiosError(error)) {
    if (error.response) {
      console.error(`❌ Código de status: ${error.response.status}`);
      console.error("📝 Dados da resposta:", error.response.data);
      message = error.response.data?.message || defaultMessage;
    } else if (error.request) {
      console.error("⚠️ Nenhuma resposta recebida do servidor");
    }
  } else if (error instanceof Error) {
    console.error("Erro desconhecido:", error.message);
    message = error.message;
  }

  alert(message);
  throw error;
}
