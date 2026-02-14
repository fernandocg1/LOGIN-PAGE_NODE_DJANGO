import React, { useState, useEffect, useCallback } from 'react';

const NODE_API_URL = 'http://localhost:3000/api';
const DJANGO_API_URL = 'http://localhost:8000/api';

// --- Ícones (Mantidos fora para performance) ---
const LogIn = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>;
const User = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const Key = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m20.5 4.5-1.92 1.92"/><path d="M13 13.5l1.5-1.5"/><path d="M21 12a9 9 0 1 1-6.2-8.5"/><path d="M17 17l-4.5-4.5"/><path d="M10.5 10.5l-4.5-4.5"/></svg>;
const Check = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const Home = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;

// --- Sub-componentes (MOVIDOS PARA FORA DO APP) ---

const LoginForm = ({ handleLogin, authData, setAuthData, setCurrentPage, renderMessage, clearMessage }) => (
  <div className="p-8 bg-white shadow-xl rounded-2xl w-full max-w-sm">
    <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
      <LogIn className="w-7 h-7 mr-3 text-indigo-600"/> Login
    </h2>
    {renderMessage()}
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          value={authData.email}
          onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="seu@email.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Senha</label>
        <input
          id="password"
          type="password"
          required
          value={authData.password}
          onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="••••••••"
        />
      </div>
      <button type="submit" className="w-full py-2 px-4 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 font-medium">
        Entrar
      </button>
    </form>
    <div className="mt-4 text-center">
      <button onClick={() => { setCurrentPage('register'); clearMessage(); }} className="text-sm text-indigo-600 font-medium">
        Não tem conta? Cadastre-se
      </button>
    </div>
  </div>
);

const RegisterForm = ({ handleRegister, authData, setAuthData, setCurrentPage, renderMessage, clearMessage }) => (
  <div className="p-8 bg-white shadow-xl rounded-2xl w-full max-w-sm">
    <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
      <User className="w-7 h-7 mr-3 text-green-600"/> Cadastro
    </h2>
    {renderMessage()}
    <form onSubmit={handleRegister} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="reg-email">Email</label>
        <input
          id="reg-email"
          type="email"
          required
          value={authData.email}
          onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="reg-password">Senha</label>
        <input
          id="reg-password"
          type="password"
          required
          value={authData.password}
          onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
        />
      </div>
      <button type="submit" className="w-full py-2 px-4 rounded-lg text-white bg-green-600 hover:bg-green-700 font-medium">
        Registrar
      </button>
    </form>
    <div className="mt-4 text-center">
      <button onClick={() => { setCurrentPage('login'); clearMessage(); }} className="text-sm text-green-600 font-medium">
        Já tem conta? Fazer Login
      </button>
    </div>
  </div>
);

const TwoFAVerifyForm = ({ handle2FAVerification, authData, setAuthData, setCurrentPage, renderMessage, clearMessage }) => (
  <div className="p-8 bg-white shadow-xl rounded-2xl w-full max-w-sm">
    <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
      <Key className="w-7 h-7 mr-3 text-yellow-600"/> 2FA Necessário
    </h2>
    {renderMessage()}
    <form onSubmit={handle2FAVerification} className="space-y-4">
      <input
        type="text"
        required
        maxLength="6"
        value={authData.totpCode}
        onChange={(e) => setAuthData({ ...authData, totpCode: e.target.value })}
        className="w-full px-4 py-2 border rounded-lg text-center text-lg tracking-widest"
        placeholder="XXXXXX"
      />
      <button type="submit" className="w-full py-2 px-4 rounded-lg text-white bg-yellow-600 hover:bg-yellow-700 font-medium flex justify-center items-center">
        <Check className="w-5 h-5 mr-2"/> Verificar Código
      </button>
    </form>
    <button onClick={() => { setCurrentPage('login'); clearMessage(); }} className="mt-4 w-full text-sm text-yellow-600 font-medium">
      Voltar ao Login
    </button>
  </div>
);

const Dashboard = ({ authState, renderMessage, handle2FAEnablement, handle2FADisablement, qrCodeBase64, handleLogout }) => (
  <div className="p-8 bg-white shadow-xl rounded-2xl w-full max-w-lg">
    <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
      <Home className="w-7 h-7 mr-3 text-indigo-600"/> Dashboard
    </h2>
    {renderMessage()}
    <p className="mb-4">Seu ID: <span className="font-bold text-indigo-600">{authState.userId}</span></p>
    <div className="mt-6 p-4 border rounded-lg bg-gray-50">
      <h3 className="text-xl font-semibold mb-3 flex items-center"><Key className="w-6 h-6 mr-2 text-red-500"/> Segurança</h3>
      {!authState.requires2FA && !qrCodeBase64 && (
        <button onClick={handle2FAEnablement} className="w-full py-2 bg-green-500 text-white rounded-lg">Ativar 2FA</button>
      )}
      {authState.requires2FA && (
        <button onClick={handle2FADisablement} className="w-full py-2 bg-red-500 text-white rounded-lg">Desativar 2FA</button>
      )}
      {qrCodeBase64 && (
        <div className="mt-4 text-center">
          <img src={`data:image/png;base64,${qrCodeBase64}`} alt="QR Code" className="mx-auto w-40 h-40 border p-1" />
          <p className="text-xs mt-2">Chave: {authState.tempSecret}</p>
        </div>
      )}
    </div>
    <button onClick={handleLogout} className="mt-8 w-full py-2 border border-gray-300 rounded-lg">Sair (Logout)</button>
  </div>
);

