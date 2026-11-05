/* =============================================
   FRUTIKÓNG — Lógica del carrito (compartida)
   ============================================= */

const CARRITO_KEY = 'frutikong_carrito';

// ── Obtener / guardar carrito ──
function getCarrito() {
  try { return JSON.parse(localStorage.getItem(CARRITO_KEY)) || []; }
  catch { return []; }
}
function saveCarrito(c) { localStorage.setItem(CARRITO_KEY, JSON.stringify(c)); }

// ── Agregar item ──
function agregarAlCarrito(item) {
  const carrito = getCarrito();
  item.id = Date.now();
  carrito.push(item);
  saveCarrito(carrito);
  actualizarBadge();
  mostrarToast(`¡${item.sabor} ${item.tamano} agregada al carrito! 🍓`);
}

// ── Eliminar / vaciar ──
function eliminarDelCarrito(id) {
  saveCarrito(getCarrito().filter(i => i.id !== id));
  actualizarBadge();
  renderCarritoPanel();
}
function vaciarCarrito() {
  saveCarrito([]);
  actualizarBadge();
  renderCarritoPanel();
}

// ── Badge navbar ──
function actualizarBadge() {
  const n = getCarrito().length;
  document.querySelectorAll('.cart-badge').forEach(b => b.textContent = n);
}

// ── Toast ──
function mostrarToast(msg) {
  let t = document.getElementById('fk-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'fk-toast';
    t.style.cssText = `
      position:fixed;bottom:90px;left:50%;transform:translateX(-50%) translateY(20px);
      background:#2d7a1f;color:#fff;padding:12px 24px;border-radius:30px;
      font-family:'Nunito',sans-serif;font-weight:700;font-size:0.95rem;
      box-shadow:0 4px 18px rgba(0,0,0,0.25);z-index:4000;
      opacity:0;transition:opacity 0.3s,transform 0.3s;white-space:nowrap;pointer-events:none;`;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(20px)';
  }, 2600);
}

// ── Calcular total ──
function calcularTotal() {
  return getCarrito().reduce((s, i) => s + i.precio_total, 0);
}

