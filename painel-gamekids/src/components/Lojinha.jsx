import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function Lojinha() {
  const familiaId = "id_familia_exemplo";
  const [itens, setItens] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [custo, setCusto] = useState("");
  const [icone, setIcone] = useState("🎮");

  // Escuta os itens da loja em tempo real
  useEffect(() => {
    const lojaRef = collection(db, "usuarios", familiaId, "loja");
    const unsubscribe = onSnapshot(lojaRef, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItens(lista);
    });
    return () => unsubscribe();
  }, []);

  const adicionarItem = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "usuarios", familiaId, "loja"), {
        titulo: titulo,
        custo: Number(custo), // Garante que o custo vá como número para o Android não bugar
        icone: icone
      });
      setTitulo(""); setCusto("");
    } catch (error) {
      alert("Erro ao adicionar item.");
    }
  };

  const removerItem = async (id) => {
    if(window.confirm("Deseja realmente remover este prêmio?")) {
      await deleteDoc(doc(db, "usuarios", familiaId, "loja", id));
    }
  };

  return (
    <div style={{ background: "white", padding: "30px", borderRadius: "10px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
      <h2 style={{ marginTop: 0 }}>Gerenciar Lojinha 🛍️</h2>
      
      {/* Formulário para adicionar prêmios */}
      <form onSubmit={adicionarItem} style={{ display: "flex", gap: "10px", marginBottom: "30px", alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: "14px", marginBottom: "5px" }}>Ícone (Emoji)</label>
          <input type="text" value={icone} onChange={e => setIcone(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} required />
        </div>
        <div style={{ flex: 3 }}>
          <label style={{ display: "block", fontSize: "14px", marginBottom: "5px" }}>Título do Prêmio</label>
          <input type="text" placeholder="Ex: Passeio de Bicicleta" value={titulo} onChange={e => setTitulo(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} required />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: "14px", marginBottom: "5px" }}>Custo (Moedas)</label>
          <input type="number" min="1" value={custo} onChange={e => setCusto(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} required />
        </div>
        <button type="submit" style={{ padding: "10px 20px", height: "42px", background: "#27AE60", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
          + Adicionar
        </button>
      </form>

      {/* Lista de prêmios cadastrados */}
      <div style={{ display: "grid", gap: "15px" }}>
        {itens.map(item => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", border: "1px solid #eee", borderRadius: "8px", background: "#fafafa" }}>
            <div style={{ fontSize: "18px" }}>
              <span style={{ marginRight: "15px", fontSize: "24px" }}>{item.icone}</span>
              <strong>{item.titulo}</strong> <span style={{ color: "#F39C12", marginLeft: "10px" }}>💰 {item.custo} moedas</span>
            </div>
            <button onClick={() => removerItem(item.id)} style={{ background: "#E74C3C", color: "white", border: "none", padding: "8px 12px", borderRadius: "5px", cursor: "pointer" }}>Remover</button>
          </div>
        ))}
      </div>
    </div>
  );
}