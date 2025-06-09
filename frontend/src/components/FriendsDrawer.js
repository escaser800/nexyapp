import React from 'react';

function FriendsDrawer({ friends, onSelectFriend, onRemoveFriend, friendsData }) {
  return (
    <div style={{width:360,maxWidth:'95vw',background:'linear-gradient(135deg,#1a1333 0%,#232a3a 100%)',boxShadow:'0 4px 32px #7f5fff55',borderRadius:'0 18px 18px 0',padding:'36px 22px',height:'100%',overflowY:'auto'}}>
      <h2 style={{color:'#a18fff',marginBottom:18,fontWeight:800,fontSize:24,letterSpacing:1}}>Amigos</h2>
      {friends.length === 0 && <div style={{color:'#fff',opacity:0.7}}>Nenhum amigo adicionado.</div>}
      {friends.map(fid => {
        const amigo = friendsData.find(f=>f.uid===fid);
        return (
          <div key={fid} style={{display:'flex',alignItems:'center',gap:16,background:'rgba(161,143,255,0.10)',borderRadius:14,padding:'14px 16px',marginBottom:14,boxShadow:'0 2px 8px #7f5fff11',transition:'background 0.2s,box-shadow 0.2s',border:'2px solid transparent'}}
            onMouseOver={e=>{e.currentTarget.style.background='rgba(161,143,255,0.18)';e.currentTarget.style.border='2px solid #7f5fff'}}
            onMouseOut={e=>{e.currentTarget.style.background='rgba(161,143,255,0.10)';e.currentTarget.style.border='2px solid transparent'}}
          >
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#a18fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:17,color:'#fff'}}>{amigo?.apelido || fid}</div>
              <div style={{fontSize:13,color:'#00ffb3',fontWeight:500}}>Online</div>
            </div>
            <button onClick={()=>onSelectFriend(fid)} className="btn-gradient" style={{padding:'7px 14px',fontSize:18,marginRight:6,background:'#7f5fff',color:'#fff',border:'none',borderRadius:8,transition:'background 0.2s'}} title="Conversar"><span role="img" aria-label="DM">💬</span></button>
            <button onClick={()=>onRemoveFriend(fid)} style={{background:'#db4437',color:'#fff',border:'none',borderRadius:8,padding:'7px 14px',fontSize:18,transition:'background 0.2s'}} title="Remover"><span role="img" aria-label="Remover">🗑️</span></button>
          </div>
        );
      })}
    </div>
  );
}
export default FriendsDrawer; 