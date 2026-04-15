import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      navigate("/painel"); // Vai para a tela de aprovação
    } catch (error) {
      alert("Erro ao fazer login. Verifique e-mail e senha.");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", padding: "20px", fontFamily: "sans-serif" }}>
      <h2>GameKids - Acesso dos Pais</h2>
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <input 
          type="email" 
          placeholder="E-mail" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          style={{ padding: "10px", fontSize: "16px" }}
        />
        <input 
          type="password" 
          placeholder="Senha" 
          value={senha} 
          onChange={(e) => setSenha(e.target.value)} 
          style={{ padding: "10px", fontSize: "16px" }}
        />
        <button type="submit" style={{ padding: "12px", background: "#4A90E2", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", cursor: "pointer" }}>
          Entrar no Painel
        </button>
      </form>
    </div>
  );
}