import React from 'react';

function NotificationsDrawer({ notifications, onAccept, onReject }) {
  return (
    <div style={{width:360,maxWidth:'95vw',background:'linear-gradient(135deg,#1a1333 0%,#232a3a 100%)',boxShadow:'0 4px 32px #7f5fff55',borderRadius:'0 18px 18px 0',padding:'36px 22px',height:'100%',overflowY:'auto'}}>
      <h2 style={{color:'#a18fff',marginBottom:18,fontWeight:800,fontSize:24,letterSpacing:1,display:'flex',alignItems:'center',gap:10}}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a18fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:'middle'}}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        Notificações
      </h2>
      {notifications.length === 0 && <div style={{color:'#fff',opacity:0.7}}>Nenhuma notificação.</div>}
      {notifications.map(n => (
        <div key={n.id} style={{background:'rgba(161,143,255,0.10)',borderRadius:14,padding:'16px 14px',marginBottom:16,boxShadow:'0 2px 8px #7f5fff11',display:'flex',alignItems:'center',gap:14,transition:'background 0.2s',border:'2px solid transparent'}}
          onMouseOver={e=>{e.currentTarget.style.background='rgba(161,143,255,0.18)';e.currentTarget.style.border='2px solid #7f5fff'}}
          onMouseOut={e=>{e.currentTarget.style.background='rgba(161,143,255,0.10)';e.currentTarget.style.border='2px solid transparent'}}
        >
          {n.tipo === 'amizade' ? <span role="img" aria-label="Pedido de amizade">➕</span> : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a18fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}
          <div style={{flex:1}}>
            <div style={{color:'#fff',fontWeight:700,fontSize:16}}>{n.texto}</div>
            <div style={{color:'#b0c4d4',fontSize:12,marginTop:2}}>{n.timestamp && new Date(n.timestamp.seconds*1000).toLocaleString()}</div>
          </div>
          {n.tipo === 'amizade' && (
            <>
              <button onClick={()=>onAccept(n)} style={{background:'#7f5fff',color:'#fff',border:'none',borderRadius:8,padding:'7px 12px',marginRight:4,fontSize:18,transition:'background 0.2s'}} title="Aceitar"><span role="img" aria-label="Aceitar">✅</span></button>
              <button onClick={()=>onReject(n)} style={{background:'#db4437',color:'#fff',border:'none',borderRadius:8,padding:'7px 12px',fontSize:18,transition:'background 0.2s'}} title="Recusar"><span role="img" aria-label="Recusar">❌</span></button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
export default NotificationsDrawer; 