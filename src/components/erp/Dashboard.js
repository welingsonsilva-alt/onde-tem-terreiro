import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { 
    Users, Calendar, Package, TrendingUp, 
    AlertTriangle, ArrowUpCircle, ArrowDownCircle 
} from 'lucide-react';

const Dashboard = ({ idLocal }) => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalMembros: 0,
        saldoGeral: 0,
        estoqueBaixo: 0,
        proximasGiras: []
    });

    useEffect(() => {
        if (idLocal) {
            fetchDashboardData();
        }
    }, [idLocal]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Total de Membros
            const { count: membros } = await supabase
                .from('Filhos')
                .select('*', { count: 'exact', head: true })
                .eq('id_terreiro', idLocal);

            // 2. Saldo Financeiro
            const { data: fin } = await supabase
                .from('Financeiro')
                .select('valor, tipo')
                .eq('id_terreiro', idLocal);
            
            const saldo = fin?.reduce((acc, curr) => 
                curr.tipo === 'entrada' ? acc + curr.valor : acc - curr.valor, 0) || 0;

            // 3. Estoque Crítico (itens com quantidade < 5)
            const { count: baixo } = await supabase
                .from('Inventario')
                .select('*', { count: 'exact', head: true })
                .eq('id_terreiro', idLocal)
                .lt('quantidade', 5);

            // 4. Últimas 3 Giras
            const { data: giras } = await supabase
                .from('Giras')
                .select('*')
                .eq('terreiro_id', idLocal)
                .order('dia_semana', { ascending: true })
                .limit(3);

            setStats({
                totalMembros: membros || 0,
                saldoGeral: saldo,
                estoqueBaixo: baixo || 0,
                proximasGiras: giras || []
            });
        } catch (error) {
            console.error("Erro no dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{padding: '20px'}}>Sincronizando dados reais...</div>;

    return (
        <section>
            <h1 style={s.title}>Visão Geral</h1>

            {/* GRID DE CARDS PRINCIPAIS */}
            <div style={s.grid}>
                <div style={s.card}>
                    <div style={{...s.iconCircle, background: '#eef2ff'}}><Users size={20} color="#7d7dbf"/></div>
                    <div>
                        <p style={s.cardLabel}>Corpo Mediúnico</p>
                        <h3 style={s.cardValue}>{stats.totalMembros} <small style={{fontSize: '0.8rem', color: '#94a3b8'}}>Filhos</small></h3>
                    </div>
                </div>

                <div style={s.card}>
                    <div style={{...s.iconCircle, background: '#ecfdf5'}}><TrendingUp size={20} color="#10b981"/></div>
                    <div>
                        <p style={s.cardLabel}>Saldo em Caixa</p>
                        <h3 style={{...s.cardValue, color: stats.saldoGeral >= 0 ? '#10b981' : '#ef4444'}}>
                            R$ {stats.saldoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h3>
                    </div>
                </div>

                <div style={s.card}>
                    <div style={{...s.iconCircle, background: stats.estoqueBaixo > 0 ? '#fff7ed' : '#f0f9ff'}}>
                        <Package size={20} color={stats.estoqueBaixo > 0 ? '#f59e0b' : '#0ea5e9'}/>
                    </div>
                    <div>
                        <p style={s.cardLabel}>Estoque Crítico</p>
                        <h3 style={s.cardValue}>{stats.estoqueBaixo} <small style={{fontSize: '0.8rem', color: '#94a3b8'}}>itens p/ repor</small></h3>
                    </div>
                </div>
            </div>

            {/* SEÇÃO DE DETALHES (FILA DE GIRAS E ALERTAS) */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '25px', marginTop: '30px' }}>
                
                {/* PRÓXIMAS GIRAS */}
                <div style={s.whiteCard}>
                    <h4 style={s.sectionTitle}><Calendar size={18}/> Próximas Atividades</h4>
                    {stats.proximasGiras.length === 0 ? (
                        <p style={{color: '#94a3b8', fontSize: '0.9rem'}}>Nenhuma gira agendada.</p>
                    ) : (
                        stats.proximasGiras.map(gira => (
                            <div key={gira.id} style={s.activityRow}>
                                <div>
                                    <span style={s.dateTag}>{new Date(gira.dia_semana + 'T00:00:00').toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}</span>
                                    <strong style={{marginLeft: '15px'}}>{gira.tipo_gira}</strong>
                                </div>
                                <span style={{color: '#64748b', fontSize: '0.85rem'}}>{gira.horario}h</span>
                            </div>
                        ))
                    )}
                </div>

                {/* ALERTAS RÁPIDOS */}
                <div style={{...s.whiteCard, background: '#1e293b', color: '#fff'}}>
                    <h4 style={{...s.sectionTitle, color: '#fff', borderBottomColor: '#334155'}}><AlertTriangle size={18} color="#f59e0b"/> Alertas do Sistema</h4>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                        {stats.estoqueBaixo > 0 && (
                            <p style={s.alertText}>⚠️ Existem {stats.estoqueBaixo} materiais abaixo do estoque mínimo.</p>
                        )}
                        {stats.saldoGeral < 0 && (
                            <p style={s.alertText}>🔴 Atenção: Seu saldo financeiro está negativo.</p>
                        )}
                        {stats.totalMembros === 0 && (
                            <p style={s.alertText}>ℹ️ Comece cadastrando os filhos da casa no Corpo Mediúnico.</p>
                        )}
                    </div>
                </div>

            </div>
        </section>
    );
};

const s = {
    title: { fontSize: '1.8rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '25px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
    card: { background: '#fff', padding: '20px', borderRadius: '18px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' },
    iconCircle: { width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    cardLabel: { margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: '600' },
    cardValue: { margin: '4px 0 0', fontSize: '1.4rem', fontWeight: '800', color: '#1e293b' },
    whiteCard: { background: '#fff', padding: '25px', borderRadius: '20px', border: '1px solid #e2e8f0' },
    sectionTitle: { margin: '0 0 20px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' },
    activityRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f8fafc' },
    dateTag: { background: '#f0f0ff', color: '#7d7dbf', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' },
    alertText: { margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.4' }
};

export default Dashboard;