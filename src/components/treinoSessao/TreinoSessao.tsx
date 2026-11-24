import { DiasDesdeUltimo } from "./DiasDesdeUltimo";
import { ExercicioCard } from "./ExercicioCard";
import { NavegacaoExercicios } from "./NavegacaoExercicios";
import { RevisaoTreino } from "./RevisaoTreino";
import { Card, Content, CycleChip, DateInput, Label, Screen, SessaoRow, TopBar, TopBarTitle } from "./TreinoSessao.styles";
import { rotuloCurto } from "./domain/sessoes";
import { useSessaoTreino } from "./hooks/useSessaoTreino";

interface TreinoSessaoProps {
  onUnsavedChanges?: (has: boolean) => void;
}

export default function TreinoSessao({ onUnsavedChanges }: TreinoSessaoProps = {}) {
  const treino = useSessaoTreino(onUnsavedChanges);
  const { sessao, resumo, currentEx } = treino;
  const emAndamento = sessao !== null && !resumo;

  return (
    <Screen>
      <TopBar>
        <TopBarTitle>GymWave Strength</TopBarTitle>
        <DateInput
          type="text"
          value={treino.data}
          onChange={(e) => treino.setData(e.target.value)}
          aria-label="Data do treino"
        />
        <DiasDesdeUltimo treino={treino} />
      </TopBar>

      <Content>
        <Card>
          <Label>Treino</Label>
          <SessaoRow>
            {treino.sessoesDisponiveis.map((s) => (
              <CycleChip
                key={s}
                $active={sessao === s}
                onClick={() => treino.alternarSessao(s)}
                type="button"
                title={s}
                aria-label={s}
              >
                {rotuloCurto(s)}
              </CycleChip>
            ))}
          </SessaoRow>
        </Card>

        {resumo && (
          <Card>
            <Label>Resumo do treino</Label>
            <p style={{ fontSize: 13, color: "#111827", margin: "4px 0" }}>
              {resumo.feitos}/{resumo.total} exercícios registrados
            </p>
            {resumo.subirPeso > 0 && (
              <p style={{ fontSize: 12, color: "#16a34a", margin: "4px 0" }}>
                {resumo.subirPeso} exercício(s) no teto de reps dentro do alvo
              </p>
            )}
          </Card>
        )}

        {emAndamento && treino.mostrarRevisao && <RevisaoTreino treino={treino} />}

        {emAndamento && !treino.mostrarRevisao && currentEx && (
          <>
            <NavegacaoExercicios treino={treino} />
            <ExercicioCard key={currentEx.nome} treino={treino} ex={currentEx} />
          </>
        )}

        {!sessao && (
          <Card>
            <p style={{ fontSize: 13, color: "#6b7280", textAlign: "center" }}>
              Selecione um treino para começar
            </p>
          </Card>
        )}
      </Content>
    </Screen>
  );
}
