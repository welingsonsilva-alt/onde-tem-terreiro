import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { 
  Users, Music, Check, Trash2, ShieldCheck, LogOut, 
  Plus, Search, X, Save, Clock, Edit3, LayoutDashboard, 
  Store, MapPin, Heart, Home, Terminal, Play, Eye, Phone, Filter, UserPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const AdminMaster = () => {
    const navigate = useNavigate();
    
    // CONFIGURAÇÃO DE ACESSO
    const [userRole, setUserRole] = useState('master'); // 'master' vê lixeira, 'erp' não.
    const isMaster = userRole === 'master';

    // ESTADOS
    const [aba, setAba] = useState('dashboard'); 
    const [subAbaSugestao, setSubAbaSugestao] = useState('pontos');
    const [dados, setDados] = useState([]);
    const [stats, setStats] = useState({ terreiros: 0, lojas: 0, pontos: 0, usuarios: 0, mediuns: 0, pendentes: 0, viewsMapa: 0 });
    const [rankingLinhas, setRankingLinhas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState(''); 
    const [filtroLinha, setFiltroLinha] = useState('Todas');
    const [expandido, setExpandido] = useState(null);
    const [logs, setLogs] = useState([]);

    // FORMULÁRIOS
    const [showForm, setShowForm] = useState(false);
    const [showUserForm, setShowUserForm] = useState(false);
    const [showLocalForm, setShowLocalForm] = useState(false); 
    const [editandoId, setEditandoId] = useState(null);
    const [origemEdicao, setOrigemEdicao] = useState('pontos');
    
    const [pontoForm, setPontoForm] = useState({ titulo: '', linha: 'Oxalá', letra: '', video_url: '' });
    const [localForm, setLocalForm] = useState({ nome: '', categoria: 'terreiro', endereco: '', whatsapp: '', nome_responsavel: '' });
    const [userForm, setUserForm] = useState({ nome: '', email: '', role: 'user' });

    const LISTA_LINHAS = ["Oxalá", "Iemanjá", "Xangô", "Ogum", "Oxóssi", "Iansã", "Obaluaê", "Nanã", "Oxum", "Preto Velho", "Caboclo", "Baiano", "Marinheiro", "Ere/Ibejada", "Exu", "Pombagira", "Exu Mirim", "Zé Pilintra/Malandragem", "Cigano", "Boiadeiro"];

    const addLog = (msg, tipo = 'info') => {
        setLogs(prev => [{ id: Date.now(), msg, tipo, hora: new Date().toLocaleTimeString() }, ...prev].slice(0, 15));
    };

    useEffect(() => {
        fetchStats();
        fetchDados();
    }, [aba, subAbaSugestao]);

    const fetchStats = async () => {
        try {
            const { data: locais } = await supabase.from('Locais').select('categoria, views');
            const { data: pontos } = await supabase.from('Pontos').select('linha');
            const { data: profiles } = await supabase.from('Profiles').select('role');
            const { count: pendentes } = await supabase.from('Sugestoes').select('*', { count: 'exact', head: true });

            const totalViews = locais?.reduce((acc, curr) => acc + (curr.views || 0), 0) || 0;
            const contagem = pontos?.reduce((acc, curr) => { 
                const l = curr.linha || 'Geral';
                acc[l] = (acc[l] || 0) + 1; 
                return acc; 
            }, {});

            setRankingLinhas(Object.entries(contagem || {}).map(([name, qtd]) => ({ name, qtd })).sort((a,b)=>b.qtd-a.qtd).slice(0,5));
            setStats({
                terreiros: locais?.filter(l => l.categoria === 'terreiro').length || 0,
                lojas: locais?.filter(l => l.categoria === 'loja').length || 0,
                pontos: pontos?.length || 0,
                usuarios: profiles?.length || 0,
                mediuns: profiles?.filter(p => p.role === 'user' || p.role === 'medium').length || 0,
                pendentes: pendentes || 0,
                viewsMapa: totalViews
            });
        } catch (e) { addLog("Erro ao carregar KPI", "error"); }
    };

    const fetchDados = async () => {
        setLoading(true);
        try {
            let query = null;
            if (aba === 'pontos') query = supabase.from('Pontos').select('*').order('titulo');
            else if (aba === 'sugestoes') query = supabase.from('Sugestoes').select('*').order('created_at', { ascending: false });
            else if (aba === 'usuarios') query = supabase.from('Profiles').select('*').neq('role', 'master').order('nome');

            if (query) {
                const { data, error } = await query;
                if (error) throw error;
                if (aba === 'sugestoes') {
                    const tipoAlvo = subAbaSugestao === 'pontos' ? 'ponto' : 'local';
                    const filtrados = data.filter(item => {
                        const t = (item.tipo || "").toLowerCase().trim();
                        return tipoAlvo === 'ponto' ? t === 'ponto' : (t === 'local' || t === 'terreiro' || t === 'loja');
                    });
                    setDados(filtrados);
                } else {
                    setDados(data || []);
                }
            }
        } catch (err) { addLog("Erro na conexão com banco", "error"); setDados([]); }
        finally { setLoading(false); }
    };

    const handleSalvarPonto = async (e) => {
        e.preventDefault();
        const { error } = (editandoId && origemEdicao === 'pontos')
            ? await supabase.from('Pontos').update(pontoForm).eq('id', editandoId)
            : await supabase.from('Pontos').insert([pontoForm]);
        
        if (!error) {
            if (origemEdicao === 'sugestoes' && editandoId) await supabase.from('Sugestoes').delete().eq('id', editandoId);
            setShowForm(false); setEditandoId(null); fetchDados(); fetchStats();
            addLog("Biblioteca atualizada", "success");
        }
    };

    const handleSalvarUsuario = async (e) => {
        e.preventDefault();
        const { error } = await supabase.from('Profiles').insert([userForm]);
        if (!error) {
            setShowUserForm(false); setUserForm({nome:'', email:'', role:'user'});
            fetchDados(); fetchStats();
            addLog("Novo Usuário ERP adicionado", "success");
        }
    };

    const handleAceitarLocal = async (e) => {
        e.preventDefault();
        const { error } = await supabase.from('Locais').insert([localForm]);
        if (!error) {
            await supabase.from('Sugestoes').delete().eq('id', editandoId);
            setShowLocalForm(false); setEditandoId(null); fetchDados(); fetchStats();
            addLog("Terreiro/Loja aceito", "success");
        }
    };

    const dadosFiltrados = dados.filter(item => {
        const matchesBusca = (item.titulo || item.nome_local || item.nome || "").toLowerCase().includes(busca.toLowerCase());
        const matchesLinha = aba === 'pontos' ? (filtroLinha === 'Todas' || item.linha === filtroLinha) : true;
        return matchesBusca && matchesLinha;
    });

    const getPlayIcon = (url) => {
        if (!url) return null;
        const isSpotify = url.includes('spotify');
        const isYoutube = url.includes('youtube') || url.includes('youtu.be');
        return (
            <a href={url} target="_blank" rel="noreferrer" style={{...styles.playBtn, color: isSpotify ? '#1DB954' : (isYoutube ? '#FF0000' : '#7d7dbf')}}>
                <Play size={14} fill="currentColor" />
            </a>
        );
    };

    return (
        <div style={styles.container}>
            <aside style={styles.sidebar}>
                <div style={styles.logoArea}><ShieldCheck size={28} color="#fff"/> <h2 style={styles.logoText}>Master Admin</h2></div>
                <nav style={styles.nav}>
                    <button onClick={() => setAba('dashboard')} style={aba === 'dashboard' ? styles.navBtnActive : styles.navBtn}><LayoutDashboard size={20}/> Dashboard</button>
                    <button onClick={() => setAba('sugestoes')} style={aba === 'sugestoes' ? styles.navBtnActive : styles.navBtn}><Clock size={20}/> Sugestões {stats.pendentes > 0 && <span style={stats.pendentes > 0 ? styles.badge : {display:'none'}}>{stats.pendentes}</span>}</button>
                    <button onClick={() => setAba('pontos')} style={aba === 'pontos' ? styles.navBtnActive : styles.navBtn}><Music size={20}/> Biblioteca</button>
                    <button onClick={() => setAba('usuarios')} style={aba === 'usuarios' ? styles.navBtnActive : styles.navBtn}><Users size={20}/> Usuários ERP</button>
                    <button onClick={() => setAba('logs')} style={aba === 'logs' ? styles.navBtnActive : styles.navBtn}><Terminal size={20}/> Logs</button>
                </nav>
                <button onClick={() => navigate('/login')} style={styles.btnSair}><LogOut size={20}/> Sair</button>
            </aside>

            <main style={styles.main}>
                <header style={styles.header}>
                    <h1>{aba.toUpperCase()}</h1>
                    {aba === 'pontos' && <button onClick={() => {setPontoForm({titulo:'', linha:'Oxalá', letra:'', video_url:''}); setEditandoId(null); setOrigemEdicao('pontos'); setShowForm(!showForm);}} style={styles.btnAdd}>{showForm ? <X/> : <><Plus size={18}/> NOVO PONTO</>}</button>}
                    {aba === 'usuarios' && <button onClick={() => setShowUserForm(!showUserForm)} style={styles.btnAdd}>{showUserForm ? <X/> : <><UserPlus size={18}/> NOVO USUÁRIO</>}</button>}
                </header>

                {aba === 'dashboard' ? (
                    <div style={styles.dashContent}>
                        <div style={styles.statsGrid}>
                            <div style={styles.statCard}><MapPin size={20} color="#7d7dbf"/> <h3>{stats.terreiros}</h3><p>Terreiros</p></div>
                            <div style={styles.statCard}><Store size={20} color="#10b981"/> <h3>{stats.lojas}</h3><p>Lojas</p></div>
                            <div style={styles.statCard}><Music size={20} color="#f59e0b"/> <h3>{stats.pontos}</h3><p>Pontos</p></div>
                            <div style={styles.statCard}><Heart size={20} color="#ef4444"/> <h3>{stats.mediuns}</h3><p>Filhos de Santo</p></div>
                            <div style={styles.statCard}><Eye size={20} color="#3b82f6"/> <h3>{stats.viewsMapa}</h3><p>Views Mapa</p></div>
                        </div>
                        <div style={styles.chartBox}>
                            <h3>Distribuição do Acervo</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={rankingLinhas} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" hide/><YAxis dataKey="name" type="category" width={100} fontSize={12}/>
                                    <Bar dataKey="qtd" fill="#7d7dbf" radius={[0, 10, 10, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ) : aba === 'logs' ? (
                    <div style={styles.logPage}>
                        <h2>Monitor de Sistema</h2>
                        <div style={styles.logList}>
                            {logs.map(l => <div key={l.id} style={{...styles.logItem, borderLeft: l.tipo==='error'?'4px solid red':'4px solid green'}}><strong>{l.hora}</strong>: {l.msg}</div>)}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* FORM PONTO */}
                        {showForm && (
                            <form onSubmit={handleSalvarPonto} style={styles.formPonto}>
                                <div style={styles.row}>
                                    <div style={{flex:2}}><label style={styles.label}>Título</label><input style={styles.input} value={pontoForm.titulo} onChange={e => setPontoForm({...pontoForm, titulo: e.target.value})} required /></div>
                                    <div style={{flex:1}}><label style={styles.label}>Linha</label><select style={styles.select} value={pontoForm.linha} onChange={e => setPontoForm({...pontoForm, linha: e.target.value})}>{LISTA_LINHAS.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
                                </div>
                                <label style={styles.label}>Link YouTube ou Spotify</label><input style={{...styles.input, width:'100%', marginBottom:'10px'}} value={pontoForm.video_url} onChange={e => setPontoForm({...pontoForm, video_url: e.target.value})} />
                                <label style={styles.label}>Letra</label><textarea style={styles.textarea} rows={5} value={pontoForm.letra} onChange={e => setPontoForm({...pontoForm, letra: e.target.value})} />
                                <button type="submit" style={styles.btnSave}>SALVAR AGORA</button>
                            </form>
                        )}

                        {/* FORM USUÁRIO */}
                        {showUserForm && aba === 'usuarios' && (
                            <form onSubmit={handleSalvarUsuario} style={styles.formPonto}>
                                <div style={styles.row}>
                                    <input placeholder="Nome" style={styles.input} value={userForm.nome} onChange={e => setUserForm({...userForm, nome: e.target.value})} required />
                                    <input placeholder="E-mail" style={styles.input} type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} required />
                                    <button type="submit" style={styles.btnSave}>ADICIONAR</button>
                                </div>
                            </form>
                        )}

                        {/* FORM REVISÃO LOCAL */}
                        {showLocalForm && (
                            <form onSubmit={handleAceitarLocal} style={styles.formPonto}>
                                <div style={styles.gridForm}>
                                    <div style={{gridColumn:'span 2', display:'flex', justifyContent:'space-between'}}><h3 style={{margin:0}}>Dados do Local</h3><button type="button" onClick={()=>setShowLocalForm(false)} style={{background:'none', border:'none'}}><X/></button></div>
                                    <div style={styles.field}><label style={styles.label}>Nome</label><input style={styles.input} value={localForm.nome} onChange={e => setLocalForm({...localForm, nome: e.target.value})} required /></div>
                                    <div style={styles.field}><label style={styles.label}>Responsável</label><input style={styles.input} value={localForm.nome_responsavel} onChange={e => setLocalForm({...localForm, nome_responsavel: e.target.value})} /></div>
                                    <div style={styles.field}><label style={styles.label}>WhatsApp</label><input style={styles.input} value={localForm.whatsapp} onChange={e => setLocalForm({...localForm, whatsapp: e.target.value})} /></div>
                                    <div style={styles.field}><label style={styles.label}>Categoria</label><select style={styles.select} value={localForm.categoria} onChange={e=>setLocalForm({...localForm, categoria: e.target.value})}><option value="terreiro">Terreiro</option><option value="loja">Loja</option></select></div>
                                    <div style={{gridColumn:'span 2'}}><label style={styles.label}>Endereço</label><input style={styles.input} value={localForm.endereco} onChange={e => setLocalForm({...localForm, endereco: e.target.value})} required /></div>
                                </div>
                                <button type="submit" style={{...styles.btnSave, marginTop:'20px'}}>ACEITAR E PUBLICAR</button>
                            </form>
                        )}

                        {/* FILTROS */}
                        <div style={styles.toolbar}>
                            <div style={styles.searchBar}><Search size={20} color="#94a3b8"/><input placeholder="Pesquisar..." style={styles.searchInput} value={busca} onChange={(e) => setBusca(e.target.value)} /></div>
                            {aba === 'pontos' && (
                                <div style={styles.filterGroup}><Filter size={18} color="#7d7dbf" /><select style={styles.selectFilter} value={filtroLinha} onChange={(e) => setFiltroLinha(e.target.value)}><option value="Todas">Todas as Linhas</option>{LISTA_LINHAS.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
                            )}
                        </div>

                        {aba === 'sugestoes' && (
                            <div style={styles.subAbaContainer}>
                                <button onClick={() => setSubAbaSugestao('pontos')} style={subAbaSugestao === 'pontos' ? styles.subBtnActive : styles.subBtn}>Solicitações de Pontos</button>
                                <button onClick={() => setSubAbaSugestao('locais')} style={subAbaSugestao === 'locais' ? styles.subBtnActive : styles.subBtn}>Solicitações de Locais</button>
                            </div>
                        )}

                        <div style={styles.lista}>
                            {dadosFiltrados.map(item => (
                                <div key={item.id} style={styles.cardContainer}>
                                    <div style={styles.itemMain}>
                                        <div onClick={() => setExpandido(expandido === item.id ? null : item.id)} style={{cursor:'pointer', flex:1}}>
                                            <strong>{item.titulo || item.nome_local || item.nome}</strong>
                                            <p style={{margin:0, fontSize:'0.8rem', color:'#64748b'}}>{item.linha || item.endereco || item.email}</p>
                                        </div>
                                        <div style={styles.actions}>
                                            {aba === 'pontos' && getPlayIcon(item.video_url)}
                                            {aba === 'sugestoes' && subAbaSugestao === 'locais' && <button onClick={() => {setEditandoId(item.id); setLocalForm({nome: item.nome_local, endereco: item.endereco || '', categoria:'terreiro', whatsapp: item.telefone || '', nome_responsavel: item.nome_responsavel || ''}); setShowLocalForm(true);}} style={styles.btnEdit}><Eye size={16}/> REVISAR</button>}
                                            {aba === 'sugestoes' && subAbaSugestao === 'pontos' && <button onClick={() => {setEditandoId(item.id); setOrigemEdicao('sugestoes'); setPontoForm({titulo:item.nome_local, linha:'Geral', letra:item.letra_sugerida, video_url:''}); setShowForm(true);}} style={styles.btnEdit}><Edit3 size={16}/> EDITAR</button>}
                                            {aba === 'pontos' && <button onClick={() => {setEditandoId(item.id); setOrigemEdicao('pontos'); setPontoForm(item); setShowForm(true);}} style={styles.btnEdit}><Edit3 size={16}/></button>}
                                            {isMaster && <button onClick={() => {if(window.confirm("Apagar?")) supabase.from(aba === 'pontos' ? 'Pontos' : aba === 'usuarios' ? 'Profiles' : 'Sugestoes').delete().eq('id', item.id).then(() => fetchDados());}} style={styles.btnDelete}><Trash2 size={16}/></button>}
                                        </div>
                                    </div>
                                    {expandido === item.id && (item.letra || item.letra_sugerida) && <div style={styles.letraBox}>{item.letra || item.letra_sugerida}</div>}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

const styles = {
    container: { display: 'flex', height: '100vh', background: '#f8fafc', overflow: 'hidden', fontFamily: 'sans-serif' },
    sidebar: { width: '250px', background: '#1e293b', padding: '20px', display: 'flex', flexDirection: 'column' },
    logoArea: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' },
    logoText: { color: '#fff', fontSize: '1.1rem', fontWeight:'bold', margin: 0 },
    nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' },
    navBtn: { background: 'none', border: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left' },
    navBtnActive: { background: '#7d7dbf', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight:'bold' },
    badge: { background: '#ef4444', color: '#fff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', marginLeft: 'auto' },
    main: { flex: 1, padding: '30px', overflowY: 'auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    btnAdd: { background: '#7d7dbf', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', gap: '8px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '25px' },
    statCard: { background: '#fff', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' },
    chartBox: { background: '#fff', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0' },
    formPonto: { background: '#fff', padding: '25px', borderRadius: '15px', border: '2px solid #7d7dbf', marginBottom: '20px' },
    gridForm: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px' },
    field: { display:'flex', flexDirection:'column', gap:'5px' },
    label: { fontSize:'0.7rem', fontWeight:'bold', color:'#64748b', textTransform:'uppercase' },
    row: { display: 'flex', gap: '15px', marginBottom: '15px' },
    input: { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', width:'100%', outline:'none' },
    select: { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', width:'100%', background:'#fff' },
    textarea: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '10px' },
    btnSave: { background: '#10b981', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', width:'100%', cursor:'pointer' },
    subAbaContainer: { display: 'flex', gap: '5px', background: '#e2e8f0', padding: '5px', borderRadius: '12px', width: 'fit-content', marginBottom: '20px' },
    subBtn: { border: 'none', background: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', color: '#64748b', fontWeight:'bold' },
    subBtnActive: { background: '#fff', color: '#7d7dbf', fontWeight: 'bold', padding: '8px 15px', borderRadius: '8px', border: 'none' },
    toolbar: { display: 'flex', gap: '15px', marginBottom: '20px' },
    searchBar: { flex: 1, background: '#fff', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 15px', borderRadius: '12px', border: '1px solid #e2e8f0' },
    searchInput: { border: 'none', outline: 'none', width: '100%', height: '45px' },
    filterGroup: { display:'flex', alignItems:'center', gap:'10px', background:'#fff', padding:'0 15px', borderRadius:'12px', border:'1px solid #e2e8f0' },
    selectFilter: { border:'none', background:'none', color:'#7d7dbf', fontWeight:'bold', cursor:'pointer' },
    lista: { display: 'flex', flexDirection: 'column', gap: '10px' },
    cardContainer: { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
    itemMain: { padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    letraBox: { padding:'15px', background:'#f8fafc', whiteSpace:'pre-line', borderTop:'1px solid #eee', fontSize:'0.9rem', color:'#334155' },
    actions: { display: 'flex', gap: '8px', alignItems:'center' },
    playBtn: { display:'flex', alignItems:'center', justifyContent:'center', width:'30px', height:'30px', borderRadius:'50%', background:'#f1f5f9' },
    btnEdit: { background: '#f1f5f9', color: '#7d7dbf', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', fontWeight:'bold', fontSize:'0.75rem' },
    btnDelete: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '8px', cursor:'pointer' },
    logPage: { background:'#fff', padding:'20px', borderRadius:'15px' },
    logItem: { padding:'10px', borderBottom:'1px solid #eee', fontSize:'0.85rem' },
    btnSair: { marginTop: 'auto', background: '#334155', color: '#f87171', border: 'none', padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }
};

export default AdminMaster;