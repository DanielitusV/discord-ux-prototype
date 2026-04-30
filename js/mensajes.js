const readIndicator   = document.getElementById('readIndicator');
const statusDot       = document.getElementById('statusDot');
const statusText      = document.getElementById('statusText');
const messageInput    = document.getElementById('messageInput');
const messagesScroll  = document.getElementById('messagesScroll');
const sendBtn         = document.getElementById('sendBtn');
const exitModal       = document.getElementById('exitModal');
const confirmExit     = document.getElementById('confirmExit');
const cancelExit      = document.getElementById('cancelExit');
const deleteModal     = document.getElementById('deleteModal');
const confirmDelete   = document.getElementById('confirmDelete');
const cancelDelete    = document.getElementById('cancelDelete');
const replyBar        = document.getElementById('replyBar');
const replyClose      = document.getElementById('replyClose');
const emojiPicker     = document.getElementById('emojiPicker');
const typingIndicator = document.getElementById('typingIndicator');

let pendingUrl        = null;
let pendingDeleteRow  = null;
let replyingTo        = null;   
let emojiTargetRow    = null;
let msgCounter        = 100;    

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
setInterval(() => {
  stateIdx = (stateIdx + 1) % states.length;
  const s = states[stateIdx];
  statusDot.className    = `status-dot ${s.cls}`;
  statusText.textContent = s.label;
}, 5000);

let typingTimeout = null;

function showTyping() {
  typingIndicator.classList.remove('hidden');
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    typingIndicator.classList.add('hidden');
  }, 3000);
}

setInterval(() => {
  if (Math.random() < 0.3) showTyping();
}, 8000);

function isNearBottom() {
  const { scrollTop, scrollHeight, clientHeight } = messagesScroll;
  return scrollHeight - scrollTop - clientHeight < 80;
}

function smartScroll() {
  if (isNearBottom()) {
    messagesScroll.scrollTop = messagesScroll.scrollHeight;
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function nowTime() {
  const d = new Date();
  return d.getHours().toString().padStart(2, '0') + ':' +
         d.getMinutes().toString().padStart(2, '0');
}

function createMessageRow({ id, text, time, isMine, replyData = null }) {
  const row = document.createElement('div');
  row.className = `bubble-row ${isMine ? 'mine' : 'theirs'}`;
  row.dataset.id = id;

  const replyHTML = replyData
    ? `<div class="reply-quote" data-ref="${replyData.id}">
         <strong>${escapeHtml(replyData.author)}</strong>
         ${escapeHtml(replyData.text.slice(0, 80))}${replyData.text.length > 80 ? '…' : ''}
       </div>`
    : '';

  const actionsHTML = isMine
    ? `<div class="msg-actions mine-actions">
         <button class="msg-action-btn" data-action="react"  title="Reaccionar">😊</button>
         <button class="msg-action-btn" data-action="reply"  title="Responder">↩</button>
         <button class="msg-action-btn" data-action="edit"   title="Editar">✏️</button>
         <button class="msg-action-btn" data-action="delete" title="Eliminar">🗑️</button>
       </div>`
    : `<div class="msg-actions theirs-actions">
         <button class="msg-action-btn" data-action="react"  title="Reaccionar">😊</button>
         <button class="msg-action-btn" data-action="reply"  title="Responder">↩</button>
       </div>`;

  const avatarHTML = isMine
    ? ''
    : `<div class="avatar tiny online">L</div>`;

  const bubbleWrapContent = isMine
    ? `${actionsHTML}<div class="bubble">${escapeHtml(text)}</div>`
    : `<div class="bubble">${escapeHtml(text)}</div>${actionsHTML}`;

  const indicatorHTML = isMine
    ? `<span class="read-indicator sent new-indicator">✔ Enviado</span>`
    : '';

  row.innerHTML = `
    ${avatarHTML}
    <div class="bubble-group">
      ${replyHTML}
      <div class="bubble-wrap">${bubbleWrapContent}</div>
      <div class="bubble-meta">
        ${time}
        ${indicatorHTML}
      </div>
      <div class="reactions-bar"></div>
    </div>`;

  if (isMine) {
    const ind = row.querySelector('.new-indicator');
    setTimeout(() => {
      ind.textContent = '✔✔ Visto';
      ind.classList.remove('sent');
    }, 3500);
  }

  const quote = row.querySelector('.reply-quote');
  if (quote) {
    quote.addEventListener('click', () => {
      const refId = quote.dataset.ref;
      const target = messagesScroll.querySelector(`[data-id="${refId}"]`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('flash-highlight');
        setTimeout(() => target.classList.remove('flash-highlight'), 1000);
      }
    });
  }

  return row;
}

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  msgCounter++;
  const id  = `msg-${msgCounter}`;
  const row = createMessageRow({
    id,
    text,
    time: nowTime(),
    isMine: true,
    replyData: replyingTo
      ? { id: replyingTo.id, author: replyingTo.author, text: replyingTo.text }
      : null,
  });

  row.id = id;
  messagesScroll.appendChild(row);
  messagesScroll.scrollTop = messagesScroll.scrollHeight;

  messageInput.value = '';
  messageInput.style.height = 'auto';

  cancelReply();
}

sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
  if (e.key === 'Escape') {
    cancelReply();
    closeEmojiPicker();
  }
});

messageInput.addEventListener('input', () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = messageInput.scrollHeight + 'px';
});

