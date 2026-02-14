Projeto focado em autenticação segura que desenvolvi para integrar o Django com SQL Server e React. 
A ideia principal foi implementar o fluxo de 2FA gerando o QR Code pelo back-end e validando o token no front.

O que usei:
Back-end: Django REST Framework.
Front-end: React (Hooks e Tailwind CSS).
Banco de Dados: Microsoft SQL Server (SSMS).
Autenticação: JWT para as rotas e PyOTP para a segurança de dois fatores.

Como rodar:
No /backend-django, rode as migrações e o runserver.
No /frontend, dê um npm install e npm start.
