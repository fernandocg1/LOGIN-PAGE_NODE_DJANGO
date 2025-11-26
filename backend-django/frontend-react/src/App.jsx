import React, { useState, useEffect, useCallback } from 'react';

const NODE_API_URL = 'http://localhost:3000/api';
const DJANGO_API_URL = 'http://localhost:8000/api';

const LogIn = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>;
const User = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const Key = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m20.5 4.5-1.92 1.92"/><path d="M13 13.5l1.5-1.5"/><path d="M21 12a9 9 0 1 1-6.2-8.5"/><path d="M17 17l-4.5-4.5"/><path d="M10.5 10.5l-4.5-4.5"/></svg>;
const Check = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const Home = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;


// Componente principal
export default function App() {
  // --- Estados de Autenticação e Navegação ---
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

  const clearMessage = useCallback(() => {
    setMessage({ type: '', text: '' });
  }, []);

  const handleApiRequest = async (url, method, body = null) => {
    clearMessage();
    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : null,
      });

      const data = await response.json();
      
      if (response.status === 202 && data.status === '2FA_REQUIRED') {
          return { status: 202, data: data };
      }
      
      if (!response.ok) {
        setMessage({ type: 'error', text: data.message || `Erro ${response.status} na requisição.` });
        return { status: response.status, data: data };
      }

      return { status: response.status, data: data };
    } catch (error) {
      setMessage({ type: 'error', text: `Erro de rede: ${error.message}. Verifique se o Backend está rodando.` });
      return { status: 500, data: null };
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const { email, password } = authData;

    if (!email || !password) {
      setMessage({ type: 'error', text: 'Por favor, preencha todos os campos.' });
      return;
    }

    const result = await handleApiRequest(`${NODE_API_URL}/registro`, 'POST', { email, password });

    if (result.status === 201) {
      setMessage({ type: 'success', text: `Registro de ${email} bem-sucedido! Faça o login.` });
      setCurrentPage('login');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = authData;

    const result = await handleApiRequest(`${DJANGO_API_URL}/login/`, 'POST', { email, password });
    
    if (result.status === 200) {
      handleSuccessfulLogin(result.data);
    } else if (result.status === 202) {
      setAuthState(prev => ({ ...prev, requires2FA: true, userId: result.data.user_id }));
      setCurrentPage('2fa-verify');
      setMessage({ type: 'warning', text: result.data.message });
    }
  };
  
  const handle2FAVerification = async (e) => {
    e.preventDefault();
    const { userId } = authState;
    const { totpCode } = authData;

    const result = await handleApiRequest(`${DJANGO_API_URL}/2fa/verify/`, 'POST', { user_id: userId, totp_code: totpCode });

    if (result.status === 200) {
      handleSuccessfulLogin(result.data);
    } else {
       // A mensagem de erro já foi setada por handleApiRequest
    }
  };

  const handle2FAEnablement = async () => {
    const result = await handleApiRequest(`${DJANGO_API_URL}/2fa/activate/`, 'POST', { user_id: authState.userId });

    if (result.status === 200) {
      setQrCodeBase64(result.data.qr_code_base64);
      setAuthState(prev => ({ ...prev, tempSecret: result.data.secret_key, requires2FA: true })); // Define requires2FA como True aqui para o Dashboard
      setMessage({ type: 'success', text: result.data.message });
    }
  };

  const handle2FADisablement = async () => {
      const result = await handleApiRequest(`${DJANGO_API_URL}/2fa/disable/`, 'POST', { user_id: authState.userId });
      
      if (result.status === 200) {
          setMessage({ type: 'success', text: result.data.message });
          setAuthState(prev => ({ ...prev, requires2FA: false, tempSecret: null, qrCodeBase64: null }));
          setQrCodeBase64(null);
      }
  }

  const handleSuccessfulLogin = (data) => {
    setAuthState({
      isAuthenticated: true,
      userId: data.user_id,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      requires2FA: data.status === '2FA_REQUIRED' || authState.requires2FA 
    });
    setMessage({ type: 'success', text: data.message });
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setAuthState({
      isAuthenticated: false,
      userId: null,
      accessToken: null,
      refreshToken: null,
      requires2FA: false,
      tempSecret: null,
    });
    setCurrentPage('login');
    setMessage({ type: 'info', text: 'Logout realizado com sucesso.' });
  };

  // --- Renderização de Componentes ---

  const renderMessage = () => {
    if (!message.text) return null;
    let baseClasses = "p-3 mb-4 rounded-lg font-medium text-sm";
    let styleClasses = "";

    switch (message.type) {
      case 'error':
        styleClasses = "bg-red-100 text-red-800 border border-red-200";
        break;
      case 'success':
        styleClasses = "bg-green-100 text-green-800 border border-green-200";
        break;
      case 'warning':
        styleClasses = "bg-yellow-100 text-yellow-800 border border-yellow-200";
        break;
      default:
        styleClasses = "bg-blue-100 text-blue-800 border border-blue-200";
    }

    return (
      <div className={`${baseClasses} ${styleClasses}`} role="alert">
        {message.text}
      </div>
    );
  };
  
  // --- Formulário de Login ---
  const LoginForm = () => (
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
            name="email"
            type="email"
            required
            value={authData.email}
            onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
            placeholder="seu@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Senha</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={authData.password}
            onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
            placeholder="••••••••"
          />
        </div>
        <div>
          <button
            type="submit"
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
          >
            Entrar
          </button>
        </div>
      </form>
      <div className="mt-4 text-center">
        <button
          onClick={() => { setCurrentPage('register'); clearMessage(); }}
          className="text-sm text-indigo-600 hover:text-indigo-500 font-medium transition duration-150 ease-in-out"
        >
          Não tem conta? Cadastre-se
        </button>
      </div>
    </div>
  );

  // --- Formulário de Registro ---
  const RegisterForm = () => (
    <div className="p-8 bg-white shadow-xl rounded-2xl w-full max-w-sm">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
        <User className="w-7 h-7 mr-3 text-green-600"/> Cadastro
      </h2>
      {renderMessage()}
      <form onSubmit={handleRegister} className="space-y-4">
        {/* Campos Email e Senha (mesma lógica do Login) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="reg-email">Email</label>
          <input
            id="reg-email"
            name="email"
            type="email"
            required
            value={authData.email}
            onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition duration-150 ease-in-out"
            placeholder="seu@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="reg-password">Senha</label>
          <input
            id="reg-password"
            name="password"
            type="password"
            required
            value={authData.password}
            onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition duration-150 ease-in-out"
            placeholder="••••••••"
          />
        </div>
        <div>
          <button
            type="submit"
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out"
          >
            Registrar
          </button>
        </div>
      </form>
      <div className="mt-4 text-center">
        <button
          onClick={() => { setCurrentPage('login'); clearMessage(); }}
          className="text-sm text-green-600 hover:text-green-500 font-medium transition duration-150 ease-in-out"
        >
          Já tem conta? Fazer Login
        </button>
      </div>
    </div>
  );
  
  // --- Formulário de Verificação 2FA ---
  const TwoFAVerifyForm = () => (
    <div className="p-8 bg-white shadow-xl rounded-2xl w-full max-w-sm">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
        <Key className="w-7 h-7 mr-3 text-yellow-600"/> 2FA Necessário
      </h2>
      {renderMessage()}
      <p className="text-sm text-gray-600 mb-4">
        Por favor, insira o código de 6 dígitos do seu aplicativo autenticador.
      </p>
      <form onSubmit={handle2FAVerification} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="totpCode">Código TOTP</label>
          <input
            id="totpCode"
            name="totpCode"
            type="text"
            required
            maxLength="6"
            value={authData.totpCode}
            onChange={(e) => setAuthData({ ...authData, totpCode: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center text-lg focus:ring-yellow-500 focus:border-yellow-500 transition duration-150 ease-in-out tracking-widest"
            placeholder="XXXXXX"
          />
        </div>
        <div>
          <button
            type="submit"
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition duration-150 ease-in-out"
          >
            <Check className="w-5 h-5 mr-2"/> Verificar Código
          </button>
        </div>
      </form>
      <div className="mt-4 text-center">
        <button
          onClick={() => { setCurrentPage('login'); clearMessage(); }}
          className="text-sm text-yellow-600 hover:text-yellow-500 font-medium transition duration-150 ease-in-out"
        >
          Voltar ao Login
        </button>
      </div>
    </div>
  );
  
  // --- Dashboard e Configuração 2FA ---
  const Dashboard = () => (
    <div className="p-8 bg-white shadow-xl rounded-2xl w-full max-w-lg">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
        <Home className="w-7 h-7 mr-3 text-indigo-600"/> Dashboard de Usuário
      </h2>
      {renderMessage()}
      <p className="mb-4 text-gray-700">
        Bem-vindo! Seu ID de usuário é <span className="font-bold text-indigo-600">{authState.userId}</span>.
      </p>
      <p className="mb-6 text-sm text-gray-500">
        Status 2FA: {authState.requires2FA ? <span className="text-green-600 font-bold">ATIVO</span> : <span className="text-red-600 font-bold">INATIVO</span>}
      </p>

      {/* Seção de Gerenciamento 2FA */}
      <div className="mt-6 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold mb-3 flex items-center text-gray-800">
            <Key className="w-6 h-6 mr-2 text-red-500"/> Gerenciamento 2FA
        </h3>

        {/* 1. Ativação (Gerar QR Code) */}
        {!authState.requires2FA && !qrCodeBase64 && (
          <button
            onClick={handle2FAEnablement}
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out mb-4"
          >
            Ativar 2FA (Chave Dupla)
          </button>
        )}

        {/* 2. Desativação */}
        {authState.requires2FA && (
            <button
              onClick={handle2FADisablement}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out mb-4"
            >
              Desativar 2FA
            </button>
        )}
        
        {/* 3. Exibição do QR Code */}
        {qrCodeBase64 && (
          <div className="mt-4 p-4 border border-indigo-200 rounded-lg bg-white text-center">
            <h4 className="font-bold text-indigo-700 mb-3">Escaneie o QR Code</h4>
            <div className="flex justify-center mb-4">
              {/* Renderiza o QR Code a partir da string Base64 */}
              <img 
                src={`data:image/png;base64,${qrCodeBase64}`} 
                alt="QR Code para 2FA" 
                className="w-40 h-40 border p-1"
              />
            </div>
            <p className="text-xs text-gray-500 break-words">
              Chave Secreta: <span className="font-mono text-indigo-600">{authState.tempSecret}</span>
            </p>
            <p className="text-xs text-red-500 mt-2">
                <strong>ATENÇÃO:</strong> Esta chave é mostrada apenas uma vez.
            </p>
          </div>
        )}

      </div>
      
      <div className="mt-8">
        <p className="text-sm text-gray-500 mb-2">
            Token de Acesso (Expira em 5 min): <span className="font-mono text-xs break-all text-gray-700">{authState.accessToken ? authState.accessToken.substring(0, 30) + '...' : 'N/A'}</span>
        </p>
        <button
          onClick={handleLogout}
          className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 transition duration-150 ease-in-out"
        >
          Sair (Logout)
        </button>
      </div>
    </div>
  );


  // --- Estrutura Principal da Aplicação ---
  let content;
  switch (currentPage) {
    case 'register':
      content = <RegisterForm />;
      break;
    case '2fa-verify':
      content = <TwoFAVerifyForm />;
      break;
    case 'dashboard':
      content = <Dashboard />;
      break;
    case 'login':
    default:
      content = <LoginForm />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans antialiased">
      {/* O Tailwind CSS é carregado no <head> */}
      {content}
    </div>
  );
};

// ⚠️ Usamos ReactDOM.render para rodar o React no HTML Puro
const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);