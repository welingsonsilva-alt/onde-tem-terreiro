import React from 'react';
import { X } from 'lucide-react';

const ModalGirasGeral = ({ isOpen, onClose, terreiros }) => {
    if (!isOpen) return null;
    return (
        <div style={overlay}>
            <div style={modal}>
                <button onClick={onClose} style={closeBtn}><X size={20}/></button>
                <h3>Giras da Semana</h3>
                <div style={{ marginTop: '15px' }}>
                    {terreiros.length > 0 ? <p>Lista de giras em breve...</p> : <p>Nenhum terreiro cadastrado.</p>}
                </div>
            </div>
        </div>
    );
};

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 5000, display: 'flex', justifyContent: 'center', alignItems: 'center' };
const modal = { background: '#fff', padding: '30px', borderRadius: '20px', position: 'relative', width: '90%', maxWidth: '500px' };
const closeBtn = { position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'none', cursor: 'pointer' };

export default ModalGirasGeral;