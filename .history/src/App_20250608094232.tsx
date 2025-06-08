export default function App() {
  const [dados, setDados] = useState<DadosTreino>(() =>
    carregarDados() || EXERCICIOS.reduce((acc, exercicio) => {
      acc[exercicio] = {};
      return acc;
    }, {} as DadosTreino)
  );

  useEffect(() => {
    salvarDados(dados);
  }, [dados]);

  return (
    <div className="p-4 min-h-screen bg-blue-50">
      <ExerciciosSection dados={dados} setDados={setDados} />
    </div>
  );
}
