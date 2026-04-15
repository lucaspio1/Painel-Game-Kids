import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, updateDoc, getDocs, deleteDoc, arrayUnion } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function Filhos() {
  const familiaId = "id_familia_exemplo";
  const [filhos, setFilhos] = useState([]);
  const [itensLoja, setItensLoja] = useState([]);
  const [filhoSelecionado, setFilhoSelecionado] = useState(null);

  // Estados para o formulário de Castigo
  const [motivo, setMotivo] = useState("");
  const [valorMulta, setValorMulta] = useState("");
  const [itemParaBloquear, setItemParaBloquear] = useState("");
  const [dataBloqueio, setDataBloqueio] = useState(""); // <-- Mudou para Data

  useEffect(() => {
    // Escuta Filhos
    const unsubscribeFilhos = onSnapshot(collection(db, "usuarios", familiaId, "criancas"), (snap) => {
      setFilhos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Busca Itens da Loja para o Select de bloqueio
    const carregarLoja = async () => {
      const snap = await getDocs(collection(db, "usuarios", familiaId, "loja"));
      setItensLoja(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    carregarLoja();
    return () => unsubscribeFilhos();
  }, []);

  const aplicarCastigo = async (e) => {
    e.preventDefault();
    if (!filhoSelecionado) return;

    // Validação: Exigir a data se um item foi escolhido
    if (itemParaBloquear && !dataBloqueio) {
      alert("Por favor, selecione até qual data e hora o item ficará bloqueado no calendário.");
      return;
    }

    const criancaRef = doc(db, "usuarios", familiaId, "criancas", filhoSelecionado.id);
    const atualizacoes = {};

    // Lógica 1: Perda de Saldo (Multa)
    if (valorMulta > 0) {
      const novoSaldo = (filhoSelecionado.saldo_atual || 0) - Number(valorMulta);
      atualizacoes.saldo_atual = novoSaldo < 0 ? 0 : novoSaldo;
    }

    // Lógica 2: Bloqueio de Item com Data Específica
    if (itemParaBloquear && dataBloqueio) {
      const bloqueiosAtuais = filhoSelecionado.bloqueios || {};
      bloqueiosAtuais[itemParaBloquear] = new Date(dataBloqueio).toISOString();
      atualizacoes.bloqueios = bloqueiosAtuais;
    }

    // Lógica 3: Salvar Histórico
    atualizacoes.historico_castigos = arrayUnion({
      data: new Date().toISOString(),
      motivo: motivo || "Sem descrição fornecida",
      multa_aplicada: valorMulta ? Number(valorMulta) : 0,
      item_bloqueado: itemParaBloquear || "Nenhum",
      bloqueado_ate: dataBloqueio ? new Date(dataBloqueio).toISOString() : null
    });

    try {
      await updateDoc(criancaRef, atualizacoes);
      alert("Castigo e motivo registrados com sucesso!");
      fecharModal();
    } catch (e) { 
      alert("Erro ao aplicar castigo."); 
    }
  };

  const fecharModal = () => {
    setFilhoSelecionado(null);
    setMotivo("");
    setValorMulta("");
    setItemParaBloquear("");
    setDataBloqueio("");
  };

  const removerFilho = async () => {
    if (!filhoSelecionado) return;
    
    const confirmacao = window.confirm(
      `⚠️ ATENÇÃO EXTREMA: Tem certeza que deseja excluir o perfil de ${filhoSelecionado.nome}? Todo o histórico, castigos e moedas serão perdidos para sempre.`
    );

    if (confirmacao) {
      try {
        await deleteDoc(doc(db, "usuarios", familiaId, "criancas", filhoSelecionado.id));
        alert("Perfil excluído com sucesso.");
        fecharModal(); // Fecha a tela após excluir
      } catch (error) {
        alert("Erro ao excluir perfil.");
      }
    }
  };

  // Pega a data/hora atual para impedir que o calendário aceite datas no passado
  const hoje = new Date();
  hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
  const dataMinima = hoje.toISOString().slice(0, 16);

  return (
    <div style={{ background: "white", padding: "30px", borderRadius: "10px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
      <h2>Gerenciar Filhos 👦👧</h2>
      <p style={{ color: "#7f8c8d", marginBottom: "30px" }}>Clique no perfil para aplicar castigos ou ver detalhes.</p>

      <div style={{ display: "grid", gap: "15px" }}>
        {filhos.map(filho => (
          <div 
            key={filho.id} 
            onClick={() => setFilhoSelecionado(filho)}
            style={{ 
              display: "flex", justifyContent: "space-between", alignItems: "center", 
              padding: "20px", border: "1px solid #eee", borderRadius: "12px", 
              cursor: "pointer", background: "#fafafa", transition: "0.2s"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <div style={{ width: "45px", height: "45px", borderRadius: "50%", background: "#3498DB", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold" }}>
                {filho.nome.charAt(0)}
              </div>
              <span style={{ fontSize: "18px", fontWeight: "bold" }}>{filho.nome}</span>
            </div>
            <span style={{ fontSize: "20px", color: "#E67E22", fontWeight: "bold" }}>💰 {filho.saldo_atual}</span>
          </div>
        ))}
      </div>

      {/* MODAL DE CASTIGO / DETALHES */}
      {filhoSelecionado && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "30px", borderRadius: "15px", width: "450px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ marginTop: 0 }}>Gestão de: {filhoSelecionado.nome}</h3>
            
            <form onSubmit={aplicarCastigo} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Motivo / Descrição */}
              <div style={{ padding: "15px", background: "#F8F9FA", borderRadius: "8px", border: "1px solid #E9ECEF" }}>
                <label style={{ display: "block", fontWeight: "bold", color: "#495057", marginBottom: "8px" }}>📝 Motivo da Ação</label>
                <textarea 
                  placeholder="Por que este castigo está sendo aplicado? (Ex: Não quis jantar)" 
                  value={motivo} 
                  onChange={e => setMotivo(e.target.value)}
                  style={{ width: "95%", padding: "10px", borderRadius: "5px", border: "1px solid #CED4DA", minHeight: "80px", resize: "vertical", fontFamily: "inherit" }}
                  required
                />
              </div>

              {/* Seção Multa */}
              <div style={{ padding: "15px", background: "#FFF5F5", borderRadius: "8px", border: "1px solid #FED7D7" }}>
                <label style={{ display: "block", fontWeight: "bold", color: "#C53030", marginBottom: "8px" }}>⚠️ Multa (Perda de Saldo)</label>
                <input 
                  type="number" placeholder="Quantas moedas retirar?" 
                  value={valorMulta} onChange={e => setValorMulta(e.target.value)}
                  style={{ width: "90%", padding: "10px", borderRadius: "5px", border: "1px solid #feb2b2" }}
                />
              </div>

              {/* Seção Bloqueio de Loja com Calendário */}
              <div style={{ padding: "15px", background: "#F0FFF4", borderRadius: "8px", border: "1px solid #C6F6D5" }}>
                <label style={{ display: "block", fontWeight: "bold", color: "#2F855A", marginBottom: "8px" }}>🚫 Bloquear Item da Loja</label>
                <select 
                  value={itemParaBloquear} onChange={e => {
                    setItemParaBloquear(e.target.value);
                    if(!e.target.value) setDataBloqueio(""); // Limpa a data se desmarcar o item
                  }}
                  style={{ width: "90%", padding: "10px", marginBottom: "10px", borderRadius: "5px", border: "1px solid #9ae6b4" }}
                >
                  <option value="">Nenhum item selecionado</option>
                  {itensLoja.map(i => <option key={i.id} value={i.id}>{i.icone} {i.titulo}</option>)}
                </select>
                
                <label style={{ fontSize: "12px", fontWeight: "bold", color: "#2F855A", display: "block", marginBottom: "5px" }}>Bloqueado até:</label>
                <input 
                  type="datetime-local" 
                  value={dataBloqueio} 
                  onChange={e => setDataBloqueio(e.target.value)}
                  min={dataMinima} // Impede de bloquear no passado
                  disabled={!itemParaBloquear} // Fica cinza se nenhum item foi escolhido em cima
                  style={{ width: "90%", padding: "10px", borderRadius: "5px", border: "1px solid #9ae6b4", background: itemParaBloquear ? "white" : "#e2e8f0" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button" onClick={fecharModal} style={{ flex: 1, padding: "12px", border: "none", background: "#EDF2F7", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Cancelar</button>
                <button type="submit" style={{ flex: 2, padding: "12px", border: "none", background: "#E53E3E", color: "white", fontWeight: "bold", borderRadius: "8px", cursor: "pointer" }}>Aplicar Castigo</button>
              </div>
            </form>
      

            {/* ZONA DE PERIGO: Excluir Perfil */}
            <div style={{ marginTop: "30px", paddingTop: "20px", borderTop: "1px solid #eee", textAlign: "center" }}>
              <button 
                type="button" 
                onClick={removerFilho}
                style={{ color: "#E53E3E", background: "none", border: "none", textDecoration: "underline", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}
              >
                🗑️ Excluir permanentemente o perfil de {filhoSelecionado.nome}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}