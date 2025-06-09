import React, { useState } from 'react';

const icons = {
  chat: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  ),
  dms: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>
  ),
  amigos: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><path d="M7 10v4M17 10v4M7 14h10"/></svg>
  ),
  notificacoes: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  ),
  salas: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9"/>
      <line x1="4" y1="15" x2="20" y2="15"/>
      <line x1="10" y1="3" x2="8" y2="21"/>
      <line x1="16" y1="3" x2="14" y2="21"/>
    </svg>
  ),
  perfil: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>
  ),
  buscar: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  ),
  sair: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff6a00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
  )
};

const btns = [
  { key: 'chat', label: 'Chat Geral', handler: 'onOpenChatGeral' },
  { key: 'dms', label: 'DMs', handler: 'onOpenDms' },
  { key: 'amigos', label: 'Amigos', handler: 'onOpenFriends' },
  { key: 'notificacoes', label: 'Notificações', handler: 'onOpenNotifications' },
  { key: 'salas', label: 'Salas', handler: 'onOpenSalas' },
  { key: 'perfil', label: 'Perfil', handler: 'onOpenProfile' },
  { key: 'buscar', label: 'Buscar', handler: 'onOpenSearch' },
];

function Sidebar({
  onOpenChatGeral, onOpenDms, onOpenFriends, onOpenNotifications, onOpenProfile, onOpenSearch, onOpenSalas, onLogout, active, user, badges = {}
}) {
  const [collapsed, setCollapsed] = useState(false);
  const safe = fn => typeof fn === 'function' ? fn : () => {};
  const handlers = {
    onOpenChatGeral,
    onOpenDms,
    onOpenFriends,
    onOpenNotifications,
    onOpenProfile,
    onOpenSearch,
    onOpenSalas,
  };
  const theme = {
    bg: 'linear-gradient(135deg,#1a1333 0%,#232a3a 100%)',
    border: '#3a2e5a',
    icon: '#a18fff',
    iconActive: '#fff',
    btnHover: 'rgba(161,143,255,0.12)',
    btnActive: 'linear-gradient(90deg,#7f5fff 0%,#00c6ff 100%)',
    tooltip: '#232a3a',
  };
  return (
    <aside style={{
      width: collapsed ? 72 : 96,
      background: theme.bg,
      borderRight: `2px solid ${theme.border}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 0', transition: 'width 0.2s', minHeight: '100vh', position: 'relative', zIndex: 10
    }}>
      <div style={{marginBottom:36, width:'100%', display:'flex', justifyContent:'center', alignItems:'center'}}>
        <span style={{fontFamily:'Orbitron',fontSize:32,color:'#a18fff',fontWeight:'bold',letterSpacing:2,transition:'color 0.2s'}}>N</span>
      </div>
      <button
        onClick={()=>setCollapsed(!collapsed)}
        style={{background:'none',border:'none',color:theme.icon,marginBottom:24,cursor:'pointer',transition:'color 0.2s'}}
        title={collapsed ? 'Expandir' : 'Colapsar'}
      >
        {collapsed ? <span style={{fontSize:22}}>»</span> : <span style={{fontSize:22}}>«</span>}
      </button>
      <nav style={{display:'flex',flexDirection:'column',gap:collapsed?8:18,width:'100%',alignItems:'center'}}>
        {btns.map(btn => (
          <div key={btn.key} style={{position:'relative',width:'100%',display:'flex',justifyContent:'center',alignItems:'center'}}>
            <button
              onClick={safe(handlers[btn.handler])}
              style={{
                margin:'0 0',width:collapsed?48:64,height:collapsed?48:64,borderRadius:16,
                background: active===btn.key ? theme.btnActive : 'none',
                border: active===btn.key ? `2px solid ${theme.icon}` : 'none',
                display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
                transition:'background 0.2s,border 0.2s',
                color: active===btn.key ? theme.iconActive : theme.icon,
                position:'relative',
              }}
              title={btn.label}
            >
              {icons[btn.key]}
              {!collapsed && (
                <span style={{
                  position:'absolute',left:70,background:theme.tooltip,color:'#fff',padding:'4px 12px',borderRadius:8,fontSize:14,whiteSpace:'nowrap',opacity:0,transition:'opacity 0.2s',pointerEvents:'none',zIndex:20
                }} className="sidebar-tooltip">{btn.label}</span>
              )}
            </button>
            {/* Badge numérico */}
            {badges[btn.key] > 0 && (
              <span style={{position:'absolute',top:6,right:collapsed?10:18,minWidth:22,height:22,background:'#ff3b3b',color:'#fff',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,padding:'0 6px',boxShadow:'0 2px 8px #0004',zIndex:30}}>{badges[btn.key]}</span>
            )}
          </div>
        ))}
      </nav>
      <button
        onClick={safe(onLogout)}
        style={{margin:'18px 0 0 0',width:collapsed?48:64,height:collapsed?48:64,borderRadius:16,background:'none',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'background 0.2s',color:'#ff6a00'}}
        title="Sair"
      >
        {icons.sair}
        {!collapsed && (
          <span style={{position:'absolute',left:70,background:theme.tooltip,color:'#fff',padding:'4px 12px',borderRadius:8,fontSize:14,whiteSpace:'nowrap',opacity:0,transition:'opacity 0.2s',pointerEvents:'none',zIndex:20}} className="sidebar-tooltip">Sair</span>
        )}
      </button>
    </aside>
  );
}

export default Sidebar; 