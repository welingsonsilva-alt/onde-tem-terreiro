import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { 
    Search, Calendar, PlusCircle, Music, Target, Info, X, 
    Menu, LogIn, MapPin, MessageCircle, Navigation2
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
    html: `<div style="background-color: #ff9800; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(0,0,0,0.4);"></div>`,
    className: '', iconSize: [22, 22], iconAnchor: [11, 11]
});

function MapController({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, zoom || 15, { animate: true, duration: 1.5 });
    }, [center, zoom, map]);
    return null;
}

const MapaPage = () => {
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [sidebarAberta, setSidebarAberta] = useState(!isMobile);
    const [abaDetalhesAberta, setAbaDetalhesAberta] = useState(false);
    
    const [searchPoint, setSearchPoint] = useState([-27.5953, -48.5480]);
    const [mapZoom, setMapZoom] = useState(13);
    const [raio, setRaio] = useState(50);
    const [locais, setLocais] = useState([]);
    const [termo, setTermo] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [filtroDoutrina, setFiltroDoutrina] = useState('Todos');
    const [distanciasReais, setDistanciasReais] = useState({});
    
    const [localSelecionado, setLocalSelecionado] = useState(null);
    const [modalIndicarAberto, setModalIndicarAberto] = useState(false);
    const [modalGirasGeralAberto, setModalGirasGeralAberto] = useState(false);

    const doutrinasBusca = ["Todos", "Umbanda", "Candomblé", "Jurema", "Umbanda Sagrada", "Almas e Angola"];

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (!mobile) setSidebarAberta(true);
        };
        window.addEventListener('resize', handleResize);
        
        const fetchDados = async () => {
            const [resT, resL] = await Promise.all([
                supabase.from('Terreiros').select('*'),
                supabase.from('Lojas').select('*')
            ]);
            const t = (resT.data || []).map(d => ({ ...d, tipo_conta: 'terreiro', lat: parseFloat(d.latitude), lng: parseFloat(d.longitude) }));
            const l = (resL.data || []).map(d => ({ ...d, tipo_conta: 'loja', lat: parseFloat(d.latitude), lng: parseFloat(d.longitude) }));
            setLocais([...t, ...l].filter(p => !isNaN(p.lat) && !isNaN(p.lng)));
        };
        fetchDados();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (locais.length === 0) return;
            const novasDistancias = {};
            for (const l of locais.slice(0, 50)) {
                try {
                    const resp = await fetch(`https://router.project-osrm.org/route/v1/driving/${searchPoint[1]},${searchPoint[0]};${l.longitude},${l.latitude}?overview=false`);
                    const data = await resp.json();
                    if (data.routes?.[0]) novasDistancias[l.id] = data.routes[0].distance / 1000;
                } catch (e) {}
            }
            setDistanciasReais(novasDistancias);
        }, 1200);
        return () => clearTimeout(timer);
    }, [locais, searchPoint]);

    const filtrados = useMemo(() => {
        return locais.map(l => ({ ...l, km: distanciasReais[l.id] || 0 }))
        .filter(l => {
            const bateTipo = filtroTipo === 'todos' ? true : l.tipo_conta === filtroTipo;
            const bateNome = (l.nome || '').toLowerCase().includes(termo.toLowerCase());
            const bateDoutrina = filtroDoutrina === 'Todos' || l.linha_principal === filtroDoutrina;
            return bateTipo && bateNome && (filtroTipo === 'loja' ? true : bateDoutrina);
        }).sort((a, b) => (a.km === 0 ? 1 : b.km === 0 ? -1 : a.km - b.km));
    }, [locais, termo, distanciasReais, filtroTipo, filtroDoutrina]);

    const selecionarLocal = useCallback((l) => {
        setLocalSelecionado(l);
        setAbaDetalhesAberta(true);
        setSearchPoint([l.lat, l.lng]);
        setMapZoom(16);
        if (isMobile) setSidebarAberta(false);
    }, [isMobile]);

    return (
        <div style={s.container}>
            <header style={s.header}>
                <div style={s.headerLeft}>
                    <button onClick={() => setSidebarAberta(!sidebarAberta)} style={s.menuBtn}>
                        {sidebarAberta ? <X size={24}/> : <Menu size={24}/>}
                    </button>
                    <div style={s.logoWrapper} onClick={() => navigate('/')}>
                        <img src="/logo.png" alt="Logo" style={s.logoImg} onError={(e) => e.target.style.display='none'} />
                        <span style={s.logoText}>Onde Tem Terreiro</span>
                    </div>
                </div>
                <div style={s.headerRight}>
                    <button style={s.btnNavCircle} onClick={() => setModalGirasGeralAberto(true)}><Calendar size={20}/></button>
                    <button style={s.btnNavCircle} onClick={() => navigate('/pontos')}><Music size={20}/></button>
                </div>
            </header>

            <div style={s.main}>
                <aside style={{...s.sidebar, transform: sidebarAberta ? 'translateX(0)' : 'translateX(-100%)', width: isMobile ? '100%' : '350px', position: isMobile ? 'absolute' : 'relative'}}>
                    {isMobile && <div style={s.sidebarHeaderMobile}><h3 style={{margin:0}}>Filtros</h3><button onClick={() => setSidebarAberta(false)} style={s.sheetClose}><X size={20}/></button></div>}
                    
                    <div style={s.tabContainer}>
                        <button onClick={() => setFiltroTipo('todos')} style={filtroTipo === 'todos' ? s.tabOn : s.tabOff}>Todos</button>
                        <button onClick={() => setFiltroTipo('terreiro')} style={filtroTipo === 'terreiro' ? s.tabOn : s.tabOff}>Terreiros</button>
                        <button onClick={() => setFiltroTipo('loja')} style={filtroTipo === 'loja' ? s.tabOn : s.tabOff}>Lojas</button>
                    </div>

                    <div style={s.searchWrapper}>
                        <Search style={s.searchIcon} size={18} />
                        <input style={s.input} placeholder="Buscar por nome..." value={termo} onChange={e => setTermo(e.target.value)} />
                    </div>

                    {filtroTipo !== 'loja' && (
                        <div style={s.doutrinaList}>
                            {doutrinasBusca.map(d => (
                                <button key={d} onClick={() => setFiltroDoutrina(d)} style={filtroDoutrina === d ? s.chipOn : s.chipOff}>{d}</button>
                            ))}
                        </div>
                    )}

                    <div style={s.results}>
                        {filtrados.map(l => (
                            <div key={l.id} style={s.card} onClick={() => selecionarLocal(l)}>
                                <div style={{flex: 1}}>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#1e293b' }}>{l.tipo_conta === 'loja' ? '🛒 ' : '🌿 '}{l.nome}</h4>
                                    <small style={{ color: '#7d7dbf', fontWeight: 'bold' }}>{l.km > 0 ? `${l.km.toFixed(1)} km` : 'Calculando...'}</small>
                                </div>
                                <Info size={18} color="#cbd5e1" />
                            </div>
                        ))}
                    </div>
                </aside>

                <div style={s.mapArea}>
                    <MapContainer center={searchPoint} zoom={mapZoom} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <MapController center={searchPoint} zoom={mapZoom} />
                        {filtrados.map(l => (
                            <Marker key={l.id} position={[l.lat, l.lng]} icon={CriarIconeColorido(l.linha_principal, l.tipo_conta)} eventHandlers={{ click: () => selecionarLocal(l) }} />
                        ))}
                        <Marker position={searchPoint} icon={iconUsuario} />
                    </MapContainer>
                    <button onClick={() => navigator.geolocation.getCurrentPosition(p => setSearchPoint([p.coords.latitude, p.coords.longitude]))} style={s.btnAlvo}><Target size={26} /></button>
                </div>
            </div>

            {abaDetalhesAberta && localSelecionado && (
                <div style={s.sheetOverlay} onClick={() => setAbaDetalhesAberta(false)}>
                    <div style={s.bottomSheet} onClick={e => e.stopPropagation()}>
                        <div style={s.sheetHandle} onClick={() => setAbaDetalhesAberta(false)} />
                        <div style={s.sheetHeader}>
                            <div style={{flex: 1}}>
                                <h2 style={s.sheetTitle}>{localSelecionado.nome}</h2>
                                <span style={s.sheetBadge}>{localSelecionado.tipo_conta === 'loja' ? 'Artigos Religiosos' : (localSelecionado.linha_principal || 'Terreiro')}</span>
                            </div>
                            <button style={s.sheetClose} onClick={() => setAbaDetalhesAberta(false)}><X size={20}/></button>
                        </div>
                        <div style={s.sheetInfoRow}>
                            <MapPin size={18} color="#94a3b8" />
                            <p style={s.sheetText}>{localSelecionado.endereco}, {localSelecionado.numero}</p>
                        </div>
                        <div style={s.sheetActions}>
                            {localSelecionado.whatsapp && <a href={`https://wa.me/55${localSelecionado.whatsapp?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={s.btnWpp}><MessageCircle size={20} /> WhatsApp</a>}
                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${localSelecionado.lat},${localSelecionado.lng}`} target="_blank" rel="noreferrer" style={s.btnRota}><Navigation2 size={20} /> Rota</a>
                        </div>
                    </div>
                </div>
            )}
            <ModalIndicar isOpen={modalIndicarAberto} onClose={() => setModalIndicarAberto(false)} />
            <ModalGirasGeral isOpen={modalGirasGeralAberto} onClose={() => setModalGirasGeralAberto(false)} terreiros={locais} />
            <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        </div>
    );
};