// --- COMPONENTE PRINCIPAL APP ---
const App = () => {
  const [currentPage, setCurrentPage] = useState('login'); 
  const [authData, setAuthData] = useState({ email: '', password: '', totpCode: '' });
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    userId: null,
    accessToken: null,
    refreshToken: null,
    requires2FA: false,
    tempSecret: null,
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [qrCodeBase64, setQrCodeBase64] = useState(null);

  const clearMessage = useCallback(() => setMessage({ type: '', text: '' }), []);

  const handleApiRequest = async (url, method, body = null) => {
    clearMessage();
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : null,
      });
      const data = await response.json();
      return { status: response.status, data };
    } catch (error) {
      setMessage({ type: 'error', text: `Erro de rede: ${error.message}` });
      return { status: 500, data: null };
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await handleApiRequest(`${DJANGO_API_URL}/login/`, 'POST', { email: authData.email, password: authData.password });
    if (result.status === 200) handleSuccessfulLogin(result.data);
    else if (result.status === 202) {
      setAuthState(prev => ({ ...prev, requires2FA: true, userId: result.data.user_id }));
      setCurrentPage('2fa-verify');
      setMessage({ type: 'warning', text: result.data.message });
    }
  };

  const handleSuccessfulLogin = (data) => {
    setAuthState(prev => ({
      ...prev,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      requires2FA: data.status === '2FA_REQUIRED' || prev.requires2FA,
      userId: data.user_id || prev.userId
    }));
    setMessage({ type: 'success', text: data.message });
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setAuthState({ isAuthenticated: false, userId: null, accessToken: null, refreshToken: null, requires2FA: false, tempSecret: null });
    setCurrentPage('login');
    setMessage({ type: 'info', text: 'Logout realizado com sucesso.' });
  };

  const renderMessage = () => {
    if (!message.text) return null;
    const colors = {
      error: "bg-red-100 text-red-800 border-red-200",
      success: "bg-green-100 text-green-800 border-green-200",
      warning: "bg-yellow-100 text-yellow-800 border-yellow-200"
    };
    return (
      <div className={`p-3 mb-4 rounded-lg font-medium text-sm border ${colors[message.type] || "bg-blue-100 text-blue-800 border-blue-200"}`}>
        {message.text}
      </div>
    );
  };

  const sharedProps = { authData, setAuthData, setCurrentPage, renderMessage, clearMessage };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans antialiased">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`html { font-family: 'Inter', sans-serif; }`}</style>
      
      {currentPage === 'login' && <LoginForm handleLogin={handleLogin} {...sharedProps} />}
      {currentPage === 'register' && <RegisterForm handleRegister={async (e) => {
          e.preventDefault();
          const result = await handleApiRequest(`${NODE_API_URL}/registro`, 'POST', { email: authData.email, password: authData.password });
          if (result.status === 201) { setMessage({ type: 'success', text: 'Registro feito! Logue.' }); setCurrentPage('login'); }
      }} {...sharedProps} />}
      {currentPage === '2fa-verify' && <TwoFAVerifyForm handle2FAVerification={async (e) => {
          e.preventDefault();
          const result = await handleApiRequest(`${DJANGO_API_URL}/2fa/verify/`, 'POST', { user_id: authState.userId, totp_code: authData.totpCode });
          if (result.status === 200) handleSuccessfulLogin(result.data);
      }} {...sharedProps} />}
      {currentPage === 'dashboard' && <Dashboard 
          authState={authState} 
          renderMessage={renderMessage} 
          qrCodeBase64={qrCodeBase64}
          handleLogout={handleLogout}
          handle2FAEnablement={async () => {
              const result = await handleApiRequest(`${DJANGO_API_URL}/2fa/activate/`, 'POST', { user_id: authState.userId });
              if (result.status === 200) { setQrCodeBase64(result.data.qr_code_base64); setAuthState(prev => ({ ...prev, tempSecret: result.data.secret_key, requires2FA: true })); }
          }}
          handle2FADisablement={async () => {
              const result = await handleApiRequest(`${DJANGO_API_URL}/2fa/disable/`, 'POST', { user_id: authState.userId });
              if (result.status === 200) { setQrCodeBase64(null); setAuthState(prev => ({ ...prev, requires2FA: false })); }
          }}
      />}
    </div>
  );
};

export default App;