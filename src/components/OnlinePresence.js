import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

function OnlinePresence({ friends }) {
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => {
      setUser(u);
      if (u) setOnline(u.uid, true);
    });
    window.addEventListener('beforeunload', () => {
      if (user) setOnline(user.uid, false);
    });
    return () => {
      if (user) setOnline(user.uid, false);
      unsub();
    };
    // eslint-disable-next-line
  }, [user]);

  // Atualiza status online no Firestore
  async function setOnline(uid, online) {
    const userDoc = doc(db, 'usuarios', uid);
    await updateDoc(userDoc, {
      online,
      lastSeen: serverTimestamp(),
    });
  }

  // Escuta status dos amigos
  useEffect(() => {
    if (!friends || friends.length === 0) return;
    const unsubs = friends.map(fid =>
      onSnapshot(doc(db, 'usuarios', fid), snap => {
        const data = snap.data();
        setOnlineFriends(prev => {
          const others = prev.filter(f => f.uid !== fid);
          if (data?.online) return [...others, { uid: fid, ...data }];
          return others;
        });
      })
    );
    return () => unsubs.forEach(u => u());
  }, [friends]);

  return (
    <div style={{marginTop: 16}}>
      <b style={{color: '#00c6ff'}}>Online agora:</b>
      {onlineFriends.length === 0 && <div style={{color: '#fff', opacity: 0.7}}>Nenhum amigo online.</div>}
      {onlineFriends.map(f => (
        <div key={f.uid} style={{color: '#00c6ff', margin: '2px 0'}}>
          {f.apelido || f.email}
        </div>
      ))}
    </div>
  );
}

export default OnlinePresence; 