// ── Render panel ──
function renderCarritoPanel() {
  const lista   = document.getElementById('carrito-lista');
  const totalEl = document.getElementById('carrito-total');
  if (!lista || !totalEl) return;

  const carrito = getCarrito();
  if (carrito.length === 0) {
    lista.innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:#bbb;">
        <div style="font-size:3.5rem;margin-bottom:10px;">🛒</div>
        <p style="font-weight:700;font-size:1rem;color:#aaa;">Tu carrito está vacío</p>
        <p style="font-size:0.85rem;color:#ccc;">Agrega tus copas favoritas</p>
      </div>`;
    totalEl.textContent = 'Bs 0';
    return;
  }

  let total = 0;
  lista.innerHTML = carrito.map(item => {
    total += item.precio_total;
    const ext = item.extras?.length ? item.extras.map(e => e.nombre).join(', ') : 'Sin extras';
    return `
      <div style="display:flex;align-items:flex-start;gap:12px;padding:14px 0;border-bottom:1px solid #f0f0f0;">
        <span style="font-size:2rem;">${item.emoji}</span>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;font-size:0.95rem;color:#333;">${item.sabor}</div>
          <div style="font-size:0.8rem;color:#999;margin:2px 0;">Tamaño: <b>${item.tamano}</b> · ${item.ml}</div>
          <div style="font-size:0.8rem;color:#bbb;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${ext}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-family:'Fredoka One',cursive;font-size:1.05rem;color:#2d7a1f;">Bs ${item.precio_total}</div>
          <button onclick="eliminarDelCarrito(${item.id})" style="
            background:none;border:none;cursor:pointer;color:#e8192c;
            font-size:0.78rem;margin-top:4px;font-family:'Nunito',sans-serif;font-weight:700;">
            ✕ Quitar
          </button>
        </div>
      </div>`;
  }).join('');
  totalEl.textContent = `Bs ${total}`;
}

// ══════════════════════════════════════════════
//  MODAL DE PAGO con QR
// ══════════════════════════════════════════════
function abrirModalPago() {
  const carrito = getCarrito();
  if (carrito.length === 0) { mostrarToast('¡Agrega productos primero!'); return; }

  const total = calcularTotal();

  // Resumen del pedido para el modal
  let resumenHTML = carrito.map((item, i) => {
    const ext = item.extras?.length ? item.extras.map(e => e.nombre).join(', ') : 'Sin extras';
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;
                  padding:7px 0;border-bottom:1px solid #f0f0f0;font-size:0.88rem;">
        <span>${item.emoji} <b>${item.sabor}</b> ${item.tamano} — ${ext}</span>
        <span style="font-family:'Fredoka One',cursive;color:#2d7a1f;flex-shrink:0;margin-left:8px;">Bs ${item.precio_total}</span>
      </div>`;
  }).join('');

  const modal = document.createElement('div');
  modal.id = 'modal-pago';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:3500;
    display:flex;align-items:center;justify-content:center;padding:16px;
    animation:fadeIn 0.2s ease;`;

  modal.innerHTML = `
    <div style="
      background:#fff;border-radius:24px;max-width:480px;width:100%;
      box-shadow:0 20px 60px rgba(0,0,0,0.3);overflow:hidden;
      font-family:'Nunito',sans-serif;max-height:92vh;display:flex;flex-direction:column;">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#2d7a1f,#4caf50);
                  color:#fff;padding:20px 24px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
        <div>
          <div style="font-family:'Fredoka One',cursive;font-size:1.3rem;">💳 Realizar Pago</div>
          <div style="font-size:0.85rem;opacity:0.85;margin-top:2px;">Escanea el QR o confirma tu pedido</div>
        </div>
        <button onclick="cerrarModalPago()" style="
          background:rgba(255,255,255,0.2);border:none;color:#fff;
          width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:1.1rem;
          display:flex;align-items:center;justify-content:center;">✕</button>
      </div>

      <!-- Cuerpo scrollable -->
      <div style="overflow-y:auto;flex:1;padding:24px;">

        <!-- Resumen del pedido -->
        <div style="margin-bottom:20px;">
          <div style="font-family:'Fredoka One',cursive;font-size:1rem;color:#444;margin-bottom:8px;">
            🍓 Resumen del pedido
          </div>
          ${resumenHTML}
          <div style="display:flex;justify-content:space-between;margin-top:12px;
                      padding:10px 12px;background:#f0fbe8;border-radius:12px;">
            <span style="font-family:'Fredoka One',cursive;font-size:1.05rem;color:#333;">Total a pagar:</span>
            <span style="font-family:'Fredoka One',cursive;font-size:1.4rem;color:#2d7a1f;">Bs ${total}</span>
          </div>
        </div>

        <!-- QR de pago -->
        <div style="margin-bottom:20px;">
          <div style="font-family:'Fredoka One',cursive;font-size:1rem;color:#444;margin-bottom:12px;">
            📱 Escanea para pagar
          </div>
          <div style="
            border:3px dashed #c8e6c0;border-radius:18px;padding:24px;
            text-align:center;background:#fafffe;min-height:200px;
            display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;">
            <!-- AQUÍ VA TU QR: reemplaza esta imagen con tu QR de pago -->
            <img id="qr-pago-img"
              src="assets/img/qr-pago.png"
              alt="QR de pago Frutikóng"
              onerror="this.style.display='none';document.getElementById('qr-placeholder').style.display='flex';"
              style="width:180px;height:180px;object-fit:contain;border-radius:12px;" />
            <div id="qr-placeholder" style="
              display:flex;flex-direction:column;align-items:center;gap:8px;
              width:180px;height:180px;background:#f0f0f0;border-radius:12px;
              justify-content:center;font-size:0.85rem;color:#aaa;">
              <span style="font-size:3rem;">📲</span>
              <span style="font-weight:700;">QR de Pago</span>
              <span style="font-size:0.75rem;text-align:center;padding:0 10px;">
                Próximamente disponible
              </span>
            </div>
            <p style="font-size:0.82rem;color:#888;margin:0;">
              Escanea con tu app de banco o billetera digital
            </p>
          </div>
        </div>

        <!-- Instrucciones -->
        <div style="
          background:#fff8e1;border-left:4px solid #f9c800;
          border-radius:0 12px 12px 0;padding:12px 16px;margin-bottom:20px;font-size:0.85rem;color:#555;">
          <b style="color:#b8860b;">📌 Instrucciones:</b><br>
          1. Escanea el QR con tu app bancaria<br>
          2. Ingresa el monto exacto: <b>Bs ${total}</b><br>
          3. Confirma el pago<br>
          4. Presiona "Ya realicé mi pago" y envía el comprobante por WhatsApp
        </div>

      </div><!-- /scroll -->

      <!-- Botones de acción (fijos abajo) -->
      <div style="padding:16px 24px;border-top:2px solid #f0f0f0;background:#fafafa;flex-shrink:0;">

        <!-- Ya pagué -->
        <button onclick="confirmarPago()" style="
          width:100%;padding:14px;border-radius:30px;border:none;cursor:pointer;
          background:linear-gradient(135deg,#25D366,#128C7E);
          color:#fff;font-family:'Fredoka One',cursive;font-size:1.05rem;
          display:flex;align-items:center;justify-content:center;gap:8px;
          box-shadow:0 4px 14px rgba(37,211,102,0.35);
          transition:transform 0.2s;margin-bottom:10px;"
          onmouseover="this.style.transform='translateY(-2px)'"
          onmouseout="this.style.transform='translateY(0)'">
          ✅ Ya realicé mi pago — Enviar pedido
        </button>

        <!-- Pagar después / solo WhatsApp -->
        <button onclick="soloWhatsApp()" style="
          width:100%;padding:12px;border-radius:30px;
          border:2px solid #2d7a1f;background:transparent;
          color:#2d7a1f;font-family:'Fredoka One',cursive;font-size:0.95rem;
          cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;
          transition:background 0.2s,color 0.2s;"
          onmouseover="this.style.background='#2d7a1f';this.style.color='#fff'"
          onmouseout="this.style.background='transparent';this.style.color='#2d7a1f'">
          <i class="fa-brands fa-whatsapp"></i> Enviar pedido sin pago previo
        </button>

      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  // Cerrar al clicar fuera
  modal.addEventListener('click', e => { if (e.target === modal) cerrarModalPago(); });
}

