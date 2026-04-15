import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";


import Aprovacoes from "../components/Aprovacoes";
import Lojinha from "../components/Lojinha";
import Filhos from "../components/Filhos";
import Missoes from "../components/Missoes";


export default function Painel() {
  const [abaAtiva, setAbaAtiva] = useState("aprovacoes");
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "sans-serif", backgroundColor: "#f4f7f6" }}>
      
      {/* MENU LATERAL (SIDEBAR) */}
      <div style={{ width: "250px", backgroundColor: "#2C3E50", color: "white", padding: "20px", display: "flex", flexDirection: "column" }}>
        <h2 style={{ textAlign: "center", marginBottom: "40px", color: "#F5A623" }}>GameKids</h2>
        
        <nav style={{ display: "flex", flexDirection: "column", gap: "10px", flexGrow: 1 }}>
          <BotaoMenu ativa={abaAtiva === "aprovacoes"} onClick={() => setAbaAtiva("aprovacoes")}>📸 Aprovações</BotaoMenu>
          <BotaoMenu ativa={abaAtiva === "missoes"} onClick={() => setAbaAtiva("missoes")}>🎯 Missões</BotaoMenu>
          <BotaoMenu ativa={abaAtiva === "lojinha"} onClick={() => setAbaAtiva("lojinha")}>🛍️ Lojinha</BotaoMenu>
          <BotaoMenu ativa={abaAtiva === "filhos"} onClick={() => setAbaAtiva("filhos")}>👦 Gerenciar Filhos</BotaoMenu>
        </nav>

        <button onClick={handleLogout} style={{ padding: "12px", background: "#E74C3C", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
          🚪 Sair
        </button>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div style={{ flexGrow: 1, padding: "40px", overflowY: "auto" }}>
        {abaAtiva === "aprovacoes" && <Aprovacoes />}
        {abaAtiva === "lojinha" && <Lojinha />}
        {abaAtiva === "missoes" && <Missoes />}
        {abaAtiva === "filhos" && <Filhos />}
      </div>
    </div>
  );
}

// Componente visual para os botões do menu
function BotaoMenu({ children, ativa, onClick }) {
  return (
    <button 
      onClick={onClick}
      style={{
        padding: "12px 15px", textAlign: "left", fontSize: "16px", cursor: "pointer",
        background: ativa ? "#34495E" : "transparent", color: "white",
        border: "none", borderRadius: "8px", transition: "0.2s", fontWeight: ativa ? "bold" : "normal"
      }}
    >
      {children}
    </button>
  );
}