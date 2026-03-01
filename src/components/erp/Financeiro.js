import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { DollarSign, Trash2, Plus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const Financeiro = ({ idLocal }) => {
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [novaMov, setNovaMov] = useState({ descricao: '', valor: '', tipo: 'entrada' });
    const [loading, setLoading] = useState(false);

    // Prioriza o idLocal vindo do ERPPage ou recupera do localStorage
    const localIdEfetivo = idLocal || localStorage.getItem('idLocal');

    useEffect(() => { 
        if (localIdEfetivo) fetchFinanceiro(); 
    }, [localIdEfetivo]);

    const fetchFinanceiro = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('Financeiro')
            .select('*')
            .eq('id_terreiro', localIdEfetivo)
            .order('data_movimentacao', { ascending: false });
        
        if (!error) setMovimentacoes(data || []);
        setLoading(false);
    };

    const adicionar = async () => {
        if (!novaMov.descricao || !novaMov.valor) return alert("Preencha todos os campos!");
        if (!localIdEfetivo) return alert("Identificação do local não encontrada.");
        
        const { error } = await supabase.from('Financeiro').insert([{ 
            ...novaMov, 
            valor: parseFloat(novaMov.valor),
            id_terreiro: localIdEfetivo,
            data_movimentacao: new Date().toISOString()
        }]);

        if (!error) {
            setNovaMov({ descricao: '', valor: '', tipo: 'entrada' });
            fetchFinanceiro();
        } else {
            alert("Erro ao lançar: " + error.message);
        }
    };

    const excluir = async (id) => {
        if(window.confirm("Excluir este registro financeiro?")) {
            const { error } = await supabase.from('Financeiro').delete().eq('id', id);
            if (!error) fetchFinanceiro();
        }
    };

    const saldo = movimentacoes.reduce((acc, curr) => 
        curr.tipo === 'entrada' ? acc + curr.valor : acc - curr.valor, 0
    );

    // Estilos protegidos (Safe Styles)
    const s = {
        title: { fontSize: '1.8rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px' },
        whiteCard: { 
            background: '#fff', 
            padding: '25px', 
            borderRadius: '20px', 
            border: '1px solid #e2e8f0', 
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' 
        },
        input: { padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem' },
        btnSave: { background: '#10b981', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
        label: { fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '5px', display: 'block' }
    };

    return (
        <section>
            <h1 style={s.title}>Fluxo de Caixa</h1>
            
            {/* Card de Saldo */}
            <div style={{ ...s.whiteCard, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderLeft: '6px solid #7d7dbf' }}>
                <div>
                    <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold', fontSize: '0.9rem' }}>Saldo em Caixa</p>
                    <h2 style={{ margin: '5px 0 0', fontSize: '2rem', color: saldo >= 0 ? '#10b981' : '#ef4444' }}>
                        R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h2>
                </div>
                <DollarSign size={40} color="#7d7dbf" style={{ opacity: 0.2 }} />
            </div>

            {/* Formulário de Lançamento */}
            <div style={{ ...s.whiteCard, marginBottom: '25px' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={20} color="#10b981"/> Novo Lançamento
                </h3>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 2, minWidth: '200px' }}>
                        <label style={s.label}>Descrição</label>
                        <input style={{...s.input, width: '100%', boxSizing: 'border-box'}} placeholder="Ex: Mensalidade, Aluguel, Doação..." value={novaMov.descricao} onChange={e => setNovaMov({...novaMov, descricao: e.target.value})} />
                    </div>
                    <div style={{ flex: 1, minWidth: '120px' }}>
                        <label style={s.label}>Valor R$</label>
                        <input style={{...s.input, width: '100%', boxSizing: 'border-box'}} type="number" placeholder="0.00" value={novaMov.valor} onChange={e => setNovaMov({...novaMov, valor: e.target.value})} />
                    </div>
                    <div style={{ flex: 1, minWidth: '120px' }}>
                        <label style={s.label}>Tipo</label>
                        <select style={{...s.input, width: '100%', boxSizing: 'border-box', background: '#fff'}} value={novaMov.tipo} onChange={e => setNovaMov({...novaMov, tipo: e.target.value})}>
                            <option value="entrada">Entrada (+)</option>
                            <option value="saida">Saída (-)</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button onClick={adicionar} style={s.btnSave}>Lançar</button>
                    </div>
                </div>
            </div>

            {/* Tabela de Histórico */}
            <div style={s.whiteCard}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem' }}>Extrato Recente</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                                <th style={{ padding: '12px', color: '#64748b', fontSize: '0.8rem' }}>DATA</th>
                                <th style={{ padding: '12px', color: '#64748b', fontSize: '0.8rem' }}>DESCRIÇÃO</th>
                                <th style={{ padding: '12px', color: '#64748b', fontSize: '0.8rem' }}>VALOR</th>
                                <th style={{ padding: '12px', color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>AÇÕES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Carregando extrato...</td></tr>
                            ) : movimentacoes.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Nenhuma movimentação este mês.</td></tr>
                            ) : (
                                movimentacoes.map(m => (
                                    <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '15px', fontSize: '0.85rem', color: '#64748b' }}>
                                            {new Date(m.data_movimentacao).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td style={{ padding: '15px', fontWeight: '500' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {m.tipo === 'entrada' ? <ArrowUpCircle size={16} color="#10b981"/> : <ArrowDownCircle size={16} color="#ef4444"/>}
                                                {m.descricao}
                                            </div>
                                        </td>
                                        <td style={{ padding: '15px', color: m.tipo === 'entrada' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                                            {m.tipo === 'entrada' ? '+' : '-'} R$ {m.valor.toFixed(2)}
                                        </td>
                                        <td style={{ padding: '15px', textAlign: 'center' }}>
                                            <button onClick={() => excluir(m.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}>
                                                <Trash2 size={18}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};

export default Financeiro;