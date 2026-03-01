import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { 
    Search, Calendar, PlusCircle, Music, Target, Info, X, 
    MessageCircle, LogIn 
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import ModalIndicar from '../../components/public/ModalIndicar';
import ModalGirasGeral from '../../components/public/ModalGirasGeral';

// --- CONFIGURAÇÃO DE ÍCONES ---
const CriarIconeColorido = (doutrina, tipo) => {
    let cor = tipo === 'loja' ? '#f59e0b' : '#7d7dbf'; 
    const cores = { 
        'Umbanda': '#2196F3', 'Candomblé': '#f44336', 'Jurema': '#4CAF50', 
        'Umbanda Sagrada': '#00BCD4', 'Almas e Angola': '#607D8B' 
    };
    if (tipo === 'terreiro' && doutrina && cores[doutrina]) cor = cores[doutrina];
    return new L.DivIcon({
        html: `<div style="background-color: ${cor}; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;"><div style="transform: rotate(45deg); font-size: 12px;">${tipo === 'loja' ? '🛒' : '🌿'}</div></div>`,
        className: '', iconSize: [32, 32], iconAnchor: [16, 32]
    });
};

const iconUsuario = new L.DivIcon({
    html: `<div style="background-color: #ff9800; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
    className: '', iconSize: [20, 20], iconAnchor: [10, 10]
});

function MapController({ center, setSearchPoint }) {
    const map = useMap();
    useEffect(() => { if (center) map.flyTo(center, 14); }, [center, map]);
    useMapEvents({ click: (e) => setSearchPoint([e.latlng.lat, e.latlng.lng]) });
    return null;
}

const MapaPage = () => {
    const navigate = useNavigate();
    const [searchPoint, setSearchPoint] = useState([-27.5953, -48.5480]);
    const [raio, setRaio] = useState(50);
    const [locais, setLocais] = useState([]);
    const [termo, setTermo] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [filtroDoutrina, setFiltroDoutrina] = useState('Todos');
    const [distanciasReais, setDistanciasReais] = useState({});
    
    const [modalAberto, setModalAberto] = useState(false);
    const [localSelecionado, setLocalSelecionado] = useState(null);
    const [modalIndicarAberto, setModalIndicarAberto] = useState(false);
    const [modalGirasAberto, setModalGirasAberto] = useState(false);

    const doutrinasBusca = ["Todos", "Umbanda", "Candomblé", "Jurema", "Umbanda Sagrada", "Almas e Angola"];

    // 1. BUSCA NAS DUAS TABELAS: "Terreiros" e "Lojas"
    useEffect(() => {
        const fetchDados = async () => {
            const [resTerreiros, resLojas] = await Promise.all([
                supabase.from('Terreiros').select('*'),
                supabase.from('Lojas').select('*')
            ]);

            let unificados = [];

            if (resTerreiros.data) {
                const t = resTerreiros.data.map(d => ({ 
                    ...d, 
                    tipo_conta: 'terreiro', 
                    lat: parseFloat(d.latitude), 
                    lng: parseFloat(d.longitude) 
                }));
                unificados = [...unificados, ...t];
            }

            if (resLojas.data) {
                const l = resLojas.data.map(d => ({ 
                    ...d, 
                    tipo_conta: 'loja', 
                    lat: parseFloat(d.latitude), 
                    lng: parseFloat(d.longitude) 
                }));
                unificados = [...unificados, ...l];
            }

            setLocais(unificados.filter(p => !isNaN(p.lat) && !isNaN(p.lng)));
        };
        fetchDados();
    }, []);

    // 2. CÁLCULO DE DISTÂNCIAS (OSRM)
    useEffect(() => {
        const timer = setTimeout(async () => {
            const novasDistancias = {};
            for (const l of locais) {
                try {
                    const resp = await fetch(`https://router.project-osrm.org/route/v1/driving/${searchPoint[1]},${searchPoint[0]};${l.longitude},${l.latitude}?overview=false`);
                    const data = await resp.json();
                    if (data.routes?.[0]) novasDistancias[l.id] = data.routes[0].distance / 1000;
                } catch (e) {}
            }
            setDistanciasReais(novasDistancias);
        }, 800);
        return () => clearTimeout(timer);
    }, [locais, searchPoint]);

    // 3. FILTRO COM RAIO DE BUSCA
    const filtrados = useMemo(() => {
        return locais.map(l => ({ ...l, km: distanciasReais[l.id] || 0 }))
        .filter(l => {
            const bateTipo = filtroTipo === 'todos' ? true : l.tipo_conta === filtroTipo;
            const bateNome = (l.nome || '').toLowerCase().includes(termo.toLowerCase());
            const bateDoutrina = filtroDoutrina === 'Todos' || l.linha_principal === filtroDoutrina;
            const d = distanciasReais[l.id];
            const dentroRaio = d !== undefined ? d <= raio : true;
            return bateTipo && bateNome && bateDoutrina && dentroRaio;
        })
        .sort((a, b) => a.km - b.km);
    }, [locais, raio, termo, distanciasReais, filtroTipo, filtroDoutrina]);

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <img src="/logo.png" alt="Logo" style={styles.logoImg} onError={(e) => e.target.style.display='none'} />
                    <span style={styles.logoText}>Onde Tem Terreiro!</span>
                </div>
                <div style={styles.headerRight}>
                    <button style={styles.btnNav} onClick={() => setModalGirasAberto(true)}><Calendar size={18}/> Giras</button>
                    <button style={styles.btnNav} onClick={() => navigate('/pontos')}><Music size={18}/> Pontos</button>
                    <button style={styles.btnIndicar} onClick={() => setModalIndicarAberto(true)}><PlusCircle size={18}/> Indicar</button>
                    <button style={styles.btnLogin} onClick={() => navigate('/login')}><LogIn size={18}/> Entrar</button>
                </div>
            </header>

            <div style={styles.main}>
                <aside style={styles.sidebar}>
                    <div style={styles.tabContainer}>
                        <button onClick={() => setFiltroTipo('todos')} style={filtroTipo === 'todos' ? styles.tabOn : styles.tabOff}>Todos</button>
                        <button onClick={() => setFiltroTipo('terreiro')} style={filtroTipo === 'terreiro' ? styles.tabOn : styles.tabOff}>Terreiros</button>
                        <button onClick={() => setFiltroTipo('loja')} style={filtroTipo === 'loja' ? styles.tabOn : styles.tabOff}>Lojas</button>
                    </div>

                    <div style={styles.searchWrapper}>
                        <Search style={styles.searchIcon} size={18} />
                        <input style={styles.input} placeholder={`Buscar no mapa...`} value={termo} onChange={e => setTermo(e.target.value)} />
                    </div>

                    {filtroTipo !== 'loja' && (
                        <div style={styles.doutrinaList}>
                            {doutrinasBusca.map(d => (
                                <button key={d} onClick={() => setFiltroDoutrina(d)} style={filtroDoutrina === d ? styles.chipOn : styles.chipOff}>{d}</button>
                            ))}
                        </div>
                    )}

                    <div style={styles.raioBox}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px' }}>
                            <span>Distância máxima</span>
                            <strong>{raio} km</strong>
                        </div>
                        <input type="range" min="1" max="100" value={raio} onChange={e => setRaio(Number(e.target.value))} style={{ width: '100%', accentColor: '#7d7dbf', cursor: 'pointer' }} />
                    </div>

                    <div style={styles.results}>
                        {filtrados.map(l => (
                            <div key={`${l.tipo_conta}-${l.id}`} style={styles.card} onClick={() => { setLocalSelecionado(l); setModalAberto(true); setSearchPoint([l.lat, l.lng]); }}>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{l.nome}</h4>
                                    <small style={{ color: '#7d7dbf', fontWeight: 'bold' }}>{l.km > 0 ? `${l.km.toFixed(1)} km` : 'Calculando...'}</small>
                                </div>
                                <Info size={18} color="#7d7dbf" />
                            </div>
                        ))}
                    </div>
                </aside>

                <div style={styles.mapArea}>
                    <MapContainer center={searchPoint} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <MapController center={searchPoint} setSearchPoint={setSearchPoint} />
                        {filtrados.map(l => (
                            <Marker key={`${l.tipo_conta}-${l.id}`} position={[l.lat, l.lng]} icon={CriarIconeColorido(l.linha_principal, l.tipo_conta)} eventHandlers={{ click: () => { setLocalSelecionado(l); setModalAberto(true); } }} />
                        ))}
                        <Marker position={searchPoint} icon={iconUsuario} />
                    </MapContainer>
                    <button onClick={() => navigator.geolocation.getCurrentPosition(p => setSearchPoint([p.coords.latitude, p.coords.longitude]))} style={styles.btnAlvo}><Target size={26} /></button>
                </div>
            </div>

            {modalAberto && localSelecionado && (
                <div style={styles.overlay} onClick={() => setModalAberto(false)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setModalAberto(false)} style={styles.closeBtn}><X size={20}/></button>
                        <h2 style={{ marginBottom: '10px' }}>{localSelecionado.nome}</h2>
                        <p style={{ color: '#666', fontSize: '0.9rem' }}>{localSelecionado.endereco}</p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                            <a href={`https://wa.me/55${localSelecionado.whatsapp?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={styles.btnAction}>WhatsApp</a>
                        </div>
                    </div>
                </div>
            )}

            <ModalIndicar isOpen={modalIndicarAberto} onClose={() => setModalIndicarAberto(false)} />
            <ModalGirasGeral isOpen={modalGirasAberto} onClose={() => setModalGirasAberto(false)} terreiros={locais} />
        </div>
    );
};

const styles = {
    container: { height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    header: { height: '70px', background: '#7d7dbf', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 1100, flexShrink: 0 },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
    logoImg: { height: '45px', borderRadius: '8px', background: '#fff', padding: '2px' },
    logoText: { fontSize: '1.2rem', fontWeight: '800' },
    headerRight: { display: 'flex', gap: '8px' },
    btnNav: { background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '10px 15px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' },
    btnIndicar: { background: '#10b981', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' },
    btnLogin: { background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff', padding: '10px 15px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' },
    main: { flex: 1, display: 'flex', overflow: 'hidden' },
    sidebar: { width: '350px', background: '#fff', borderRight: '1px solid #eee', padding: '20px', display: 'flex', flexDirection: 'column', zIndex: 1000 },
    tabContainer: { display: 'flex', gap: '5px', marginBottom: '15px' },
    tabOn: { flex: 1, padding: '10px', background: '#7d7dbf', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold' },
    tabOff: { flex: 1, padding: '10px', background: '#f5f5f5', color: '#999', border: 'none', borderRadius: '10px' },
    searchWrapper: { position: 'relative', marginBottom: '15px' },
    searchIcon: { position: 'absolute', left: '12px', top: '12px', color: '#bbb' },
    input: { width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1px solid #eee', outline: 'none', fontSize: '0.9rem' },
    doutrinaList: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '15px' },
    chipOn: { padding: '6px 12px', background: '#7d7dbf', color: '#fff', border: 'none', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' },
    chipOff: { padding: '6px 12px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '20px', fontSize: '0.75rem' },
    raioBox: { background: '#f8f9ff', padding: '12px', borderRadius: '15px', marginBottom: '15px', border: '1px solid #edf0ff' },
    results: { flex: 1, overflowY: 'auto' },
    card: { padding: '15px', borderBottom: '1px solid #f9f9f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
    mapArea: { flex: 1, position: 'relative' },
    btnAlvo: { position: 'absolute', bottom: '30px', right: '30px', zIndex: 1000, width: '55px', height: '55px', borderRadius: '50%', background: '#fff', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', color: '#7d7dbf', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' },
    modal: { background: '#fff', padding: '30px', borderRadius: '25px', width: '90%', maxWidth: '420px', position: 'relative' },
    closeBtn: { position: 'absolute', top: '20px', right: '20px', border: 'none', background: '#f0f0f0', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' },
    btnAction: { flex: 1, padding: '12px', background: '#25d366', color: '#fff', textAlign: 'center', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', display: 'flex', justifyContent: 'center' }
};

export default MapaPage;
