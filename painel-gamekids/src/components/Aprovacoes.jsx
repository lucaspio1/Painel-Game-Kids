import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const STATUS_AGUARDANDO = "aguardando_aprovacao";

export default function Aprovacoes() {
  const [missoesPendentes, setMissoesPendentes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [acaoEmAndamento, setAcaoEmAndamento] = useState("");

  const familiaId = auth.currentUser?.uid;

  const carregarAprovacoes = useCallback(async () => {
    if (!familiaId) {
      setErro("Não foi possível identificar a família logada.");
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);
      setErro("");

      const criancasRef = collection(db, "usuarios", familiaId, "criancas");
      const criancasSnap = await getDocs(criancasRef);

      const pendentes = [];

      for (const criancaDoc of criancasSnap.docs) {
        const crianca = criancaDoc.data();
        const atividadesRef = collection(
          db,
          "usuarios",
          familiaId,
          "criancas",
          criancaDoc.id,
          "atividades",
        );
        const atividadesSnap = await getDocs(atividadesRef);

        atividadesSnap.forEach((atividadeDoc) => {
          const dados = atividadeDoc.data();
          if (dados.status === STATUS_AGUARDANDO) {
            pendentes.push({
              id: atividadeDoc.id,
              criancaId: criancaDoc.id,
              nomeCrianca: crianca?.nome || "Criança",
              ...dados,
            });
          }
        });
      }

      setMissoesPendentes(pendentes);
    } catch (error) {
      console.error("Erro ao carregar aprovações:", error);
      setErro("Não foi possível carregar as aprovações. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }, [familiaId]);

  useEffect(() => {
    carregarAprovacoes();
  }, [carregarAprovacoes]);

  const aprovarMissao = async (missao) => {
    if (!familiaId) return;

    try {
      setAcaoEmAndamento(`aprovar-${missao.id}`);

      await runTransaction(db, async (transaction) => {
        const missaoRef = doc(
          db,
          "usuarios",
          familiaId,
          "criancas",
          missao.criancaId,
          "atividades",
          missao.id,
        );

        const criancaRef = doc(db, "usuarios", familiaId, "criancas", missao.criancaId);

        transaction.update(missaoRef, {
          status: "concluido",
          aprovado_em: serverTimestamp(),
        });

        transaction.update(criancaRef, {
          saldo_atual: increment(missao.valor || 0),
        });
      });

      if (missao.recorrencia && missao.recorrencia !== "nenhuma") {
        const atividadesRef = collection(
          db,
          "usuarios",
          familiaId,
          "criancas",
          missao.criancaId,
          "atividades",
        );

        await addDoc(atividadesRef, {
          titulo: missao.titulo,
          valor: missao.valor,
          status: "pendente",
          recorrencia: missao.recorrencia,
          data_criacao: serverTimestamp(),
        });
      }

      await carregarAprovacoes();
    } catch (error) {
      console.error("Erro ao aprovar missão:", error);
      setErro("Não foi possível aprovar a missão. Tente novamente.");
    } finally {
      setAcaoEmAndamento("");
    }
  };

  const rejeitarMissao = async (missao) => {
    if (!familiaId) return;

    try {
      setAcaoEmAndamento(`rejeitar-${missao.id}`);

      const missaoRef = doc(
        db,
        "usuarios",
        familiaId,
        "criancas",
        missao.criancaId,
        "atividades",
        missao.id,
      );

      await updateDoc(missaoRef, {
        status: "pendente",
        rejeitado_em: serverTimestamp(),
      });

      await carregarAprovacoes();
    } catch (error) {
      console.error("Erro ao rejeitar missão:", error);
      setErro("Não foi possível rejeitar a missão. Tente novamente.");
    } finally {
      setAcaoEmAndamento("");
    }
  };

  const totalMoedasPendentes = useMemo(
    () => missoesPendentes.reduce((total, missao) => total + Number(missao.valor || 0), 0),
    [missoesPendentes],
  );

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Aprovações Pendentes 📸</h2>
      <p style={{ marginTop: "8px", color: "#4f5d75" }}>
        {missoesPendentes.length} tarefas aguardando aprovação • Potencial de {" "}
        <strong style={{ color: "#e67e22" }}>{totalMoedasPendentes} moedas</strong>
      </p>

      {erro && (
        <div
          style={{
            margin: "16px 0",
            background: "#fdecea",
            color: "#a12622",
            border: "1px solid #f7c7c3",
            borderRadius: "8px",
            padding: "12px 14px",
          }}
        >
          {erro}
        </div>
      )}

      {carregando ? (
        <p style={{ color: "#7f8c8d" }}>Carregando aprovações...</p>
      ) : missoesPendentes.length === 0 ? (
        <p style={{ color: "#7f8c8d" }}>
          Tudo certo por aqui! Nenhuma tarefa aguardando aprovação no momento.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "20px", marginTop: "20px" }}>
          {missoesPendentes.map((missao) => {
            const aprovando = acaoEmAndamento === `aprovar-${missao.id}`;
            const rejeitando = acaoEmAndamento === `rejeitar-${missao.id}`;
            const desabilitado = aprovando || rejeitando;

            return (
              <div
                key={missao.id}
                style={{
                  border: "1px solid #e0e0e0",
                  padding: "20px",
                  borderRadius: "12px",
                  background: "white",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                }}
              >
                <h3 style={{ margin: "0 0 10px 0", color: "#2c3e50" }}>
                  {missao.titulo} ({missao.nomeCrianca})
                </h3>

                <p style={{ margin: "0 0 15px 0", color: "#e67e22", fontWeight: "bold" }}>
                  Recompensa: 💰 {missao.valor || 0} moedas
                </p>

                {missao.foto_prova_url ? (
                  <img
                    src={missao.foto_prova_url}
                    alt={`Foto de comprovação da missão ${missao.titulo}`}
                    style={{
                      width: "100%",
                      maxHeight: "320px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      border: "1px solid #eee",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      border: "1px dashed #c7ced6",
                      borderRadius: "8px",
                      padding: "18px",
                      color: "#7f8c8d",
                    }}
                  >
                    Nenhuma foto enviada para esta tarefa.
                  </div>
                )}

                <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                  <button
                    onClick={() => aprovarMissao(missao)}
                    disabled={desabilitado}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: "#27ae60",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "15px",
                      cursor: desabilitado ? "not-allowed" : "pointer",
                      fontWeight: "bold",
                      opacity: desabilitado ? 0.65 : 1,
                    }}
                  >
                    {aprovando ? "Aprovando..." : "✅ Aprovar"}
                  </button>

                  <button
                    onClick={() => rejeitarMissao(missao)}
                    disabled={desabilitado}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: "#f1f3f5",
                      color: "#34495e",
                      border: "1px solid #d6dce2",
                      borderRadius: "8px",
                      fontSize: "15px",
                      cursor: desabilitado ? "not-allowed" : "pointer",
                      fontWeight: 600,
                      opacity: desabilitado ? 0.65 : 1,
                    }}
                  >
                    {rejeitando ? "Rejeitando..." : "↩️ Rejeitar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
