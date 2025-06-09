import React, { useState } from 'react';

function SearchDrawer({ onAddFriend, onClose, searchResults, onSearch, searchValue, loading, amigos = [], pendentes = [], userId }) {
  const [popup, setPopup] = useState('');
  const [added, setAdded] = useState({});
  const handleAdd = async (uid) => {
    setAdded(a => ({...a, [uid]: true}));
    await onAddFriend(uid);
    setPopup('Pedido de amizade enviado!');
    setTimeout(()=>setPopup(''), 2000);
    setTimeout(()=>setAdded(a => ({...a, [uid]: false})), 2000);
  };
  return (
    <div style={{width:360,maxWidth:'95vw',background:'linear-gradient(135deg,#1a1333 0%,#232a3a 100%)',boxShadow:'0 4px 32px #7f5fff55',borderRadius:'0 18px 18px 0',padding:'36px 22px',height:'100%',overflowY:'auto',display:'flex',flexDirection:'column',gap:22}}>
      <h2 style={{color:'#a18fff',marginBottom:8,fontWeight:800,fontSize:24,display:'flex',alignItems:'center',gap:10,letterSpacing:1}}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#a18fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:'middle'}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Buscar Usuários
      </h2>
      <input
        type="text"
        value={searchValue}
        onChange={e=>onSearch(e.target.value)}
        placeholder="Digite o apelido..."
        style={{width:'100%',marginBottom:12,padding:14,borderRadius:10,border:'1.5px solid #a18fff55',background:'#181f2a',color:'#fff',fontSize:17,transition:'border 0.2s'}}
      />
      {loading && <div style={{color:'#a18fff',marginBottom:8}}>Buscando...</div>}
      {searchResults.length === 0 && !loading && <div style={{color:'#fff',opacity:0.7}}>Nenhum resultado.</div>}
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
      {searchResults.filter(u => u.uid !== userId).map(u => (
        <div key={u.uid} style={{display:'flex',alignItems:'center',gap:16,background:'rgba(161,143,255,0.10)',borderRadius:16,padding:'16px 18px',boxShadow:'0 2px 12px #7f5fff22',transition:'box-shadow 0.2s,transform 0.2s',cursor:'pointer',position:'relative',border:'2px solid transparent'}}
          onMouseOver={e=>{e.currentTarget.style.boxShadow='0 4px 24px #7f5fff44';e.currentTarget.style.border='2px solid #7f5fff'}}
          onMouseOut={e=>{e.currentTarget.style.boxShadow='0 2px 12px #7f5fff22';e.currentTarget.style.border='2px solid transparent'}}
        >
          <div style={{width:44,height:44,borderRadius:'50%',background:'#7f5fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',color:'#fff',fontSize:22,boxShadow:'0 2px 8px #7f5fff55'}}>
            {u.apelido ? u.apelido[0].toUpperCase() : 'U'}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:18,color:'#fff',textOverflow:'ellipsis',overflow:'hidden',whiteSpace:'nowrap'}}>{u.apelido}</div>
            <div style={{fontSize:13,color:'#b0c4d4',textOverflow:'ellipsis',overflow:'hidden',whiteSpace:'nowrap'}}>{u.email}</div>
          </div>
          {amigos.includes(u.uid) ? (
            <span style={{color:'#00ffb3',fontWeight:700,fontSize:15}}>Amigo</span>
          ) : pendentes.includes(u.uid) ? (
            <span style={{color:'#ffb300',fontWeight:700,fontSize:15}}>Pendente</span>
          ) : added[u.uid] ? (
            <button disabled className="btn-gradient" style={{padding:'7px 18px',fontSize:20,background:'#00ffb3',color:'#fff',borderRadius:8,transition:'background 0.2s'}}>✔️</button>
          ) : (
            <button onClick={()=>handleAdd(u.uid)} className="btn-gradient" style={{padding:'7px 18px',fontSize:20,background:'#7f5fff',color:'#fff',borderRadius:8,transition:'background 0.2s'}} title="Adicionar"><span role="img" aria-label="Adicionar">➕</span></button>
          )}
        </div>
      ))}
      </div>
      <button onClick={onClose} style={{background:'rgba(161,143,255,0.10)',color:'#a18fff',border:'none',borderRadius:10,padding:'14px 0',fontWeight:700,marginTop:22,fontSize:17,transition:'background 0.2s'}}>Fechar</button>
      {popup && <div style={{position:'fixed',top:30,left:'50%',transform:'translateX(-50%)',background:'#7f5fff',color:'#fff',padding:'16px 38px',borderRadius:16,fontWeight:800,boxShadow:'0 4px 24px #7f5fff55',zIndex:9999,fontSize:19,animation:'fadeIn 0.3s'}}> {popup} </div>}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
}
export default SearchDrawer; 