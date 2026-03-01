import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { 
    UserPlus, Trash2, Edit3, Save, X, PlusCircle, 
    MinusCircle, FileText, Camera, Loader2, User 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const CorpoMediunico = ({ idLocal }) => {
    const [filhos, setFilhos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [subindoFoto, setSubindoFoto] = useState(false);
    const [abaModal, setAbaModal] = useState('espiritual');
    
    const [novoFilho, setNovoFilho] = useState({ nome: '', cargo: 'Médium', status: 'Ativo' });
    const [modalAberto, setModalAberto] = useState(false);
    const [filhoEdicao, setFilhoEdicao] = useState(null);

    useEffect(() => { if (idLocal) fetchFilhos(); }, [idLocal]);

    const fetchFilhos = async () => {
        setLoading(true);
        const { data } = await supabase.from('Filhos').select('*').eq('id_terreiro', idLocal).order('nome');
        setFilhos(data || []);
        setLoading(false);
    };

    // Lógica de Upload da Foto do Médium
    const handleFotoUpload = async (e) => {
        try {
            setSubindoFoto(true);
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${filhoEdicao.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('filhos-fotos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('filhos-fotos').getPublicUrl(filePath);
            setFilhoEdicao({ ...filhoEdicao, foto_url: data.publicUrl });
        } catch (err) {
            alert("Erro ao subir foto: " + err.message);
        } finally {
            setSubindoFoto(false);
        }
    };

    const salvarFicha = async () => {
        const { error } = await supabase.from('Filhos').update(filhoEdicao).eq('id', filhoEdicao.id);
        if (!error) { alert("Ficha atualizada!"); setModalAberto(false); fetchFilhos(); }
    };

    const gerarPDF = async (f) => {
        const doc = new jsPDF();
        
        // Cabeçalho (Papel Timbrado)
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text("FICHA CADASTRAL DO MÉDIUM", 105, 25, { align: "center" });

        // Foto no PDF (se houver)
        if (f.foto_url) {
            try {
                doc.addImage(f.foto_url, 'JPEG', 160, 45, 35, 45);
            } catch (e) { console.log("Erro ao carregar foto no PDF"); }
        }

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text(`Nome: ${f.nome}`, 20, 55);
        doc.text(`Cargo: ${f.cargo}`, 20, 62);
        doc.text(`Orixá Frente: ${f.orixa_frente || '---'}`, 20, 69);
        doc.text(`Orixá Adjuntó: ${f.orixa_adjunto || '---'}`, 20, 76);

        if (f.entidades && f.entidades.length > 0) {
            doc.autoTable({
                startY: 100,
                head: [['Entidade', 'Tipo']],
                body: f.entidades.map(e => [e.nome, e.tipo]),
                theme: 'grid'
            });
        }

        doc.save(`Ficha_${f.nome}.pdf`);
    };

    return (
        <section>
            <h1 style={s.title}>Corpo Mediúnico</h1>

            <div style={s.whiteCard}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={s.tableHead}>
                            <th style={s.th}>Foto</th>
                            <th style={s.th}>Nome</th>
                            <th style={s.th}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filhos.map(f => (
                            <tr key={f.id} style={s.tr}>
                                <td style={{ padding: '10px' }}>
                                    {f.foto_url ? 
                                        <img src={f.foto_url} style={s.avatarMin} alt="Avatar" /> : 
                                        <div style={s.avatarPlaceholder}><User size={16}/></div>
                                    }
                                </td>
                                <td style={{ fontWeight: 'bold' }}>{f.nome}</td>
                                <td style={{ display: 'flex', gap: '8px', padding: '15px' }}>
                                    <button onClick={() => abrirEdicao(f)} style={s.btnEdit}><Edit3 size={14}/> Ficha</button>
                                    <button onClick={() => gerarPDF(f)} style={s.btnPdf}><FileText size={14}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {modalAberto && (
                <div style={s.modalOverlay}>
                    <div style={s.modalContent}>
                        <div style={s.modalHeader}>
                            <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                                <div style={s.avatarBig}>
                                    {filhoEdicao.foto_url ? 
                                        <img src={filhoEdicao.foto_url} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="Perfil" /> : 
                                        <User size={30} color="#cbd5e1"/>
                                    }
                                    <label style={s.btnCamera}>
                                        <Camera size={14}/>
                                        <input type="file" hidden onChange={handleFotoUpload} accept="image/*" />
                                    </label>
                                </div>
                                <h2>{filhoEdicao.nome}</h2>
                            </div>
                            <button onClick={() => setModalAberto(false)} style={{background:'none', border:'none'}}><X /></button>
                        </div>

                        <div style={s.modalBody}>
                            <div style={s.tabs}>
                                <button onClick={() => setAbaModal('espiritual')} style={abaModal === 'espiritual' ? s.tabActive : s.tab}>Espiritual</button>
                                <button onClick={() => setAbaModal('admin')} style={abaModal === 'admin' ? s.tabActive : s.tab}>Administrativo</button>
                            </div>

                            {abaModal === 'espiritual' ? (
                                <div style={s.grid}>
                                    <div><label style={s.label}>Orixá Frente</label><input style={s.input} value={filhoEdicao.orixa_frente || ''} onChange={e=>setFilhoEdicao({...filhoEdicao, orixa_frente: e.target.value})} /></div>
                                    <div><label style={s.label}>Orixá Adjuntó</label><input style={s.input} value={filhoEdicao.orixa_adjunto || ''} onChange={e=>setFilhoEdicao({...filhoEdicao, orixa_adjunto: e.target.value})} /></div>
                                </div>
                            ) : (
                                <div style={s.grid}>
                                    <div><label style={s.label}>Telefone</label><input style={s.input} value={filhoEdicao.telefone || ''} onChange={e=>setFilhoEdicao({...filhoEdicao, telefone: e.target.value})} /></div>
                                    <div><label style={s.label}>CPF</label><input style={s.input} value={filhoEdicao.cpf || ''} onChange={e=>setFilhoEdicao({...filhoEdicao, cpf: e.target.value})} /></div>
                                </div>
                            )}
                        </div>

                        <div style={s.modalFooter}>
                            <button onClick={salvarFicha} style={s.btnSave}>
                                {subindoFoto ? <Loader2 className="animate-spin"/> : <><Save size={18}/> Salvar Prontuário</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

const s = {
    title: { fontSize: '1.6rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px' },
    whiteCard: { background: '#fff', borderRadius: '15px', border: '1px solid #e2e8f0', overflow: 'hidden' },
    tableHead: { background: '#f8fafc', textAlign: 'left' },
    th: { padding: '15px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' },
    tr: { borderBottom: '1px solid #f1f5f9' },
    avatarMin: { width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' },
    avatarPlaceholder: { width: '35px', height: '35px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' },
    avatarBig: { width: '80px', height: '80px', borderRadius: '20px', background: '#f8fafc', position: 'relative', border: '2px solid #e2e8f0', overflow: 'hidden' },
    btnCamera: { position: 'absolute', bottom: 0, right: 0, background: '#7d7dbf', color: '#fff', padding: '5px', cursor: 'pointer', display: 'flex' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { background: '#fff', width: '90%', maxWidth: '600px', borderRadius: '20px', overflow: 'hidden' },
    modalHeader: { padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    modalBody: { padding: '20px' },
    modalFooter: { padding: '20px', borderTop: '1px solid #eee' },
    tabs: { display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9' },
    tab: { background: 'none', border: 'none', padding: '10px', cursor: 'pointer', color: '#94a3b8' },
    tabActive: { background: 'none', border: 'none', padding: '10px', cursor: 'pointer', color: '#7d7dbf', fontWeight: 'bold', borderBottom: '2px solid #7d7dbf' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    label: { display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' },
    input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' },
    btnSave: { width: '100%', padding: '15px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display:'flex', justifyContent:'center', gap:'10px' },
    btnEdit: { background: '#f1f5f9', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' },
    btnPdf: { background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }
};

export default CorpoMediunico;