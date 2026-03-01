import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { 
  LogOut, User, Lock, LayoutDashboard, Users, 
  Calendar, Package, DollarSign, Globe, Bell, Settings 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Importação dos subcomponentes
import Dashboard from '../../components/erp/Dashboard';
import CorpoMediunico from '../../components/erp/CorpoMediunico';
import Estoque from '../../components/erp/Estoque';
import Financeiro from '../../components/erp/Financeiro';
import Giras from '../../components/erp/Giras';
import PerfilPublico from '../../components/erp/PerfilPublico';
import ModalAlterarSenha from '../../components/admin/ModalAlterarSenha';

const ERPPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [abaAtiva, setAbaAtiva] = useState('dashboard');
    const [modalSenha, setModalSenha] = useState(false);
    
    const [perfil, setPerfil] = useState({
        id: '',
        nome: '',
        role: '',
        tipo_conta: '',
        id_local: ''
    });

    useEffect(() => {
        carregarDadosIniciais();
    }, []);

    const carregarDadosIniciais = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                navigate('/login');
                return;
            }

            const { data: profileData } = await supabase
                .from('Profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setPerfil(profileData);
            }
        } catch (err) {
            console.error("Erro ao carregar dados:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.clear();
        navigate('/login');
    };

    // Renderizador de Conteúdo Dinâmico
    const renderConteudo = () => {
        const idParaComponentes = perfil.id_local || perfil.id;

        switch (abaAtiva) {
            case 'dashboard': return <Dashboard idLocal={idParaComponentes} />;
            case 'filhos': return <CorpoMediunico idLocal={idParaComponentes} />;
            case 'giras': return <Giras idLocal={idParaComponentes} />;
            case 'estoque': return <Estoque idLocal={idParaComponentes} />;
            case 'financeiro': return <Financeiro idLocal={idParaComponentes} />;
            case 'perfil': return <PerfilPublico idLocal={idParaComponentes} />;
            default: return <Dashboard idLocal={idParaComponentes} />;
        }
    };

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7d7dbf', fontWeight: 'bold' }}>
            Carregando sistema...
        </div>
    );

    return (
        <div style={s.container}>
            {/* BARRA LATERAL (SIDEBAR) */}
            <aside style={s.sidebar}>
                <div style={s.brand}>
                    <div style={s.logoIcon}>U</div>
                    <div>
                        <h2 style={s.brandName}>Umbanda Digital</h2>
                        <span style={s.brandStatus}>{perfil.tipo_conta || 'Membro'}</span>
                    </div>
                </div>

                <nav style={s.nav}>
                    <p style={s.navLabel}>Principal</p>
                    <button onClick={() => setAbaAtiva('dashboard')} style={abaAtiva === 'dashboard' ? s.navBtnActive : s.navBtn}>
                        <LayoutDashboard size={20}/> Dashboard
                    </button>

                    <p style={s.navLabel}>Operacional</p>
                    {/* MENU CORPO MEDIÚNICO E GIRAS - Aberto para todos que não sejam 'loja' explicitamente */}
                    {perfil.tipo_conta !== 'loja' && (
                        <>
                            <button onClick={() => setAbaAtiva('filhos')} style={abaAtiva === 'filhos' ? s.navBtnActive : s.navBtn}>
                                <Users size={20}/> Corpo Mediúnico
                            </button>
                            <button onClick={() => setAbaAtiva('giras')} style={abaAtiva === 'giras' ? s.navBtnActive : s.navBtn}>
                                <Calendar size={20}/> Agenda de Giras
                            </button>
                        </>
                    )}

                    <button onClick={() => setAbaAtiva('estoque')} style={abaAtiva === 'estoque' ? s.navBtnActive : s.navBtn}>
                        <Package size={20}/> Estoque
                    </button>

                    <button onClick={() => setAbaAtiva('financeiro')} style={abaAtiva === 'financeiro' ? s.navBtnActive : s.navBtn}>
                        <DollarSign size={20}/> Financeiro
                    </button>

                    <p style={s.navLabel}>Configurações</p>
                    <button onClick={() => setAbaAtiva('perfil')} style={abaAtiva === 'perfil' ? s.navBtnActive : s.navBtn}>
                        <Globe size={20}/> Perfil Público
                    </button>
                    <button onClick={() => setModalSenha(true)} style={s.navBtn}>
                        <Lock size={20}/> Alterar Senha
                    </button>
                </nav>

                <div style={s.footer}>
                    <div style={s.userArea}>
                        <div style={s.userAvatar}><User size={18}/></div>
                        <span style={s.userName}>{perfil.nome || 'Usuário'}</span>
                    </div>
                    <button onClick={handleLogout} style={s.logoutBtn} title="Sair">
                        <LogOut size={18}/>
                    </button>
                </div>
            </aside>

            {/* ÁREA DE CONTEÚDO */}
            <main style={s.main}>
                <header style={s.topHeader}>
                    <h2 style={{fontSize: '1.1rem', color: '#1e293b'}}>Gestão Administrativa</h2>
                    <div style={{display: 'flex', gap: '10px'}}>
                        <button style={s.iconBtn}><Bell size={18}/></button>
                        <button style={s.iconBtn}><Settings size={18}/></button>
                    </div>
                </header>

                <div style={s.contentWrapper}>
                    {renderConteudo()}
                </div>
            </main>

            <ModalAlterarSenha isOpen={modalSenha} onClose={() => setModalSenha(false)} />
        </div>
    );
};

const s = {
    container: { display: 'flex', height: '100vh', width: '100vw', background: '#f8fafc', overflow: 'hidden' },
    sidebar: { width: '260px', background: '#1e293b', display: 'flex', flexDirection: 'column', padding: '20px' },
    brand: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '35px', padding: '0 10px' },
    logoIcon: { background: '#7d7dbf', color: '#fff', width: '35px', height: '35px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
    brandName: { color: '#fff', margin: 0, fontSize: '1rem', fontWeight: 'bold' },
    brandStatus: { color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: '800' },
    nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' },
    navLabel: { color: '#475569', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 'bold', margin: '20px 0 10px 10px' },
    navBtn: { display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', color: '#94a3b8', padding: '12px 15px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: '0.2s' },
    navBtnActive: { display: 'flex', alignItems: 'center', gap: '12px', background: '#7d7dbf', border: 'none', color: '#fff', padding: '12px 15px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' },
    main: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' },
    topHeader: { height: '60px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', flexShrink: 0 },
    iconBtn: { background: '#f1f5f9', border: 'none', color: '#64748b', padding: '8px', borderRadius: '8px', cursor: 'pointer' },
    contentWrapper: { padding: '30px', flex: 1 },
    footer: { marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    userArea: { display: 'flex', alignItems: 'center', gap: '10px' },
    userAvatar: { width: '32px', height: '32px', background: '#334155', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' },
    userName: { color: '#f1f5f9', fontSize: '0.8rem', fontWeight: 'bold', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    logoutBtn: { background: '#ef444415', border: 'none', color: '#ef4444', padding: '8px', borderRadius: '8px', cursor: 'pointer' }
};

export default ERPPage;