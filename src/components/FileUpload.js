import React, { useRef, useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function FileUpload({ salaId, dmId }) {
  const fileRef = useRef();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setProgress(0);
    const storage = getStorage();
    const path = salaId ? `salas/${salaId}/${file.name}` : `dms/${dmId}/${file.name}`;
    const storageRef = ref(storage, path);
    // Upload com progresso
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on('state_changed', (snapshot) => {
      const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      setProgress(prog);
    });
    await uploadTask;
    const url = await getDownloadURL(storageRef);
    // Envia mensagem com link do arquivo
    const user = auth.currentUser;
    if (salaId) {
      await addDoc(collection(db, 'salas', salaId, 'mensagens'), {
        texto: `Arquivo: ${file.name}`,
        arquivo: url,
        autor: user.uid,
        timestamp: serverTimestamp(),
      });
    } else if (dmId) {
      await addDoc(collection(db, 'dms', dmId, 'mensagens'), {
        texto: `Arquivo: ${file.name}`,
        arquivo: url,
        autor: user.uid,
        timestamp: serverTimestamp(),
      });
    }
    setLoading(false);
    setProgress(0);
    fileRef.current.value = '';
  };

  return (
    <div style={{margin:'8px 0'}}>
      <input type="file" ref={fileRef} onChange={handleFile} disabled={loading} style={{color:'#fff'}} />
      {loading && <span style={{color:'#00c6ff',marginLeft:8}}>Enviando... {progress}%</span>}
      {progress > 0 && progress < 100 && (
        <div style={{width: '100%', background: '#232a3a', borderRadius: 4, marginTop: 4}}>
          <div style={{width: `${progress}%`, height: 6, background: '#00c6ff', borderRadius: 4}} />
        </div>
      )}
    </div>
  );
}

export default FileUpload; 