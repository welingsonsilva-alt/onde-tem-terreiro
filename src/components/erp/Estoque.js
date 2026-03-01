import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Package, Plus, Minus, Trash2 } from 'lucide-react';

const Estoque = ({ idLocal }) => {
    const [itens, setItens] = useState([]);
    const [novoItem, setNovoItem] = useState({ item: '', quantidade: 0 });
    const [loading, setLoading] = useState(false);

    // Prioriza o idLocal vindo do ERPPage ou recupera do localStorage
    const localIdEfetivo = idLocal || localStorage.getItem('idLocal');

    useEffect(() => { 
        if (localIdEfetivo) fetchEstoque(); 
    }, [localIdEfetivo]);

    const fetchEstoque = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('Inventario')
            .select('*')
            .eq('id_terreiro', localIdEfetivo)
            .order('item');
        
        if (!error) setItens(data || []);
        setLoading(false);
    };

    const adicionarItem = async () => {
        if (!novoItem.item) return alert("Digite o nome do item!");
        if (!localIdEfetivo) return alert("Erro de identificação do local.");

        const { error } = await supabase
            .from('Inventario')
            .insert([{ ...novoItem, id_terreiro: localIdEfetivo }]);

        if (!error) { 
            setNovoItem({ item: '', quantidade: 0 }); 
            fetchEstoque(); 
        } else {
            alert("Erro ao cadastrar item: " + error.message);
        }
    };

    const alterarQtd = async (id, novaQtd) => {
        if (novaQtd < 0) return;
        const { error } = await supabase
            .from('Inventario')
            .update({ quantidade: novaQtd })
            .eq('id', id);
        
        if (!error) fetchEstoque();
    };

    const excluirItem = async (id) => {
        if (window.confirm("Deseja remover este item permanentemente?")) {
            const { error } = await supabase.from('Inventario').delete().eq('id', id);
            if (!error) fetchEstoque();
        }
    };

    // Estilos protegidos (Safe Styles)
    const s = {
        title: { fontSize: '1.8rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px' },
        whiteCard: { 
            background: '#fff', 
            padding: '20px', 
            borderRadius: '15px', 
            border: '1px solid #e2e8f0', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            position: 'relative' 
        },
        input: { padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', flex: 1 },
        btnSave: { background: '#10b981', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
        deleteBtn: { position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '5px' }
    };

    return (
        <section>
            <h1 style={s.title}>Controle de Estoque</h1>
            
            <div style={{ ...s.whiteCard, marginBottom: '25px' }}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input 
                        style={s.input} 
                        placeholder="Nome do Item (Ex: Vela Branca)" 
                        value={novoItem.item} 
                        onChange={e => setNovoItem({...novoItem, item: e.target.value})} 
                    />
                    <input 
                        style={{ ...s.input, maxWidth: '100px' }} 
                        type="number" 
                        placeholder="Qtd" 
                        value={novoItem.quantidade} 
                        onChange={e => setNovoItem({...novoItem, quantidade: parseInt(e.target.value) || 0})} 
                    />
                    <button onClick={adicionarItem} style={s.btnSave}>
                        <Plus size={18}/> Cadastrar Item
                    </button>
                </div>
            </div>

            {loading ? (
                <p style={{ color: '#64748b' }}>Consultando inventário...</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
                    {itens.length === 0 ? (
                        <p style={{ color: '#94a3b8', gridColumn: '1/-1' }}>Nenhum item em estoque.</p>
                    ) : (
                        itens.map(i => (
                            <div key={i.id} style={s.whiteCard}>
                                <button onClick={() => excluirItem(i.id)} style={s.deleteBtn} title="Remover">
                                    <Trash2 size={16} />
                                </button>
                                
                                <h4 style={{ margin: '0 0 15px 0', paddingRight: '20px', color: '#334155' }}>{i.item}</h4>
                                
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '10px', borderRadius: '10px' }}>
                                    <button onClick={() => alterarQtd(i.id, i.quantidade - 1)} style={btnQtd}><Minus size={16}/></button>
                                    <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#7d7dbf' }}>{i.quantidade}</span>
                                    <button onClick={() => alterarQtd(i.id, i.quantidade + 1)} style={btnQtd}><Plus size={16}/></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </section>
    );
};

const btnQtd = { 
    background: '#fff', 
    border: '1px solid #e2e8f0', 
    borderRadius: '8px', 
    padding: '6px', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    color: '#64748b',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
};

export default Estoque;