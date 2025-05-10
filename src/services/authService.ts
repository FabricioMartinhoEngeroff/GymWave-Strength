
import { handleApiError } from "../utils/handleApiError";

// Interface com os dados do usuário
interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  cpf: string;
  telefone: string;
  endereco: {
    rua: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
}

// Interface para usuários armazenados localmente
interface MockUser extends RegisterUserData {
  role: string;
}

const mockUsersKey = "mock-users";

// Gera um token JWT falso com payload básico e expiração
function generateMockJWT(payload: object, expiresInSeconds = 3600): string {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;

  const fullPayload = { ...payload, exp };
  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const encodedHeader = encode(header);
  const encodedPayload = encode(fullPayload);
  const signature = btoa("segredo-simulado"); // Simulação simples

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Faz login comparando com os usuários salvos localmente
export async function login(email: string, password: string) {
  try {
    const usersJSON = localStorage.getItem(mockUsersKey);
    const users: MockUser[] = usersJSON ? JSON.parse(usersJSON) : [];

    const foundUser = users.find((u) => u.email === email);

    if (!foundUser || foundUser.password !== password) {
      throw new Error("Usuário ou senha inválidos.");
    }

    const token = generateMockJWT({ email: foundUser.email, role: foundUser.role });
    localStorage.setItem("token", token);
    localStorage.setItem("email", foundUser.email);

    return { token };
  } catch (error) {
    handleApiError(error, "Erro ao realizar login.");
  }
}

// Simula o registro, salvando o novo usuário no "banco local"
export async function register(userData: RegisterUserData) {
  try {
    const usersJSON = localStorage.getItem(mockUsersKey);
    const users: MockUser[] = usersJSON ? JSON.parse(usersJSON) : [];

    const emailExists = users.some((u) => u.email === userData.email);
    if (emailExists) {
      throw new Error("Este e-mail já está registrado.");
    }

    const newUser: MockUser = { ...userData, role: "user" };
    users.push(newUser);

    localStorage.setItem(mockUsersKey, JSON.stringify(users));

    const token = generateMockJWT({ email: newUser.email, role: newUser.role });
    localStorage.setItem("token", token);
    localStorage.setItem("email", newUser.email);

    return { token };
  } catch (error) {
    handleApiError(error, "Erro ao cadastrar usuário.");
  }
}
