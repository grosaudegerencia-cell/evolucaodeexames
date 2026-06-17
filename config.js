// ============================================================
//  config.js — Configurações da GRO Saúde
// ============================================================

const GRO_CONFIG = {

  // ============================================================
  //  GOOGLE SHEETS — Planilha PRÓPRIA do Sistema
  // ============================================================
  //  Planilha dedicada do sistema (criada no Drive da GRO Saúde):
  //  "Sistema GRO Saúde — Agendamentos"
  //  https://docs.google.com/spreadsheets/d/14O4xjAW5NtxaP8boO2Ng0ubBIdG-A6YuCoKO3dvbiLM/edit
  //
  //  Esta planilha:
  //   • recebe TODOS os agendamentos feitos na Agenda do site
  //   • envia automaticamente o RELATÓRIO DIÁRIO por e-mail (toda tarde)
  //  O motor disso é o Apps Script (arquivo apps-script.gs).
  // ============================================================
  SHEET_ID:          '14O4xjAW5NtxaP8boO2Ng0ubBIdG-A6YuCoKO3dvbiLM',
  SHEET_ABA:         'Agendamentos',
  SHEET_ABA_AGENDA:  'Agendamentos',
  USAR_SHEETS:       false,   // dashboard analítico continua usando data.js (histórico)

  // E-mail que recebe o relatório diário (configurado no apps-script.gs)
  EMAIL_RELATORIO:   'e-protecao@hotmail.com',

  // ============================================================
  //  GRAVAÇÃO AUTOMÁTICA (Agenda do site -> planilha do sistema)
  // ============================================================
  //  Depois de publicar o Apps Script como "App da Web" (veja as
  //  instruções no início do arquivo apps-script.gs), cole aqui a
  //  URL gerada. A partir daí, cada vaga agendada na Agenda é
  //  gravada na planilha automaticamente.
  // ============================================================
  SHEETS_URL: 'https://script.google.com/macros/s/AKfycbwLZ6_Fv7OS8LVdj_yOszJhrlXGXltCo04AxVeA4etLixuFVf07EL2wVWYtn4BGgdkz/exec',

  // ============================================================
  //  USUÁRIOS DO SISTEMA
  // ============================================================
  //  Estes são os usuários padrão (sempre disponíveis).
  //  O admin pode criar/remover usuários adicionais pela tela
  //  "Gerenciar Usuários" (ficam salvos no navegador).
  //  Senhas em Base64 — gere em btoa('senha') no console (F12).
  USERS: [
    { username: 'admin',    passwordB64: 'Z3JvQDIwMjY=',     role: 'admin',  name: 'Administrador GRO', fixo: true },
    { username: 'recepcao', passwordB64: 'cmVjZXBAMjAyNg==', role: 'user',   name: 'Recepção GRO',      fixo: true },
    { username: 'medico',   passwordB64: 'bWVkQDIwMjY=',     role: 'medico', name: 'Médico',            fixo: true },
  ],

  CLINICA: {
    nome:   'GRO Saúde',
    slogan: 'Gestão de Segurança e Medicina Ocupacional',
  }
};

// URL pública de leitura da planilha (CSV via gviz) — montada automaticamente
GRO_CONFIG.getSheetCsvUrl = function(aba) {
  const nome = aba || this.SHEET_ABA;
  return `https://docs.google.com/spreadsheets/d/${this.SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(nome)}`;
};
GRO_CONFIG.getSheetEditUrl = function() {
  return `https://docs.google.com/spreadsheets/d/${this.SHEET_ID}/edit`;
};
