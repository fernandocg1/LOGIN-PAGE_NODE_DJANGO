const sql = require('mssql');

const dbConfig = {
    user: 'node_user',          
    password: 'Gta$@543',  
    server: 'GADELHA_PC\\SQLEXPRESS', 
    database: 'AuthDB',         
    options: {
        encrypt: true,          
        trustServerCertificate: true
    },
    port: 1433 
};

let pool;

async function connectToDb() {
    try {
        if (!pool) {
            // Cria um pool de conexões para gerenciar as requisições
            pool = await sql.connect(dbConfig);
            console.log('SQL Server: Conexão bem-sucedida!');
        }
        return pool;
    } catch (err) {
        console.error('SQL Server: ERRO DE CONEXÃO!', err.message);
        throw new Error('Falha na conexão com o banco de dados.'); 
    }
}

async function createUser(email, passwordHash) {
    try {
        const dbPool = await connectToDb();
        
        // Query SQL para inserir um novo usuário. 
        // Usa Prepared Statements (requisição) para segurança (evitar SQL Injection).
        const result = await dbPool.request()
            .input('email', sql.NVarChar(255), email)
            .input('passwordHash', sql.NVarChar(255), passwordHash)
            .query(`
                INSERT INTO Users (Email, PasswordHash)
                VALUES (@email, @passwordHash);
            `);

        return result;

    } catch (err) {
        // Erro 2627 é a violação de UNIQUE no SQL Server (e-mail já existe)
        if (err.number === 2627) { 
            throw new Error('Email já cadastrado.');
        }
        console.error('Erro ao criar usuário:', err.message);
        throw err;
    }
}

// Exportamos as funções para serem usadas no server.js
module.exports = {
    connectToDb,
    createUser
};