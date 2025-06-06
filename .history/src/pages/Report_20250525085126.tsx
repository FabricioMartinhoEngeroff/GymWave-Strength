// Relatório com edição e exclusão de treinos (ícones via react-icons/fa)
import { useEffect, useState } from "react";
import { carregarDados, salvarDados } from "../utils/storage";
import { DadosTreino } from "../types/TrainingData";
import { CICLOS } from "../data/cycles";
import {
  FaSearch,
  FaClipboard,
  FaCalendarAlt,
  FaDumbbell,
  FaSyncAlt,
  FaTag,
  FaStar,
  FaFileAlt,
  FaSave,
  FaTimes,
  FaPencilAlt,
  FaTrashAlt
} from "react-icons/fa";

interface LinhaRelatorio {
  data: string;
  exercicio: string;
  ciclo: string;
  series: {
    serie: number;
    rep: string;
    peso: string;
  }[];
  obs?: string;
}

export default function Report() {
  const [linhas, setLinhas] = useState<LinhaRelatorio[]>([]);
  const [busca, setBusca] = useState("");
  const [editandoIdx, setEditandoIdx] = useState<number | null>(null);
  const [linhaEditada, setLinhaEditada] = useState<Partial<LinhaRelatorio>>({});

  useEffect(() => {
    const bruto: DadosTreino = carregarDados();
    const geradas: LinhaRelatorio[] = [];

    Object.entries(bruto).forEach(([exercicio, ciclos]) => {
      Object.entries(ciclos).forEach(([ciclo, registro]) => {
        const { pesos = [], reps = [], obs = "", data = "" } = registro;
        const cicloId = ciclo.startsWith("Ciclo ") ? `C${ciclo.split(" ")[1]}` : ciclo;
        const cicloNome = CICLOS.find(c => c.id === cicloId)?.titulo || "Ciclo não identificado";
        const series = reps.map((rep, idx) => ({ serie: idx+1, rep: rep||"-", peso: pesos[idx]||"-" }));
        geradas.push({ data, exercicio, ciclo: cicloNome, series, obs });
      });
    });

    setLinhas(geradas);
  }, []);

  const salvarEdicao = (idx: number) => {
    const novas = [...linhas];
    novas[idx] = { ...novas[idx], ...linhaEditada } as LinhaRelatorio;
    setLinhas(novas);
    setEditandoIdx(null);

    const dados = carregarDados();
    const ex = novas[idx].exercicio;
    const cid = CICLOS.find(c=>c.titulo===novas[idx].ciclo)?.id;
    if(ex && cid && dados[ex]?.[cid]){
      dados[ex][cid] = {
        ...dados[ex][cid],
        data: novas[idx].data,
        pesos: novas[idx].series.map(s=>s.peso),
        reps: novas[idx].series.map(s=>s.rep),
        obs: novas[idx].obs||""
      };
      salvarDados(dados);
    }
  };

  const excluirLinha = (idx: number) => {
    const novas = [...linhas];
    const lin = novas.splice(idx,1)[0];
    setLinhas(novas);

    const dados = carregarDados();
    const cid = CICLOS.find(c=>c.titulo===lin.ciclo)?.id;
    if(lin.exercicio && cid && dados[lin.exercicio]?.[cid]){
      delete dados[lin.exercicio][cid];
      if(Object.keys(dados[lin.exercicio]).length===0) delete dados[lin.exercicio];
      salvarDados(dados);
    }
  };

  const linhasFiltradas = linhas.filter(l=>
    l.exercicio.toLowerCase().includes(busca.toLowerCase())
  );

  const iniciarEdicao = (l: LinhaRelatorio): LinhaRelatorio => ({
    ...l,
    series: l.series.map(s=>({ ...s }))
  });

  return (
    <div style={{minHeight:"100vh",background:"#f3f4f6",padding:20}}>
      <h1 style={{textAlign:"center",fontSize:24,fontWeight:"bold",marginBottom:24}}>
        <FaClipboard className="inline-block mr-2" size={24}/>Relatório de Treinos
      </h1>
      <div style={{maxWidth:500,margin:"0 auto",position:"relative",marginBottom:24}}>
        <FaSearch size={20} style={{position:"absolute",top:10,left:12,color:"#aaa"}}/>
        <input
          type="text" placeholder="Buscar exercício..."
          value={busca} onChange={e=>setBusca(e.target.value)}
          style={{width:"100%",padding:"10px 14px 10px 36px",borderRadius:9999,border:"1px solid #ccc",background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,0.1)"}}
        />
      </div>
      <div style={{maxWidth:500,margin:"0 auto"}}>
        {linhasFiltradas.map((l,idx)=>(
          <div key={idx} style={{background:"#fff",padding:16,borderRadius:12,boxShadow:"0 2px 6px rgba(0,0,0,0.08)",marginBottom:20,border:"1px solid #e2e8f0"}}>
            {editandoIdx===idx ? (
              <>
                <input value={linhaEditada.data||l.data}
                  onChange={e=>setLinhaEditada(p=>({...p,data:e.target.value}))}
                  style={{width:"100%",marginBottom:8}}/>
                {l.series.map((s,i)=>(
                  <div key={i} style={{display:"flex",gap:6,marginBottom:6}}>
                    <input value={linhaEditada.series?.[i]?.rep||s.rep}
                      onChange={e=>{ const arr=[...(linhaEditada.series||l.series)]; arr[i]={...arr[i],rep:e.target.value}; setLinhaEditada(p=>({...p,series:arr})); }}
                      style={{width:"50%"}}/>
                    <input value={linhaEditada.series?.[i]?.peso||s.peso}
                      onChange={e=>{ const arr=[...(linhaEditada.series||l.series)]; arr[i]={...arr[i],peso:e.target.value}; setLinhaEditada(p=>({...p,series:arr})); }}
                      style={{width:"50%"}}/>
                  </div>
                ))}
                <input value={linhaEditada.obs||l.obs||""}
                  onChange={e=>setLinhaEditada(p=>({...p,obs:e.target.value}))}
                  placeholder="Observações" style={{width:"100%",marginTop:6}}/>
                <button onClick={()=>salvarEdicao(idx)} style={{marginRight:10}}><FaSave className="inline-block mr-1" size={16}/>Salvar</button>
                <button onClick={()=>setEditandoIdx(null)}><FaTimes className="inline-block mr-1" size={16}/>Cancelar</button>
              </>
            ) : (
              <>
                <p><FaCalendarAlt className="inline-block mr-1" size={16}/><strong>Data:</strong> {l.data}</p>
                <p><FaDumbbell className="inline-block mr-1" size={16}/><strong>Exercício:</strong> {l.exercicio}</p>
                <p><FaTag className="inline-block mr-1" size={16}/><strong>Ciclo:</strong> {l.ciclo}</p>
                <p style={{fontSize:13,color:"#888"}}><FaStar className="inline-block mr-1" size={14}/>Série <FaSyncAlt className="inline-block mx-1" size={14}/>Reps · <FaDumbbell className="inline-block mx-1" size={14}/>Peso</p>
                {l.series.map(s=>(
                  <p key={s.serie} style={{background:"#f9fafb",border:"1px solid #e5e7eb",padding:"8px 12px",borderRadius:6,marginBottom:6,fontSize:14,color:"#333"}}>
                    Série {s.serie}: {s.rep} reps x {s.peso} kg
                  </p>
                ))}
                {l.obs && <p style={{fontSize:13,color:"#555",borderTop:"1px solid #eee",marginTop:12,paddingTop:10}}><FaFileAlt className="inline-block mr-1" size={14}/><strong>Observações:</strong> {l.obs}</p>}
                <div style={{display:"flex",justifyContent:"space-between",gap:10,marginTop:10}}>
                  <button onClick={()=>{setEditandoIdx(idx); setLinhaEditada(iniciarEdicao(l));}}><FaPencilAlt className="inline-block mr-1" size={16}/>Editar</button>
                  <button onClick={()=>excluirLinha(idx)} style={{backgroundColor:"#e11d48"}}><FaTrashAlt className="inline-block mr-1" size={16}/>Excluir</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
