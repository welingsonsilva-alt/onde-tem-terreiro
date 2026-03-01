import React, { useState } from 'react';
import { X, Send, User, Phone, Home, Sparkles } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

const ModalIndicar = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [formData, setFormData] = useState({
        nome_local: '',
        nome_responsavel: '',
        telefone: '',
        tipo: 'terreiro'
    });

    if (!isOpen) return null;

    // Máscara simples para telefone (XX) XXXXX-XXXX
    const handlePhoneMask = (value) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\2)(\d)/g, "($1) $2")
            .replace(/(\d)(\d{4})$/, "$1-$2")
            .substring(0, 15);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.from('Sugestoes').insert([formData]);

        if (error) {
            alert("Houve um erro ao enviar. Verifique sua conexão.");
        } else {
            setEnviado(true);
            setTimeout(() => {
                onClose();
                setEnviado(false);
                setFormData({ nome_local: '', nome_responsavel: '', telefone: '', tipo: 'terreiro' });
            }, 3000);
        }
        setLoading(false);
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <button onClick={onClose} style={styles.closeBtn}><X size={20}/></button>
                
                {!enviado ? (
                    <>
                        <div style={styles.header}>
                            <Sparkles color="#7d7dbf" size={24} />
                            <h2 style={styles.title}>Indicar um Local</h2>
                        </div>
                        <p style={styles.subtitle}>Ajude a expandir nossa rede! Informe os dados abaixo e entraremos em contato com o responsável.</p>

                        <form onSubmit={handleSubmit} style={styles.form}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Nome do Terreiro ou Loja</label>
                                <div style={styles.inputWrapper}>
                                    <Home size={16} style={styles.icon} />
                                    <input required style={styles.input} placeholder="Ex: Tenda de Umbanda Caboclo Sete Flechas" 
                                        value={formData.nome_local} onChange={e => setFormData({...formData, nome_local: e.target.value})} />
                                </div>
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Nome do Responsável</label>
                                <div style={styles.inputWrapper}>
                                    <User size={16} style={styles.icon} />
                                    <input required style={styles.input} placeholder="Nome do Zelador ou Proprietário" 
                                        value={formData.nome_responsavel} onChange={e => setFormData({...formData, nome_responsavel: e.target.value})} />
                                </div>
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Telefone para Contato</label>
                                <div style={styles.inputWrapper}>
                                    <Phone size={16} style={styles.icon} />
                                    <input required style={styles.input} placeholder="(00) 00000-0000" 
                                        value={formData.telefone} onChange={e => setFormData({...formData, telefone: handlePhoneMask(e.target.value)})} />
                                </div>
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Este local é um:</label>
                                <select style={styles.select} value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                                    <option value="terreiro">Terreiro / Casa de Axé</option>
                                    <option value="loja">Loja de Artigos Religiosos</option>
                                </select>
                            </div>

                            <button type="submit" disabled={loading} style={styles.submitBtn}>
                                {loading ? 'Enviando...' : 'Enviar Indicação'} <Send size={16} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={styles.successBox}>
                        <div style={styles.checkCircle}>✓</div>
                        <h3 style={{marginBottom: '10px'}}>Enviado com Sucesso!</h3>
                        <p style={{color: '#666', fontSize: '0.9rem'}}>Obrigado por fortalecer nossa comunidade. Vamos validar as informações em breve.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' },
    modal: { background: '#fff', padding: '32px', borderRadius: '28px', width: '90%', maxWidth: '420px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
    closeBtn: { position: 'absolute', top: '24px', right: '24px', border: 'none', background: '#f1f5f9', borderRadius: '12px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    header: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' },
    title: { margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#1e293b' },
    subtitle: { fontSize: '0.85rem', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' },
    form: { display: 'flex', flexDirection: 'column', gap: '18px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '0.75rem', fontWeight: '700', color: '#7d7dbf', textTransform: 'uppercase', letterSpacing: '0.5px' },
    inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
    icon: { position: 'absolute', left: '14px', color: '#94a3b8' },
    input: { width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.95rem', background: '#f8fafc', transition: '0.2s' },
    select: { padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.95rem', cursor: 'pointer', outline: 'none' },
    submitBtn: { marginTop: '8px', padding: '16px', borderRadius: '16px', border: 'none', background: '#7d7dbf', color: '#fff', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 15px -3px rgba(125, 125, 191, 0.4)' },
    successBox: { textAlign: 'center', padding: '20px 10px' },
    checkCircle: { width: '64px', height: '64px', background: '#10b981', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '32px', fontWeight: 'bold' }
};

export default ModalIndicar;