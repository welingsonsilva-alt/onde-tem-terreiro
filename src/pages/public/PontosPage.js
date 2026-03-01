import React, { useState, useEffect, useMemo } from 'react';
import { Search, Youtube, Music, ArrowLeft, BookOpen, X, Send, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';

const PontosPage = () => {
    const navigate = useNavigate();
    const [busca, setBusca] = useState('');
    const [filtroLinha, setFiltroLinha] = useState('Todos');
    const [pontoParaVerLetra, setPontoParaVerLetra] = useState(null);
    
    // Estados para Sugestão de Novo Ponto
    const [modalSugerir, setModalSugerir] = useState(false);
    const [sugestao, setSugestao] = useState({ titulo: '', linha: 'Geral', letra: '' });
    
    const [listaPontos, setListaPontos] = useState([]);
    const [loading, setLoading] = useState(true);

    const entidades = [
        "Todos", "Baiano", "Boiadeiro", "Caboclo", "Ciganos", "Erê", "Exu", "Geral", 
        "Iansã", "Iemanjá", "Jurema", "Marinheiro", "Nanã", "Obaluaê", "Ogum", 
        "Oxalá", "Oxóssi", "Oxum", "Pomba Gira", "Preto Velho", "Xangô"
    ];

    // BUSCAR PONTOS DO BANCO
    useEffect(() => {
        const fetchPontos = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('Pontos')
                    .select('*')
                    .order('titulo', { ascending: true });
                
                if (data) setListaPontos(data);
            } catch (err) {
                console.error("Erro ao buscar pontos:", err);
            }
            setLoading(false);
        };
        fetchPontos();
    }, []);

    // FILTRO DINÂMICO
    const filtrados = useMemo(() => {
        return listaPontos.filter(p => {
            const bateTexto = (p.titulo || "").toLowerCase().includes(busca.toLowerCase());
            const bateLinha = filtroLinha === 'Todos' || p.linha === filtroLinha;
            return bateTexto && bateLinha;
        });
    }, [busca, filtroLinha, listaPontos]);

    // FUNÇÃO PARA ENVIAR SUGESTÃO AO MASTER
    const enviarSugestao = async (e) => {
        e.preventDefault();
        const { error } = await supabase.from('Sugestoes').insert([{ 
            nome_local: `Sugestão de Ponto: ${sugestao.titulo}`,
            tipo: 'ponto',
            nome_responsavel: sugestao.linha,
            letra_sugerida: sugestao.letra,
            status: 'Novo'
        }]);

        if (!error) {
            alert("Axé! Sua sugestão foi enviada para revisão do administrador.");
            setModalSugerir(false);
            setSugestao({ titulo: '', linha: 'Geral', letra: '' });
        } else {
            alert("Erro ao enviar sugestão: " + error.message);
        }
    };

    return (
        <div style={styles.container}>
            {/* HEADER */}
            <header style={styles.header}>
                <div style={styles.headerContent}>
                    <button onClick={() => navigate('/')} style={styles.btnBack}>
                        <ArrowLeft size={20} /> <span style={{ marginLeft: 8 }}>Mapa</span>
                    </button>
                    <div style={styles.logoTitle}>
                        <Music size={24} color="#7d7dbf" />
                        <h1 style={styles.mainTitle}>Pontos de Axé</h1>
                    </div>
                    <button onClick={() => setModalSugerir(true)} style={styles.btnSugerir}>
                        <PlusCircle size={18} /> <span>Sugerir</span>
                    </button>
                </div>
            </header>

            <main style={styles.main}>
                {/* BUSCA */}
                <div style={styles.searchBox}>
                    <Search size={20} color="#94a3b8" />
                    <input 
                        style={styles.input} 
                        placeholder="Pesquisar ponto por nome..." 
                        value={busca} 
                        onChange={e => setBusca(e.target.value)} 
                    />
                </div>

                {/* FILTROS DE LINHA */}
                <div style={styles.entidadesGrid}>
                    {entidades.map(ent => (
                        <button 
                            key={ent} 
                            onClick={() => setFiltroLinha(ent)} 
                            style={{
                                ...styles.btnEntidade, 
                                background: filtroLinha === ent ? '#7d7dbf' : '#fff', 
                                color: filtroLinha === ent ? '#fff' : '#64748b', 
                                border: filtroLinha === ent ? '1px solid #7d7dbf' : '1px solid #e2e8f0' 
                            }}
                        >
                            {ent}
                        </button>
                    ))}
                </div>

                {/* LISTA DE RESULTADOS COM SCROLL */}
                <div style={styles.listaScrollArea}>
                    <div style={styles.listaContainer}>
                        {loading ? (
                            <div style={styles.empty}>Carregando acervo de luz...</div>
                        ) : filtrados.length > 0 ? (
                            filtrados.map(p => {
                                const isSpotify = p.video_url?.includes('spotify');
                                return (
                                    <div key={p.id} style={styles.pontoRow}>
                                        <div style={styles.pontoInfo}>
                                            <div style={styles.pontoBadge}>{p.linha}</div>
                                            <span style={styles.pontoNome}>{p.titulo}</span>
                                        </div>
                                        <div style={styles.pontoActions}>
                                            <button onClick={() => setPontoParaVerLetra(p)} style={styles.btnActionLetra}>
                                                <BookOpen size={16} /> Letra
                                            </button>
                                            {p.video_url && (
                                                <a 
                                                    href={p.video_url} 
                                                    target="_blank" 
                                                    rel="noreferrer" 
                                                    style={{...styles.btnActionOuvir, background: isSpotify ? '#1DB954' : '#ff0000'}}
                                                >
                                                    {isSpotify ? <Music size={16} /> : <Youtube size={16} />}
                                                    <span style={{ marginLeft: 6 }}>{isSpotify ? 'Spotify' : 'YouTube'}</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={styles.empty}>Nenhum ponto encontrado nesta linha.</div>
                        )}
                    </div>
                </div>
            </main>

            {/* MODAL PARA VER LETRA */}
            {pontoParaVerLetra && (
                <div style={styles.overlay} onClick={() => setPontoParaVerLetra(null)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setPontoParaVerLetra(null)} style={styles.closeBtn}><X size={20}/></button>
                        <div style={styles.modalHeader}>
                            <span style={styles.modalBadge}>{pontoParaVerLetra.linha}</span>
                            <h2 style={styles.modalTitle}>{pontoParaVerLetra.titulo}</h2>
                        </div>
                        <pre style={styles.preLetra}>{pontoParaVerLetra.letra}</pre>
                    </div>
                </div>
            )}

            {/* MODAL PARA SUGERIR PONTO */}
            {modalSugerir && (
                <div style={styles.overlay} onClick={() => setModalSugerir(false)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setModalSugerir(false)} style={styles.closeBtn}><X size={20}/></button>
                        <h2 style={{textAlign: 'center', marginBottom: '10px'}}>Sugerir Novo Ponto</h2>
                        <form onSubmit={enviarSugestao} style={styles.formSugestao}>
                            <input 
                                placeholder="Título do Ponto" 
                                style={styles.inputModal} 
                                value={sugestao.titulo} 
                                onChange={e => setSugestao({...sugestao, titulo: e.target.value})} 
                                required 
                            />
                            <select 
                                style={styles.inputModal} 
                                value={sugestao.linha} 
                                onChange={e => setSugestao({...sugestao, linha: e.target.value})}
                            >
                                {entidades.filter(e => e !== 'Todos').map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                            <textarea 
                                placeholder="Letra completa aqui..." 
                                style={{...styles.inputModal, height: '150px'}} 
                                value={sugestao.letra} 
                                onChange={e => setSugestao({...sugestao, letra: e.target.value})}
                                required
                            />
                            <button type="submit" style={styles.btnEnviar}>Enviar para Revisão</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- ESTILOS ATUALIZADOS ---
const styles = {
    container: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: 'Inter, sans-serif', overflow: 'hidden' },
    header: { height: '70px', background: '#fff', borderBottom: '1px solid #e2e8f0', zIndex: 100 },
    headerContent: { maxWidth: '1000px', margin: '0 auto', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' },
    btnBack: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: '600' },
    logoTitle: { display: 'flex', alignItems: 'center', gap: '10px' },
    mainTitle: { fontSize: '1.2rem', fontWeight: '800', color: '#1e293b', margin: 0 },
    btnSugerir: { background: '#7d7dbf', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' },
    
    main: { maxWidth: '900px', width: '100%', margin: '0 auto', padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' },
    
    searchBox: { background: '#fff', padding: '12px 20px', borderRadius: '15px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexShrink: 0 },
    input: { border: 'none', outline: 'none', width: '100%', fontSize: '1rem' },
    
    entidadesGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px', justifyContent: 'center', flexShrink: 0 },
    btnEntidade: { padding: '8px 16px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' },
    
    // ÁREA DE SCROLL
    listaScrollArea: { flex: 1, overflowY: 'auto', borderRadius: '20px', border: '1px solid #e2e8f0', background: '#fff' },
    listaContainer: { background: '#fff', overflow: 'hidden' },
    
    pontoRow: { padding: '15px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
    pontoInfo: { display: 'flex', alignItems: 'center', gap: '15px' },
    pontoBadge: { fontSize: '0.6rem', fontWeight: '800', color: '#7d7dbf', background: '#f0f0ff', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase' },
    pontoNome: { fontSize: '1rem', fontWeight: '600', color: '#334155' },
    pontoActions: { display: 'flex', gap: '10px' },
    btnActionLetra: { background: '#f1f5f9', border: 'none', color: '#475569', padding: '8px 15px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' },
    btnActionOuvir: { color: '#fff', padding: '8px 15px', borderRadius: '10px', display: 'flex', alignItems: 'center', textDecoration: 'none', fontWeight: '700', fontSize: '0.85rem' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' },
    modalContent: { background: '#fff', padding: '30px', borderRadius: '25px', width: '90%', maxWidth: '500px', position: 'relative', maxHeight: '85vh', overflowY: 'auto' },
    closeBtn: { position: 'absolute', top: '15px', right: '15px', border: 'none', background: '#f1f5f9', borderRadius: '10px', padding: 8, cursor: 'pointer' },
    modalHeader: { textAlign: 'center', marginBottom: '20px' },
    modalBadge: { fontSize: '0.7rem', fontWeight: '800', color: '#7d7dbf', background: '#f0f0ff', padding: '5px 15px', borderRadius: '20px' },
    modalTitle: { fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', marginTop: '10px' },
    preLetra: { whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '1.1rem', lineHeight: '1.6', color: '#475569', textAlign: 'center' },
    formSugestao: { display: 'flex', flexDirection: 'column', gap: '12px' },
    inputModal: { padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', width: '100%', fontSize: '1rem' },
    btnEnviar: { background: '#10b981', color: '#fff', padding: '15px', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' },
    empty: { padding: '40px', textAlign: 'center', color: '#94a3b8' }
};

export default PontosPage;