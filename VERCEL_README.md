# Deploy no Vercel e Configuração

Este projeto foi adaptado para funcionar tanto em servidor local quanto em hospedagem estática/serverless como a **Vercel**.

## Como funciona a persistência de dados?

1.  **Modo Local (Node.js)**:
    *   As configurações são salvas no arquivo `config.json`.
    *   O login é verificado contra `users.json`.
    *   Tudo é persistente no servidor.

2.  **Modo Vercel / Static**:
    *   Como a Vercel não permite salvar arquivos (`fs.writeFile` não persiste), o sistema detecta isso automaticamente.
    *   As configurações (Nome do Sistema, Logo) são salvas no **Navegador do Usuário (LocalStorage)**.
    *   O login é validado localmente (Admin / 123) ou via API se configurado banco de dados externo.
    *   **Vantagem**: Funciona instantaneamente sem configurar banco de dados.
    *   **Limitação**: Se você mudar o logo, apenas *você* verá a mudança naquele navegador. Outros usuários verão o padrão até mudarem o deles.

## Credenciais Padrão
*   **Usuário**: admin
*   **Senha**: 123

## Deploy na Vercel
1.  Faça push para o GitHub.
2.  Importe o projeto na Vercel.
3.  O arquivo `vercel.json` já configura tudo automaticamente.