function cerrarModalPago() {
  const modal = document.getElementById('modal-pago');
  if (modal) { modal.remove(); document.body.style.overflow = ''; }
}

// Confirmar pago → WhatsApp con nota de pago
function confirmarPago() {
  const carrito = getCarrito();
  const total   = calcularTotal();
  let msg = '¡Hola Frutikóng! 🍓 *YA REALICÉ MI PAGO* ✅\n\n';
  msg += `*Total pagado: Bs ${total}*\n\n`;
  msg += 'Detalle del pedido:\n';
  carrito.forEach((item, i) => {
    const ext = item.extras?.length ? item.extras.map(e => e.nombre).join(', ') : 'Sin extras';
    msg += `${i+1}. ${item.sabor} ${item.tamano} (${ext}) — Bs ${item.precio_total}\n`;
  });
  msg += '\n📎 Adjunto el comprobante de pago. ¡Gracias!';
  cerrarModalPago();
  toggleCarritoPanel();
  vaciarCarrito();
  window.open(`https://wa.me/59178606168?text=${encodeURIComponent(msg)}`, '_blank');
  setTimeout(() => mostrarToast('¡Pedido enviado! 🎉 Adjunta tu comprobante'), 800);
}

// Solo WhatsApp sin pago
function soloWhatsApp() {
  const carrito = getCarrito();
  const total   = calcularTotal();
  let msg = '¡Hola Frutikóng! 🍓 Quiero hacer el siguiente pedido:\n\n';
  carrito.forEach((item, i) => {
    const ext = item.extras?.length ? item.extras.map(e => `${e.nombre} (+Bs ${e.precio})`).join(', ') : 'Sin extras';
    msg += `*${i+1}. ${item.sabor} — ${item.tamano}*\n   Extras: ${ext}\n   Subtotal: Bs ${item.precio_total}\n\n`;
  });
  msg += `*TOTAL: Bs ${total}*\n\n¡Gracias! 😊`;
  cerrarModalPago();
  toggleCarritoPanel();
  vaciarCarrito();
  window.open(`https://wa.me/59178606168?text=${encodeURIComponent(msg)}`, '_blank');
}

