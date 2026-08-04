export const HARDCODED_USERS = [
  { email: "treino@gmail.com", password: "@Treino123", name: "Fabricio" },
  { email: "amanda@treino.com", password: "@TreinoAmanda", name: "Amanda" },
] as const;

export type AppUser = (typeof HARDCODED_USERS)[number];
