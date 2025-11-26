# core/auth_service.py

import base64       
import pyotp      
import bcrypt
import pyodbc     
from io import BytesIO
import qrcode       

SQL_CONN_STR = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=GADELHA_PC\\SQLEXPRESS,1433;"
    "DATABASE=AuthDB;"
    "UID=node_user;"
    "PWD=Gta$@543;" 
)

class FakeUser:
    """Objeto auxiliar para simular o modelo ORM para JWT e 2FA."""
    def __init__(self, user_id, is_2fa_enabled, secret_2fa=None):
        self.id = user_id                 
        self.is_authenticated = True
        self.is_2fa_enabled = is_2fa_enabled 
        self.Secret2FA = secret_2fa        
        
def verify_password(email, password):
    """
    Verifica a senha plana contra o hash armazenado no SQL Server.
    Busca Hash, Status 2FA e Chave Secreta do DB.
    """
    try:
        cnxn = pyodbc.connect(SQL_CONN_STR)
        cursor = cnxn.cursor()
        
        cursor.execute("SELECT PasswordHash, Id, Is2FAEnabled, Secret2FA FROM Users WHERE Email=?", email)
        row = cursor.fetchone()
        
        cursor.close()
        cnxn.close()

        if not row:
            return None 
        
        password_hash = row[0].encode('utf-8')
        user_id = row[1]
        is_2fa_enabled = row[2]
        secret_2fa = row[3] 
        
    except Exception as e:
        print(f"Erro na conexão pyodbc ou busca (verify_password): {e}")
        return None
        
    try:
        plain_password_bytes = password.encode('utf-8')
        is_valid = bcrypt.checkpw(plain_password_bytes, password_hash)
        
        if is_valid:
            return FakeUser(user_id, is_2fa_enabled, secret_2fa)
        else:
            return None 
            
    except Exception as e:
        print(f"Erro na verificação BCrypt: {e}")
        return None

def update_2fa_secret(user_id, secret):
    """
    Atualiza a chave secreta de 2FA e ativa o recurso (Is2FAEnabled = 1).
    (Necessária para activate_2fa_view)
    """
    try:
        cnxn = pyodbc.connect(SQL_CONN_STR)
        cursor = cnxn.cursor()
        
        is_enabled = 1 if secret else 0 
        
        cursor.execute("""
            UPDATE Users 
            SET Secret2FA = ?, Is2FAEnabled = ?
            WHERE Id = ?
        """, secret, is_enabled, user_id)
        
        cnxn.commit()
        cnxn.close()
        return True
    except Exception as e:
        print(f"Erro ao salvar o 2FA no DB (update_2fa_secret): {e}")
        return False

def get_2fa_secret(user_id):
    """
    Lê a chave secreta e o status de 2FA do SQL Server.
    (Necessária para verify_2fa_view)
    """
    try:
        cnxn = pyodbc.connect(SQL_CONN_STR)
        cursor = cnxn.cursor()
        cursor.execute("SELECT Id, Is2FAEnabled, Secret2FA FROM Users WHERE Id=?", user_id)
        row = cursor.fetchone()
        cnxn.close()
        
        if row:
            return FakeUser(row[0], row[1], row[2])
        return None
        
    except Exception as e:
        print(f"Erro ao ler Secret2FA (get_2fa_secret): {e}")
        return None

def disable_2fa(user_id):
    """
    Desativa o 2FA (seta Is2FAEnabled = 0 e limpa Secret2FA).
    (Necessária para disable_2fa_view)
    """
    try:
        cnxn = pyodbc.connect(SQL_CONN_STR)
        cursor = cnxn.cursor()
        
        cursor.execute("""
            UPDATE Users 
            SET Secret2FA = NULL, Is2FAEnabled = 0
            WHERE Id = ?
        """, user_id)
        
        cnxn.commit()
        cnxn.close()
        return True
    except Exception as e:
        print(f"Erro ao desativar o 2FA no DB (disable_2fa): {e}")
        return False

def generate_2fa_qr_code(email, secret):
    """Gera a URL de provisionamento e o código QR."""
    
    app_name = "AuthProject" 
    
    # 1. Gera a URL TOTP
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=email,
        issuer_name=app_name
    )
    
    # 2. Gera o QR Code em formato base64
    qr = qrcode.make(totp_uri)
    buf = BytesIO()
    qr.save(buf, format="PNG")
    
    return base64.b64encode(buf.getvalue()).decode('utf-8'), totp_uri