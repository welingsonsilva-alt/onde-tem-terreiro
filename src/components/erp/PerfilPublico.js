import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { 
  Save, Camera, Home, MapPin, Instagram, MessageCircle, 
  Loader2, Globe, Search, Map, Phone, Mail, Facebook, Music2 
} from 'lucide-react';

const PerfilPublico = ({ idLocal }) => {
    const [loading, setLoading] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [buscandoCep, setBuscandoCep] = useState(false);
    const [modoCadastro, setModoCadastro] = useState(false);
    const [userId, setUserId] = useState(idLocal);
    
    const [perfil, setPerfil] = useState({
        nome: '', zelador: '', biografia: '', 
        cep: '', endereco: '', numero: '', complemento: '', cidade: '', estado: '',
        telefone: '', whatsapp: '', email_publico: '', 
        instagram: '', facebook: '', tiktok: '',
        linha_principal: 'Umbanda', foto_url: '', acessibilidade: 'false',
        latitude: null, longitude: null
    });

    useEffect(() => {
        const inicializar = async () => {
            let currentId = idLocal;
            if (!currentId) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) { currentId = user.id; setUserId(user.id); }
            }
            if (currentId) carregarDadosTerreiro(currentId);
            else setLoading(false);
        };
        inicializar();
    }, [idLocal]);

    const carregarDadosTerreiro = async (id) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('Terreiros').select('*').eq('id', id).single();
            if (error || !data) setModoCadastro(true);
            else { setPerfil(data); setModoCadastro(false); }
        } catch (err) { setModoCadastro(true); }
        finally { setLoading(false); }
    };

    const handleBuscaCEP = async (val) => {
        const cepLimpo = val.replace(/\D/g, '');
        setPerfil(prev => ({ ...prev, cep: cepLimpo }));

        if (cepLimpo.length === 8) {
            setBuscandoCep(true);
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
                const data = await res.json();

                if (!data.erro) {
                    const query = encodeURIComponent(`${data.logradouro}, ${data.localidade}, ${data.uf}, Brasil`);
                    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
                    const geoData = await geoRes.json();

                    setPerfil(prev => ({
                        ...prev,
                        endereco: `${data.logradouro}, ${data.bairro}`,
                        cidade: data.localidade,
                        estado: data.uf,
                        latitude: geoData[0]?.lat || null,
                        longitude: geoData[0]?.lon || null
                    }));
                }
            } catch (err) { console.error(err); }
            finally { setBuscandoCep(false); }
        }
    };

    const handleSalvar = async () => {
        const finalId = idLocal || userId;
        setSalvando(true);
        try {
            const dadosParaEnviar = { ...perfil, id: finalId };
            const { error } = modoCadastro 
                ? await supabase.from('Terreiros').insert([dadosParaEnviar])
                : await supabase.from('Terreiros').update(perfil).eq('id', finalId);

            if (error) throw error;
            alert("Dados salvos com sucesso!");
            setModoCadastro(false);
        } catch (err) { alert("Erro: " + err.message); }
        finally { setSalvando(false); }
    };

    if (loading) return <div style={{padding: '50px', textAlign: 'center'}}>Carregando...</div>;

    return (
        <section style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '50px' }}>
            <h1 style={{fontSize: '1.8rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px'}}>
                {modoCadastro ? 'Cadastrar Terreiro' : 'Perfil Público'}
            </h1>
            
            <div style={s.whiteCard}>
                <h3 style={s.sectionTitle}><Home size={18}/> Informações Gerais</h3>
                <label style={s.label}>Nome do Terreiro</label>
                <input style={s.input} value={perfil.nome || ''} onChange={e => setPerfil({...perfil, nome: e.target.value})} />

                <h3 style={s.sectionTitle}><MapPin size={18}/> Localização</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <label style={s.label}>CEP</label>
                        <input style={s.input} placeholder="00000000" value={perfil.cep || ''} onChange={e => handleBuscaCEP(e.target.value)} />
                    </div>
                    <div>
                        <label style={s.label}>Logradouro (Rua e Bairro)</label>
                        <input style={s.input} value={perfil.endereco || ''} disabled placeholder="Automático pelo CEP" />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px' }}>
                    <div style={{gridColumn: 'span 1'}}>
                        <label style={s.label}>Número</label>
                        <input style={s.input} value={perfil.numero || ''} onChange={e => setPerfil({...perfil, numero: e.target.value})} />
                    </div>
                    <div style={{gridColumn: 'span 1'}}>
                        <label style={s.label}>Complemento</label>
                        <input style={s.input} value={perfil.complemento || ''} onChange={e => setPerfil({...perfil, complemento: e.target.value})} />
                    </div>
                    <div style={{gridColumn: 'span 1'}}>
                        <label style={s.label}>Cidade</label>
                        <input style={s.input} value={perfil.cidade || ''} disabled />
                    </div>
                    <div style={{gridColumn: 'span 1'}}>
                        <label style={s.label}>UF</label>
                        <input style={s.input} value={perfil.estado || ''} disabled />
                    </div>
                </div>

                <h3 style={s.sectionTitle}><Phone size={18}/> Meios de Comunicação</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <label style={s.label}>Telefone Fixo</label>
                        <input style={s.input} value={perfil.telefone || ''} onChange={e => setPerfil({...perfil, telefone: e.target.value})} />
                    </div>
                    <div>
                        <label style={s.label}><MessageCircle size={14}/> WhatsApp</label>
                        <input style={s.input} value={perfil.whatsapp || ''} onChange={e => setPerfil({...perfil, whatsapp: e.target.value})} />
                    </div>
                </div>
                <label style={s.label}><Mail size={14}/> E-mail Público</label>
                <input style={s.input} value={perfil.email_publico || ''} onChange={e => setPerfil({...perfil, email_publico: e.target.value})} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                    <div>
                        <label style={s.label}><Instagram size={14}/> Instagram</label>
                        <input style={s.input} placeholder="@usuario" value={perfil.instagram || ''} onChange={e => setPerfil({...perfil, instagram: e.target.value})} />
                    </div>
                    <div>
                        <label style={s.label}><Facebook size={14}/> Facebook</label>
                        <input style={s.input} placeholder="fb.com/pagina" value={perfil.facebook || ''} onChange={e => setPerfil({...perfil, facebook: e.target.value})} />
                    </div>
                    <div>
                        <label style={s.label}><Music2 size={14}/> TikTok</label>
                        <input style={s.input} placeholder="@usuario" value={perfil.tiktok || ''} onChange={e => setPerfil({...perfil, tiktok: e.target.value})} />
                    </div>
                </div>

                <button onClick={handleSalvar} style={s.btnSave} disabled={salvando}>
                    {salvando ? <Loader2 className="animate-spin" /> : <><Save size={20}/> Salvar Perfil Público</>}
                </button>
            </div>
        </section>
    );
};

const s = {
    whiteCard: { background: '#fff', padding: '30px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    sectionTitle: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', color: '#475569', marginTop: '30px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' },
    label: { display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' },
    input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', outline: 'none', boxSizing: 'border-box' },
    btnSave: { width: '100%', padding: '15px', borderRadius: '12px', border: 'none', background: '#10b981', color: '#fff', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '20px' }
};

export default PerfilPublico;