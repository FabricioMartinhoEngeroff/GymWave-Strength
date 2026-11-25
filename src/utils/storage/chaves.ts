// ─── User-scoped storage keys ─────────────────────────────────────────────────

// O usuário atual é definido só pelo AuthProvider (setCurrentUser), nunca lido do storage.
let _userId = "";

// Keys that hold real user data (not auth infrastructure)
const USER_DATA_KEYS = ["registros", "logbook", "dadosTreino", "planoTreino", "sessoes_config"];

// No primeiro login após a mudança, migra dados globais pré-existentes
// para as chaves do usuário, para que nada se perca.
function migrateUnscoped(userId: string) {
  USER_DATA_KEYS.forEach((base) => {
    const scopedKey = `gw:${userId}:${base}`;
    const old = localStorage.getItem(base);
    if (old && old !== "{}" && old !== "[]") {
      // Só migra se o destino ainda não existe
      if (!localStorage.getItem(scopedKey)) {
        localStorage.setItem(scopedKey, old);
      }
      // Remove a chave global para que outro usuário não herde esses dados
      localStorage.removeItem(base);
    }
  });
}

export function setCurrentUser(id: string | null) {
  _userId = id ?? "";
  if (_userId) migrateUnscoped(_userId);
}

export function getCurrentUser(): string {
  return _userId;
}

export function storageKey(base: string): string {
  return _userId ? `gw:${_userId}:${base}` : base;
}
