import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, query, where, deleteDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function Missoes() {
  const familiaId = "id_familia_exemplo";
  const [criancas, setCriancas] = useState([]);
  const [criancaId, setCriancaId] = useState("");
  const [missoesDaCrianca, setMissoesDaCrianca] = useState([]);

  // Estados do formulário
  const [titulo, setTitulo] = useState("");
  const [valor, setValor] = useState("");
  const [recorrencia, setRecorrencia] = useState("nenhuma");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. Busca as crianças para o Select
    const unsubscribeCriancas = onSnapshot(collection(db, "usuarios", familiaId, "criancas"), (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCriancas(lista);
      if (lista.length > 0 && !criancaId) setCriancaId(lista[0].id);
    });
    return () => unsubscribeCriancas();
  }, []);

  // 2. Busca missões PENDENTES da criança selecionada
  useEffect(() => {
    if (!criancaId) return;
    const q = query(
      collection(db, "usuarios", familiaId, "criancas", criancaId, "atividades"), 
      where("status", "==", "pendente")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMissoesDaCrianca(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [criancaId]);

  const criarMissao = async (e) => {
    e.preventDefault();
    if (!criancaId || !titulo || !valor) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "usuarios", familiaId, "criancas", criancaId, "atividades"), {
        titulo,
        valor: Number(valor),
        recorrencia,
        status: "pendente",
        data_criacao: new Date().toISOString()
      });
      setTitulo(""); setValor(""); setRecorrencia("nenhuma");
      alert("Missão lançada no aplicativo!");
    } catch (e) {
      alert("Erro ao criar missão.");
    } finally {
      setLoading(false);
    }
  };

  const deletarMissao = async (id) => {
    if (window.confirm("Deseja cancelar esta missão pendente?")) {
      await deleteDoc(doc(db, "usuarios", familiaId, "criancas", criancaId, "atividades", id));
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
      
      {/* LADO ESQUERDO: LANÇAR MISSÃO */}
      <div style={{ background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
        <h3 style={{ marginTop: 0, color: "#2c3e50" }}>🎯 Nova Missão</h3>
        <form onSubmit={criarMissao} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "bold", marginBottom: "5px" }}>Para quem?</label>
            <select value={criancaId} onChange={e => setCriancaId(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}>
              {criancas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "bold", marginBottom: "5px" }}>O que deve ser feito?</label>
            <input type="text" placeholder="Ex: Arrumar o quarto" value={titulo} onChange={e => setTitulo(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} required />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "bold", marginBottom: "5px" }}>Moedas 💰</label>
              <input type="number" placeholder="50" value={valor} onChange={e => setValor(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "bold", marginBottom: "5px" }}>Repetição 🔄</label>
              <select value={recorrencia} onChange={e => setRecorrencia(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}>
                <option value="nenhuma">Apenas uma vez</option>
                <option value="diaria">Todos os dias</option>
                <option value="semanal">Toda semana</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ marginTop: "10px", padding: "15px", background: "#F5A623", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
            {loading ? "Processando..." : "Lançar Missão"}
          </button>
        </form>
      </div>

      {/* LADO DIREITO: LISTA DE MISSÕES ATIVAS DA CRIANÇA SELECIONADA */}
      <div style={{ background: "#f8f9fa", padding: "30px", borderRadius: "12px", border: "1px solid #eee" }}>
        <h3 style={{ marginTop: 0 }}>Atividades Atuais</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {missoesDaCrianca.length === 0 ? (
            <p style={{ color: "#999" }}>Nenhuma missão ativa para este perfil.</p>
          ) : (
            missoesDaCrianca.map(m => (
              <div key={m.id} style={{ background: "white", padding: "15px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                <div>
                  <div style={{ fontWeight: "bold" }}>{m.titulo}</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    💰 {m.valor} moedas | {m.recorrencia === "nenhuma" ? "Única" : `🔄 ${m.recorrencia}`}
                  </div>
                </div>
                <button onClick={() => deletarMissao(m.id)} style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: "18px" }}>🗑️</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}