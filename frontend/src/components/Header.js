import React from 'react';

function Header() {
  return (
    <header style={{position:'fixed',top:0,left:0,width:'100%',height:60,display:'flex',alignItems:'center',justifyContent:'space-between',background:'linear-gradient(90deg,#232a3a 60%,#00c6ff 100%)',padding:'0 32px',boxShadow:'0 2px 8px #00c6ff22',zIndex:100}}>
      {/* <div style={{fontWeight:'bold',fontSize:20,color:'#fff',letterSpacing:1}}>Chat Geral</div> */}
      <div style={{display:'flex',alignItems:'center',gap:18}}>
        <span style={{color:'#00ffb3',fontWeight:'bold',fontSize:14}}>Online</span>
        <button className="btn-gradient" style={{padding:'8px 18px',fontSize:15}}>Perfil</button>
      </div>
    </header>
  );
}
export default Header; 