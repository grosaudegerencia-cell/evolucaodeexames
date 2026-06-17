// ============================================================
//  auth.js — Autenticação e gestão de usuários GRO Saúde
// ============================================================

const GRO_AUTH = {

  SESSION_KEY:   'gro_session',
  USERS_KEY:     'gro_usuarios_extra',     // usuários criados pelo admin
  DISABLED_KEY:  'gro_usuarios_desativados', // usernames de padrão desativados

  getDisabled() {
    try { return JSON.parse(localStorage.getItem(this.DISABLED_KEY)) || []; } catch { return []; }
  },
  saveDisabled(list) { localStorage.setItem(this.DISABLED_KEY, JSON.stringify(list)); },

  // ---- Lista combinada: usuários do config + criados pelo admin (sem desativados) ----
  getAllUsers() {
    let extra = [];
    try { extra = JSON.parse(localStorage.getItem(this.USERS_KEY)) || []; } catch {}
    const desativados = this.getDisabled();
    return [...GRO_CONFIG.USERS, ...extra].filter(u => !desativados.includes(u.username));
  },

  getExtraUsers() {
    try { return JSON.parse(localStorage.getItem(this.USERS_KEY)) || []; } catch { return []; }
  },

  saveExtraUsers(list) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(list));
  },

  // ---- Sessão ----
  requireLogin() {
    if (!this.isLoggedIn()) { window.location.href = 'login.html'; return null; }
    return this.getUser();
  },

  requireAdmin() {
    const u = this.requireLogin();
    if (u && u.role !== 'admin') {
      alert('Acesso restrito ao administrador.');
      window.location.href = 'index.html';
      return null;
    }
    return u;
  },

  isLoggedIn() {
    const s = sessionStorage.getItem(this.SESSION_KEY);
    if (!s) return false;
    try { const x = JSON.parse(s); return x && x.username && x.expires > Date.now(); }
    catch { return false; }
  },

  getUser() {
    try { return JSON.parse(sessionStorage.getItem(this.SESSION_KEY)); } catch { return null; }
  },

  login(username, password) {
    const user = this.getAllUsers().find(
      u => u.username === username && atob(u.passwordB64) === password
    );
    if (!user) return false;
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify({
      username: user.username, name: user.name, role: user.role,
      expires: Date.now() + 8 * 60 * 60 * 1000,
    }));
    return true;
  },

  logout() {
    sessionStorage.removeItem(this.SESSION_KEY);
    window.location.href = 'login.html';
  },

  isAdmin() { const u = this.getUser(); return u && u.role === 'admin'; },

  // ---- Gestão de usuários (admin) ----
  criarUsuario({ username, password, name, role }) {
    username = (username||'').trim().toLowerCase();
    if (!username || !password || !name) return { ok:false, msg:'Preencha todos os campos.' };
    if (this.getAllUsers().some(u => u.username === username))
      return { ok:false, msg:'Já existe um usuário com esse nome.' };
    const extra = this.getExtraUsers();
    extra.push({ username, passwordB64: btoa(password), name, role: role||'user', fixo:false });
    this.saveExtraUsers(extra);
    return { ok:true };
  },

  // Exclui qualquer usuário (criado pelo admin OU padrão do config).
  // Protege: não pode excluir a si mesmo nem o último admin ativo.
  removerUsuario(username) {
    const atual = this.getUser();
    if (atual && atual.username === username)
      return { ok:false, msg:'Você não pode excluir o próprio usuário em uso.' };

    const alvo = this.getAllUsers().find(u => u.username === username);
    if (!alvo) return { ok:false, msg:'Usuário não encontrado.' };

    if (alvo.role === 'admin') {
      const admins = this.getAllUsers().filter(u => u.role === 'admin');
      if (admins.length <= 1)
        return { ok:false, msg:'Não é possível excluir o único administrador do sistema.' };
    }

    const fixo = GRO_CONFIG.USERS.some(u => u.username === username);
    if (fixo) {
      // usuário padrão (config.js): registra como desativado
      const dis = this.getDisabled();
      if (!dis.includes(username)) { dis.push(username); this.saveDisabled(dis); }
    } else {
      // usuário criado pelo admin: remove do localStorage
      this.saveExtraUsers(this.getExtraUsers().filter(u => u.username !== username));
    }
    return { ok:true };
  },

  alterarSenha(username, novaSenha) {
    const extra = this.getExtraUsers();
    const i = extra.findIndex(u => u.username === username);
    if (i >= 0) { extra[i].passwordB64 = btoa(novaSenha); this.saveExtraUsers(extra); return { ok:true }; }
    return { ok:false, msg:'Usuário padrão: altere a senha no arquivo config.js.' };
  }
};
