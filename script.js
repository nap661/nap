// --- Sessions (as seen in your screenshots) ---
const SESSIONS = [
  { id:'plym-ct-2026-02-20', title:'Community Training – Plymouth',      date:'20 Feb 2026', location:'Stonehouse', tags:['Community','Free','In‑person'] },
  { id:'dev-p2p-2026-03-05', title:'P2P Training – Devonport',           date:'05 Mar 2026', location:'Devonport',  tags:['P2P','Free','In‑person'] },
  { id:'org-2026-03-12',     title:'Organisational Training – Plymouth', date:'12 Mar 2026', location:'Plymouth',   tags:['Workforce','Free','On‑site'] },
  { id:'plym-ct-2026-03-18', title:'Community Training – Plymouth',      date:'18 Mar 2026', location:'Stonehouse', tags:['Community','Free','In‑person'] },
  { id:'dev-p2p-2026-03-26', title:'P2P Training – Devonport',           date:'26 Mar 2026', location:'Devonport',  tags:['P2P','Free','In‑person'] }
];

// DOM references
const sessionsWrap = document.getElementById('sessions');
const cartDrawer   = document.getElementById('cartDrawer');
const cartItems    = document.getElementById('cartItems');
const cartCount    = document.getElementById('cartCount');
const openCart     = document.getElementById('openCart');
const closeCart    = document.getElementById('closeCart');
const toCheckout   = document.getElementById('toCheckout');
const checkout     = document.getElementById('checkout');
const summaryList  = document.getElementById('summaryList');
const checkoutForm = document.getElementById('checkoutForm');
const checkoutMsg  = document.getElementById('checkoutMsg');

let cart = [];

/* =========================
   Sessions grid rendering
   ========================= */
function renderSessions(){
  if (!sessionsWrap) return;

  sessionsWrap.innerHTML = SESSIONS.map(s => {
    const tags = (s.tags || []).map(t => `<span class="tag">${t}</span>`).join('');

    return `
      <div class="card">
        <div class="tagbar">${tags}</div>
        <div class="title">${s.title}</div>
        <div class="meta">${s.date} • ${s.location}</div>

        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn pink"   onclick="addToCart('${s.id}')">Add to Cart</button>
          #checkoutBook Direct</button>
        </div>
      </div>
    `;
  }).join('');
}

/* =========================
   Cart logic
   ========================= */
function addToCart(id){
  const s = SESSIONS.find(x => x.id === id);
  if (!s) return;

  // prevent duplicates
  if (!cart.find(x => x.id === id)) {
    cart.push(s);
  }
  renderCart();
}

function removeFromCart(id){
  cart = cart.filter(x => x.id !== id);
  renderCart();
}

function renderCart(){
  if (!cartItems) return;

  cartItems.innerHTML = cart.map(s => `
    <div class="cart-item">
      <div>
        <strong>${s.title}</strong>
        <div class="meta">${s.date} • ${s.location}</div>
      </div>
      <button class="rm" onclick="removeFromCart('${s.id}')">Remove</button>
    </div>
  `).join('');

  if (cartCount) cartCount.textContent = cart.length || 0;
}

/* =========================
   Drawer controls
   ========================= */
if (openCart)  openCart.addEventListener('click', () => cartDrawer.classList.add('open'));
if (closeCart) closeCart.addEventListener('click', () => cartDrawer.classList.remove('open'));

if (toCheckout) {
  toCheckout.addEventListener('click', () => {
    cartDrawer.classList.remove('open');
    document.querySelector('#checkout')?.scrollIntoView({ behavior:'smooth' });
    buildSummary();
  });
}

/* =========================
   Checkout summary
   ========================= */
function buildSummary(){
  if (!summaryList) return;
  summaryList.innerHTML = cart.map(s => `<li>${s.title} — ${s.date} (${s.location})</li>`).join('');
}

/* =========================
   Submit to Google Sheets
   =========================
   The ENDPOINT constant is defined in index.html:

   <script>
     const ENDPOINT = 'https://script.google.com/macros/s/...../exec';
   </script>
*/
if (checkoutForm) {
  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!window.ENDPOINT) {
      console.error('Missing ENDPOINT. Ensure it is defined in index.html.');
      if (checkoutMsg) {
        checkoutMsg.style.color = 'crimson';
        checkoutMsg.textContent = 'Config error: booking endpoint is missing.';
      }
      return;
    }

    if (!cart.length) {
      if (checkoutMsg) {
        checkoutMsg.style.color = 'crimson';
        checkoutMsg.textContent = 'Your cart is empty. Please add a session first.';
      }
      return;
    }

    if (checkoutMsg) {
      checkoutMsg.textContent = 'Sending booking…';
      checkoutMsg.style.color = '#0f1324';
    }

    const form = new FormData(checkoutForm);
    const payload = {
      name:  form.get('name'),
      email: form.get('email'),
      phone: form.get('phone'),
      notes: form.get('notes'),
      items: cart
    };

    try {
      const res  = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(payload),
        mode: 'cors'
      });

      // Some Apps Script deployments return 200 with body.ok true
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Booking failed (HTTP ${res.status})`);
      }

      if (checkoutMsg) {
        checkoutMsg.style.color = 'green';
        checkoutMsg.textContent = 'Booking received! We’ll email you a confirmation.';
      }

      // Reset UI
      cart = [];
      renderCart();
      buildSummary();
      checkoutForm.reset();

    } catch (err) {
      if (checkoutMsg) {
        checkoutMsg.style.color = 'crimson';
        checkoutMsg.textContent = 'Sorry—booking failed: ' + (err?.message || err);
      }
      console.error(err);
    }
  });
}

/* =========================
   Init on load
   ========================= */
renderSessions();
renderCart();

// Expose removal for inline buttons (optional safeguard)
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
