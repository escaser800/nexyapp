import React from 'react';

function DmDrawer({ friendsData, onSelectFriend, onClose }) {
  return (
    <div style={{width:360,maxWidth:'95vw',background:'linear-gradient(135deg,#1a1333 0%,#232a3a 100%)',boxShadow:'0 4px 32px #7f5fff55',borderRadius:'0 18px 18px 0',padding:'36px 22px',height:'100%',overflowY:'auto',display:'flex',flexDirection:'column',gap:22}}>
      <h2 style={{color:'#a18fff',marginBottom:8,fontWeight:800,fontSize:24,letterSpacing:1}}>Suas DMs</h2>
      {friendsData.length === 0 && <div style={{color:'#fff',opacity:0.7}}>Nenhum amigo para conversar.</div>}
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {friendsData.map(f => (
          <div key={f.uid} onClick={()=>onSelectFriend(f.uid)} style={{display:'flex',alignItems:'center',gap:16,background:'rgba(161,143,255,0.10)',borderRadius:16,padding:'16px 18px',boxShadow:'0 2px 12px #7f5fff22',cursor:'pointer',transition:'box-shadow 0.2s,transform 0.2s',border:'2px solid transparent'}}
            onMouseOver={e=>{e.currentTarget.style.boxShadow='0 4px 24px #7f5fff44';e.currentTarget.style.border='2px solid #7f5fff'}}
            onMouseOut={e=>{e.currentTarget.style.boxShadow='0 2px 12px #7f5fff22';e.currentTarget.style.border='2px solid transparent'}}
          >
            <div style={{width:44,height:44,borderRadius:'50%',background:'#7f5fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',color:'#fff',fontSize:22,boxShadow:'0 2px 8px #7f5fff55'}}>
              {f.apelido ? f.apelido[0].toUpperCase() : 'U'}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:18,color:'#fff',textOverflow:'ellipsis',overflow:'hidden',whiteSpace:'nowrap'}}>{f.apelido}</div>
              <div style={{fontSize:13,color:'#b0c4d4'}}>Clique para conversar</div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onClose} style={{background:'rgba(161,143,255,0.10)',color:'#a18fff',border:'none',borderRadius:10,padding:'14px 0',fontWeight:700,marginTop:22,fontSize:17,transition:'background 0.2s'}}>Fechar</button>
    </div>
  );
}
export default DmDrawer; 