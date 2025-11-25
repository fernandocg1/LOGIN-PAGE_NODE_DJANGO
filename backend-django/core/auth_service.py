# core/auth_service.py

import bcrypt
import pyodbc 
from core.models import User
import os

SQL_CONN_STR = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=GADELHA_PC\\SQLEXPRESS,1433;"
    "DATABASE=AuthDB;"
    "UID=node_user;"
    "PWD=Gta$@543;" 
)

def verify_password(email, password):
    """Verifica a senha plana contra o hash armazenado no SQL Server."""
    
    try:
        cnxn = pyodbc.connect(SQL_CONN_STR)
        cursor = cnxn.cursor()
        
        cursor.execute("SELECT PasswordHash, Id FROM Users WHERE Email=?", email)
        row = cursor.fetchone()
        
        cursor.close()
        cnxn.close()

        if not row:
            return None # Usuário não encontrado
        
        password_hash = row[0].encode('utf-8')
        user_id = row[1]
        
    except Exception as e:
        print(f"Erro na conexão pyodbc ou busca: {e}")
        return None
        
    try:
        plain_password_bytes = password.encode('utf-8')
        is_valid = bcrypt.checkpw(plain_password_bytes, password_hash)
        
        if is_valid:
            class FakeUser:
                def __init__(self, user_id):
                    self.Id = user_id
                
            return FakeUser(user_id) 
        else:
            return None 
            
    except Exception as e:
        print(f"Erro na verificação BCrypt: {e}")
        return None
