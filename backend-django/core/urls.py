from django.urls import path
from .views import login_view, activate_2fa_view, verify_2fa_view, disable_2fa_view

urlpatterns = [
    # Login e Verificação de Credenciais
    path('login/', login_view, name='api_login'),
    
    # 2FA: Ativação (Gera QR Code e Salva Chave Secreta)
    path('2fa/activate/', activate_2fa_view, name='api_2fa_activate'),
    
    # 2FA: Verificação (Segunda etapa do login)
    path('2fa/verify/', verify_2fa_view, name='api_2fa_verify'),
    
    # 2FA: Desativação (Limpa chave secreta e Is2FAEnabled)
    path('2fa/disable/', disable_2fa_view, name='api_2fa_disable'),
]