import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';
import { auth } from './firebase';

function PrivateRoute({ children }) {
  const [user, setUser] = React.useState(undefined);

  React.useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => setUser(u));
    return () => unsub();
  }, []);

  if (user === undefined) return null; // Pode exibir um loading aqui

  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const [user, setUser] = React.useState(undefined);

  React.useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => setUser(u));
    return () => unsub();
  }, []);

  if (user === undefined) return null;

  return !user ? children : <Navigate to="/chat" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        <Route path="/chat/*" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        } />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/chat" />} />
      </Routes>
    </Router>
  );
}

export default App; 