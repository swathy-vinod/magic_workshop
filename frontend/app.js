const API = 'http://127.0.0.1:8002';

function getUser() {
  try {
    return JSON.parse(sessionStorage.getItem('user'));
  } catch {
    return null;
  }
}

function setUser(u) {
  sessionStorage.setItem('user', JSON.stringify({ id: u.id, name: u.name }));
}

function clearUser() {
  sessionStorage.removeItem('user');
}

function date(iso) {
  try {
    return iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'short' }) : '';
  } catch {
    return iso;
  }
}

async function api(method, path, body) {
  const opt = { method, headers: {} };
  if (body != null) {
    opt.headers['Content-Type'] = 'application/json';
    opt.body = JSON.stringify(body);
  }
  const r = await fetch(API + path, opt);
  const d = await r.json().catch(() => null);
  if (!r.ok) {
    const msg = typeof d?.detail === 'string'
      ? d.detail
      : Array.isArray(d?.detail)
        ? d.detail.map((x) => x.msg).join(' ')
        : d?.detail || r.statusText;
    throw new Error(msg);
  }
  return d;
}

if (document.getElementById('signup-form')) {
  document.getElementById('signup-form').onsubmit = async (e) => {
    e.preventDefault();
    const name = (document.getElementById('name').value || '').trim();
    const email = (document.getElementById('email').value || '').trim();
    const password = document.getElementById('password').value;
    if (!name || !email || !password) return;
    try {
      const u = await api('POST', '/users', { name, email, password });
      setUser(u);
      location.href = 'todos.html';
    } catch (err) {
      console.log(err);
    }
  };
}

if (document.getElementById('login-form')) {
  document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = (document.getElementById('email').value || '').trim();
    if (!email) return;
    try {
      const users = await api('GET', '/users');
      const u = users.find((x) => (x.email || '').toLowerCase() === email.toLowerCase());
      if (!u) return;
      setUser(u);
      location.href = 'todos.html';
    } catch (err) {
      console.log(err);
    }
  };
}

if (document.getElementById('todo-form')) {
  const user = getUser();
  if (!user) {
    location.href = 'login.html';
    throw 0;
  }

  document.getElementById('greeting').textContent = `Hi, ${user.name}. Your todos:`;

  async function load() {
    try {
      const todos = await api('GET', `/users/${user.id}/todos`);
      const list = document.getElementById('list');
      list.innerHTML = '';
      (todos || []).forEach((t) => {
        const li = document.createElement('li');
        const title = document.createElement('span');
        title.className = 'todo-title';
        title.textContent = t.title ?? '';
        const meta = document.createElement('span');
        meta.className = 'todo-meta';
        meta.textContent = [t.description, date(t.created_at)].filter(Boolean).join(' · ');
        li.append(title, meta);
        list.appendChild(li);
      });
    } catch (err) {
      console.log(err);
    }
  }

  document.getElementById('todo-form').onsubmit = async (e) => {
    e.preventDefault();
    const title = (document.getElementById('title').value || '').trim();
    if (!title) return;
    try {
      const body = { user_id: user.id, title };
      const desc = (document.getElementById('description').value || '').trim();
      if (desc) body.description = desc;
      await api('POST', '/todos', body);
      document.getElementById('title').value = '';
      document.getElementById('description').value = '';
      load();
    } catch (err) {
      console.log(err);
    }
  };

  document.getElementById('logout').onclick = () => {
    clearUser();
    location.href = 'login.html';
  };

  load();
}
