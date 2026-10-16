export interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export type FormErrors = Partial<Record<keyof FormData, string>>;
