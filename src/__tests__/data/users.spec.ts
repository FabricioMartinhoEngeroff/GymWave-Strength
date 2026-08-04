/**
 * UsersTest → data/users
 * Verifica que os usuários hardcoded estão corretos e completos.
 */
import { describe, it, expect } from "vitest";
import { HARDCODED_USERS } from "../../data/users";

describe("HARDCODED_USERS — dados dos usuários do sistema", () => {
  it("existem exatamente 2 usuários cadastrados", () => {
    expect(HARDCODED_USERS).toHaveLength(2);
  });

  it("cada usuário tem email, password e name definidos e não vazios", () => {
    for (const user of HARDCODED_USERS) {
      expect(user.email).toBeTruthy();
      expect(user.password).toBeTruthy();
      expect(user.name).toBeTruthy();
    }
  });

  it("Fabricio está cadastrado com as credenciais corretas", () => {
    const fabricio = HARDCODED_USERS.find((u) => u.name === "Fabricio");
    expect(fabricio).toBeDefined();
    expect(fabricio!.email).toBe("treino@gmail.com");
    expect(fabricio!.password).toBe("@Treino123");
  });

  it("Amanda está cadastrada com as credenciais corretas", () => {
    const amanda = HARDCODED_USERS.find((u) => u.name === "Amanda");
    expect(amanda).toBeDefined();
    expect(amanda!.email).toBe("amanda@treino.com");
    expect(amanda!.password).toBe("@TreinoAmanda123");
  });

  it("todos os emails são únicos", () => {
    const emails = HARDCODED_USERS.map((u) => u.email);
    expect(new Set(emails).size).toBe(emails.length);
  });

  it("todos os names são únicos", () => {
    const names = HARDCODED_USERS.map((u) => u.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
