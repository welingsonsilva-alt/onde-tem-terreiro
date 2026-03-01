import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { X, Lock, Eye, EyeOff } from 'lucide-react';

const ModalAlterarSenha = ({ isOpen, onClose }) => {
    const [novaSenha, setNovaSenha] = useState('');
    const [verSenha, setVerSenha] = useState(false);
    const [salvando, setSalvando] = useState(false);

    const handleAtualizarSenha = async (e) => {
        e.preventDefault();
        setSalvando(true);
        
        const { error } = await supabase.auth.updateUser({ password: novaSenha });

        if (!error) {
            alert("Senha atualizada com sucesso!");
            setNovaSenha('');
            onClose();
        } else {
            alert("Erro ao atualizar senha: " + error.message);
        }
        setSalvando(false);
    };

    if (!isOpen) return null;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                    <div style={styles.iconBox}><Lock size={20} color="#7d7dbf" /></div>
                    <h3>Definir Nova Senha</h3>
                    <button onClick={onClose} style={styles.closeBtn}><X size={20}/></button>
                </div>
                <p style={styles.modalSub}>Escolha uma senha forte com pelo menos 6 caracteres.</p>
                
                <form onSubmit={handleAtualizarSenha}>
                    <div style={styles.passwordWrapper}>
                        <input 
                            type={verSenha ? "text" : "password"} 
                            style={styles.input} 
                            placeholder="Nova senha" 
                            value={novaSenha}
                            onChange={e => setNovaSenha(e.target.value)}
                            required
                            minLength={6}
                        />
                        <button type="button" onClick={() => setVerSenha(!verSenha)} style={styles.eyeBtn}>
                            {verSenha ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>
                    </div>
                    <button type="submit" disabled={salvando} style={styles.btnConfirmar}>
                        {salvando ? 'Salvando...' : 'Confirmar Alteração'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' },
    modal: { background: '#fff', padding: '30px', borderRadius: '25px', width: '90%', maxWidth: '380px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
    modalHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', position: 'relative' },
    iconBox: { background: '#f0f0ff', padding: '10px', borderRadius: '12px' },
    closeBtn: { position: 'absolute', right: '-10px', top: '-10px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' },
    modalSub: { fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' },
    passwordWrapper: { position: 'relative' },
    input: { width: '100%', padding: '12px 45px 12px 15px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '1rem', boxSizing: 'border-box' },
    eyeBtn: { position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' },
    btnConfirmar: { width: '100%', marginTop: '20px', padding: '15px', background: '#7d7dbf', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }
};

export default ModalAlterarSenha;