/* ============================================================
   script.js — Escenarios 3 (Canal de voz) y 4 (Notificaciones)
   ------------------------------------------------------------
   Se carga junto a main.js. Usa querySelector con guardas para
   que pueda incluirse en cualquier página sin romper.
   ============================================================ */

/* ------------------------------------------------------------
   Utilidad: Toast flotante (mensaje breve de confirmación)
   ------------------------------------------------------------ */
function mostrarToast(mensaje) {
  let toast = document.getElementById('toast');

  // Si la página no tiene un toast definido, lo creamos al vuelo
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast hidden';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }

  toast.textContent = mensaje;
  toast.classList.remove('hidden');
  // forzar reflow para que la transición se aplique al añadir 'show'
  void toast.offsetWidth;
  toast.classList.add('show');

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 200);
  }, 2000);
}

/* ============================================================
   Escenario 3 — Canal de voz
   Al confirmar "Entrar":
     - Se cierra el modal
     - Aparece la lista de conectados en la barra lateral (incluyéndote)
     - El botón cambia a "Salir del canal"
     - Se muestra un toast de conexión
   ============================================================ */
(function escenarioVoz() {
  const btnEntrar     = document.getElementById('btnEntrarCanal');
  const btnSalir      = document.getElementById('btnSalirCanal');
  const modal         = document.getElementById('modalVoz');
  const btnConfirmar  = document.getElementById('btnConfirmarVoz');
  const btnCancelar   = document.getElementById('btnCancelarVoz');
  const btnCerrar     = document.getElementById('btnCerrarModalVoz');
  const panelChat     = document.getElementById('panelChat');
  const listaMensajes = document.getElementById('listaMensajes');
  const formMensaje   = document.getElementById('formMensaje');
  const inputMensaje  = document.getElementById('inputMensaje');
  const sidebarLista  = document.getElementById('sidebarConectados');

  // Si no estamos en voz.html, salimos
  if (!btnEntrar || !modal) return;

  // Miembros que ya están en el canal antes de que entres (simulado)
  const yaConectados = [
    { inicial: 'L', nombre: 'Luis Fernando', estado: 'online', mic: '🎤' },
    { inicial: 'J', nombre: 'Jonas',         estado: 'online', mic: '🎤' }
  ];

  // Tu usuario (coincide con el footer "Invitado · En línea")
  const tuUsuario = { inicial: 'D', nombre: 'Invitado (tú)', estado: 'online', mic: '🎤', esTu: true };

  // Mensajes simulados que ya existen en el canal cuando entras
  const mensajesSimulados = [
    { inicial: 'L', nombre: 'Luis Fernando', hora: '14:02', texto: '¡Hola equipo! ¿Listos para revisar el prototipo?' },
    { inicial: 'J', nombre: 'Jonas',         hora: '14:03', texto: 'Sí, ya estoy aquí. Comparto pantalla en un momento.' },
    { inicial: 'L', nombre: 'Luis Fernando', hora: '14:05', texto: 'Perfecto. Yo voy a tomar notas mientras explicas.' },
    { inicial: 'J', nombre: 'Jonas',         hora: '14:07', texto: 'Avisen cuando alguien más se conecte 👋' }
  ];

  // ---- Modal helpers ----
  function abrirModal() {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }
  function cerrarModal() {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }

  // ---- Render de la lista en el sidebar (debajo del canal General) ----
  function renderSidebarConectados(miembros) {
    if (!sidebarLista) return;
    sidebarLista.innerHTML = '';

    miembros.forEach((m) => {
      const li = document.createElement('li');
      li.className = 'sidebar-voice-member' + (m.esTu ? ' is-you' : '');

      const avatar = document.createElement('div');
      avatar.className = 'avatar tiny ' + (m.estado || 'online');
      avatar.textContent = m.inicial;

      const nombre = document.createElement('span');
      nombre.className = 'sidebar-voice-member-name';
      nombre.textContent = m.nombre;

      const mic = document.createElement('span');
      mic.className = 'sidebar-voice-mic';
      mic.textContent = m.mic || '🎤';

      li.appendChild(avatar);
      li.appendChild(nombre);
      li.appendChild(mic);
      sidebarLista.appendChild(li);
    });

    sidebarLista.classList.remove('hidden');
  }

  function ocultarSidebarConectados() {
    if (!sidebarLista) return;
    sidebarLista.innerHTML = '';
    sidebarLista.classList.add('hidden');
  }

  // ---- Render de mensajes del chat ----
  function agregarMensaje(msg) {
    if (!listaMensajes) return;

    const li = document.createElement('li');
    li.className = 'chat-message' + (msg.esTu ? ' is-you' : '');

    // Avatar
    const avatar = document.createElement('div');
    avatar.className = 'avatar tiny ' + (msg.estado || 'online');
    avatar.textContent = msg.inicial;

    // Cuerpo del mensaje
    const body = document.createElement('div');
    body.className = 'chat-message-body';

    const head = document.createElement('div');
    head.className = 'chat-message-head';

    const nombre = document.createElement('span');
    nombre.className = 'chat-message-name';
    nombre.textContent = msg.nombre;

    const hora = document.createElement('span');
    hora.className = 'chat-message-time';
    hora.textContent = msg.hora;

    head.appendChild(nombre);
    head.appendChild(hora);

    const texto = document.createElement('div');
    texto.className = 'chat-message-text';
    texto.textContent = msg.texto;

    body.appendChild(head);
    body.appendChild(texto);

    li.appendChild(avatar);
    li.appendChild(body);
    listaMensajes.appendChild(li);

    // Auto-scroll al último mensaje
    listaMensajes.scrollTop = listaMensajes.scrollHeight;
  }

  function renderMensajesIniciales() {
    if (!listaMensajes) return;
    listaMensajes.innerHTML = '';
    mensajesSimulados.forEach(agregarMensaje);
  }

  // Hora actual en formato HH:MM
  function horaActual() {
    const d = new Date();
    return d.getHours().toString().padStart(2, '0') + ':' +
           d.getMinutes().toString().padStart(2, '0');
  }

  // ---- Conectarse / desconectarse ----
  function conectarseAlCanal() {
    cerrarModal();

    // Mostrar la lista de conectados en la barra lateral, debajo del canal General
    renderSidebarConectados([...yaConectados, tuUsuario]);

    // Mostrar el chat con los mensajes simulados
    renderMensajesIniciales();
    panelChat?.classList.remove('hidden');

    // Cambiar los botones: ocultar "Entrar", mostrar "Salir"
    btnEntrar.classList.add('hidden');
    btnSalir?.classList.remove('hidden');

    // Marcar el canal en la barra lateral con el indicador verde
    const canalActivo = document.querySelector('.channel-list a[href="voz.html"]');
    canalActivo?.classList.add('in-voice');

    // Toast de confirmación
    if (typeof mostrarToast === 'function') {
      mostrarToast('🎙️ Ingresando… conectado al canal General');
    }

    // Mensaje automático de bienvenida un segundo después
    setTimeout(() => {
      agregarMensaje({
        inicial: 'L',
        nombre: 'Luis Fernando',
        hora: horaActual(),
        texto: '¡Bienvenido al canal, Invitado! 👋'
      });
    }, 1200);
  }

  function salirDelCanal() {
    panelChat?.classList.add('hidden');
    btnSalir?.classList.add('hidden');
    btnEntrar.classList.remove('hidden');

    // Limpiar la lista de la barra lateral
    ocultarSidebarConectados();

    const canalActivo = document.querySelector('.channel-list a[href="voz.html"]');
    canalActivo?.classList.remove('in-voice');

    if (typeof mostrarToast === 'function') {
      mostrarToast('📴 Has salido del canal de voz');
    }
  }

  // ---- Envío de mensajes desde el input ----
  formMensaje?.addEventListener('submit', (e) => {
    e.preventDefault();
    const texto = inputMensaje.value.trim();
    if (!texto) return;

    agregarMensaje({
      inicial: 'D',
      nombre: 'Invitado (tú)',
      hora: horaActual(),
      texto: texto,
      esTu: true
    });

    inputMensaje.value = '';
    inputMensaje.focus();
  });

  // ---- Listeners ----
  btnEntrar.addEventListener('click', abrirModal);
  btnConfirmar?.addEventListener('click', conectarseAlCanal);
  btnCancelar?.addEventListener('click', cerrarModal);
  btnCerrar?.addEventListener('click', cerrarModal);
  btnSalir?.addEventListener('click', salirDelCanal);

  // Cerrar modal al hacer clic fuera de la tarjeta
  modal.addEventListener('click', (e) => {
    if (e.target === modal) cerrarModal();
  });

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      cerrarModal();
    }
  });
})();

