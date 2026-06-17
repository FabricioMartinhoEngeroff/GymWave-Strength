# EF_07 — Gráfico Powerlifter (Moderno)

---

## 1. Acesso

Rota `/grafico-powerlifter` (requer autenticação).

Acessada pelo botão **"Ver Gráfico Moderno"** na aba legada de registro (CycleCard).

Componente: `PowerliftingChart`

---

## 2. Atores e Permissões

Qualquer usuário autenticado com dados registrados possui acesso.

---

## 3. Regras Gerais

- **RG1** – Os dados são lidos do `localStorage` (`dadosTreino`).
- **RG2** – Exibe a evolução de carga dos principais exercícios (ex.: Agachamento, Supino, Terra) em formato visual moderno.
- **RG3** – Caso não haja dados, exibe mensagem de estado vazio.

---

## 4. Tela

### 4.1 Conteúdo

- Gráfico de linha ou barra comparando a evolução de carga por exercício ao longo do tempo.
- Visual aprimorado em relação ao `GraphicsContainer`, voltado para acompanhamento de movimentos principais do powerlifting.

---

## 5. Mensagens do Sistema

| Identificador | Tipo | Texto |
|---|---|---|
| `[sem_dados]` | Informação | Sem registros para listar. |