// ── Toggle panel ──
function toggleCarritoPanel() {
  const panel   = document.getElementById('carrito-panel');
  const overlay = document.getElementById('carrito-overlay');
  if (!panel) return;
  const abierto = panel.classList.toggle('open');
  if (overlay) overlay.style.display = abierto ? 'block' : 'none';
  if (abierto) renderCarritoPanel();
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  actualizarBadge();

  document.querySelectorAll('.cart-btn').forEach(btn => {
    btn.addEventListener('click', toggleCarritoPanel);
  });

  if (!document.getElementById('carrito-panel')) {
    document.body.insertAdjacentHTML('beforeend', `
      <div id="carrito-overlay" onclick="toggleCarritoPanel()" style="
        display:none;position:fixed;inset:0;
        background:rgba(0,0,0,0.4);z-index:1999;"></div>

      <div id="carrito-panel" style="
        position:fixed;top:0;right:-420px;width:400px;max-width:95vw;
        height:100vh;background:#fff;z-index:2000;
        box-shadow:-4px 0 24px rgba(0,0,0,0.18);
        display:flex;flex-direction:column;
        transition:right 0.35s cubic-bezier(.4,0,.2,1);
        font-family:'Nunito',sans-serif;">

        <div style="background:linear-gradient(135deg,#2d7a1f,#4caf50);
                    color:#fff;padding:20px 24px;
                    display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
          <div style="font-family:'Fredoka One',cursive;font-size:1.3rem;">🛒 Mi Pedido</div>
          <button onclick="toggleCarritoPanel()" style="
            background:rgba(255,255,255,0.2);border:none;color:#fff;
            width:32px;height:32px;border-radius:50%;cursor:pointer;
            font-size:1.1rem;display:flex;align-items:center;justify-content:center;">✕</button>
        </div>

        <div id="carrito-lista" style="flex:1;overflow-y:auto;padding:0 20px;"></div>

        <div style="padding:20px 24px;border-top:2px solid #f0f0f0;background:#fafafa;flex-shrink:0;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <span style="font-family:'Fredoka One',cursive;font-size:1.1rem;color:#333;">Total:</span>
            <span id="carrito-total" style="font-family:'Fredoka One',cursive;font-size:1.5rem;color:#2d7a1f;">Bs 0</span>
          </div>
          <button onclick="abrirModalPago()" style="
            width:100%;padding:14px;border-radius:30px;border:none;cursor:pointer;
            background:linear-gradient(135deg,#e8192c,#ff4d6a);
            color:#fff;font-family:'Fredoka One',cursive;font-size:1.05rem;
            display:flex;align-items:center;justify-content:center;gap:8px;
            box-shadow:0 4px 14px rgba(232,25,44,0.3);transition:transform 0.2s;margin-bottom:10px;"
            onmouseover="this.style.transform='translateY(-2px)'"
            onmouseout="this.style.transform='translateY(0)'">
            💳 Proceder al pago
          </button>
          <button onclick="vaciarCarrito()" style="
            width:100%;padding:10px;border-radius:30px;
            border:2px solid #ccc;background:transparent;
            color:#aaa;font-family:'Fredoka One',cursive;font-size:0.88rem;
            cursor:pointer;transition:all 0.2s;"
            onmouseover="this.style.borderColor='#e8192c';this.style.color='#e8192c'"
            onmouseout="this.style.borderColor='#ccc';this.style.color='#aaa'">
            🗑️ Vaciar carrito
          </button>
        </div>
      </div>
    `);
  }
});

// Estilos dinámicos
const styleEl = document.createElement('style');
styleEl.textContent = `
  #carrito-panel.open { right: 0 !important; }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
`;
document.head.appendChild(styleEl);
