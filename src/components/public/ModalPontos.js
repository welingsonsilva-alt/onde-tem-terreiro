import React, { useState, useMemo } from 'react';
import { X, Search, Youtube, BookOpen, ChevronDown, ChevronUp, Music } from 'lucide-react';

const ModalPontos = ({ isOpen, onClose }) => {
    const [pontoExpandido, setPontoExpandido] = useState(null);
    const [busca, setBusca] = useState('');
    const [filtroLinha, setFiltroLinha] = useState('Todos');

    const linhas = ["Todos", "Oxalá", "Oxum", "Iemanjá", "Preto Velho", "Exu", "Pomba Gira", "Erê", "Caboclo", "Ogum", "Xangô"];

    const listaPontos = [
        { 
            id: 1, 
            titulo: "Hino da Umbanda", 
            linha: "Oxalá",
            letra: "Refletiu a luz divina\nCom todo seu esplendor\nVem do reino de Oxalá\nOnde há paz e amor...",
            videoUrl: "https://www.youtube.com/results?search_query=hino+da+umbanda"
        },
        { 
            id: 2, 
            titulo: "Beira-Mar", 
            linha: "Iemanjá",
            letra: "Iemanjá, Oh Iemanjá\nQuem manda na beira do mar é Iemanjá...",
            videoUrl: "https://www.youtube.com/results?search_query=ponto+beira+mar+iemanja"
        },
        { 
            id: 3, 
            titulo: "Ponto de Defumação", 
            linha: "Geral",
            letra: "Nossa Senhora incensou a seu amado filho\nIncensou para o mal sair e o bem entrar...",
            videoUrl: "https://www.youtube.com/results?search_query=ponto+de+defumacao+umbanda"
        }
    ];

    // Lógica de Filtro Combinada (Busca + Linha)
    const pontosFiltrados = useMemo(() => {
        return listaPontos.filter(p => {
            const bateBusca = p.titulo.toLowerCase().includes(busca.toLowerCase());
            const bateLinha = filtroLinha === 'Todos' || p.linha === filtroLinha;
            return bateBusca && bateLinha;
        });
    }, [busca, filtroLinha]);

    if (!isOpen) return null;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <div style={styles.iconBox}><Music color="#7d7dbf" size={20} /></div>
                    <div style={{ flex: 1 }}>
                        <h2 style={styles.title}>Cantigas e Pontos</h2>
                        <p style={styles.subtitle}>{pontosFiltrados.length} pontos encontrados</p>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
                </div>

                {/* BUSCA */}
                <div style={styles.searchBox}>
                    <Search size={16} color="#ccc" style={styles.searchIcon} />
                    <input 
                        style={styles.searchInput} 
                        placeholder="Pesquisar ponto..." 
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                    />
                </div>

                {/* FILTROS POR LINHA (Scroll Horizontal) */}
                <div style={styles.filterScroll}>
                    {linhas.map(linha => (
                        <button 
                            key={linha} 
                            onClick={() => setFiltroLinha(linha)}
                            style={{
                                ...styles.chip,
                                background: filtroLinha === linha ? '#7d7dbf' : '#f5f5f5',
                                color: filtroLinha === linha ? '#fff' : '#666'
                            }}
                        >
                            {linha}
                        </button>
                    ))}
                </div>

                {/* LISTA DE PONTOS */}
                <div style={styles.playlist}>
                    {pontosFiltrados.length > 0 ? (
                        pontosFiltrados.map((ponto) => (
                            <div key={ponto.id} style={styles.itemContainer}>
                                <div 
                                    style={{
                                        ...styles.itemHeader, 
                                        background: pontoExpandido === ponto.id ? '#f9f9ff' : 'white'
                                    }}
                                    onClick={() => setPontoExpandido(pontoExpandido === ponto.id ? null : ponto.id)}
                                >
                                    <div style={styles.pontoMeta}>
                                        <div style={styles.pontoTitulo}>{ponto.titulo}</div>
                                        <div style={styles.pontoLinha}>{ponto.linha}</div>
                                    </div>
                                    {pontoExpandido === ponto.id ? <ChevronUp size={18} color="#7d7dbf"/> : <ChevronDown size={18} color="#ccc"/>}
                                </div>

                                {pontoExpandido === ponto.id && (
                                    <div style={styles.letraContainer}>
                                        <pre style={styles.letraTexto}>{ponto.letra}</pre>
                                        <a href={ponto.videoUrl} target="_blank" rel="noreferrer" style={styles.btnOuvir}>
                                            <Youtube size={16} /> Ouvir no YouTube
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div style={styles.empty}>Nenhum ponto encontrado nesta linha.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' },
    modal: { background: '#fff', padding: '25px', borderRadius: '24px', width: '95%', maxWidth: '450px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' },
    header: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' },
    iconBox: { background: '#f0f0ff', padding: '10px', borderRadius: '12px' },
    title: { margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#333' },
    subtitle: { margin: 0, fontSize: '0.8rem', color: '#999' },
    closeBtn: { background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' },
    
    searchBox: { position: 'relative', marginBottom: '12px' },
    searchIcon: { position: 'absolute', left: '12px', top: '12px' },
    searchInput: { width: '100%', padding: '10px 10px 10px 35px', borderRadius: '10px', border: '1px solid #eee', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' },
    
    filterScroll: { display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '15px', scrollbarWidth: 'none' },
    chip: { padding: '6px 15px', borderRadius: '20px', border: 'none', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', transition: '0.2s' },
    
    playlist: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' },
    itemContainer: { borderRadius: '16px', border: '1px solid #eee', overflow: 'hidden' },
    itemHeader: { padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' },
    pontoMeta: { display: 'flex', flexDirection: 'column' },
    pontoTitulo: { fontSize: '0.85rem', fontWeight: '700', color: '#333' },
    pontoLinha: { fontSize: '0.65rem', color: '#7d7dbf', fontWeight: '800', textTransform: 'uppercase' },
    
    letraContainer: { padding: '15px', background: '#f9f9ff', textAlign: 'center', borderTop: '1px solid #f0f0f0' },
    letraTexto: { whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.85rem', color: '#555', margin: '0 0 15px 0', fontStyle: 'italic', lineHeight: '1.6' },
    btnOuvir: { background: '#ff0000', color: '#fff', padding: '10px 20px', borderRadius: '12px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '8px' },
    empty: { textAlign: 'center', padding: '30px', color: '#ccc', fontSize: '0.9rem' }
};

export default ModalPontos;