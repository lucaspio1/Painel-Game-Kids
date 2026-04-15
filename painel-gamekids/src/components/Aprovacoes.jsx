import { useState, useEffect } from "react";
import { collection, doc, getDoc, getDocs, updateDoc, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function Aprovacoes() {
  const familiaId = "id_familia_exemplo"; 
  const [missoesPendentes, setMissoesPendentes] = useState([]);

  // Busca todas as missões aguardando aprovação
  const carregarAprovacoes = async () => {
    const criancasRef = collection(db, "usuarios", familiaId, "criancas");
    const criancasSnap = await getDocs(criancasRef);
    
    let pendentes = [];
    
    for (const criancaDoc of criancasSnap.docs) {
      const atividadesRef = collection(db, "usuarios", familiaId, "criancas", criancaDoc.id, "atividades");
      const atividadesSnap = await getDocs(atividadesRef);
      
      atividadesSnap.forEach(atividadeDoc => {
        const dados = atividadeDoc.data();
        if (dados.status === "aguardando_aprovacao") {
          pendentes.push({
            id: atividadeDoc.id,
            criancaId: criancaDoc.id,
            nomeCrianca: criancaDoc.data().nome,
            ...dados
          });
        }
      });
    }
    setMissoesPendentes(pendentes);
  };

  useEffect(() => {
    carregarAprovacoes();
  }, []);

  const aprovarMissao = async (missao) => {
    try {
      // 1. Atualiza status para concluído
      const missaoRef = doc(db, "usuarios", familiaId, "criancas", missao.criancaId, "atividades", missao.id);
      await updateDoc(missaoRef, { status: "concluido" });

      // 2. Adiciona as moedas
      const criancaRef = doc(db, "usuarios", familiaId, "criancas", missao.criancaId);
      const criancaSnap = await getDoc(criancaRef);
      const saldoAtual = criancaSnap.data().saldo_atual || 0;
      await updateDoc(criancaRef, { saldo_atual: saldoAtual + missao.valor });

      // 3. Recria a tarefa caso seja hábito (recorrência)
      if (missao.recorrencia && missao.recorrencia !== "nenhuma") {
        const atividadesRef = collection(db, "usuarios", familiaId, "criancas", missao.criancaId, "atividades");
        await addDoc(atividadesRef, {
          titulo: missao.titulo,
          valor: missao.valor,
          status: "pendente",
          recorrencia: missao.recorrencia,
          data_criacao: new Date()
        });
      }

      alert(`Missão de ${missao.nomeCrianca} aprovada! +${missao.valor} moedas.`);
      carregarAprovacoes();
    } catch (error) {
      console.error("Erro ao aprovar:", error);
      alert("Ocorreu um erro ao aprovar a missão.");
    }
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Aprovações Pendentes 📸</h2>
      {missoesPendentes.length === 0 ? (
        <p style={{ color: "#7f8c8d" }}>Tudo tranquilo! Nenhuma missão aguardando aprovação no momento.</p>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {missoesPendentes.map(missao => (
            <div key={missao.id} style={{ border: "1px solid #e0e0e0", padding: "20px", borderRadius: "10px", background: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
              <h3 style={{ margin: "0 0 10px 0", color: "#2c3e50" }}>{missao.titulo} ({missao.nomeCrianca})</h3>
              <p style={{ margin: "0 0 15px 0", color: "#e67e22", fontWeight: "bold" }}>Recompensa: 💰 {missao.valor} moedas</p>
              
              {missao.foto_prova_url && (
                <img 
                  src={missao.foto_prova_url} 
                  alt="Prova da missão" 
                  style={{ width: "100%", maxHeight: "300px", objectFit: "cover", borderRadius: "8px", border: "1px solid #eee" }} 
                />
              )}
              
              <button 
                onClick={() => aprovarMissao(missao)}
                style={{ marginTop: "15px", width: "100%", padding: "12px", background: "#27ae60", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", cursor: "pointer", fontWeight: "bold", transition: "0.2s" }}
              >
                ✅ Aprovar e Enviar Moedas
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}