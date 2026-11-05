/* =============================================
   FRUTIKÓNG — Autenticación con Google Sheets
   ============================================= */

const API_URL = 'https://script.google.com/macros/s/AKfycbwUaHinLKj-tRQuYKXJiK_iv1-m5mSyfyRoWCHBxETV1Ig_IO7jFH6118ZIiDzd0twmAg/exec';
const USER_KEY = 'frutikong_usuario';

// ── Obtener / guardar / cerrar sesión ──
function getUsuario() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); }
  catch { return null; }
}
function saveUsuario(u) { localStorage.setItem(USER_KEY, JSON.stringify(u)); }
function cerrarSesion() {
  localStorage.removeItem(USER_KEY);
  window.location.href = 'index.html';
}

// ── Llamada a la API ──
async function llamarAPI(datos) {
  const res = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(datos),
    headers: { 'Content-Type': 'text/plain' }
  });
  return res.json();
}

// ── Actualizar navbar: solo muestra/oculta, NUNCA destruye los links ──
function actualizarNavbarAuth() {
  const usuario = getUsuario();

  // Elementos que pueden existir en el navbar
  const linkLogin    = document.getElementById('linkLogin');
  const linkRegistro = document.getElementById('linkRegistro');
  const linkNombre   = document.getElementById('linkNombre');
  const spanNombre   = document.getElementById('spanNombre');
  const linkMiZona   = document.getElementById('linkMiZona');
  const linkSalir    = document.getElementById('linkSalir');

  // Si no existen los elementos, no hacer nada
  if (!linkLogin && !linkRegistro) return;

  if (usuario) {
    // Con sesión: ocultar login/registro, mostrar nombre/miZona/salir
    if (linkLogin)    linkLogin.style.display    = 'none';
    if (linkRegistro) linkRegistro.style.display = 'none';
    if (linkNombre) {
      linkNombre.style.display = 'flex';
      if (spanNombre) spanNombre.textContent = usuario.nombre;
    }
    if (linkMiZona) linkMiZona.style.display = 'flex';
    if (linkSalir)  {
      linkSalir.style.display = 'flex';
      // Asignar el evento solo una vez
      if (!linkSalir.dataset.bound) {
        linkSalir.dataset.bound = '1';
        linkSalir.addEventListener('click', (e) => {
          e.preventDefault();
          cerrarSesion();
        });
      }
    }
  } else {
    // Sin sesión: mostrar login/registro, ocultar el resto
    if (linkLogin)    linkLogin.style.display    = 'flex';
    if (linkRegistro) linkRegistro.style.display = 'flex';
    if (linkNombre)   linkNombre.style.display   = 'none';
    if (linkMiZona)   linkMiZona.style.display   = 'none';
    if (linkSalir)    linkSalir.style.display    = 'none';
  }
}

// Ejecutar al cargar
document.addEventListener('DOMContentLoaded', actualizarNavbarAuth);
