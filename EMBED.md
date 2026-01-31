# Guia de Integração via Iframe

A plataforma **CodeKids** pode ser facilmente incorporada (embed) em outros sites, sistemas de gestão escolar (LMS) ou portais educacionais utilizando a tag HTML `<iframe>`.

## Código Básico de Incorporação

Para adicionar a plataforma ao seu site, utilize o seguinte código HTML:

```html
<iframe 
    src="https://seu-endereco-do-servidor.com/" 
    width="100%" 
    height="600px" 
    frameborder="0" 
    allow="bluetooth; microphone; camera"
    allowfullscreen>
</iframe>
```

### Explicação dos Atributos

- **src**: A URL onde a plataforma CodeKids está hospedada.
- **width/height**: Define as dimensões do editor. Recomendamos usar `100%` de largura e pelo menos `600px` de altura para uma boa experiência de uso.
- **allow="bluetooth"**: **CRÍTICO**. Este atributo é obrigatório para permitir que o navegador acesse o Bluetooth do dispositivo do aluno para conectar ao LEGO WeDo 2.0.
- **allowfullscreen**: Permite que o editor seja expandido para tela cheia.

## Requisitos de Hospedagem (Backend)

Para que as funcionalidades de personalização (Nome do Sistema, Logo) funcionem, a aplicação deve ser servida através do servidor Node.js incluído.

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Inicie o servidor:
   ```bash
   node server.js
   ```

O servidor rodará por padrão na porta `3000`.

## Personalização (White Label)

O administrador do sistema pode alterar o nome da plataforma e a logo diretamente pela interface:

1. Clique no botão de **Configurações** (ícone de engrenagem) na barra de ferramentas.
2. Altere o **Nome do Sistema**.
3. Escolha entre **Texto** ou **Imagem** para a logo.
4. Clique em **Salvar**.

As alterações são salvas no arquivo `config.json` no servidor e refletidas imediatamente para todos os usuários.

## Permissões de Navegador

Para o funcionamento correto do Bluetooth (Web Bluetooth API), o site onde o iframe está hospedado deve ser servido via **HTTPS** (ou ser `localhost` para testes). O Chrome e o Edge bloqueiam o acesso ao Bluetooth em conexões não seguras (HTTP).
