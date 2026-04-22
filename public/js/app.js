/**
 * MoraSuite — Core App (Login, Router, POS, Receipt)
 */
(function () {
  'use strict';

  var currentUser = null;
  var currentModule = 'pos';
  var cart = [];
  var selectedClient = null;
  var allProducts = [];
  var allClients = [];
  var searchQuery = '';

  // ── Init ──────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', async function () {
    try {
      var res = await API.me();
      currentUser = res.data;
      showApp();
    } catch (e) {
      showLogin();
    }
  });

  // ── Login ─────────────────────────────────────────────
  function showLogin() {
    document.getElementById('loginScreen').classList.add('active');
    document.getElementById('app').classList.remove('active');
    
    // Auth Toggle
    var isLogin = true;
    var loginF = document.getElementById('loginForm');
    var regF = document.getElementById('registerForm');
    var toggleBtn = document.getElementById('toggleAuthMode');
    toggleBtn.onclick = function(e) {
      e.preventDefault();
      isLogin = !isLogin;
      loginF.style.display = isLogin ? 'flex' : 'none';
      regF.style.display = isLogin ? 'none' : 'flex';
      toggleBtn.textContent = isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in";
      document.getElementById('lError').style.display = 'none';
      document.getElementById('rError').style.display = 'none';
    };

    loginF.onsubmit = async function (e) {
      e.preventDefault();
      var errEl = document.getElementById('lError');
      var btn = document.getElementById('loginBtn');
      var u = document.getElementById('lUser').value.trim();
      var p = document.getElementById('lPass').value;
      btn.disabled = true;
      btn.textContent = 'Verifying...';
      errEl.style.display = 'none';
      try {
        var res = await API.login(u, p);
        currentUser = res.data;
        showApp();
      } catch (err) {
        errEl.textContent = err.message || 'Credenciales incorrectas';
        errEl.style.display = 'block';
      } finally {
        btn.disabled = false;
        btn.innerHTML = 'Sign in <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M5 13h11.17l-4.88 4.88c-.39.39-.39 1.03 0 1.42.39.39 1.02.39 1.41 0l6.59-6.59c.39-.39.39-1.02 0-1.41l-6.58-6.6a.996.996 0 1 0-1.41 1.41L16.17 11H5c-.55 0-1 .45-1 1s.45 1 1 1z"/></svg>';
      }
    };

    regF.onsubmit = async function (e) {
      e.preventDefault();
      var errEl = document.getElementById('rError');
      var btn = document.getElementById('registerBtn');
      var u = document.getElementById('rUser').value.trim();
      var p = document.getElementById('rPass').value;
      var n = document.getElementById('rName').value.trim();
      var d = document.getElementById('rDoc').value.trim();
      btn.disabled = true;
      btn.textContent = 'Procesando...';
      errEl.style.display = 'none';
      try {
        var res = await API.register(u, p, n, d);
        UI.toast('Cuenta creada. Pendiente de aprobación.', 'success');
        // Switch back to login
        toggleBtn.click();
      } catch (err) {
        errEl.textContent = err.message || 'Error al registrar';
        errEl.style.display = 'block';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Create Account';
      }
    };
  }

  // ── App ───────────────────────────────────────────────
  async function showApp() {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('app').classList.add('active');
    
    var displayName = currentUser.nombre_mostrar || currentUser.username;
    
    document.getElementById('hName').textContent = displayName;
    document.getElementById('hRole').textContent = currentUser.role === 'admin' ? 'Administrador' : 'Cajero';
    document.getElementById('hAvatar').textContent = displayName[0].toUpperCase();

    buildSidebar();
    navTo(currentUser.role === 'admin' ? 'pos' : 'pos');

    document.getElementById('logoutBtn').onclick = async function () {
      await API.logout();
      currentUser = null;
      location.reload();
    };

    var si = document.getElementById('posSearchInput');
    if (si) si.oninput = function (e) {
      searchQuery = e.target.value;
      renderProducts();
    };

    // Load data for POS
    await loadPOSData();
  }

  async function loadPOSData() {
    try {
      var [prodRes, clientRes] = await Promise.all([
        API.getAllProductos(),
        API.getAllClientes()
      ]);
      allProducts = prodRes.data || [];
      allClients = clientRes.data || [];
    } catch (e) {
      UI.toast('Error cargando datos', 'error');
    }
  }

  // ── Sidebar ───────────────────────────────────────────
  function buildSidebar() {
    var sb = document.getElementById('modSidebar');
    var items = [];
    items.push({ id: 'pos', ic: '🛒', lb: 'POS' });
    if (currentUser.role === 'admin') {
      items.push({ id: 'dashboard', ic: '📊', lb: 'Dashboard' });
      items.push({ id: '_sep' });
      items.push({ id: 'products', ic: '📦', lb: 'Productos' });
      items.push({ id: 'clients', ic: '👥', lb: 'Clientes' });
      items.push({ id: 'usuarios', ic: '🛡️', lb: 'Usuarios' });
      items.push({ id: '_sep' });
      items.push({ id: 'history', ic: '📋', lb: 'Historial' });
    } else {
      // cajero: POS + history only
      items.push({ id: 'history', ic: '📋', lb: 'Historial' });
    }

    sb.innerHTML = '<img src="img/logo.png" class="mod-brand-img" alt="Logo" onerror="this.onerror=null;this.src=\'img/logo.svg\'">' +
      items.map(function (i) {
        if (i.id === '_sep') return '<div class="mod-sep"></div>';
        return '<button class="mod-btn" data-mod="' + i.id + '"><span class="mod-ic">' + i.ic + '</span>' + i.lb + '</button>';
      }).join('');

    sb.querySelectorAll('.mod-btn').forEach(function (b) {
      b.addEventListener('click', function () { navTo(b.dataset.mod); });
    });
  }

  function navTo(mod) {
    currentModule = mod;
    document.querySelectorAll('.mod-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.mod === mod);
    });
    var labels = {
      pos: 'Punto de Venta', dashboard: 'Dashboard',
      products: 'Productos', clients: 'Clientes', history: 'Historial', usuarios: 'Usuarios'
    };
    document.getElementById('hModName').textContent = labels[mod] || '';

    var posW = document.getElementById('posWrap');
    var modV = document.getElementById('modViews');

    if (mod === 'pos') {
      posW.classList.add('active');
      modV.style.display = 'none';
      renderPOS();
    } else {
      posW.classList.remove('active');
      modV.style.display = 'flex';
      modV.style.flex = '1';
      document.querySelectorAll('.mod-view').forEach(function (v) {
        v.classList.remove('active');
      });
      var vEl = document.getElementById('view_' + mod);
      if (vEl) vEl.classList.add('active');
      if (window.Modules && window.Modules[mod]) window.Modules[mod]();
    }
  }

  // ── POS ───────────────────────────────────────────────
  function renderPOS() {
    renderProducts();
    renderCart();
  }

  function renderProducts() {
    var prods = allProducts;
    if (searchQuery) {
      var q = searchQuery.toLowerCase();
      prods = prods.filter(function (p) {
        return p.nombre.toLowerCase().indexOf(q) >= 0;
      });
    }
    var g = document.getElementById('posGrid');
    if (!prods.length) {
      g.innerHTML = '<div class="empty"><p>Sin productos</p></div>';
      return;
    }
    g.innerHTML = prods.map(function (p) {
      var outOfStock = p.stock <= 0;
      return '<div class="p-card' + (outOfStock ? ' soldout' : '') + '" data-id="' + p.id + '">' +
        (outOfStock ? '<div class="p-card-so">AGOTADO</div>' : '') +
        '<div class="p-card-ic"><svg viewBox="0 0 24 24"><path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm6 14H6V8h2v2h2V8h4v2h2V8h2v10z"/></svg></div>' +
        '<div class="p-card-body">' +
        '<div class="p-card-nm">' + p.nombre + '</div>' +
        '<div class="p-card-cd">Stock: ' + p.stock + '</div>' +
        '<div class="p-card-pr">' + UI.fmtP(p.precio) + '</div>' +
        '</div></div>';
    }).join('');

    g.querySelectorAll('.p-card:not(.soldout)').forEach(function (c) {
      c.onclick = function () { addToCart(parseInt(c.dataset.id), c); };
    });
  }

  function addToCart(pid, el) {
    var p = allProducts.find(function (x) { return x.id === pid; });
    if (!p) return;
    var ex = cart.find(function (i) { return i.producto_id === pid; });
    if (ex) {
      if (ex.cantidad >= p.stock) {
        UI.toast('Stock insuficiente', 'error');
        return;
      }
      ex.cantidad++;
    } else {
      cart.push({
        producto_id: pid,
        nombre: p.nombre,
        precio_unitario: parseFloat(p.precio),
        cantidad: 1,
        stock: p.stock
      });
    }
    if (el) {
      el.classList.add('added');
      setTimeout(function () { el.classList.remove('added'); }, 260);
    }
    renderCart();
    UI.toast(p.nombre + ' agregado', 'success');
  }

  function renderCart() {
    var el = document.getElementById('opItems');
    var tot = cart.reduce(function (s, i) { return s + i.precio_unitario * i.cantidad; }, 0);
    var cnt = cart.reduce(function (s, i) { return s + i.cantidad; }, 0);

    document.getElementById('opCount').textContent = cnt ? cnt + ' item' + (cnt > 1 ? 's' : '') : 'Sin items';

    // Client section — show name + points
    if (selectedClient) {
      document.getElementById('opClient').innerHTML =
        '<div class="op-client-info">' +
        '<div class="op-client-name">👤 ' + selectedClient.nombre + '</div>' +
        '<div class="op-client-points">⭐ ' + (selectedClient.puntos || 0) + ' puntos</div>' +
        '</div>' +
        '<button class="op-client-btn" id="clearClientBtn">×</button>';
    } else {
      document.getElementById('opClient').innerHTML =
        '<button class="op-client-btn" id="pickClientBtn">+ Asignar Cliente</button>';
    }

    var pickBtn = document.getElementById('pickClientBtn');
    if (pickBtn) pickBtn.onclick = pickClient;
    var clearBtn = document.getElementById('clearClientBtn');
    if (clearBtn) clearBtn.onclick = function () { selectedClient = null; renderCart(); };

    if (!cart.length) {
      el.innerHTML = '<div class="op-empty"><span style="font-size:2rem;opacity:.2">🛒</span><p>Agrega productos</p></div>';
    } else {
      el.innerHTML = cart.map(function (item, i) {
        return '<div class="op-item"><div class="op-item-info">' +
          '<div class="op-item-nm">' + item.nombre + '</div>' +
          '<div class="op-item-pr">' + UI.fmtP(item.precio_unitario) + ' c/u</div>' +
          '</div><div class="op-item-ctrls">' +
          '<button class="cart-act" data-act="m" data-idx="' + i + '">−</button>' +
          '<span class="op-item-qty">' + item.cantidad + '</span>' +
          '<button class="cart-act" data-act="p" data-idx="' + i + '">+</button>' +
          '</div>' +
          '<div class="op-item-tot">' + UI.fmtP(item.precio_unitario * item.cantidad) + '</div>' +
          '<button class="op-item-rm btn-icon cart-act" data-act="r" data-idx="' + i + '">×</button></div>';
      }).join('');

      el.querySelectorAll('.cart-act').forEach(function (b) {
        b.onclick = function () {
          var idx = parseInt(b.dataset.idx);
          var act = b.dataset.act;
          if (act === 'p') {
            if (cart[idx].cantidad >= cart[idx].stock) {
              UI.toast('Stock máximo alcanzado', 'error');
              return;
            }
            cart[idx].cantidad++;
          } else if (act === 'm') {
            cart[idx].cantidad--;
            if (cart[idx].cantidad <= 0) cart.splice(idx, 1);
          } else {
            cart.splice(idx, 1);
          }
          renderCart();
        };
      });
    }

    document.getElementById('opSub').textContent = UI.fmtP(tot);
    document.getElementById('opTot').textContent = UI.fmtP(tot);
    document.getElementById('completeBtn').disabled = !cart.length;
    document.getElementById('completeBtn').onclick = completeOrder;
    document.getElementById('clearBtn').onclick = function () { cart = []; renderCart(); };
  }

  // ── Client picker ─────────────────────────────────────
  function pickClient() {
    var body = '<div class="fg"><label class="fl">Buscar o crear cliente</label>' +
      '<input class="fi" id="clSearch" placeholder="Nombre o teléfono"></div>' +
      '<div id="clList" style="max-height:200px;overflow-y:auto;margin-top:8px"></div>' +
      '<div style="border-top:1px solid var(--border);padding-top:10px;margin-top:10px">' +
      '<button class="btn btn-primary btn-block" id="newClBtn">+ Crear Nuevo Cliente</button></div>';
    UI.modal('Seleccionar Cliente', body);

    function renderList(q) {
      var list = allClients;
      if (q) {
        q = q.toLowerCase();
        list = list.filter(function (c) {
          return c.nombre.toLowerCase().indexOf(q) >= 0 ||
            (c.telefono && c.telefono.indexOf(q) >= 0);
        });
      }
      document.getElementById('clList').innerHTML = list.map(function (c) {
        return '<div style="padding:10px;border-radius:var(--r-sm);cursor:pointer;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border)" class="cl-pick" data-id="' + c.id + '">' +
          '<div><strong style="font-size:.93rem">' + c.nombre + '</strong>' +
          '<div style="font-size:.8rem;color:var(--text-3)">' + (c.telefono || '') + '</div></div>' +
          '<div class="points-badge">⭐ ' + (c.puntos || 0) + '</div></div>';
      }).join('');
      document.querySelectorAll('.cl-pick').forEach(function (el) {
        el.onclick = function () {
          selectedClient = allClients.find(function (x) { return x.id == el.dataset.id; });
          UI.closeModal();
          renderCart();
        };
      });
    }
    renderList('');
    document.getElementById('clSearch').oninput = function (e) { renderList(e.target.value); };
    document.getElementById('newClBtn').onclick = function () { UI.closeModal(); showNewClient(); };
  }

  function showNewClient() {
    var body = '<div class="fg"><label class="fl">Nombre</label><input class="fi" id="ncName" placeholder="Nombre"></div>' +
      '<div class="fg"><label class="fl">Teléfono</label><input class="fi" id="ncPhone" placeholder="3001234567"></div>' +
      '<div class="fg"><label class="fl">Email</label><input class="fi" id="ncEmail" placeholder="email@ejemplo.com"></div>';
    var foot = '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>' +
      '<button class="btn btn-primary" id="saveClBtn">Crear</button>';
    UI.modal('Nuevo Cliente', body, foot);
    document.getElementById('saveClBtn').onclick = async function () {
      var nm = document.getElementById('ncName').value.trim();
      var ph = document.getElementById('ncPhone').value.trim();
      var em = document.getElementById('ncEmail').value.trim();
      if (!nm) { UI.toast('Nombre requerido', 'error'); return; }
      try {
        var res = await API.createCliente({ nombre: nm, telefono: ph, email: em });
        selectedClient = res.data;
        allClients.push(res.data);
        UI.closeModal();
        renderCart();
        UI.toast('Cliente creado', 'success');
      } catch (err) {
        UI.toast(err.message, 'error');
      }
    };
  }

  // ── Complete Order ────────────────────────────────────
  async function completeOrder() {
    if (!cart.length) return;
    var btn = document.getElementById('completeBtn');
    btn.disabled = true;
    btn.textContent = 'Procesando...';

    try {
      var items = cart.map(function (i) {
        return {
          producto_id: i.producto_id,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario
        };
      });

      var res = await API.createVenta({
        cliente_id: selectedClient ? selectedClient.id : null,
        items: items
      });

      UI.toast('Venta #' + res.data.numero_factura + ' completada', 'success');

      // Show points earned confirmation
      if (res.data.puntos_ganados && res.data.puntos_ganados > 0) {
        UI.toast('+' + res.data.puntos_ganados + ' puntos añadidos', 'info');
      }

      // Show receipt
      showReceipt(res.data);

      // Refresh POS data
      cart = [];
      selectedClient = null;
      await loadPOSData();
      renderCart();
      renderProducts();
    } catch (err) {
      UI.toast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '✅ Completar Venta';
    }
  }

  // ── Receipt (Tirilla) ────────────────────────────────
  function buildReceiptHTML(venta) {
    var invoiceNum = String(venta.numero_factura).padStart(4, '0');
    var fecha = UI.fmtD(venta.fecha || new Date().toISOString());
    var clientName = venta.cliente_nombre || (selectedClient ? selectedClient.nombre : '—');

    // Build items list
    var itemsHTML = '';
    var itemsList = venta.detalles || venta.items || cart;
    itemsList.forEach(function (item) {
      var nombre = item.producto_nombre || item.nombre;
      var qty = item.cantidad;
      var unitPrice = parseFloat(item.precio_unitario);
      var total = parseFloat(item.total || (unitPrice * qty));
      itemsHTML += '<div class="rcpt-item">' +
        '<span class="rcpt-item-nm">' + qty + 'x ' + nombre + '</span>' +
        '<span>' + UI.fmtP(total) + '</span></div>' +
        '<div class="rcpt-item-detail">Valor unitario: ' + UI.fmtP(unitPrice) + '</div>';
    });

    return '<div class="rcpt" id="rcptPrint">' +
      '<div class="rcpt-hdr">' +
      '<img src="img/logo.png" class="rcpt-logo" crossorigin="anonymous" onerror="this.onerror=null;this.src=\'img/logo.svg\'">' +
      '<div class="rcpt-brand">MORA MOOD</div>' +
      '<div class="rcpt-sub">Sistema POS MoraSuite</div>' +
      '<div class="rcpt-sub">NIT: 1082918585-7</div>' +
      '</div>' +
      '<div class="rcpt-sep"></div>' +
      '<div class="rcpt-info">' +
      '<div><span>Factura:</span><span>#' + invoiceNum + '</span></div>' +
      '<div><span>Fecha:</span><span>' + fecha + '</span></div>' +
      '<div><span>Cliente:</span><span>' + clientName + '</span></div>' +
      '<div><span>Cajero:</span><span>' + (venta.cajero || currentUser.nombre_mostrar || currentUser.username) + '</span></div>' +
      '</div>' +
      '<div class="rcpt-sep"></div>' +
      '<div class="rcpt-items">' + itemsHTML + '</div>' +
      '<div class="rcpt-sep"></div>' +
      '<div class="rcpt-tot">' +
      '<div class="rcpt-tot-row"><span>Subtotal</span><span>' + UI.fmtP(venta.total) + '</span></div>' +
      '<div class="rcpt-tot-row grand"><span>TOTAL</span><span>' + UI.fmtP(venta.total) + '</span></div>' +
      '</div>' +
      '<div class="rcpt-sep"></div>' +
      '<div class="rcpt-notes">Notas: _______________</div>' +
      '<div class="rcpt-sep"></div>' +
      '<div class="rcpt-bc"><svg id="rcptBarcode"></svg></div>' +
      '<div class="rcpt-sep"></div>' +
      '<div class="rcpt-ftr">' +
      '<div class="rcpt-thanks">Gracias por elegir MoraMood 💜</div>' +
      '<div>Preparamos cada detalle para elevar tu día.</div>' +
      '<div>Nos vemos en tu próximo mood.</div>' +
      '</div>' +
      '</div>';
  }

  function showReceipt(venta) {
    var foot = '<button class="btn btn-ghost" id="rCl">Cerrar</button>' +
      '<button class="btn btn-primary" id="rDl">⬇️ Descargar JPG</button>';
    var m = UI.modal('Tirilla de Venta', '<div class="rcpt preview" id="rcptEl">' + buildReceiptHTML(venta).replace('<div class="rcpt"', '<div') + '</div>', foot);

    // Generate barcode from venta ID / invoice number
    setTimeout(function () {
      try {
        var barcodeEl = document.querySelector('#rcptEl #rcptBarcode');
        if (barcodeEl && window.JsBarcode) {
          JsBarcode(barcodeEl, 'FAC-' + String(venta.numero_factura).padStart(6, '0'), {
            format: 'CODE128', width: 1.5, height: 35,
            displayValue: true, fontSize: 10, margin: 4,
            background: '#ffffff', lineColor: '#000000'
          });
        }
      } catch (e) { console.warn('Barcode error:', e); }
    }, 100);

    m.querySelector('#rCl').onclick = function () { UI.closeModal(); };
    m.querySelector('#rDl').onclick = function () { downloadReceiptJPG(venta); };

    // Auto-download
    setTimeout(function () { downloadReceiptJPG(venta); }, 600);
  }

  function downloadReceiptJPG(venta) {
    // Render receipt in hidden container for clean capture
    var container = document.getElementById('receiptContainer');
    container.innerHTML = buildReceiptHTML(venta);
    container.style.left = '0';
    container.style.position = 'fixed';
    container.style.zIndex = '-1';

    // Generate barcode
    try {
      var bcEl = container.querySelector('#rcptBarcode');
      if (bcEl && window.JsBarcode) {
        JsBarcode(bcEl, 'FAC-' + String(venta.numero_factura).padStart(6, '0'), {
          format: 'CODE128', width: 1.5, height: 35,
          displayValue: true, fontSize: 10, margin: 4,
          background: '#ffffff', lineColor: '#000000'
        });
      }
    } catch (e) { }

    setTimeout(function () {
      var el = container.querySelector('.rcpt');
      if (el && window.html2canvas) {
        html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(function (canvas) {
          var link = document.createElement('a');
          link.download = 'tirilla-FAC-' + venta.numero_factura + '.jpg';
          link.href = canvas.toDataURL('image/jpeg', 0.95);
          link.click();
          container.innerHTML = '';
          container.style.left = '-9999px';
        });
      }
    }, 300);
  }

  // ── Expose ────────────────────────────────────────────
  window.MoraApp = {
    showLogin: showLogin,
    showReceipt: showReceipt,
    buildReceiptHTML: buildReceiptHTML,
    getUser: function () { return currentUser; },
    reloadData: loadPOSData
  };
})();
