const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs'); 
const { connectToDb, createUser } = require('./db-service'); 

const app = express();
const PORT = 3000;

// Middleware para analisar requisições JSON (necessário para receber dados do frontend)
app.use(express.json());

app.use(cors({
        origin: '*', // Permite TODAS as origens (somente em desenvolvimento)
        methods: ['GET', 'POST'],
    }));
    
    app.use(express.json());
// --- Endpoint de Registro ---
app.post('/api/registro', async (req, res) => {
    const { email, password } = req.body;

    // 1. Validação básica
    if (!email || !password) {
        return res.status(400).send({ message: 'E-mail e senha são obrigatórios.' });
    }

    try {
        // 2. Hashing da Senha (com salt gerado automaticamente pelo fator de custo 10)
        const passwordHash = await bcrypt.hash(password, 10);
        
        // 3. Salvar no Banco de Dados
        await createUser(email, passwordHash); 
        
        // 4. Retornar sucesso
        res.status(201).send({ message: 'Usuário registrado com sucesso!' });

    } catch (error) {
        // Tratamento de erro de e-mail duplicado vindo do db-service
        if (error.message === 'Email já cadastrado.') {
             return res.status(409).send({ message: 'Este e-mail já está em uso.' }); // 409 Conflict
        }
        
        // Outros erros internos
        console.error('Erro no registro:', error);
        res.status(500).send({ message: 'Erro interno ao registrar usuário.' });
    }
});

// Inicialização do servidor
app.listen(PORT, async () => {
    await connectToDb(); // Tenta conectar ao DB na inicialização
    console.log(`Servidor Node.js rodando em http://localhost:${PORT}`);
});
