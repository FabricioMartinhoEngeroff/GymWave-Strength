import "@testing-library/jest-dom/vitest";
import { mensagens } from "../../components/mensagens/mensagens";

// Limpa o localStorage entre todos os testes
beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

afterEach(() => {
  mensagens.limpar();
  sessionStorage.clear();
  localStorage.clear();
});
