import React, { useRef, useEffect, useState, useCallback } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { rtdb } from '../firebase';
import { ref as dbRef, set as rtdbSet, onValue, serverTimestamp as rtdbServerTimestamp, remove as rtdbRemove } from 'firebase/database';

function formatHora(ts) {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ChatWindow({ messages, user, onSend, input, setInput, contato, onBack }) {
  const messagesEndRef = useRef(null);
  const chatContentRef = useRef(null);
  const [statusContato, setStatusContato] = useState({ online: false, lastSeen: null });
  const [digitando, setDigitando] = useState(false);
  const [contatoDigitando, setContatoDigitando] = useState(false);
  const typingTimeout = useRef();
  const [mensagemRespondida, setMensagemRespondida] = useState(null);
  const [mensagemDestacada, setMensagemDestacada] = useState(null);
  const mensagemRefs = useRef({});
  const [hovered, setHovered] = useState(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  useEffect(() => {
    console.log('[Digitando] Meu UID:', user?.uid, 'Contato UID:', contato?.uid);
  }, [user?.uid, contato?.uid]);

  useEffect(() => {
    if (!contato?.uid) return;
    const unsub = onSnapshot(doc(db, 'usuarios', contato.uid), snap => {
      const data = snap.data();
      setStatusContato({
        online: !!data?.online,
        lastSeen: data?.lastSeen?.seconds ? new Date(data.lastSeen.seconds * 1000) : null
      });
    });
    return () => unsub();
  }, [contato?.uid]);

  useEffect(() => {
    if (!user?.uid || !contato?.uid) return;
    const chatId = [user.uid, contato.uid].sort().join('_');
    const otherUid = user.uid === chatId.split('_')[0] ? chatId.split('_')[1] : chatId.split('_')[0];
    console.log('[Digitando] DEBUG chatId:', chatId, '| Meu UID:', user.uid, '| Contato UID:', contato.uid, '| Escutando UID:', otherUid);
    const typingRef = dbRef(rtdb, `/typing/${chatId}/${otherUid}`);
    console.log('[Digitando] Escutando:', `/typing/${chatId}/${otherUid}`);
    const unsubscribe = onValue(typingRef, snap => {
      setContatoDigitando(!!snap.val());
      console.log('[Digitando] Valor recebido:', snap.val());
    });
    return () => unsubscribe();
  }, [user?.uid, contato?.uid]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Efeito para remover destaque após 1 segundo
  useEffect(() => {
    if (!mensagemDestacada) return;
    const timeout = setTimeout(() => setMensagemDestacada(null), 1000);
    return () => clearTimeout(timeout);
  }, [mensagemDestacada]);

  // Avatar e nome do contato
  const nomeContato = contato?.apelido || contato?.nome || contato?.email || 'Chat Geral';
  const avatarContato = contato?.fotoUrl || null;
  const avatarLetra = contato?.apelido ? contato.apelido[0].toUpperCase() : (contato?.nome ? contato.nome[0].toUpperCase() : (contato?.email ? contato.email[0].toUpperCase() : 'C'));

  // Função para cancelar resposta
  const cancelarResposta = () => setMensagemRespondida(null);

  // Função para lidar com digitação
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!user?.uid || !contato?.uid) return;
    const chatId = [user.uid, contato.uid].sort().join('_');
    console.log('[Digitando] handleInputChange', { userUid: user?.uid, contatoUid: contato?.uid, chatId });
    const typingRef = dbRef(rtdb, `/typing/${chatId}/${user.uid}`);
    console.log('[Digitando] Escrevendo:', `/typing/${chatId}/${user.uid}`);
    if (!digitando) {
      setDigitando(true);
      rtdbSet(typingRef, true);
      console.log('[Digitando] Set true');
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setDigitando(false);
      rtdbRemove(typingRef);
      console.log('[Digitando] Remove (timeout)');
    }, 5000);
  };

  // Ao enviar mensagem, remove status de digitação
  const handleSend = (e) => {
    if (!user?.uid || !contato?.uid) return onSend(e);
    const chatId = [user.uid, contato.uid].sort().join('_');
    const typingRef = dbRef(rtdb, `/typing/${chatId}/${user.uid}`);
    setDigitando(false);
    rtdbRemove(typingRef);
    // Envia a mensagem com referência à mensagem respondida, se houver
    onSend(e, mensagemRespondida);
    setMensagemRespondida(null);
  };

  // Função para verificar se está no fim do chat
  const isAtBottom = useCallback(() => {
    if (!chatContentRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = chatContentRef.current;
    return scrollHeight - scrollTop - clientHeight < 60; // margem de tolerância
  }, []);

  // Scroll inteligente ao receber novas mensagens
  useEffect(() => {
    if (isAtBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setShowScrollToBottom(false);
    } else {
      setShowScrollToBottom(true);
    }
  }, [messages, isAtBottom]);

  // Listener de scroll para mostrar/esconder botão
  useEffect(() => {
    const el = chatContentRef.current;
    if (!el) return;
    const onScroll = () => {
      if (isAtBottom()) {
        setShowScrollToBottom(false);
      } else {
        setShowScrollToBottom(true);
      }
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [isAtBottom]);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',alignItems:'center',justifyContent:'center'}}>
      {/* Barra do topo */}
      <div style={{width:'100%',maxWidth:600,minWidth:320,position:'relative',margin:'70px auto 0 auto',borderRadius:'24px 24px 0 0',boxShadow:'0 2px 12px #7f5fff22',background:'rgba(35,42,58,0.98)'}}>
        {/* Header do chat fixo */}
        <div style={{height:64,display:'flex',alignItems:'center',gap:16,background:'rgba(35,42,58,0.98)',borderRadius:'24px 24px 0 0',borderBottom:'2px solid #7f5fff',padding:'0 32px',position:'sticky',top:0,zIndex:2, boxShadow:'0 1.5px 0 #7f5fff33'}}>
          {onBack && (
            <button onClick={onBack} style={{background:'none',border:'none',color:'#a18fff',fontSize:26,fontWeight:700,cursor:'pointer',marginRight:8}} title="Voltar">←</button>
          )}
          {avatarContato ? (
            <img src={avatarContato} alt="avatar" style={{width:40,height:40,borderRadius:'50%',objectFit:'cover',boxShadow:'0 2px 8px #00c6ff22'}} />
          ) : (
            <div style={{width:40,height:40,borderRadius:'50%',background:'#7f5fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',color:'#fff',fontSize:22,boxShadow:'0 2px 8px #7f5fff55'}}>{avatarLetra}</div>
          )}
          <span style={{color:'#a18fff',fontWeight:700,fontSize:19,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',flex:1}}>{nomeContato}</span>
          {/* Status online/última visualização */}
          {contato?.uid && (
            <span style={{color: statusContato.online ? '#00ffb3' : '#b0c4d4',fontWeight:500,fontSize:14,marginLeft:12}}>
              {statusContato.online
                ? 'Online'
                : statusContato.lastSeen
                  ? `Visto por último há ${Math.max(1, Math.round((Date.now() - statusContato.lastSeen.getTime())/60000))} min`
                  : ''}
            </span>
          )}
        </div>
        {/* Conteúdo do chat */}
        <div ref={chatContentRef} style={{height:'calc(70vh - 64px)',overflowY:'auto',padding:'32px 40px 0 40px',marginBottom:0,background:'rgba(24,31,42,0.98)',borderRadius:'0 0 24px 24px', position:'relative'}}>
          {messages.map((m, i) => {
            // Para DMs, comparar pelo uid do user
            const isMe = m.user === (user?.uid || user?.displayName || user?.email);
            const nome = m.apelido || (m.user && m.user !== user?.uid ? m.user : '') || '';
            return (
              <div
                key={i}
                ref={el => { if (el) mensagemRefs.current[m.id] = el; }}
                style={{
                  display:'flex',
                  flexDirection: isMe ? 'row-reverse' : 'row',
                  alignItems:'flex-end',
                  marginBottom:22,
                  gap:16
                }}
                onMouseEnter={() => setHovered(m.id)}
                onMouseLeave={() => setHovered(null)}
              > 
                {/* Avatar */}
                <div style={{width:44,height:44,borderRadius:'50%',background:isMe?'#00c6ff':'#232a3a',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',color:'#fff',fontSize:22,boxShadow:'0 2px 8px #00c6ff22'}}>
                  {isMe ? (user?.apelido ? user.apelido[0].toUpperCase() : (user?.email||'U')[0].toUpperCase()) : ((m.apelido||'U')[0]||'U').toUpperCase()}
                </div>
                {/* Bolha */}
                <div style={{
                  maxWidth:'75%',
                  background: isMe ? 'linear-gradient(135deg, #1e4fa3 80%, #00c6ff 100%)' : 'rgba(161,143,255,0.10)',
                  color: isMe ? '#fff' : '#bcb8e6',
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  padding:'16px 44px 16px 26px',
                  boxShadow:'0 2px 8px #00c6ff22',
                  wordBreak:'break-word',
                  position:'relative',
                  border: mensagemDestacada === m.id ? '2.5px solid #ff6a00' : (isMe ? '2px solid #00c6ff' : '2px solid #232a3a'),
                  textAlign:'left',
                  transition: 'border 0.3s, box-shadow 0.2s, background 0.3s',
                  animation: mensagemDestacada === m.id ? 'highlight 0.7s' : undefined,
                }}>
                  {/* Preview da mensagem respondida no balão */}
                  {m.resposta && (
                    <div
                      style={{
                        borderLeft: '3px solid #7f5fff',
                        background: 'rgba(127,95,255,0.10)',
                        color: '#a18fff',
                        fontSize: 13,
                        marginBottom: 7,
                        padding: '6px 12px',
                        borderRadius: 7,
                        maxWidth: 260,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontStyle: 'italic',
                        cursor: 'pointer',
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                        borderRight: 'none',
                        borderTopLeftRadius: 7,
                        borderBottomLeftRadius: 7,
                        borderTop: 'none',
                        borderBottom: 'none',
                        borderRight: 'none',
                        borderTopLeftRadius: 7,
                        borderBottomLeftRadius: 7,
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                        transition: 'background 0.2s',
                      }}
                      title="Clique para ir até a mensagem original"
                      onClick={() => {
                        if (m.resposta.id && mensagemRefs.current[m.resposta.id]) {
                          mensagemRefs.current[m.resposta.id].scrollIntoView({ behavior: 'smooth', block: 'center' });
                          setMensagemDestacada(m.resposta.id);
                        }
                      }}
                    >
                      {m.resposta.texto || '[mensagem]'}
                    </div>
                  )}
                  {/* Ícone de responder */}
                  {hovered === m.id && (
                    <button onClick={() => setMensagemRespondida(m)} title="Responder" style={{position:'absolute',top:8,right:12,background:'none',border:'none',color:'#a18fff',fontSize:20,cursor:'pointer',opacity:0.9,padding:0,display:'flex',alignItems:'center',justifyContent:'center',transition:'color 0.2s'}}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{display:'block'}}>
                        <path d="M9 17L4 12L9 7" />
                        <path d="M4 12H20" />
                      </svg>
                    </button>
                  )}
                  <div style={{fontSize:17}}>{m.text || m.texto}</div>
                  {m.arquivo && (
                    <div><a href={m.arquivo} target="_blank" rel="noopener noreferrer" style={{color:'#00c6ff'}}>Baixar arquivo</a></div>
                  )}
                  <div style={{
                    fontSize: '10px',
                    color: '#7f8fa6',
                    marginTop: 10,
                    textAlign: isMe ? 'right' : 'left',
                    opacity: 0.75,
                    letterSpacing: 0.2,
                    fontWeight: 500
                  }}>{formatHora(m.timestamp)}
                    {/* Indicação de visualização */}
                    {isMe && m.lidaPor && contato && m.lidaPor.includes(contato.uid) && (
                      <span style={{marginLeft:8,color:'#00ffb3',fontWeight:700,fontSize:10}}>Visto</span>
                    )}
                  </div>
                  {/* Reações (exemplo) */}
                  <div style={{marginTop:4,display:'flex',gap:4}}>
                    {m.reacoes && m.reacoes.length > 0 && m.reacoes.map((r, idx) => (
                      <span key={idx} style={{fontSize:18}}>{r.emoji}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
          {showScrollToBottom && (
            <button onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                position:'fixed',
                right:56,
                bottom:120,
                zIndex:30,
                background:'#00c6ff',
                color:'#fff',
                border:'none',
                borderRadius:'50%',
                width:48,
                height:48,
                boxShadow:'0 2px 12px #00c6ff55',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                fontSize:28,
                cursor:'pointer',
                transition:'background 0.18s, transform 0.18s',
                outline:'none',
                padding:0,
              }}
              title="Ir para o fim"
              onMouseOver={e => e.currentTarget.style.background = '#009be0'}
              onMouseOut={e => e.currentTarget.style.background = '#00c6ff'}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          )}
        </div>
        {/* Preview da mensagem respondida acima do input */}
        {mensagemRespondida && (
          <div style={{
            background: 'rgba(127,95,255,0.13)',
            borderLeft: '4px solid #7f5fff',
            borderRadius: '8px 8px 0 0',
            borderBottomRightRadius: 0,
            borderBottomLeftRadius: 0,
            color: '#a18fff',
            fontSize: 15.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            boxShadow: '0 2px 8px 0 #7f5fff11',
            position: 'relative',
            animation: 'replyIn 0.35s',
            padding: '8px 16px 8px 16px',
            minHeight: 36,
            width: '100%',
            margin: 0,
          }}>
            <span style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:340, fontWeight:600, letterSpacing:0.1}}>
              <span style={{color:'#7f5fff', fontWeight:700, marginRight:4}}>↩ Responder:</span> <span style={{color:'#fff'}}>{mensagemRespondida.text || mensagemRespondida.texto || '[arquivo]'}</span>
            </span>
            <button onClick={cancelarResposta} style={{
              background:'none',
              border:'none',
              color:'#ff6a00',
              fontSize:22,
              cursor:'pointer',
              marginLeft:8,
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              borderRadius: '50%',
              width: 32,
              height: 32,
              transition:'background 0.18s, color 0.18s',
              position:'static',
              opacity: 0.85
            }} title="Cancelar"
              onMouseOver={e => e.currentTarget.style.background = '#ff6a0022'}
              onMouseOut={e => e.currentTarget.style.background = 'none'}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="4" x2="16" y2="16" /><line x1="16" y1="4" x2="4" y2="16" /></svg>
            </button>
            <style>{`
              @keyframes replyIn { from { opacity: 0; transform: translateY(-12px);} to { opacity: 1; transform: translateY(0);} }
            `}</style>
          </div>
        )}
        {/* Indicador de digitação na parte de baixo */}
        {contatoDigitando && (
          <div style={{color:'#00c6ff',fontWeight:600,fontSize:16,margin:'8px 0 0 40px',textAlign:'left',display:'flex',alignItems:'center',gap:4}}>
            <span>{(contato.apelido || contato.nome || contato.email || 'Contato')} está digitando</span>
            <span style={{display:'inline-block',width:24}}>
              <span style={{animation:'dotJump 1s infinite',marginRight:1}}>•</span>
              <span style={{animation:'dotJump 1s 0.2s infinite',marginRight:1}}>•</span>
              <span style={{animation:'dotJump 1s 0.4s infinite'}}>•</span>
            </span>
            <style>{`
              @keyframes dotJump {
                0%, 80%, 100% { transform: translateY(0); opacity: 0.7; }
                40% { transform: translateY(-6px); opacity: 1; }
              }
            `}</style>
          </div>
        )}
        {/* Input fixo */}
        <form onSubmit={handleSend} style={{width:'100%',display:'flex',flexDirection:'column',alignItems:'stretch',gap:0,padding:'0',background:'transparent',borderTop:'1.5px solid #00c6ff33',position:'sticky',bottom:0}}>
          <div style={{padding:'18px 40px 0 40px',display:'flex',flexDirection:'column',gap:0}}>
            <div style={{display:'flex',alignItems:'center',gap:16}}>
              <input type="text" value={input} onChange={handleInputChange} placeholder="Digite sua mensagem..." style={{
                flex:1,
                padding:'16px 20px',
                borderRadius: mensagemRespondida ? '0 0 0 0' : '10px',
                border:'1.5px solid #2d3756',
                background:'#232a3a',
                color:'#fff',
                fontSize:'1.12rem',
                outline:'none',
                boxShadow:'none',
                transition:'border 0.2s',
              }}
              onFocus={e => e.target.style.border = '1.5px solid #00c6ff'}
              onBlur={e => e.target.style.border = '1.5px solid #2d3756'}
              />
              <button type="submit" style={{
                width:44,
                height:44,
                borderRadius:'50%',
                background:'#00c6ff',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                border:'none',
                boxShadow:'none',
                transition:'background 0.18s, transform 0.18s',
                cursor:'pointer',
                padding:0,
              }}
              onMouseOver={e => {e.currentTarget.style.background = '#009be0';e.currentTarget.style.transform='scale(1.08)'}}
              onMouseOut={e => {e.currentTarget.style.background = '#00c6ff';e.currentTarget.style.transform='scale(1)'}}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{display:'block'}}>
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
export default ChatWindow; 