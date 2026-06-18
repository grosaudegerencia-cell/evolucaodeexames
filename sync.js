// ============================================================
//  sync.js — Sincronização com o Google Sheets (backend Apps Script)
//  Mantém usuários, agendamentos, exames, tipos, empresas e config
//  iguais em TODOS os dispositivos. O localStorage vira apenas cache.
//
//  Requer: GRO_CONFIG.SHEETS_URL apontando para o App da Web publicado
//          (apps-script.gs) e GRO_CONFIG.SYNC_ENABLED = true.
// ============================================================

const GRO_SYNC = {
  // Chaves de cache no localStorage (as mesmas que db.js/auth.js já usam)
  K_USERS: 'gro_usuarios_extra',
  K_PROC:  'gro_procedimentos_cad',
  K_TIPOS: 'gro_tipos_cad',
  K_EMP:   'gro_empresas_cad',
  K_AG:    'gro_agendamentos',
  K_CFG:   'gro_cfg_agenda',
  K_TS:    'gro_sync_ts',

  ativo() {
    return typeof GRO_CONFIG !== 'undefined' && GRO_CONFIG.SYNC_ENABLED && !!GRO_CONFIG.SHEETS_URL;
  },

  // ---------- PULL: baixa tudo da planilha para o cache local ----------
  async puxarTudo(timeoutMs) {
    if (!this.ativo()) return { ok:false, motivo:'sync desativado' };
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs || 8000);
    try {
      const url = GRO_CONFIG.SHEETS_URL + '?action=getAll&_=' + Date.now();
      const resp = await fetch(url, { signal: ctrl.signal, redirect:'follow' });
      clearTimeout(t);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const d = await resp.json();
      if (!d || !d.success) throw new Error('resposta inválida');

      // Grava cada coleção no cache APENAS quando vier conteúdo do servidor.
      // (evita que uma planilha ainda vazia apague o cache local não sincronizado)
      if (Array.isArray(d.usuarios) && d.usuarios.length)
                                          localStorage.setItem(this.K_USERS, JSON.stringify(d.usuarios));
      if (Array.isArray(d.procedimentos) && d.procedimentos.length)
                                          localStorage.setItem(this.K_PROC, JSON.stringify(d.procedimentos));
      if (Array.isArray(d.tipos) && d.tipos.length)
                                          localStorage.setItem(this.K_TIPOS, JSON.stringify(d.tipos));
      if (Array.isArray(d.empresas) && d.empresas.length)
                                          localStorage.setItem(this.K_EMP, JSON.stringify(d.empresas));
      if (Array.isArray(d.agendamentos) && d.agendamentos.length)
                                          localStorage.setItem(this.K_AG, JSON.stringify(d.agendamentos));
      if (d.config)                       localStorage.setItem(this.K_CFG, JSON.stringify(d.config));

      localStorage.setItem(this.K_TS, String(Date.now()));
      return { ok:true, dados:d };
    } catch (e) {
      clearTimeout(t);
      return { ok:false, motivo: e.message || String(e) };
    }
  },

  // ---------- PUSH: envia uma alteração para a planilha ----------
  //  Usa Content-Type text/plain (requisição "simples", sem preflight CORS),
  //  permitindo ler a resposta. Fila local garante reenvio se cair a rede.
  async enviar(action, data) {
    if (!this.ativo()) return { ok:false, motivo:'sync desativado' };
    try {
      const resp = await fetch(GRO_CONFIG.SHEETS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, data }),
        redirect: 'follow',
      });
      const txt = await resp.text();
      let json = {}; try { json = JSON.parse(txt); } catch {}
      if (json && json.error) throw new Error(json.error);
      return { ok:true, resp: json };
    } catch (e) {
      this.enfileirar(action, data);   // guarda p/ reenviar depois
      return { ok:false, motivo: e.message || String(e) };
    }
  },

  // ---------- Fila de reenvio (resiliência offline) ----------
  FILA_KEY: 'gro_sync_fila',
  enfileirar(action, data) {
    try {
      const fila = JSON.parse(localStorage.getItem(this.FILA_KEY)) || [];
      fila.push({ action, data, ts: Date.now() });
      localStorage.setItem(this.FILA_KEY, JSON.stringify(fila));
    } catch {}
  },
  async processarFila() {
    if (!this.ativo()) return;
    let fila = [];
    try { fila = JSON.parse(localStorage.getItem(this.FILA_KEY)) || []; } catch {}
    if (!fila.length) return;
    const restantes = [];
    for (const item of fila) {
      const r = await this.enviarDireto(item.action, item.data);
      if (!r.ok) restantes.push(item);
    }
    localStorage.setItem(this.FILA_KEY, JSON.stringify(restantes));
  },
  // envia sem reenfileirar (usado pela própria fila)
  async enviarDireto(action, data) {
    try {
      const resp = await fetch(GRO_CONFIG.SHEETS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, data }),
        redirect: 'follow',
      });
      const txt = await resp.text();
      let json = {}; try { json = JSON.parse(txt); } catch {}
      if (json && json.error) throw new Error(json.error);
      return { ok:true };
    } catch (e) { return { ok:false }; }
  },

  // Indicador visual opcional (usa um elemento #syncStatus se existir)
  marcar(texto, cor) {
    const el = document.getElementById('syncStatus');
    if (el) { el.textContent = texto; if (cor) el.style.color = cor; }
  },

  // Atalho chamado no carregamento das páginas
  async inicializar() {
    if (!this.ativo()) return false;
    this.marcar('Sincronizando…', '#9be8b8');
    await this.processarFila();          // reenvia pendências
    const r = await this.puxarTudo();    // baixa estado mais recente
    this.marcar(r.ok ? '● Sincronizado' : '● Offline (cache local)', r.ok ? '#9be8b8' : '#f7c948');
    return r.ok;
  },
};
