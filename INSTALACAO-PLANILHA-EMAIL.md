# Ativar planilha própria + relatório diário por e-mail

O sistema já tem uma **planilha própria** e o código pronto para:
- gravar automaticamente os agendamentos da Agenda na planilha;
- enviar o **relatório do dia por e-mail** para **e-protecao@hotmail.com** toda tarde (17h30).

Falta apenas **publicar o motor (Apps Script)** — uma configuração única de ~3 minutos que só você pode fazer (exige autorizar e-mail e planilha na sua conta Google).

---

## Passo a passo

### 1. Abra a planilha do sistema
👉 https://docs.google.com/spreadsheets/d/14O4xjAW5NtxaP8boO2Ng0ubBIdG-A6YuCoKO3dvbiLM/edit

### 2. Abra o editor de script
Menu **Extensões → Apps Script**.

### 3. Cole o código
Apague o que estiver lá, abra o arquivo **`apps-script.gs`** deste repositório, copie **todo** o conteúdo e cole. Clique no **disquete** (Salvar).

### 4. Instale o sistema (cria abas + agenda o e-mail)
No topo, no seletor de função, escolha **`instalarSistema`** e clique em **▶ Executar**.
- O Google vai pedir autorização → **Revisar permissões** → escolha sua conta → **Avançado → Acessar (não seguro)** → **Permitir**.
- *(Esse aviso "não seguro" é normal: é o seu próprio script acessando sua planilha e e-mail.)*

Pronto: a partir daqui o **relatório diário às 17h30** já está agendado. ✅

### 5. Publique como App da Web (para o site gravar na planilha)
- **Implantar → Nova implantação**
- Engrenagem ⚙ → tipo **App da Web**
- **Executar como:** Eu
- **Quem pode acessar:** Qualquer pessoa
- **Implantar** → copie a **URL do app da Web** (termina em `/exec`)

### 6. Cole a URL no sistema
No arquivo **`config.js`**, campo `SHEETS_URL`, cole a URL entre as aspas:
```js
SHEETS_URL: 'https://script.google.com/macros/s/AKfyc.../exec',
```
Me avise que eu publico essa alteração — ou edite e faça commit você mesmo.

---

## Como testar agora (sem esperar as 17h30)
No editor do Apps Script, escolha a função **`enviarRelatorioDiario`** e clique em **▶ Executar**.
O e-mail do dia chega na hora em **e-protecao@hotmail.com**.

## Para mudar o horário ou o e-mail
No topo do `apps-script.gs`:
```js
var EMAIL_RELATORIO = 'e-protecao@hotmail.com';
var HORA_ENVIO      = 17;
  var MINUTO_ENVIO    = 30;   // troque o horário aqui
```
Depois rode **`instalarSistema`** de novo para aplicar.
