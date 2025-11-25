from django.db import models

class User(models.Model):
    Id = models.AutoField(primary_key=True) 
    Email = models.CharField(max_length=255, unique=True)
    PasswordHash = models.CharField(max_length=255)
    Is2FAEnabled = models.BooleanField(default=False)
    Secret2FA = models.CharField(max_length=255, null=True, blank=True)
    
    class Meta:
        db_table = 'Users' 
        managed = False # Não permitir que o Django tente criar a tabela