import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, provider, db } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Preencha todos os campos');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Garante documento do usuário no Firestore
      const userDoc = doc(db, 'usuarios', user.uid);
      const snap = await getDoc(userDoc);
      if (!snap.exists()) {
        await setDoc(userDoc, {
          apelido: user.displayName || user.email,
          email: user.email,
          uid: user.uid,
          amigos: [],
        });
      }
      navigate('/chat');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await signInWithPopup(auth, provider);
      navigate('/chat');
    } catch (err) {
      setError(err.message);
    }
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
      {/* Card de login */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        background: 'rgba(24, 24, 32, 0.92)',
        borderRadius: 32,
        boxShadow: '0 8px 32px #232a3a99',
        padding: '48px 38px 38px 38px',
        minWidth: 340,
        maxWidth: 380,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: '1.5px solid #7f5fff44',
        backdropFilter: 'blur(2px)',
      }}>
        <h2 style={{color: '#fff', marginBottom: 32, fontWeight: 700, fontSize: '2rem', letterSpacing: 1}}>Login</h2>
        <form onSubmit={handleLogin} style={{width: '100%', display: 'flex', flexDirection: 'column', gap: 18}}>
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
          <button
            type="submit"
            disabled={loading}
            className="btn-animado"
          >{loading ? 'Entrando...' : 'Login'}</button>
        </form>
        {error && <div style={{color: '#ff6a00', marginTop: 18, marginBottom: 0, textAlign: 'center', fontWeight: 600}}>{error}</div>}
        <div style={{color: '#b0c4d4', textAlign: 'center', marginTop: 28, fontSize: 15}}>
          Não tem conta? <Link to="/register" style={{color: '#7f5fff', textDecoration: 'underline', fontWeight: 700}}>Cadastre-se</Link>
        </div>
        <button onClick={handleGoogleLogin} disabled={loading} className="btn-animado" style={{marginTop: 24}}>
          Entrar com Google
        </button>
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

export default Login; 