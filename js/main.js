document.addEventListener('click', (event) => {
  const openBtn = event.target.closest('[data-open-modal]');
  const closeBtn = event.target.closest('[data-close-modal]');

  if (openBtn) {
    const modal = document.getElementById(openBtn.dataset.openModal);
    modal?.classList.remove('hidden');
  }

  if (closeBtn) {
    const modal = document.getElementById(closeBtn.dataset.closeModal);
    modal?.classList.add('hidden');
  }

  if (event.target.classList.contains('modal-backdrop')) {
    event.target.classList.add('hidden');
  }
});

const serverSearch = document.getElementById('serverSearch');
const serverRows = document.querySelectorAll('.server-row');

serverSearch?.addEventListener('input', () => {
  const value = serverSearch.value.toLowerCase().trim();
  serverRows.forEach((row) => {
    const name = row.dataset.name || '';
    row.style.display = name.includes(value) ? 'flex' : 'none';
  });
});

// Storage de servidores
function getServers() {
  const stored = localStorage.getItem('customServers');
  return stored ? JSON.parse(stored) : [];
}

function getAvailableServers() {
  return [
    'Ingenieria',
    'Programacion',
    'Diseño UX/UI',
    'Gaming Central',
    'Música y Arte',
    'Deportes',
    'Películas',
    'Tecnología',
    'Viajes',
    'Cocina'
  ];
}

function getJoinableServers() {
  const myServers = getServers();
  const available = getAvailableServers();
  return available.filter(server => !myServers.includes(server));
}

function saveServers(servers) {
  localStorage.setItem('customServers', JSON.stringify(servers));
}

function createServerButton(name) {
  const button = document.createElement('button');
  button.className = 'server-icon custom-server';
  button.title = name;
  button.textContent = name.charAt(0).toUpperCase();
  button.onclick = (e) => {
    e.stopPropagation();
    const path = window.location.pathname;
    const isInPages = path.includes('/pages/');
    const url = isInPages 
      ? `custom-server.html?name=${encodeURIComponent(name)}`
      : `pages/custom-server.html?name=${encodeURIComponent(name)}`;
    window.location.href = url;
  };
  return button;
}

function deleteServer(name) {
  const servers = getServers();
  const updated = servers.filter(s => s !== name);
  saveServers(updated);
  
  const rail = document.querySelector('.server-rail');
  const buttons = Array.from(rail.querySelectorAll('.custom-server'));
  buttons.forEach(btn => {
    if (btn.title === name) btn.remove();
  });
}

function addServerToRail(name) {
  const serverRail = document.querySelector('.server-rail');
  if (!serverRail) return;

  const addBtn = serverRail.querySelector('.add');
  if (!addBtn) return;

  const existingButtons = Array.from(serverRail.querySelectorAll('.custom-server'));
  if (existingButtons.some(btn => btn.title === name)) {
    return;
  }

  const button = createServerButton(name);
  addBtn.parentNode.insertBefore(button, addBtn);
}

function loadSavedServers() {
  const servers = getServers();
  servers.forEach((serverName) => {
    addServerToRail(serverName);
  });
}

function createServer() {
  const input = document.getElementById('serverNameInput');
  const serverName = input?.value.trim();

  if (!serverName) {
    alert('Por favor ingresa un nombre para el servidor');
    return;
  }

  // Guardar en localStorage
  const servers = getServers();
  if (!servers.includes(serverName)) {
    servers.push(serverName);
    saveServers(servers);
  }

  // Agregar a la interfaz
  addServerToRail(serverName);

  // Cerrar el modal
  const modal = document.getElementById('createServerModal');
  modal?.classList.add('hidden');

  // Limpiar input
  if (input) input.value = '';

  console.log('✓ Servidor creado:', serverName);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadSavedServers);
} else {
  loadSavedServers();
}

function openSearchServers() {
  const modal = document.getElementById('searchServersModal');
  if (modal) {
    modal.classList.remove('hidden');
    document.getElementById('searchInput').focus();
  }
}

function closeSearchServers() {
  const modal = document.getElementById('searchServersModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

function filterServers() {
  const input = document.getElementById('searchInput');
  const query = input.value.toLowerCase().trim();
  const list = document.getElementById('serversList');

  list.innerHTML = '';

  if (!query) {
    list.innerHTML = '<div class="servers-empty">Escribe para buscar servidores...</div>';
    return;
  }

  const myServers = getServers();
  const available = getAvailableServers();
  
  // Combinar servidores públicos con los del usuario
  const allServers = [...new Set([...available, ...myServers])];
  
  // Filtrar por la búsqueda
  const filtered = allServers.filter(name => 
    name.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    list.innerHTML = '<div class="servers-empty">No encontramos servidores que coincidan con tu búsqueda.</div>';
    return;
  }

  filtered.forEach(name => {
    const isJoined = myServers.includes(name);
    const item = document.createElement('div');
    item.className = 'server-item';
    item.innerHTML = `
      <div class="server-item-icon">${name.charAt(0).toUpperCase()}</div>
      <div class="server-item-name">${name}</div>
      <button class="server-join-btn" onclick="event.stopPropagation()">${isJoined ? 'Abrir' : 'Unirse'}</button>
    `;
    
    const btn = item.querySelector('.server-join-btn');
    btn.onclick = () => {
      // Si no está unido, agregarlo a localStorage
      if (!isJoined) {
        const servers = getServers();
        if (!servers.includes(name)) {
          servers.push(name);
          saveServers(servers);
          addServerToRail(name);
        }
      }
      
      // Navegar al servidor
      const path = window.location.pathname;
      const isInPages = path.includes('/pages/');
      const url = isInPages 
        ? `custom-server.html?name=${encodeURIComponent(name)}`
        : `pages/custom-server.html?name=${encodeURIComponent(name)}`;
      window.location.href = url;
    };
    
    list.appendChild(item);
  });
}

function populateServersList() {
  const list = document.getElementById('serversList');
  list.innerHTML = '<div class="servers-empty">Escribe para buscar servidores...</div>';
}

document.addEventListener('DOMContentLoaded', () => {
  const searchModal = document.getElementById('searchServersModal');
  if (searchModal) {
    populateServersList();
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', filterServers);
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSearchServers();
      });
    }

    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) closeSearchServers();
    });
  }

  const compassBtn = document.querySelector('.compass');
  if (compassBtn) {
    compassBtn.onclick = (e) => {
      e.stopPropagation();
      openSearchServers();
    };
  }
});
