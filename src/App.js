import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './services/supabaseClient';

// --- INJEÇÃO DE ESTILO GLOBAL PARA REMOVER O SCROLL DO SITE ---
const style = document.createElement("style");
style.innerHTML = `
  html, body, #root {
    margin: 0;
    padding: 0;
    height: 100vh;
    width: 100vw;
    overflow: hidden !important; /* Trava o scroll global */
    font-family: 'Inter', sans-serif;
  }
  * { box-sizing: border-box; }
`;
document.head.appendChild(style);

// --- IMPORTAÇÃO DAS PÁGINAS ---
import MapaPage from './pages/public/MapaPage';
import PontosPage from './pages/public/PontosPage';
import LoginPage from './pages/admin/LoginPage';
import ERPPage from './pages/admin/ERPPage';
import AdminMaster from './pages/admin/AdminMaster';

function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Verifica sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) setLoading(false);
    });

    // 2. Ouve mudanças de login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. Busca a Role (cargo) sempre que a sessão mudar
  useEffect(() => {
    if (session?.user) {
      const fetchRole = async () => {
        const { data, error } = await supabase
          .from('Profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (!error && data) {
          setUserRole(data.role);
        } else {
          setUserRole('public');
        }
        setLoading(false);
      };
      fetchRole();
    } else {
      setUserRole(null);
    }
  }, [session]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        background: '#f8fafc',
        color: '#7d7dbf',
        fontWeight: 'bold'
      }}>
        Iniciando Axé...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* ROTAS PÚBLICAS */}
        <Route path="/" element={<MapaPage />} />
        <Route path="/pontos" element={<PontosPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* ROTA MASTER (Apenas usuários com role 'master') */}
        <Route 
          path="/admin-master" 
          element={
            session && userRole === 'master' 
              ? <AdminMaster /> 
              : <Navigate to="/login" />
          } 
        />

        {/* ROTA ERP (Dono de terreiro ou Master) */}
        <Route 
          path="/erp" 
          element={
            session && (userRole === 'erp' || userRole === 'master') 
              ? <ERPPage /> 
              : <Navigate to="/login" />
          } 
        />

        {/* REDIRECIONAMENTO PADRÃO */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;