/* ============================================================
   Escenario 4 — Silenciar notificaciones (versión mejorada)
   - Modo Do Not Disturb (Todo / Solo menciones / Nada)
   - Switches por origen con badges "Silenciado"
   - Horario silencioso con time pickers
   - Vista previa en vivo según configuración
   - Botón "Probar sonido" con Web Audio API
   - Persistencia en localStorage
   - Toast con botón "Deshacer"
   - Botón "Restablecer por defecto"
   ============================================================ */
(function escenarioNotificaciones() {
  const switches      = document.querySelectorAll('.switch-list input[type="checkbox"]');
  const btnGuardar    = document.getElementById('btnGuardarNotis');
  const btnReset      = document.getElementById('btnReset');
  const btnProbar     = document.getElementById('btnProbarSonido');
  const radiosDnd     = document.querySelectorAll('input[name="modoDnd"]');
  const swHorario     = document.getElementById('swHorario');
  const horaInicio    = document.getElementById('horaInicio');
  const horaFin       = document.getElementById('horaFin');
  const preview       = document.getElementById('preview');
  const previewIcon   = preview?.querySelector('.preview-icon');
  const previewTitle  = document.getElementById('previewTitle');
  const previewText   = document.getElementById('previewText');

  // Si no hay switches, no estamos en notificaciones.html
  if (switches.length === 0 && !btnReset) return;

  const STORAGE_KEY = 'uxploradores_notificaciones_v1';
  const DEFAULTS = {
    modoDnd: 'todo',
    swServidor: false,
    swCanal: false,
    swChats: false,
    swHorario: false,
    horaInicio: '22:00',
    horaFin: '08:00'
  };

  // Estado actual + snapshot anterior (para deshacer al guardar)
  let estado = { ...DEFAULTS };
  let estadoAnterior = null;

  // ---------- Persistencia ----------
  function cargarEstado() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) estado = { ...DEFAULTS, ...JSON.parse(raw) };
    } catch (_) { /* ignorar */ }
  }
  function guardarEstado() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
    } catch (_) { /* ignorar */ }
  }

  // ---------- Sincronizar UI desde el estado ----------
  function pintarUI() {
    // Radios DnD
    radiosDnd.forEach((r) => { r.checked = (r.value === estado.modoDnd); });

    // Switches por origen
    document.getElementById('swServidor').checked = estado.swServidor;
    document.getElementById('swCanal').checked    = estado.swCanal;
    document.getElementById('swChats').checked    = estado.swChats;
    actualizarBadges();

    // Horario
    swHorario.checked = estado.swHorario;
    horaInicio.value  = estado.horaInicio;
    horaFin.value     = estado.horaFin;
    horaInicio.disabled = !estado.swHorario;
    horaFin.disabled    = !estado.swHorario;

    actualizarPreview();
  }

  // Mostrar/ocultar el badge "Silenciado" según cada switch
  function actualizarBadges() {
    document.querySelectorAll('.switch-row').forEach((row) => {
      const input = row.querySelector('input[type="checkbox"]');
      const badge = row.querySelector('.silenced-badge');
      if (!input || !badge) return;
      badge.classList.toggle('hidden', !input.checked);
    });
  }

  // ---------- Vista previa en vivo ----------
  function actualizarPreview() {
    if (!preview) return;

    // Decidir si la previsualización aparece "silenciada"
    const todoSilenciado = estado.modoDnd === 'nada' ||
                           (estado.swServidor && estado.swCanal && estado.swChats);

    preview.classList.toggle('is-muted', todoSilenciado);

    if (estado.modoDnd === 'nada') {
      previewIcon.textContent = '🔕';
      previewTitle.textContent = 'Modo silencio activado';
      previewText.textContent  = 'No recibirás avisos hasta que cambies el modo.';
    } else if (estado.modoDnd === 'menciones') {
      previewIcon.textContent = '@';
      previewTitle.textContent = 'UXploradores · @Invitado';
      previewText.textContent  = 'Jonas te ha mencionado en #general';
    } else {
      previewIcon.textContent = todoSilenciado ? '🔕' : '🔔';
      previewTitle.textContent = 'UXploradores · #general';
      previewText.textContent  = 'Luis Fernando: ¿Pueden revisar el prototipo?';
    }
  }

  // ---------- Sonido de prueba (Web Audio API, sin archivos) ----------
  function reproducirBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn('No se pudo reproducir el sonido:', e);
    }
  }

  // ---------- Toast con acción "Deshacer" ----------
  function toastConDeshacer(mensaje, onDeshacer) {
    let toast = document.getElementById('toast');
    if (!toast) return;

    toast.innerHTML = '';
    const span = document.createElement('span');
    span.textContent = mensaje;
    toast.appendChild(span);

    const btn = document.createElement('button');
    btn.className = 'toast-action-btn';
    btn.textContent = 'Deshacer';
    btn.addEventListener('click', () => {
      onDeshacer?.();
      toast.classList.remove('show');
      setTimeout(() => toast.classList.add('hidden'), 200);
    });
    toast.appendChild(btn);

    toast.classList.remove('hidden');
    void toast.offsetWidth;
    toast.classList.add('show');

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.classList.add('hidden'), 200);
    }, 4500);
  }

  // ---------- Listeners ----------
  radiosDnd.forEach((r) => {
    r.addEventListener('change', () => {
      if (r.checked) {
        estado.modoDnd = r.value;
        actualizarPreview();
        const labels = { todo: 'Todas las notificaciones', menciones: 'Solo menciones', nada: 'Modo silencio total' };
        mostrarToast(`🔔 Modo: ${labels[r.value]}`);
      }
    });
  });

  switches.forEach((sw) => {
    sw.addEventListener('change', () => {
      estado[sw.id] = sw.checked;
      actualizarBadges();
      actualizarPreview();
      const etiqueta = sw.dataset.label || 'Notificación';
      const accion = sw.checked ? 'silenciado' : 'reactivado';
      mostrarToast(`🔔 ${etiqueta} ${accion}`);
    });
  });

  swHorario.addEventListener('change', () => {
    estado.swHorario = swHorario.checked;
    horaInicio.disabled = !swHorario.checked;
    horaFin.disabled    = !swHorario.checked;
    mostrarToast(swHorario.checked
      ? `🌙 Horario silencioso activado (${estado.horaInicio} – ${estado.horaFin})`
      : '☀️ Horario silencioso desactivado');
  });

  horaInicio.addEventListener('change', () => { estado.horaInicio = horaInicio.value; });
  horaFin.addEventListener('change',    () => { estado.horaFin    = horaFin.value; });

  btnProbar?.addEventListener('click', () => {
    if (estado.modoDnd === 'nada') {
      mostrarToast('🔕 Modo silencio activo: no se reproducirá sonido');
      return;
    }
    reproducirBeep();
    mostrarToast('🔊 Sonido de prueba reproducido');
  });

  btnGuardar?.addEventListener('click', () => {
    estadoAnterior = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || { ...DEFAULTS };
    guardarEstado();
    toastConDeshacer('✅ Preferencias guardadas correctamente', () => {
      estado = { ...estadoAnterior };
      guardarEstado();
      pintarUI();
      mostrarToast('↩️ Cambios revertidos');
    });
  });

  btnReset?.addEventListener('click', () => {
    estadoAnterior = { ...estado };
    estado = { ...DEFAULTS };
    pintarUI();
    guardarEstado();
    toastConDeshacer('↺ Configuración restablecida', () => {
      estado = { ...estadoAnterior };
      guardarEstado();
      pintarUI();
      mostrarToast('↩️ Restablecimiento revertido');
    });
  });

  // ---------- Inicialización ----------
  cargarEstado();
  pintarUI();
})();
