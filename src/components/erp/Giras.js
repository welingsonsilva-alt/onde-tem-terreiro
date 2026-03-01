import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Calendar, Plus, Trash2, Clock, Image as ImageIcon, Loader2, X } from 'lucide-react';

const Giras = () => {
    const [giras, setGiras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [imagemFile, setImagemFile] = useState(null);
    
    const [novaGira, setNovaGira] = useState({
        data_gira: new Date().toISOString().split('T')[0],
        horario: '19:00',
        tipo_gira: '',
        observacoes: '',
        flyer_url: ''
    });

    useEffect(() => { fetchGiras(); }, []);

    const fetchGiras = async () => {
        setLoading(true);
        const { data } = await supabase.from('Giras').select('*').order('data_gira', { ascending: true });
        setGiras(data || []);
        setLoading(false);
    };

    const handleUploadFlyer = async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('gira-flyers')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('gira-flyers').getPublicUrl(filePath);
        return data.publicUrl;
    };

    const handleAgendar = async () => {
        if (!novaGira.tipo_gira) return alert("Informe o tipo da gira!");
        
        setSalvando(true);
        try {
            let urlFinal = '';
            if (imagemFile) {
                urlFinal = await handleUploadFlyer(imagemFile);
            }

            const { error } = await supabase
                .from('Giras')
                .insert([{ ...novaGira, flyer_url: urlFinal }]);

            if (error) throw error;

            setNovaGira({ data_gira: new Date().toISOString().split('T')[0], horario: '19:00', tipo_gira: '', observacoes: '', flyer_url: '' });
            setImagemFile(null);
            fetchGiras();
        } catch (err) {
            alert("Erro: " + err.message);
        } finally {
            setSalvando(false);
        }
    };

    return (
        <section style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h1 style={s.title}>Agenda de Giras</h1>

            <div style={s.whiteCard}>
                <h3 style={s.subTitle}><Plus size={18}/> Agendar Trabalho</h3>
                
                <div style={s.formGrid}>
                    <div>
                        <label style={s.label}>Data</label>
                        <input type="date" style={s.input} value={novaGira.data_gira} onChange={e => setNovaGira({...novaGira, data_gira: e.target.value})} />
                    </div>
                    <div>
                        <label style={s.label}>Horário de Início</label>
                        <div style={{position: 'relative'}}>
                            <Clock size={16} style={s.inputIcon} />
                            <input type="time" style={{...s.input, paddingLeft: '35px'}} value={novaGira.horario} onChange={e => setNovaGira({...novaGira, horario: e.target.value})} />
                        </div>
                    </div>
                    <div style={{gridColumn: 'span 2'}}>
                        <label style={s.label}>Linha / Trabalho</label>
                        <input placeholder="Ex: Gira de Baianos" style={s.input} value={novaGira.tipo_gira} onChange={e => setNovaGira({...novaGira, tipo_gira: e.target.value})} />
                    </div>
                </div>

                <div style={{marginTop: '15px'}}>
                    <label style={s.label}>Flyer / Arte da Gira (Opcional)</label>
                    <div style={s.uploadBox}>
                        <input 
                            type="file" 
                            accept="image/*" 
                            id="flyer" 
                            style={{display: 'none'}} 
                            onChange={e => setImagemFile(e.target.files[0])}
                        />
                        <label htmlFor="flyer" style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <ImageIcon size={20} color="#7d7dbf" />
                            {imagemFile ? <span>{imagemFile.name}</span> : <span>Carregar flyer do computador...</span>}
                        </label>
                        {imagemFile && <X size={18} onClick={() => setImagemFile(null)} style={{cursor: 'pointer', color: 'red'}}/>}
                    </div>
                </div>

                <button onClick={handleAgendar} style={s.btnPrimary} disabled={salvando}>
                    {salvando ? <Loader2 className="animate-spin" /> : 'Confirmar Agenda'}
                </button>
            </div>

            <div style={{ marginTop: '30px' }}>
                <h3 style={s.subTitle}><Calendar size={18}/> Próximas Datas</h3>
                <div style={s.listGrid}>
                    {giras.map(g => (
                        <div key={g.id} style={s.giraCard}>
                            {g.flyer_url && <img src={g.flyer_url} alt="Flyer" style={s.flyerThumb} />}
                            <div style={{ flex: 1, padding: '15px' }}>
                                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                    <span style={s.dateBadge}>{new Date(g.data_gira + 'T00:00:00').toLocaleDateString('pt-BR')} às {g.horario?.slice(0,5)}</span>
                                    <Trash2 size={16} color="#ef4444" style={{cursor: 'pointer'}} onClick={() => { if(window.confirm("Excluir?")) supabase.from('Giras').delete().eq('id', g.id).then(fetchGiras) }}/>
                                </div>
                                <h4 style={{ margin: '10px 0 5px' }}>{g.tipo_gira}</h4>
                                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>{g.observacoes}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const s = {
    title: { fontSize: '1.8rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px' },
    whiteCard: { background: '#fff', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    label: { display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' },
    input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', boxSizing: 'border-box' },
    inputIcon: { position: 'absolute', top: '13px', left: '12px', color: '#94a3b8' },
    uploadBox: { border: '2px dashed #e2e8f0', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' },
    btnPrimary: { width: '100%', marginTop: '20px', padding: '15px', background: '#7d7dbf', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
    listGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
    giraCard: { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
    flyerThumb: { width: '100%', height: '150px', objectFit: 'cover', borderBottom: '1px solid #eee' },
    dateBadge: { background: '#f0f0ff', color: '#7d7dbf', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }
};

export default Giras;