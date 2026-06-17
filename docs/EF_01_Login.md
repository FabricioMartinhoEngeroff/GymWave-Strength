# EF_01 — Login e Autenticação

---

## 1. Acesso

A tela é a rota raiz da aplicação (`/`). Toda vez que o usuário acessa o sistema sem sessão ativa é redirecionado para esta tela.

---

## 2. Atores e Permissões

| Perfil | Acesso | Observação |
|---|---|---|
| Usuário autenticado | Total | Acessa todas as abas da aplicação |
| Visitante (sem login) | Apenas `/` | Redirecionado para Login |

---

## 3. Regras Gerais

- **RG1** – Se o usuário já possui sessão ativa ao acessar `/`, é redirecionado automaticamente para `/app`.
- **RG2** – A autenticação utiliza Firebase Authentication (e-mail + senha).
- **RG3** – Rotas protegidas (`/app`, `/graficos`, `/relatorio`, `/grafico-powerlifter`) verificam o estado de autenticação via `PrivateRoute`. Usuário não autenticado é redirecionado para `/`.
- **RG4** – A rota `/admin` não exige autenticação (uso interno).
- **RG5** – O idioma da interface é Português – Brasil.

---

## 4. Tela de Login

### 4.1 Campos

| Nº | Campo | Tipo | Obrig. | Estado inicial |
|---|---|---|---|---|
| 01 | E-mail | Input e-mail | Sim | Em branco |
| 02 | Senha | Input senha | Sim | Em branco |

### 4.2 Botões

| Botão | Ação | Regras |
|---|---|---|
| **Entrar** | Autenticar o usuário | 1. Verifica campos obrigatórios; se não preenchidos emite `[campos_obrigatorios]`. 2. Se credenciais inválidas emite `[credenciais_invalidas]`. 3. Se corretas, redireciona para `/app`. |
| **Criar conta** | Redireciona para a tela de cadastro | — |
| **Esqueci minha senha** | Envia e-mail de redefinição (Firebase) | Emite mensagem de confirmação após o envio. |

---

## 5. Tela de Cadastro (Registro)

### 5.1 Campos

| Nº | Campo | Tipo | Obrig. | Estado inicial |
|---|---|---|---|---|
| 01 | Nome | Input texto | Sim | Em branco |
| 02 | E-mail | Input e-mail | Sim | Em branco |
| 03 | Senha | Input senha | Sim | Em branco |
| 04 | Confirmar senha | Input senha | Sim | Em branco |

### 5.2 Botões

| Botão | Ação | Regras |
|---|---|---|
| **Cadastrar** | Criar conta no Firebase | 1. Verifica campos obrigatórios. 2. Senhas devem ser iguais; se não, emite `[senhas_diferentes]`. 3. Em caso de sucesso, redireciona para `/app`. |
| **Já tenho conta** | Redireciona para Login | — |

---

## 6. Mensagens do Sistema

| Identificador | Tipo | Cor | Título | Texto |
|---|---|---|---|---|
| `[campos_obrigatorios]` | Aviso | Amarelo | Atenção! | Existe um ou mais campos obrigatórios que não foram preenchidos. |
| `[credenciais_invalidas]` | Erro | Vermelho | Erro | E-mail ou senha incorretos. Favor verificar. |
| `[senhas_diferentes]` | Aviso | Amarelo | Atenção! | As senhas informadas não são iguais. |
| `[email_redefinicao]` | Sucesso | Verde | Sucesso | E-mail de redefinição de senha enviado com sucesso. |
