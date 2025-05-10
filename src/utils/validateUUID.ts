/**
 * Valida se uma string está no formato UUID v4
 */
export function isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
  
  // Exemplo de uso:
  const id = "550e8400-e29b-41d4-a716-446655440000";
  
  if (isValidUUID(id)) {
    console.log("✅ ID válido, pode ser usado na requisição.");
  } else {
    console.warn("❌ ID inválido, verifique antes de enviar.");
  }