messagesScroll.addEventListener('click', (e) => {
  const btn = e.target.closest('.msg-action-btn');
  if (!btn) return;

  const action = btn.dataset.action;
  const row    = btn.closest('.bubble-row');

  if (action === 'react')  openEmojiPicker(e, row);
  if (action === 'reply')  startReply(row);
  if (action === 'edit')   startEdit(row);
  if (action === 'delete') openDeleteModal(row);
});

function openEmojiPicker(e, row) {
  e.stopPropagation();
  emojiTargetRow = row;
  emojiPicker.classList.remove('hidden');

  const rect = e.target.getBoundingClientRect();
  emojiPicker.style.top  = (rect.top - 52) + 'px';
  emojiPicker.style.left = Math.min(rect.left, window.innerWidth - 230) + 'px';
}

function closeEmojiPicker() {
  emojiPicker.classList.add('hidden');
  emojiTargetRow = null;
}

emojiPicker.addEventListener('click', (e) => {
  const btn = e.target.closest('.emoji-opt');
  if (!btn || !emojiTargetRow) return;

  addReaction(emojiTargetRow, btn.dataset.emoji);
  closeEmojiPicker();
});

document.addEventListener('click', (e) => {
  if (!emojiPicker.contains(e.target) && !e.target.classList.contains('msg-action-btn')) {
    closeEmojiPicker();
  }
});

function addReaction(row, emoji) {
  const bar = row.querySelector('.reactions-bar');

  let pill = Array.from(bar.querySelectorAll('.reaction-pill'))
    .find(p => p.dataset.emoji === emoji);

  if (pill) {
    const isMine = pill.classList.contains('mine');
    const count  = parseInt(pill.querySelector('.count').textContent);

    if (isMine) {
      if (count <= 1) pill.remove();
      else {
        pill.querySelector('.count').textContent = count - 1;
        pill.classList.remove('mine');
      }
    } else {
      pill.querySelector('.count').textContent = count + 1;
      pill.classList.add('mine');
    }
  } else {
    pill = document.createElement('button');
    pill.className = 'reaction-pill mine';
    pill.dataset.emoji = emoji;
    pill.innerHTML = `${emoji} <span class="count">1</span>`;
    pill.addEventListener('click', () => addReaction(row, emoji));
    bar.appendChild(pill);
  }
}

function startReply(row) {
  const bubble = row.querySelector('.bubble');
  if (!bubble || bubble.classList.contains('deleted')) return;

  const isMine  = row.classList.contains('mine');
  const author  = isMine ? 'Tú' : 'Luis Fernando';
  const text    = bubble.textContent.trim();
  const id      = row.id || row.dataset.id;

  replyingTo = { id, author, text };

  replyBar.classList.remove('hidden');
  replyBar.querySelector('.reply-author').textContent = `↩ Respondiendo a ${author}`;
  replyBar.querySelector('.reply-text').textContent   = text.slice(0, 80);
  messageInput.focus();
}

function cancelReply() {
  replyingTo = null;
  replyBar.classList.add('hidden');
}

replyClose.addEventListener('click', cancelReply);

function startEdit(row) {
  const bubbleWrap = row.querySelector('.bubble-wrap');
  const bubble     = row.querySelector('.bubble');
  if (!bubble || bubble.classList.contains('deleted')) return;

  const originalText = bubble.textContent.trim();

  bubble.style.display = 'none';

  const textarea = document.createElement('textarea');
  textarea.className = 'bubble-edit-input';
  textarea.value     = originalText;
  textarea.rows      = Math.min(originalText.split('\n').length + 1, 5);

  const editActions = document.createElement('div');
  editActions.className = 'edit-actions';
  editActions.innerHTML = `
    <span>Enter para guardar · Esc para cancelar</span>
    <button class="save-edit">Guardar</button>
    <button class="cancel-edit">Cancelar</button>`;

  bubbleWrap.appendChild(textarea);
  const groupEl = row.querySelector('.bubble-group');
  groupEl.appendChild(editActions);
  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);

  function saveEdit() {
    const newText = textarea.value.trim();
    if (newText && newText !== originalText) {
      bubble.textContent = newText;
      // Agregar tag "(editado)" en la meta si no existe
      const meta = row.querySelector('.bubble-meta');
      if (!meta.querySelector('.edited-tag')) {
        const tag = document.createElement('span');
        tag.className   = 'edited-tag';
        tag.textContent = '(editado)';
        meta.insertBefore(tag, meta.firstChild);
      }
    }
    exitEdit();
  }

  function exitEdit() {
    textarea.remove();
    editActions.remove();
    bubble.style.display = '';
  }

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); }
    if (e.key === 'Escape') exitEdit();
  });

  editActions.querySelector('.save-edit').addEventListener('click', saveEdit);
  editActions.querySelector('.cancel-edit').addEventListener('click', exitEdit);
}

function openDeleteModal(row) {
  pendingDeleteRow = row;
  deleteModal.classList.add('visible');
}

confirmDelete.addEventListener('click', () => {
  if (!pendingDeleteRow) return;
  const bubble = pendingDeleteRow.querySelector('.bubble');
  if (bubble) {
    bubble.className = 'bubble deleted';
    bubble.textContent = '🗑️ Mensaje eliminado';
    pendingDeleteRow.querySelectorAll('[data-action="edit"], [data-action="delete"]')
      .forEach(b => b.remove());
  }
  deleteModal.classList.remove('visible');
  pendingDeleteRow = null;
});

cancelDelete.addEventListener('click', () => {
  deleteModal.classList.remove('visible');
  pendingDeleteRow = null;
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

messagesScroll.scrollTop = messagesScroll.scrollHeight;