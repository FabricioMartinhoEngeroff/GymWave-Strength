# GymWave Strength — Especificações Funcionais

Documentação de todas as telas e funcionalidades do sistema GymWave Strength.

---

## Índice

| EF | Tela | Rota / Acesso | Arquivo |
|---|---|---|---|
| EF_01 | Login e Autenticação | `/` | [EF_01_Login.md](./EF_01_Login.md) |
| EF_02 | Registrar Treino (Aba Principal) | `/app` → aba Registrar | [EF_02_Registrar_Treino.md](./EF_02_Registrar_Treino.md) |
| EF_03 | Gráficos | `/app` → aba Gráficos · `/graficos` | [EF_03_Graficos.md](./EF_03_Graficos.md) |
| EF_04 | Volume Load por Músculo | `/app` → aba Volume | [EF_04_Volume_Load.md](./EF_04_Volume_Load.md) |
| EF_05 | Relatórios de Treinos | `/app` → aba Relatórios · `/relatorio` | [EF_05_Relatorios.md](./EF_05_Relatorios.md) |
| EF_06 | Exportar / Importar Dados | `/app` → aba Exportar | [EF_06_Exportar_Importar.md](./EF_06_Exportar_Importar.md) |
| EF_07 | Gráfico Powerlifter (Moderno) | `/grafico-powerlifter` | [EF_07_Grafico_Powerlifter.md](./EF_07_Grafico_Powerlifter.md) |
| EF_08 | Importação Admin | `/admin` | [EF_08_Admin_Import.md](./EF_08_Admin_Import.md) |

---

## Estrutura de Navegação

```
GymWave Strength
│
├── / ──────────────────── Login / Cadastro (EF_01)
│
├── /app ───────────────── Shell com BottomNav
│   ├── [aba Registrar] ── Registrar Treino (EF_02)
│   ├── [aba Gráficos]  ── Gráficos (EF_03)
│   ├── [aba Volume]    ── Volume Load (EF_04)
│   ├── [aba Relatórios]── Relatórios (EF_05)
│   └── [aba Exportar]  ── Exportar/Importar (EF_06)
│
├── /graficos ──────────── Gráficos (EF_03) — rota direta
├── /relatorio ─────────── Relatórios (EF_05) — rota direta
├── /grafico-powerlifter── Gráfico Powerlifter (EF_07)
└── /admin ─────────────── Importação Admin (EF_08) — sem auth
```

---

## Padrões do Sistema

### Armazenamento de dados

| Chave localStorage | Conteúdo |
|---|---|
| `logbook` | Registros detalhados por exercício (novo formato Saizen) |
| `dadosTreino` | Registros legados por exercício e ciclo |
| `planoTreino` | Plano de treino importado via planilha |
| `dadosTreino_backup` | Backup automático gerado antes de importações |
| `planoTreino_backup` | Backup do plano antes de importações |

### Formato de Data

Todas as datas são armazenadas e exibidas no formato `DD/MM/AAAA` (pt-BR).

### Método de Treino

O sistema implementa o modelo de séries **v6** (2 Top Sets + Back-off):
- **Top Set 1:** primeira série pesada, na faixa de reps do exercício. É a série de referência para 1RM, PR e teto.
- **Top Set 2:** segunda série pesada, **no mesmo peso do Top Set 1**, na mesma faixa de reps.
- **Back-off:** série de volume, opcional — apenas para exercícios configurados com `seriesValidas = 3`. Tira ~10% da carga dos Top Sets (`backoffPct` = 0,9) e vai até a falha, com as mesmas repetições ou mais. Não conta para o teto.
- **Teto de reps:** quando o atleta atinge o limite superior da faixa no Top Set 1, o sistema sinaliza para subir o peso no próximo ciclo (+1 kg abaixo de 40 kg, +2 kg acima).

### Mensagens Padrão (reutilizadas em múltiplas telas)

| Identificador | Texto |
|---|---|
| `[campos_obrigatorios]` | Existe um ou mais campos obrigatórios que não foram preenchidos. |
| `[sem_registros]` | Sem registros para listar. |
| `[alteracoes_nao_salvas]` | Você tem alterações não salvas. Sair mesmo assim? |
| `[sucesso]` | Operação realizada com sucesso. |
