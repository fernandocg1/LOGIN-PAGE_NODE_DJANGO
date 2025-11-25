from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from core.auth_service import verify_password
import json

@csrf_exempt 
def login_view(request):
    if request.method == 'POST':
        try:
            # 1. Carrega os dados JSON da requisição
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')
        except json.JSONDecodeError:
            return JsonResponse({"message": "JSON inválido."}, status=400)
        
        # 2. Verifica as credenciais usando o serviço de autenticação
        user = verify_password(email, password)
        
        if user:
            return JsonResponse({
                "message": "Login bem-sucedido!", 
                "user_id": user.Id
            }, status=200)
        else:
            # Senha ou email inválido
            return JsonResponse({"message": "Credenciais inválidas. Verifique email e senha."}, status=401)
    
    return JsonResponse({"message": "Método não permitido."}, status=405)