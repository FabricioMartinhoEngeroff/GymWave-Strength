import { describe, it, expect } from "vitest";
import {
  registerSchema,
  getPasswordRequirements,
} from "../../../../components/login/domain/schemas";
import {
  issueCodes,
  issuesFor,
  sorted,
  validRegisterInput,
  VALID_PASSWORD,
} from "../helpers/fixtures";

const NAME_MAX = 100;
const PASSWORD_MAX = 128;

const ALL_REQUIREMENT_CODES = [
  "PASSWORD_NO_LOWERCASE",
  "PASSWORD_NO_NUMBER",
  "PASSWORD_NO_SPECIAL",
  "PASSWORD_NO_UPPERCASE",
  "PASSWORD_TOO_SHORT",
];

const parse = (o: Record<string, unknown> = {}) => registerSchema.safeParse(validRegisterInput(o));

/** Cadastro em que a confirmação é igual à senha: isola só as regras da senha. */
const parseWithPassword = (password: string) => parse({ password, confirmPassword: password });

/** Senha que cumpre todos os requisitos e tem exatamente `length` caracteres. */
const strongPasswordOfLength = (length: number) => "Aa1!" + "x".repeat(length - 4);

describe("G1 — registerSchema: nome", () => {
  it('aplica trim: " Ana " → "Ana"', () => {
    const r = parse({ name: " Ana " });
    expect(r.success && r.data.name).toBe("Ana");
  });
  it('"AB" → NAME_TOO_SHORT', () => expect(issueCodes(parse({ name: "AB" }))).toContain("NAME_TOO_SHORT"));
  it("101 caracteres → NAME_TOO_LONG", () =>
    expect(issueCodes(parse({ name: "a".repeat(NAME_MAX + 1) }))).toContain("NAME_TOO_LONG"));
  it("100 caracteres → ok", () => expect(parse({ name: "a".repeat(NAME_MAX) }).success).toBe(true));
  it.each(["", "    "])("%j → REQUIRED", (name) => expect(issueCodes(parse({ name }))).toContain("REQUIRED"));
  it.each(["Ana\u0000Silva", "Ana\nSilva", "Ana\u0007", "Ana\tSilva"])(
    "caracteres de controle (%j) → rejeitado",
    (name) => {
      const r = parse({ name });
      expect(r.success).toBe(false);
      expect(issuesFor(r, "name").length).toBeGreaterThan(0);
    },
  );
});

describe("G1 — registerSchema: senha de cadastro", () => {
  it("menos de 8 caracteres → PASSWORD_TOO_SHORT", () => {
    expect(issueCodes(parseWithPassword("Ab1!"))).toContain("PASSWORD_TOO_SHORT");
  });

  it.each([
    ["abcdef1!", "PASSWORD_NO_UPPERCASE"],
    ["ABCDEF1!", "PASSWORD_NO_LOWERCASE"],
    ["Abcdefg!", "PASSWORD_NO_NUMBER"],
    ["Abcdefg1", "PASSWORD_NO_SPECIAL"],
  ])("%s → %s (e só ele)", (password, code) => {
    const codes = issueCodes(parseWithPassword(password));
    expect(codes).toContain(code);
    expect(codes.filter((c) => c.startsWith("PASSWORD_"))).toEqual([code]);
  });

  it('"Abcdef1!" → ok', () => expect(parseWithPassword(VALID_PASSWORD).success).toBe(true));

  it("128 caracteres → ok; 129 → TOO_LONG", () => {
    expect(parseWithPassword(strongPasswordOfLength(PASSWORD_MAX)).success).toBe(true);
    expect(issueCodes(parseWithPassword(strongPasswordOfLength(PASSWORD_MAX + 1)))).toContain("TOO_LONG");
  });

  it("não aplica trim na senha", () => {
    const pw = " Abcdef1! ";
    const r = parseWithPassword(pw);
    expect(r.success && r.data.password).toBe(pw);
  });
});

describe("G1 — registerSchema: confirmação e role", () => {
  it("confirmPassword diferente → PASSWORDS_DONT_MATCH no campo confirmPassword", () => {
    const r = parse({ confirmPassword: "Outra1234!" });
    const issues = issuesFor(r, "confirmPassword");
    expect(issues.map((i) => i.message)).toContain("PASSWORDS_DONT_MATCH");
  });

  it("role: 'admin' no input não aparece no output (o perfil é sempre 'user')", () => {
    const r = parse({ role: "admin" });
    expect(r.success).toBe(true);
    expect(r.success && r.data).not.toHaveProperty("role");
  });

  it("CPF, telefone e endereço não passam pelo schema", () => {
    const r = parse({ cpf: "123", telefone: "1", endereco: {} });
    expect(r.success && r.data).not.toHaveProperty("cpf");
    expect(r.success && r.data).not.toHaveProperty("telefone");
    expect(r.success && r.data).not.toHaveProperty("endereco");
  });
});

describe("G14 — getPasswordRequirements (checklist)", () => {
  it("lista todos os requisitos com met=false para senha vazia", () => {
    const reqs = getPasswordRequirements("");
    expect(sorted(reqs.map((r) => r.code))).toEqual(sorted(ALL_REQUIREMENT_CODES));
    expect(reqs.every((r) => r.met === false)).toBe(true);
    expect(reqs.every((r) => typeof r.label === "string" && r.label.length > 0)).toBe(true);
  });

  it("senha forte → todos met", () => {
    expect(getPasswordRequirements(VALID_PASSWORD).every((r) => r.met)).toBe(true);
  });

  it("marca somente o que falta", () => {
    const unmet = getPasswordRequirements("abcdefgh").filter((r) => !r.met).map((r) => r.code);
    expect(sorted(unmet)).toEqual(
      sorted(["PASSWORD_NO_UPPERCASE", "PASSWORD_NO_NUMBER", "PASSWORD_NO_SPECIAL"]),
    );
  });
});