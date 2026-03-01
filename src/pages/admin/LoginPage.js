import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

const LoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Limpa erros ao digitar
    useEffect(() => {
        if (error) setError(null);
    }, [email, password]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        console.log("--- Iniciando Processo de Login ---");

        try {
            // 1. Autenticação no Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password,
            });

            if (authError) {
                console.error("Erro de Autenticação:", authError.message);
                throw new Error("E-mail ou senha incorretos.");
            }

            console.log("Autenticação realizada com sucesso. ID:", authData.user.id);

            // 2. Aguarda 800ms para o Banco de Dados sincronizar o Schema
            // Isso evita o erro 500/406 em bancos instáveis
            await new Promise(resolve => setTimeout(resolve, 800));

            // 3. Busca a Role do usuário na tabela Profiles
            // IMPORTANTE: Verifique se no seu banco é "Profiles" ou "profiles"
            const { data: profile, error: profileError } = await supabase
                .from('Profiles') 
                .select('role, nome')
                .eq('id', authData.user.id)
                .single();

            if (profileError) {
                console.error("Erro ao buscar Perfil:", profileError.message);
                // Se o Auth funcionou mas o Profile falhou, o problema é no Schema/Tabela
                throw new Error("Erro de sincronização: " + profileError.message);
            }

            console.log("Perfil carregado:", profile);

            // 4. Redirecionamento baseado na Role
            if (profile.role === 'master') {
                console.log("Redirecionando para Painel Master...");
                navigate('/admin-master');
            } else {
                console.log("Redirecionando para ERP...");
                navigate('/erp');
            }

        } catch (err) {
            console.error("Falha Crítica no Login:", err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            {/* Botão de Voltar */}
            <button onClick={() => navigate('/')} style={styles.btnBack}>
                <ArrowLeft size={18} /> Voltar ao Mapa
            </button>

            <div style={styles.loginCard}>
                <div style={styles.header}>
                    <div style={styles.iconCircle}>
                        <LogIn size={32} color="#7d7dbf" />
                    </div>
                    <h2 style={styles.title}>Área de Gestão</h2>
                    <p style={styles.subtitle}>Entre com suas credenciais de administrador</p>
                </div>

                {error && (
                    <div style={styles.errorBox}>
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin} style={styles.form}>
                    <div style={styles.inputWrapper}>
                        <Mail size={18} style={styles.inputIcon} />
                        <input
                            type="email"
                            placeholder="E-mail"
                            style={styles.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div style={styles.inputWrapper}>
                        <Lock size={18} style={styles.inputIcon} />
                        <input
                            type="password"
                            placeholder="Senha"
                            style={styles.input}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading} style={styles.btnLogin}>
                        {loading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Conectando ao Banco...
                            </>
                        ) : (
                            'Acessar Sistema'
                        )}
                    </button>
                </form>

                <p style={styles.footerText}>
                    Esqueceu sua senha? Entre em contato com o suporte.
                </p>
            </div>
        </div>
    );
};

// Estilos Minimalistas e Profissionais
const styles = {
    container: {
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f1f5f9',
        fontFamily: 'system-ui, sans-serif',
        margin: 0,
        padding: 0,
        overflow: 'hidden'
    },
    btnBack: {
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'white',
        border: '1px solid #e2e8f0',
        padding: '10px 15px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        color: '#64748b',
        fontWeight: '600',
        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
    },
    loginCard: {
        background: 'white',
        padding: '40px',
        borderRadius: '30px',
        width: '90%',
        maxWidth: '420px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
    },
    header: { textAlign: 'center', marginBottom: '30px' },
    iconCircle: {
        width: '60px',
        height: '60px',
        background: '#f0f0ff',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 15px'
    },
    title: { margin: 0, fontSize: '1.5rem', color: '#1e293b', fontWeight: '800' },
    subtitle: { color: '#64748b', fontSize: '0.9rem', marginTop: '5px' },
    errorBox: {
        background: '#fef2f2',
        border: '1px solid #fee2e2',
        color: '#b91c1c',
        padding: '12px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '20px',
        fontSize: '0.85rem'
    },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    inputWrapper: { position: 'relative' },
    inputIcon: { position: 'absolute', left: '15px', top: '15px', color: '#94a3b8' },
    input: {
        width: '100%',
        padding: '15px 15px 15px 45px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '1rem',
        outline: 'none',
        transition: 'border 0.2s',
        boxSizing: 'border-box'
    },
    btnLogin: {
        background: '#7d7dbf',
        color: 'white',
        padding: '16px',
        borderRadius: '12px',
        border: 'none',
        fontSize: '1rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        marginTop: '10px'
    },
    footerText: { textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', marginTop: '25px' }
};

export default LoginPage;