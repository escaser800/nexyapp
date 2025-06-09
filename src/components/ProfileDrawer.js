import React, { useState } from 'react';

function ProfileDrawer({ user, apelido, email, onSave, onClose }) {
  const [editApelido, setEditApelido] = useState(apelido || '');
  return (
    <div style={{width:360,maxWidth:'95vw',background:'linear-gradient(135deg,#1a1333 0%,#232a3a 100%)',boxShadow:'0 4px 32px #7f5fff55',borderRadius:'0 18px 18px 0',padding:'36px 22px',height:'100%',overflowY:'auto',display:'flex',flexDirection:'column',gap:22}}>
      <h2 style={{color:'#a18fff',marginBottom:8,fontWeight:800,fontSize:24,display:'flex',alignItems:'center',gap:10,letterSpacing:1}}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a18fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:'middle'}}><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>
        Meu Perfil
      </h2>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,marginBottom:18}}>
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#a18fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>
        <div style={{color:'#fff',fontWeight:700,fontSize:20}}>{email}</div>
      </div>
      <label style={{color:'#b0c4d4',fontWeight:500,fontSize:15,marginBottom:4}}>Apelido</label>
      <input type="text" value={editApelido} onChange={e=>setEditApelido(e.target.value)} style={{width:'100%',marginBottom:12,padding:12,borderRadius:8,border:'1.5px solid #a18fff55',background:'#181f2a',color:'#fff',fontSize:16,transition:'border 0.2s'}} />
      <button className="btn-gradient" onClick={()=>onSave(editApelido)} style={{marginBottom:12,display:'flex',alignItems:'center',gap:8,justifyContent:'center',background:'#7f5fff',color:'#fff',border:'none',borderRadius:8,padding:'12px 0',fontWeight:700,fontSize:16,transition:'background 0.2s'}}>
        <span role="img" aria-label="Salvar">💾</span> Salvar
      </button>
      <button onClick={onClose} style={{background:'rgba(161,143,255,0.10)',color:'#a18fff',border:'none',borderRadius:10,padding:'14px 0',fontWeight:700,fontSize:17,transition:'background 0.2s'}}>Fechar</button>
    </div>
  );
}
export default ProfileDrawer; 