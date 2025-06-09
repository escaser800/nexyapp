import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import FriendsDrawer from './FriendsDrawer';
import NotificationsDrawer from './NotificationsDrawer';
import ProfileDrawer from './ProfileDrawer';
import SearchDrawer from './SearchDrawer';
import DmDrawer from './DmDrawer';
import ChatWindow from './ChatWindow';
import { auth, db } from '../firebase';
import { doc, onSnapshot, updateDoc, arrayRemove, arrayUnion, collection, query, orderBy, getDoc, deleteDoc, where, getDocs, addDoc, serverTimestamp, setDoc, writeBatch, limit } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { rtdb } from '../firebase';
import { ref as dbRef, onDisconnect, set as rtdbSet, serverTimestamp as rtdbServerTimestamp, onValue } from 'firebase/database';

function Layout({ children }) {
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [friends, setFriends] = useState([]);
  const [friendsData, setFriendsData] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dmFriend, setDmFriend] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);
  const [dmInput, setDmInput] = useState('');
  const dmEndRef = useRef(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sidebarActive, setSidebarActive] = useState('chat');
  const [dmListOpen, setDmListOpen] = useState(false);
  const [dmTopics, setDmTopics] = useState([]);
  const [messages, setMessages] = useState([
    { user: 'NexyBot', text: 'Bem-vindo ao Nexy APP! Envie uma mensagem para começar.' }
  ]);
  const [input, setInput] = useState('');
  const [dmUnread, setDmUnread] = useState(0);
  const [salasOpen, setSalasOpen] = useState(false);
  const [salaAtual, setSalaAtual] = useState(null);
  const [salaMessages, setSalaMessages] = useState([]);
  const [salaInput, setSalaInput] = useState('');
  const [salas, setSalas] = useState([]);

  // Observar usuário logado
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => setUser(u));
    return () => unsub();
  }, []);

  // Buscar dados do usuário
  useEffect(() => {
    if (!user) return;
    const userDoc = doc(db, 'usuarios', user.uid);
    const unsub = onSnapshot(userDoc, snap => {
      setUserData(snap.data());
      setFriends(snap.data()?.amigos || []);
    });
    return () => unsub();
  }, [user]);

  // Buscar dados dos amigos
  useEffect(() => {
    if (!friends || friends.length === 0) { setFriendsData([]); return; }
    Promise.all(friends.map(async fid => {
      const snap = await getDoc(doc(db, 'usuarios', fid));
      return { uid: fid, apelido: snap.data()?.apelido || fid };
    })).then(setFriendsData);
  }, [friends]);

  // Buscar notificações em tempo real
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'usuarios', user.uid, 'notificacoes'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  // Mensagens em tempo real da DM
  useEffect(() => {
    if (!dmFriend || !user) { setDmMessages([]); return; }
    const chatId = [user.uid, dmFriend].sort().join('_');
    const q = query(collection(db, 'dms', chatId, 'mensagens'), orderBy('timestamp'));
    const unsub = onSnapshot(q, snap => {
      setDmMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [dmFriend, user]);

  // Marcar mensagens da DM como lidas ao abrir e ao receber novas mensagens
  useEffect(() => {
    if (!dmFriend || !user || !dmMessages.length) return;
    const chatId = [user.uid, dmFriend].sort().join('_');
    const batch = writeBatch(db);
    dmMessages.forEach((msg, idx) => {
      if (!msg.lidaPor || !msg.lidaPor.includes(user.uid)) {
        const msgRef = doc(db, 'dms', chatId, 'mensagens', msg.id || String(idx));
        batch.update(msgRef, { lidaPor: [...(msg.lidaPor || []), user.uid] });
      }
    });
    batch.commit();
  }, [dmFriend, user, dmMessages]);

  // Scroll automático para última mensagem
  useEffect(() => {
    if (dmEndRef.current) dmEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [dmMessages]);

  // Buscar pedidos de amizade pendentes enviados
  useEffect(() => {
    if (!user) { setPendingRequests([]); return; }
    const q = query(collection(db, 'usuarios', user.uid, 'notificacoes'), where('tipo', '==', 'amizade'));
    const unsub = onSnapshot(q, snap => {
      setPendingRequests(snap.docs.map(d => d.data().de));
    });
    return () => unsub();
  }, [user]);

  // Sempre que abrir uma DM, adiciona à lista de tópicos (sem duplicar)
  useEffect(() => {
    if (dmFriend && !dmTopics.includes(dmFriend)) {
      setDmTopics(prev => [...prev.filter(uid => uid !== dmFriend), dmFriend]);
    }
  }, [dmFriend]);

  // Calcular total de mensagens não lidas em todas as DMs
  useEffect(() => {
    if (!user || !friendsData.length) { setDmUnread(0); return; }
    let unsubscribes = [];
    let totalUnread = 0;
    let unreadMap = {};
    friendsData.forEach(f => {
      const chatId = [user.uid, f.uid].sort().join('_');
      const q = query(collection(db, 'dms', chatId, 'mensagens'), orderBy('timestamp', 'desc'), limit(50));
      const unsub = onSnapshot(q, snap => {
        let unread = 0;
        snap.docs.forEach(docSnap => {
          const data = docSnap.data();
          // Se a DM está aberta com esse amigo, não conta como não lida
          if (dmFriend === f.uid) return;
          if (data.autor !== user.uid && (!data.lidaPor || !data.lidaPor.includes(user.uid))) unread++;
        });
        unreadMap[f.uid] = unread;
        // Soma total de mensagens não lidas em todas as DMs
        totalUnread = Object.values(unreadMap).reduce((acc, val) => acc + val, 0);
        setDmUnread(totalUnread);
      });
      unsubscribes.push(unsub);
    });
    return () => unsubscribes.forEach(u => u());
  }, [user, friendsData, dmFriend]);

  // Marcar notificações como lidas ao abrir o drawer, sem apagar do banco
  useEffect(() => {
    if (!notificationsOpen || !user) return;
    const batch = writeBatch(db);
    notifications.forEach(n => {
      if (!n.lidaPor || !n.lidaPor.includes(user.uid)) {
        const notifRef = doc(db, 'usuarios', user.uid, 'notificacoes', n.id);
        batch.update(notifRef, { lidaPor: [...(n.lidaPor || []), user.uid] });
      }
    });
    if (notifications.length > 0) batch.commit();
  }, [notificationsOpen, user, notifications]);

  // Calcular badge de notificações não lidas
  const notificacoesNaoLidas = notifications.filter(n => !n.lidaPor || !n.lidaPor.includes(user?.uid)).length;

  const badges = {
    notificacoes: notificacoesNaoLidas,
    dms: dmUnread
  };

  // Remover amigo
  const handleRemoveFriend = async (friendUid) => {
    if (!user) return;
    const userDoc = doc(db, 'usuarios', user.uid);
    await updateDoc(userDoc, { amigos: arrayRemove(friendUid) });
    const friendDoc = doc(db, 'usuarios', friendUid);
    await updateDoc(friendDoc, { amigos: arrayRemove(user.uid) });
  };

  // Aceitar amizade
  const handleAccept = async (notif) => {
    if (!user) return;
    const userDoc = doc(db, 'usuarios', user.uid);
    const amigoDoc = doc(db, 'usuarios', notif.de);
    let amigoSnap = await getDoc(amigoDoc);
    if (!amigoSnap.exists()) {
      // Cria documento mínimo para o amigo
      await setDoc(amigoDoc, {
        uid: notif.de,
        apelido: notif.apelido || notif.de,
        email: '',
        amigos: [user.uid],
      });
      amigoSnap = await getDoc(amigoDoc);
    }
    await updateDoc(userDoc, { amigos: arrayUnion(notif.de) });
    await updateDoc(amigoDoc, { amigos: arrayUnion(user.uid) });
    await deleteDoc(doc(db, 'usuarios', user.uid, 'notificacoes', notif.id));
  };
  // Recusar amizade
  const handleReject = async (notif) => {
    if (!user) return;
    await deleteDoc(doc(db, 'usuarios', user.uid, 'notificacoes', notif.id));
  };

  // Salvar apelido
  const handleSaveApelido = async (novoApelido) => {
    if (!user) return;
    const userDoc = doc(db, 'usuarios', user.uid);
    await updateDoc(userDoc, { apelido: novoApelido });
    setProfileOpen(false);
  };

  // Buscar usuários por apelido
  const handleSearch = async (value) => {
    setSearchValue(value);
    if (!value || value.length < 3) { setSearchResults([]); return; }
    setSearchLoading(true);
    const q = query(collection(db, 'usuarios'), where('apelido', '>=', value), where('apelido', '<=', value + '\uf8ff'));
    const snap = await getDocs(q);
    setSearchResults(snap.docs
      .filter(d => d.id !== user?.uid)
      .map(d => ({ uid: d.id, ...d.data() })));
    setSearchLoading(false);
  };

  // Enviar pedido de amizade
  const handleAddFriend = async (friendUid) => {
    if (!user) return;
    // Buscar dados do usuário logado para mostrar na notificação
    const userSnap = await getDoc(doc(db, 'usuarios', user.uid));
    const meuApelido = userSnap.data()?.apelido || user.uid;
    await addDoc(collection(db, 'usuarios', friendUid, 'notificacoes'), {
      tipo: 'amizade',
      de: user.uid,
      apelido: meuApelido,
      texto: `${meuApelido} quer te adicionar como amigo!`,
      timestamp: serverTimestamp(),
    });
  };

  // Função de logout
  const handleLogout = async () => {
    if (user) {
      const userRef = doc(db, 'usuarios', user.uid);
      await updateDoc(userRef, {
        online: false,
        lastSeen: serverTimestamp(),
      });
    }
    await signOut(auth);
    window.location.reload();
  };

  // Enviar mensagem DM
  const handleSendDm = async (e, resposta = null) => {
    e.preventDefault();
    if (!dmInput.trim() || !user || !dmFriend) return;
    const chatId = [user.uid, dmFriend].sort().join('_');
    const msg = {
      texto: dmInput,
      autor: user.uid,
      timestamp: serverTimestamp(),
    };
    if (resposta) {
      msg.resposta = {
        texto: resposta.text || resposta.texto || '',
        id: resposta.id || '',
      };
    }
    await addDoc(collection(db, 'dms', chatId, 'mensagens'), msg);
    setDmInput('');
  };

  // Função para enviar mensagem no chat geral
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    const msg = { user: user.displayName || user.email, text: input };
    setMessages([...messages, msg]);
    setInput('');
    // Aqui você pode emitir para o backend/socket se quiser
  };

  // Handlers centralizados para a Sidebar
  const handleOpenChatGeral = () => {
    setSidebarActive('chat');
    setDmFriend(null);
    setDmListOpen(false);
    setFriendsOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
    setSearchOpen(false);
  };
  const handleOpenDms = () => {
    setSidebarActive('dms');
    setDmListOpen(true);
    setDmFriend(null);
    setFriendsOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
    setSearchOpen(false);
  };
  const handleOpenFriends = () => {
    setSidebarActive('amigos');
    setFriendsOpen(true);
    setDmListOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
    setSearchOpen(false);
  };
  const handleOpenNotifications = () => {
    setSidebarActive('notificacoes');
    setNotificationsOpen(true);
    setFriendsOpen(false);
    setDmListOpen(false);
    setProfileOpen(false);
    setSearchOpen(false);
  };
  const handleOpenProfile = () => {
    setSidebarActive('perfil');
    setProfileOpen(true);
    setFriendsOpen(false);
    setNotificationsOpen(false);
    setDmListOpen(false);
    setSearchOpen(false);
  };
  const handleOpenSearch = () => {
    setSidebarActive('buscar');
    setSearchOpen(true);
    setProfileOpen(false);
    setFriendsOpen(false);
    setNotificationsOpen(false);
    setDmListOpen(false);
  };
  const handleOpenSalas = () => {
    console.log('Clicou no botão de salas!');
    setSalasOpen(true);
    setSidebarActive('salas');
    setFriendsOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
    setSearchOpen(false);
    setDmListOpen(false);
  };

  // Sistema de presença em tempo real (Realtime Database)
  useEffect(() => {
    if (!user) return;
    const statusRef = dbRef(rtdb, `/status/${user.uid}`);
    // Marca como online no RTDB
    rtdbSet(statusRef, {
      online: true,
      lastSeen: Date.now(),
    });
    // Garante update automático ao desconectar
    onDisconnect(statusRef).set({
      online: false,
      lastSeen: Date.now(),
    });
    // Sincroniza para o Firestore também
    const userRef = doc(db, 'usuarios', user.uid);
    updateDoc(userRef, {
      online: true,
      lastSeen: serverTimestamp(),
    });
    // Listener para manter sincronizado
    const unsubscribe = onValue(statusRef, snap => {
      const val = snap.val();
      if (val) {
        updateDoc(userRef, {
          online: !!val.online,
          lastSeen: val.lastSeen ? new Date(val.lastSeen) : serverTimestamp(),
        });
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Buscar salas em tempo real
  useEffect(() => {
    const q = query(collection(db, 'salas'), orderBy('criadaEm', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setSalas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // Mensagens da sala em tempo real
  useEffect(() => {
    if (!salaAtual) {
      setSalaMessages([]);
      return;
    }
    const q = query(collection(db, 'salas', salaAtual.id, 'mensagens'), orderBy('timestamp'));
    const unsub = onSnapshot(q, snap => {
      setSalaMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [salaAtual]);

  const handleSendSalaMessage = async (e) => {
    e.preventDefault();
    if (!salaInput.trim() || !user || !salaAtual) return;
    const msg = {
      texto: salaInput,
      autorUid: user.uid,
      autorApelido: userData?.apelido || user.displayName || user.email || 'Anônimo',
      avatar: userData?.avatar || '',
      timestamp: serverTimestamp(),
    };
    try {
      await addDoc(collection(db, 'salas', salaAtual.id, 'mensagens'), msg);
      setSalaInput('');
    } catch {}
  };

  // Drawer de Salas Públicas
  function SalasDrawer({ onClose, user, onEntrarSala, salas }) {
    const [nome, setNome] = useState('');
    const [desc, setDesc] = useState('');
    const [avatar, setAvatar] = useState('');
    const [erro, setErro] = useState('');
    const [criando, setCriando] = useState(false);

    // Função local para criar sala
    const criarSala = async (e) => {
      e.preventDefault();
      setErro('');
      if (!nome.trim()) return setErro('Nome obrigatório');
      setCriando(true);
      try {
        await addDoc(collection(db, 'salas'), {
          nome,
          desc,
          avatar,
          criadorUid: user?.uid || 'anon',
          criadorApelido: user?.apelido || user?.displayName || user?.email || 'Anônimo',
          criadaEm: serverTimestamp(),
          privada: false,
          membros: [],
        });
        setNome(''); setDesc(''); setAvatar('');
      } catch (e) {
        setErro('Erro ao criar sala');
      }
      setCriando(false);
    };

    return (
      <div style={{width:400,maxWidth:'95vw',background:'rgba(35,42,58,0.98)',boxShadow:'0 4px 32px #7f5fff55',borderRadius:18,padding:'36px 22px',height:'100vh',overflowY:'auto',display:'flex',flexDirection:'column',gap:22}}>
        <h2 style={{color:'#a18fff',marginBottom:8,fontWeight:800,fontSize:24,letterSpacing:1}}>Salas Públicas</h2>
        <form onSubmit={criarSala} style={{display:'flex',flexDirection:'column',gap:10,marginBottom:18}}>
          <input type="text" placeholder="Nome da sala" value={nome} onChange={e=>setNome(e.target.value)} style={{padding:10,borderRadius:8,border:'1.5px solid #7f5fff55',background:'#181f2a',color:'#fff',fontSize:16}} />
          <input type="text" placeholder="Descrição" value={desc} onChange={e=>setDesc(e.target.value)} style={{padding:10,borderRadius:8,border:'1.5px solid #7f5fff55',background:'#181f2a',color:'#fff',fontSize:16}} />
          <input type="text" placeholder="URL do avatar (opcional)" value={avatar} onChange={e=>setAvatar(e.target.value)} style={{padding:10,borderRadius:8,border:'1.5px solid #7f5fff55',background:'#181f2a',color:'#fff',fontSize:16}} />
          <button type="submit" disabled={criando} style={{background:'#00c6ff',color:'#fff',border:'none',borderRadius:8,padding:'10px 0',fontWeight:700,fontSize:17,marginTop:4}}>{criando ? 'Criando...' : 'Criar sala'}</button>
          {erro && <div style={{color:'#ff6a00',marginTop:4}}>{erro}</div>}
        </form>
        <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:14}}>
          {salas.length === 0 ? <div style={{color:'#fff',opacity:0.7}}>Nenhuma sala pública encontrada.</div> :
            salas.map(sala => (
              <div key={sala.id} style={{display:'flex',alignItems:'center',gap:14,background:'rgba(161,143,255,0.10)',borderRadius:12,padding:'12px 10px',boxShadow:'0 2px 8px #7f5fff11',cursor:'pointer',transition:'background 0.18s'}}
                onClick={() => { onEntrarSala(sala); onClose(); }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(161,143,255,0.18)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(161,143,255,0.10)'}
              >
                {sala.avatar ? <img src={sala.avatar} alt="avatar" style={{width:44,height:44,borderRadius:'50%',objectFit:'cover',background:'#232a3a'}} /> :
                  <div style={{width:44,height:44,borderRadius:'50%',background:'#7f5fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',color:'#fff',fontSize:22}}>{sala.nome[0]?.toUpperCase()||'S'}</div>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:18,color:'#fff',textOverflow:'ellipsis',overflow:'hidden',whiteSpace:'nowrap'}}>{sala.nome}</div>
                  <div style={{fontSize:13,color:'#b0c4d4',textOverflow:'ellipsis',overflow:'hidden',whiteSpace:'nowrap'}}>{sala.desc}</div>
                  <div style={{fontSize:12,color:'#7f8fa6',marginTop:2}}>Criador: {sala.criadorApelido}</div>
                </div>
              </div>
            ))}
        </div>
        <button onClick={onClose} style={{background:'rgba(161,143,255,0.10)',color:'#a18fff',border:'none',borderRadius:10,padding:'14px 0',fontWeight:700,fontSize:17,marginTop:18,transition:'background 0.2s'}}>Fechar</button>
      </div>
    );
  }

  return (
    <div style={{display:'flex',height:'100vh',width:'100vw',overflow:'hidden',background:'linear-gradient(135deg,#181f2a 0%,#232a3a 100%)'}}>
      {user && (
        <aside style={{width:96, background:'linear-gradient(135deg,#1a1333 0%,#232a3a 100%)', borderRight:'2px solid #3a2e5a', display:'flex', flexDirection:'column', alignItems:'center', padding:'18px 0', minHeight:'100vh', position:'relative', zIndex:10}}>
          {/* Sidebar com todos os botões */}
          <Sidebar
            user={user}
            onOpenChatGeral={handleOpenChatGeral}
            onOpenDms={handleOpenDms}
            onOpenFriends={handleOpenFriends}
            onOpenNotifications={handleOpenNotifications}
            onOpenProfile={handleOpenProfile}
            onOpenSearch={handleOpenSearch}
            onOpenSalas={handleOpenSalas}
            onLogout={handleLogout}
            active={sidebarActive}
            badges={badges}
          />
        </aside>
      )}
      <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,position:'relative'}}>
        {/* <Header /> */}
        <main style={{flex:1,overflow:'hidden',padding:'0',display:'flex',flexDirection:'column',minHeight:0,height:'100vh'}}>
          {dmFriend ? (
            <div style={{flex:1,display:'flex',flexDirection:'column',height:'100%',minHeight:0, borderRadius:'24px 24px 0 0', overflow:'hidden', background:'rgba(35,42,58,0.98)', boxShadow:'0 8px 32px #0003, 0 1.5px 0 #7f5fff44'}}>
              {(() => { const found = friendsData.find(f => f.uid === dmFriend); console.log('[DEBUG] ChatWindow contato.uid:', found ? found.uid : dmFriend, '| dmFriend:', dmFriend); })()}
              <ChatWindow
                messages={dmMessages.map(m => ({ ...m, user: m.autor }))}
                user={user}
                onSend={handleSendDm}
                input={dmInput}
                setInput={setDmInput}
                contato={(() => {
                  const found = friendsData.find(f => f.uid === dmFriend);
                  if (found) return found;
                  return { uid: dmFriend, apelido: dmFriend };
                })()}
                onBack={()=>setDmFriend(null)}
              />
              <div ref={dmEndRef} />
            </div>
          ) : salaAtual ? (
            <div style={{flex:1,display:'flex',flexDirection:'column',height:'100%',minHeight:0, borderRadius:'24px 24px 0 0', overflow:'hidden', background:'rgba(35,42,58,0.98)', boxShadow:'0 8px 32px #0003, 0 1.5px 0 #7f5fff44'}}>
              <ChatWindow
                messages={salaMessages.map(m => ({
                  ...m,
                  user: m.autorUid,
                  apelido: m.autorApelido,
                  avatar: m.avatar,
                  text: m.texto,
                }))}
                user={user}
                onSend={handleSendSalaMessage}
                input={salaInput}
                setInput={setSalaInput}
                contato={{
                  apelido: salaAtual.nome,
                  fotoUrl: salaAtual.avatar,
                  desc: salaAtual.desc,
                  tipo: 'sala',
                }}
                onBack={() => setSalaAtual(null)}
              />
            </div>
          ) : (
            <div style={{flex:1,display:'flex',flexDirection:'column',height:'100%',minHeight:0, borderRadius:'24px 24px 0 0', overflow:'hidden', background:'rgba(35,42,58,0.98)', boxShadow:'0 8px 32px #0003, 0 1.5px 0 #7f5fff44'}}>
              <ChatWindow
                messages={messages}
                user={user}
                onSend={handleSendMessage}
                input={input}
                setInput={setInput}
                contato={{apelido: 'Chat Geral'}}
              />
            </div>
          )}
        </main>
        {friendsOpen && (
          <>
            <div style={{position:'fixed',top:0,left:80,zIndex:200}}>
              <FriendsDrawer
                friends={friends}
                friendsData={friendsData}
                onSelectFriend={fid => {
                  setDmFriend(fid);
                  setFriendsOpen(false);
                  setDmListOpen(false);
                  setNotificationsOpen(false);
                  setProfileOpen(false);
                  setSearchOpen(false);
                  setSidebarActive('chat');
                }}
                onRemoveFriend={handleRemoveFriend}
              />
            </div>
            <div onClick={()=>setFriendsOpen(false)} style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',zIndex:199,background:'rgba(0,0,0,0.2)'}} />
          </>
        )}
        {notificationsOpen && (
          <>
            <div style={{position:'fixed',top:0,left:80,zIndex:200}}>
              <NotificationsDrawer
                notifications={notifications}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            </div>
            <div onClick={()=>setNotificationsOpen(false)} style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',zIndex:199,background:'rgba(0,0,0,0.2)'}} />
          </>
        )}
        {profileOpen && userData && (
          <>
            <div style={{position:'fixed',top:0,left:80,zIndex:200}}>
              <ProfileDrawer
                user={user}
                apelido={userData.apelido}
                email={userData.email}
                onSave={handleSaveApelido}
                onClose={()=>setProfileOpen(false)}
              />
            </div>
            <div onClick={()=>setProfileOpen(false)} style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',zIndex:199,background:'rgba(0,0,0,0.2)'}} />
          </>
        )}
        {searchOpen && (
          <>
            <div style={{position:'fixed',top:0,left:80,zIndex:200}}>
              <SearchDrawer
                searchResults={searchResults}
                searchValue={searchValue}
                loading={searchLoading}
                onSearch={handleSearch}
                onAddFriend={handleAddFriend}
                onClose={()=>setSearchOpen(false)}
                amigos={friends}
                pendentes={pendingRequests}
                userId={user?.uid}
              />
            </div>
            <div onClick={()=>setSearchOpen(false)} style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',zIndex:199,background:'rgba(0,0,0,0.2)'}} />
          </>
        )}
        {dmListOpen && (
          <>
            <div style={{position:'fixed',top:0,left:80,zIndex:200}}>
              <DmDrawer
                friendsData={friendsData}
                onSelectFriend={fid => {
                  setDmFriend(fid);
                  setDmListOpen(false);
                  setFriendsOpen(false);
                  setNotificationsOpen(false);
                  setProfileOpen(false);
                  setSearchOpen(false);
                  setSidebarActive('chat');
                }}
                onClose={()=>setDmListOpen(false)}
              />
            </div>
            <div onClick={()=>setDmListOpen(false)} style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',zIndex:199,background:'rgba(0,0,0,0.2)'}} />
          </>
        )}
        {salasOpen && (
          <>
            <div style={{position:'fixed',top:0,left:80,zIndex:200}}>
              <SalasDrawer onClose={()=>setSalasOpen(false)} user={userData || user} onEntrarSala={setSalaAtual} salas={salas} />
            </div>
            <div onClick={()=>setSalasOpen(false)} style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',zIndex:199,background:'rgba(0,0,0,0.2)'}} />
          </>
        )}
      </div>
    </div>
  );
}
export default Layout; 