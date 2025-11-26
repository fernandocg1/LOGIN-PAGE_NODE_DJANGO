from django.urls import path
from .views import login_view, activate_2fa_view, verify_2fa_view, disable_2fa_view

urlpatterns = [
    # Login e Verificação de Credenciais
    path('login/', login_view, name='api_login'),
    path('2fa/activate/', activate_2fa_view, name='api_2fa_activate'),
    path('2fa/verify/', verify_2fa_view, name='api_2fa_verify'),
    path('2fa/disable/', disable_2fa_view, name='api_2fa_disable'),
]