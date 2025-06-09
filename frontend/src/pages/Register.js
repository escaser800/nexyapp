import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';

function Register() {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [apelido, setApelido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password || !apelido) {
      setError('Preencha todos os campos, incluindo o apelido');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    setLoading(true);
    try {
      // Verificar se o apelido já existe
      const q = query(collection(db, 'usuarios'), where('apelido', '==', apelido));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setError('Este apelido já está em uso. Escolha outro.');
        setLoading(false);
        return;
      }
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: apelido });
      await setDoc(doc(db, 'usuarios', user.uid), {
        apelido,
        email,
        uid: user.uid,
        amigos: [],
      });
      navigate('/chat');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0f',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Fundo animado com SVG de ondas */}
      <svg style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',zIndex:0}} viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7f5fff" />
            <stop offset="100%" stopColor="#00c6ff" />
          </linearGradient>
        </defs>
        <path d="M0,600 Q360,700 720,600 T1440,600 V800 H0 Z" fill="url(#grad1)" opacity="0.18"/>
        <path d="M0,500 Q360,600 720,500 T1440,500 V800 H0 Z" fill="url(#grad1)" opacity="0.12"/>
        <path d="M0,400 Q360,500 720,400 T1440,400 V800 H0 Z" fill="url(#grad1)" opacity="0.10"/>
      </svg>
      {/* Card de registro */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        background: 'rgba(24, 24, 32, 0.92)',
        borderRadius: 32,
        boxShadow: '0 8px 32px #232a3a99',
        padding: '48px 38px 38px 38px',
        minWidth: 340,
        maxWidth: 400,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: '1.5px solid #7f5fff44',
        backdropFilter: 'blur(2px)',
        animation: 'fadeInCard 1.2s cubic-bezier(.4,0,.2,1)',
      }}>
        <h2 style={{color: '#fff', marginBottom: 32, fontWeight: 700, fontSize: '2rem', letterSpacing: 1}}>Criar sua conta</h2>
        <form onSubmit={handleRegister} style={{width: '100%', display: 'flex', flexDirection: 'column', gap: 18}}>
          <input
            type="text"
            placeholder="Nome completo"
            value={nome}
            onChange={e => setNome(e.target.value)}
            className="input-animado"
          />
          <input
            type="text"
            placeholder="Apelido (nickname)"
            value={apelido}
            onChange={e => setApelido(e.target.value)}
            className="input-animado"
          />
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input-animado"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input-animado"
          />
          <input
            type="password"
            placeholder="Confirmar senha"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="input-animado"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-animado"
          >{loading ? 'Cadastrando...' : 'Cadastrar'}</button>
        </form>
        {error && <div style={{color: '#ff6a00', marginTop: 18, marginBottom: 0, textAlign: 'center', fontWeight: 600}}>{error}</div>}
        <div style={{color: '#b0c4d4', textAlign: 'center', marginTop: 28, fontSize: 15}}>
          Já tem conta? <Link to="/login" style={{color: '#7f5fff', textDecoration: 'underline', fontWeight: 700}}>Entrar</Link>
        </div>
      </div>
      {/* Fade-in animation keyframes e animações dos botões/inputs */}
      <style>{`
        @keyframes fadeInCard {
          from { opacity: 0; transform: translateY(40px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .btn-animado {
          width: 100%;
          padding: 13px 0;
          border-radius: 22px;
          background: linear-gradient(90deg, #7f5fff 0%, #00c6ff 100%);
          color: #fff;
          font-weight: bold;
          font-size: 1.15rem;
          border: none;
          margin-top: 8px;
          margin-bottom: 0;
          box-shadow: 0 2px 8px #7f5fff33;
          transition: background 0.3s, box-shadow 0.2s, transform 0.15s;
          cursor: pointer;
          opacity: 1;
          outline: none;
          position: relative;
          overflow: hidden;
        }
        .btn-animado:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .btn-animado:hover:not(:disabled) {
          background: linear-gradient(270deg, #00c6ff 0%, #7f5fff 100%);
          box-shadow: 0 4px 16px #7f5fff55;
          transform: scale(1.045);
        }
        .btn-animado:active:not(:disabled) {
          transform: scale(0.98);
          box-shadow: 0 1px 4px #7f5fff33;
        }
        .input-animado {
          width: 100%;
          padding: 15px 18px;
          border-radius: 22px;
          border: 1.5px solid #7f5fff55;
          background: rgba(127,95,255,0.10);
          color: #fff;
          font-size: 18px;
          margin-bottom: 0;
          outline: none;
          box-shadow: 0 2px 8px #7f5fff22;
          transition: border 0.2s, box-shadow 0.2s;
        }
        .input-animado:focus {
          border: 1.5px solid #00c6ff;
          box-shadow: 0 0 0 3px #00c6ff33;
        }
      `}</style>
    </div>
  );
}

export default Register; 