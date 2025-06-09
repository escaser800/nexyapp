require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Salas em memória (substitua por banco real depois)
let salas = [
  {
    id: 'geral',
    nome: 'Geral',
    desc: 'Sala principal',
    avatar: '',
    criadorUid: 'sistema',
    criadorApelido: 'Sistema',
    privada: false,
    membros: [],
    criadaEm: new Date()
  }
];

// Firebase Admin
try {
  admin.app();
} catch (e) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
const firestore = admin.firestore();

// Rotas básicas de teste
app.get('/', (req, res) => {
  res.send('Nexy APP backend online!');
});

// Endpoint para listar salas
app.get('/api/salas', (req, res) => {
  res.json(salas);
});

// Endpoint para criar sala
app.post('/api/salas', async (req, res) => {
  const { nome, desc, avatar, criadorUid, criadorApelido } = req.body;
  if (!nome || !criadorUid || !criadorApelido) return res.status(400).json({ error: 'Nome, criadorUid e criadorApelido são obrigatórios.' });
  const novaSala = {
    id: uuidv4(),
    nome,
    desc: desc || '',
    avatar: avatar || '',
    criadorUid,
    criadorApelido,
    privada: false,
    membros: [],
    criadaEm: new Date()
  };
  salas.push(novaSala);
  try {
    await firestore.collection('salas').doc(novaSala.id).set({
      nome: novaSala.nome,
      desc: novaSala.desc,
      avatar: novaSala.avatar,
      criadorUid: novaSala.criadorUid,
      criadorApelido: novaSala.criadorApelido,
      privada: false,
      membros: [],
      criadaEm: novaSala.criadaEm,
    });
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao criar sala no Firestore', details: e.message });
  }
  res.status(201).json(novaSala);
});

// Endpoint para criar sala privada
app.post('/api/salas/privada', (req, res) => {
  const { nome, desc, membros } = req.body;
  if (!nome || !Array.isArray(membros) || membros.length === 0) {
    return res.status(400).json({ error: 'Nome e membros são obrigatórios.' });
  }
  const novaSala = { id: uuidv4(), nome, desc: desc || '', privada: true, membros, criadaEm: new Date() };
  salas.push(novaSala);
  res.status(201).json(novaSala);
});

// Endpoint para listar salas públicas e privadas do usuário
app.get('/api/salas/user/:uid', (req, res) => {
  const { uid } = req.params;
  const visiveis = salas.filter(s => !s.privada || (s.membros && s.membros.includes(uid)));
  res.json(visiveis);
});

// Endpoint para promover admin em sala
app.post('/api/salas/:salaId/admin', (req, res) => {
  const { salaId } = req.params;
  const { uid } = req.body;
  const sala = salas.find(s => s.id === salaId);
  if (!sala) return res.status(404).json({ error: 'Sala não encontrada' });
  if (!sala.admins) sala.admins = [];
  if (!sala.admins.includes(uid)) sala.admins.push(uid);
  res.json({ ok: true, admins: sala.admins });
});

// Endpoint para remover usuário de sala
app.post('/api/salas/:salaId/remover', (req, res) => {
  const { salaId } = req.params;
  const { uid } = req.body;
  const sala = salas.find(s => s.id === salaId);
  if (!sala) return res.status(404).json({ error: 'Sala não encontrada' });
  sala.membros = sala.membros.filter(m => m !== uid);
  res.json({ ok: true, membros: sala.membros });
});

// Endpoint para listar admins de uma sala
app.get('/api/salas/:salaId/admins', (req, res) => {
  const { salaId } = req.params;
  const sala = salas.find(s => s.id === salaId);
  if (!sala) return res.status(404).json({ error: 'Sala não encontrada' });
  res.json({ admins: sala.admins || [] });
});

// Endpoint para buscar mensagens de uma sala
app.get('/api/salas/:salaId/mensagens', async (req, res) => {
  const { salaId } = req.params;
  try {
    const snap = await firestore.collection('salas').doc(salaId).collection('mensagens').orderBy('timestamp').get();
    const mensagens = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(mensagens);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar mensagens', details: e.message });
  }
});

// Endpoint para enviar mensagem para uma sala
app.post('/api/salas/:salaId/mensagens', async (req, res) => {
  const { salaId } = req.params;
  const { texto, autorUid, autorApelido, avatar, timestamp } = req.body;
  if (!texto || !autorUid) return res.status(400).json({ error: 'Texto e autorUid são obrigatórios.' });
  try {
    const msg = {
      texto,
      autorUid,
      autorApelido: autorApelido || '',
      avatar: avatar || '',
      timestamp: timestamp ? admin.firestore.Timestamp.fromDate(new Date(timestamp)) : admin.firestore.FieldValue.serverTimestamp(),
    };
    const ref = await firestore.collection('salas').doc(salaId).collection('mensagens').add(msg);
    const docSnap = await ref.get();
    res.status(201).json({ id: ref.id, ...docSnap.data() });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao enviar mensagem', details: e.message });
  }
});

// Socket.io - chat em tempo real por sala
io.on('connection', (socket) => {
  console.log('Novo usuário conectado:', socket.id);

  socket.on('joinRoom', (room) => {
    socket.join(room);
    socket.to(room).emit('userJoined', socket.id);
  });

  socket.on('sendMessage', ({ room, message }) => {
    io.to(room).emit('receiveMessage', message);
  });

  socket.on('leaveRoom', (room) => {
    socket.leave(room);
  });

  socket.on('disconnect', () => {
    console.log('Usuário desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Servidor Nexy rodando em http://localhost:${PORT}`);
}); 