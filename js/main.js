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