const s = {
    container: { height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', fontFamily: 'Inter, sans-serif' },
    header: { height: '65px', background: '#7d7dbf', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 15px', zIndex: 1100, flexShrink: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
    menuBtn: { background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '5px' },
    logoWrapper: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
    logoImg: { height: '35px', width: '35px', borderRadius: '8px', background: '#fff', padding: '2px' },
    logoText: { fontSize: '1.05rem', fontWeight: '800' },
    headerRight: { display: 'flex', gap: '10px' },
    btnNavCircle: { background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    main: { flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' },
    sidebar: { background: '#fff', height: '100%', padding: '15px', display: 'flex', flexDirection: 'column', zIndex: 1150, transition: 'transform 0.3s ease-in-out' },
    sidebarHeaderMobile: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #eee' },
    tabContainer: { display: 'flex', gap: '5px', marginBottom: '15px', flexShrink: 0 },
    tabOn: { flex: 1, padding: '10px', background: '#7d7dbf', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.85rem' },
    tabOff: { flex: 1, padding: '10px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', fontSize: '0.85rem' },
    searchWrapper: { position: 'relative', marginBottom: '15px', flexShrink: 0 },
    searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' },
    input: { width: '100%', padding: '12px 10px 12px 40px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' },
    doutrinaList: { display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '15px', flexShrink: 0 },
    chipOn: { padding: '6px 14px', background: '#7d7dbf', color: '#fff', border: 'none', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' },
    chipOff: { padding: '6px 14px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '20px', fontSize: '0.7rem' },
    results: { flex: 1, overflowY: 'auto' },
    card: { padding: '15px 10px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
    mapArea: { flex: 1, position: 'relative' },
    btnAlvo: { position: 'absolute', bottom: '25px', right: '20px', zIndex: 1000, width: '50px', height: '50px', borderRadius: '50%', background: '#fff', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.25)', color: '#7d7dbf', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    sheetOverlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', zIndex: 1200, display: 'flex', alignItems: 'flex-end' },
    bottomSheet: { width: '100%', background: '#fff', borderTopLeftRadius: '28px', borderTopRightRadius: '28px', padding: '15px 20px 30px', boxShadow: '0 -10px 30px rgba(0,0,0,0.15)', animation: 'slideUp 0.3s ease-out' },
    sheetHandle: { width: '40px', height: '5px', background: '#e2e8f0', borderRadius: '10px', margin: '0 auto 15px' },
    sheetHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
    sheetTitle: { fontSize: '1.2rem', margin: 0, color: '#1e293b', fontWeight: '800' },
    sheetBadge: { fontSize: '0.75rem', color: '#7d7dbf', fontWeight: 'bold' },
    sheetClose: { background: '#f1f5f9', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer' },
    sheetInfoRow: { display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', background: '#f8fafc', padding: '10px', borderRadius: '12px' },
    sheetText: { fontSize: '0.9rem', color: '#475569', margin: 0 },
    sheetActions: { display: 'flex', gap: '12px' },
    btnWpp: { flex: 1, background: '#25d366', color: '#fff', padding: '14px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold', textDecoration: 'none' },
    btnRota: { flex: 1, background: '#7d7dbf', color: '#fff', padding: '14px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold', textDecoration: 'none' }
};

export default MapaPage;
