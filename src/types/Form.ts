export interface Address {
    rua: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  }
  
  export interface FormData {
    email: string;
    password: string;
    name: string;
    cpf: string;
    telefone: string;
    endereco: Address;
  }
  
  export interface FormErrors {
    name: string | null;
    email: string | null;
    password: string | null;
    cpf: string | null;
    telefone: string | null;
    endereco: {
      rua: string | null;
      bairro: string | null;
      cidade: string | null;
      estado: string | null;
      cep: string | null;
    };
  }