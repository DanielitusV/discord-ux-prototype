const readIndicator  = document.getElementById('readIndicator');
const statusDot      = document.getElementById('statusDot');
const statusText     = document.getElementById('statusText');
const messageInput   = document.getElementById('messageInput');
const messagesScroll = document.getElementById('messagesScroll');
const sendBtn        = document.getElementById('sendBtn');
const exitModal      = document.getElementById('exitModal');
const confirmExit    = document.getElementById('confirmExit');
const cancelExit     = document.getElementById('cancelExit');

let pendingUrl = null;

setTimeout(() => {
  readIndicator.textContent = '✔✔ Visto';
  readIndicator.classList.remove('sent');
}, 3500);

const states = [
  { label: 'En línea',               cls: 'online'  },
  { label: 'Última conexión: 5 min', cls: 'offline' },
  { label: 'Ausente',                cls: 'idle'    },
  { label: 'En línea',               cls: 'online'  },
];

let stateIdx = 0;

function cycleStatus() {
  stateIdx = (stateIdx + 1) % states.length;
  const s = states[stateIdx];
  statusDot.className    = `status-dot ${s.cls}`;
  statusText.textContent = s.label;
}

setInterval(cycleStatus, 5000);

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  const now  = new Date();
  const time = now.getHours().toString().padStart(2, '0') + ':' +
               now.getMinutes().toString().padStart(2, '0');

  const row = document.createElement('div');
  row.className = 'bubble-row mine';
  row.innerHTML = `
    <div>
      <div class="bubble">${escapeHtml(text)}</div>
      <div class="bubble-meta">
        ${time}
        <span class="read-indicator sent new-indicator">✔ Enviado</span>
      </div>
    </div>`;

  messagesScroll.appendChild(row);
  messagesScroll.scrollTop = messagesScroll.scrollHeight;

  messageInput.value      = '';
  messageInput.style.height = 'auto';

  const newIndicator = row.querySelector('.new-indicator');
  setTimeout(() => {
    newIndicator.textContent = '✔✔ Visto';
    newIndicator.classList.remove('sent');
  }, 3500);
}

sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

messageInput.addEventListener('input', () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = messageInput.scrollHeight + 'px';
});

function safeNavigate(url) {
  if (messageInput.value.trim()) {
    pendingUrl = url;
    exitModal.classList.add('visible');
  } else {
    window.location.href = url;
  }
}

confirmExit.addEventListener('click', () => {
  exitModal.classList.remove('visible');
  if (pendingUrl) window.location.href = pendingUrl;
});

cancelExit.addEventListener('click', () => {
  exitModal.classList.remove('visible');
  pendingUrl = null;
});

document.querySelectorAll('.channel, .server-icon.home-icon').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href') || link.dataset.href;
    if (!href) return;
    if (messageInput.value.trim()) {
      e.preventDefault();
      safeNavigate(href);
    }
  });
});

window.addEventListener('popstate', () => {
  if (messageInput.value.trim()) {
    history.pushState(null, '', window.location.href);
    pendingUrl = null;
    exitModal.classList.add('visible');

    confirmExit.onclick = () => {
      exitModal.classList.remove('visible');
      history.back();
    };
  }
});

history.pushState(null, '', window.location.href);