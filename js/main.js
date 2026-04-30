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

function saveServers(servers) {
  localStorage.setItem('customServers', JSON.stringify(servers));
}

function createServerButton(name) {
  const button = document.createElement('button');
  button.className = 'server-icon custom-server';
  button.title = name;
  button.textContent = name.charAt(0).toUpperCase();
  return button;
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
