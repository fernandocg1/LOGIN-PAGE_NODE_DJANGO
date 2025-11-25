# core/views.py

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from core.auth_service import verify_password, get_2fa_secret, disable_2fa # 💡 Novo import
import json
from rest_framework_simplejwt.tokens import RefreshToken 
from .auth_service import update_2fa_secret, generate_2fa_qr_code 
import pyotp
import base64 

# Funções auxiliares para gerar o token
def get_tokens_for_user(user):
    """Gera o token de acesso e refresh para o usuário."""
    # O Simple JWT requer um objeto com o atributo 'id'
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

@csrf_exempt 
def login_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')
        except json.JSONDecodeError:
            return JsonResponse({"message": "JSON inválido"}, status=400)
        
        # 1. Verifica as credenciais (seu serviço BCrypt no SQL Server)
        # Assumindo que verify_password retorna um objeto de usuário ou None
        user = verify_password(email, password)
        
        if user:
            # 💡 Etapa de 2FA no login
            # Se o 2FA estiver ativado, retorne 202 e exija o código TOTP
            # user.is_2fa_enabled deve ser True ou False com base no DB
            if user.is_2fa_enabled:
                 return JsonResponse({
                     "message": "2FA necessário. Por favor, insira o código TOTP.", 
                     "user_id": user.id,
                     "status": "2FA_REQUIRED"
                 }, status=202) # 202 Accepted (Não autenticado totalmente)
                 
            # 2. Se não houver 2FA, gera os tokens JWT
            tokens = get_tokens_for_user(user)
            
            # 3. Retorna os tokens
            return JsonResponse({
                "message": "Login bem-sucedido!", 
                "user_id": user.id, 
                "access_token": tokens['access'],
                "refresh_token": tokens['refresh'],
            }, status=200)
        else:
            return JsonResponse({"message": "Credenciais inválidas. Verifique email e senha."}, status=401)
    
    return JsonResponse({"message": "Método não permitido"}, status=405)

@csrf_exempt
def activate_2fa_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id') 
            
            if user_id is None:
                 return JsonResponse({"message": "ID do usuário não fornecido."}, status=400)
                 
        except:
            return JsonResponse({"message": "JSON inválido ou ID do usuário ausente."}, status=400)
        
        # 1. Gera a chave secreta
        # Usa pyotp.random_base32() que retorna a chave Base32 diretamente
        secret = pyotp.random_base32()
        
        # 2. Gera o QR Code e URL
        try:
            # O email é usado apenas para identificação no app autenticador
            qr_base64, totp_uri = generate_2fa_qr_code("user_id_" + str(user_id), secret)
        except Exception as e:
            return JsonResponse({"message": f"Erro ao gerar QR: {e}"}, status=500)

        # 3. Salva a chave secreta no banco de dados (Is2FAEnabled = 1)
        if update_2fa_secret(user_id, secret):
            return JsonResponse({
                "message": "2FA ativado com sucesso no DB.",
                "qr_code_base64": qr_base64,
                "secret_key": secret 
            }, status=200)
        else:
            return JsonResponse({"message": "Erro ao salvar o 2FA no DB."}, status=500)
    
    return JsonResponse({"message": "Método não permitido"}, status=405)

@csrf_exempt
def verify_2fa_view(request):
    """
    Verifica o código TOTP fornecido pelo usuário.
    Esta é a segunda etapa do login se o 2FA estiver ativo.
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id')
            totp_code = data.get('totp_code')
            
            if not all([user_id, totp_code]):
                return JsonResponse({"message": "ID do usuário e código TOTP são obrigatórios."}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({"message": "JSON inválido"}, status=400)

        # 1. Busca a chave secreta no DB
        user = get_2fa_secret(user_id) # Assumindo que esta função retorna o objeto de usuário com 'id', 'Secret2FA' e 'is_2fa_enabled'

        if not user or not user.is_2fa_enabled:
            return JsonResponse({"message": "2FA não ativado ou usuário não encontrado."}, status=404)

        if not user.Secret2FA:
             return JsonResponse({"message": "Chave secreta 2FA ausente no DB."}, status=500)

        # 2. Verifica o código TOTP
        try:
            totp = pyotp.TOTP(user.Secret2FA)
            if totp.verify(totp_code):
                # Geração de tokens JWT após a verificação bem-sucedida
                tokens = get_tokens_for_user(user) 
                
                return JsonResponse({
                    "message": "Verificação 2FA bem-sucedida. Login completo.",
                    "user_id": user.id,
                    "access_token": tokens['access'],
                    "refresh_token": tokens['refresh'],
                }, status=200)
            else:
                return JsonResponse({"message": "Código TOTP inválido."}, status=401)
        except Exception as e:
             # Em caso de erro com o pyotp (e.g., chave inválida/malformada)
            return JsonResponse({"message": f"Erro interno na verificação TOTP: {e}"}, status=500)
            
    return JsonResponse({"message": "Método não permitido"}, status=405)

@csrf_exempt
def disable_2fa_view(request):
    """Desativa o 2FA para o usuário."""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id')
            
            if user_id is None:
                 return JsonResponse({"message": "ID do usuário não fornecido."}, status=400)
                 
        except:
            return JsonResponse({"message": "JSON inválido ou ID do usuário ausente."}, status=400)

        # 1. Desativa o 2FA no banco de dados (Is2FAEnabled = 0 e limpa Secret2FA)
        if disable_2fa(user_id):
            return JsonResponse({
                "message": "2FA desativado com sucesso."
            }, status=200)
        else:
            return JsonResponse({"message": "Erro ao desativar o 2FA. O usuário pode não existir ou já estar desativado."}, status=500)
    
    return JsonResponse({"message": "Método não permitido"}, status=405)