import "@testing-library/jest-dom/vitest";

// Limpa o localStorage entre todos os testes
beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});
