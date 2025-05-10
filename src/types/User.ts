export interface User {
  id: string;
  name: string;
  email: string;
  telefone: string;
  cpf: string;
  endereco: {
    rua: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  role: string; 
}

export default User;