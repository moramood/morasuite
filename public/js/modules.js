/**
 * MoraSuite — Admin Modules (Dashboard, Products, Clients, History)
 * All list views have pagination + search.
 */
(function () {
  'use strict';

  window.Modules = {};

  // ═══════════════════════════════════════════════════════
  //  DASHBOARD (admin only)
  // ═══════════════════════════════════════════════════════
  Modules.dashboard = async function () {
    var v = document.getElementById('view_dashboard');
    v.innerHTML = '<div class="content-header"><h2>📊 Dashboard</h2><span class="hdr-date">' +
      new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) +
      '</span></div><div class="content-body"><div class="loading-spinner">Cargando...</div></div>';

    try {
      var [statsRes, topRes, recentRes, hourlyRes] = await Promise.all([
        API.getDashStats(),
        API.getDashTopProducts(),
        API.getDashRecentSales(),
        API.getDashHourly()
      ]);

      var stats = statsRes.data;
      var topProducts = topRes.data || [];
      var recentSales = recentRes.data || [];
      var hourlyData = hourlyRes.data || [];

      var body = v.querySelector('.content-body');
      body.innerHTML =
        // Metrics
        '<div class="dash-metrics">' +
        '<div class="metric-card"><div class="metric-label">Ventas Hoy</div>' +
        '<div class="metric-val" style="color:var(--success)">' + UI.fmtP(stats.hoy.ventas_total) + '</div>' +
        '<div class="metric-sub">' + stats.hoy.ventas_count + ' pedidos</div></div>' +

        '<div class="metric-card"><div class="metric-label">Pedidos Hoy</div>' +
        '<div class="metric-val" style="color:var(--primary)">' + stats.hoy.ventas_count + '</div>' +
        '<div class="metric-sub">Total histórico: ' + stats.total_historico + '</div></div>' +

        '<div class="metric-card"><div class="metric-label">Ticket Promedio</div>' +
        '<div class="metric-val" style="color:var(--warning)">' + UI.fmtP(stats.hoy.ticket_promedio) + '</div></div>' +

        '<div class="metric-card"><div class="metric-label">Datos</div>' +
        '<div class="metric-val" style="font-size:1rem">📦 ' + stats.total_productos + ' | 👥 ' + stats.total_clientes + '</div>' +
        '<div class="metric-sub">Productos y clientes</div></div>' +
        '</div>' +

        // Charts
        '<div class="dash-charts">' +
        '<div class="chart-card"><h3>📈 Ventas por Hora</h3><canvas id="chartHour"></canvas></div>' +
        '<div class="chart-card"><h3>🏆 Top Productos</h3><canvas id="chartTop"></canvas></div>' +
        '</div>' +

        // Recent sales
        '<div class="chart-card"><h3>📋 Últimas Ventas</h3>' +
        '<div style="max-height:200px;overflow-y:auto">' +
        recentSales.map(function (o) {
          return '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:.88rem">' +
            '<span style="color:var(--primary);font-weight:600">#' + String(o.numero_factura).padStart(4, '0') + '</span>' +
            '<span>' + (o.cliente_nombre || '—') + '</span>' +
            '<span style="font-weight:700">' + UI.fmtP(o.total) + '</span>' +
            '<span style="color:var(--text-3)">' + UI.fmtDS(o.fecha) + '</span></div>';
        }).join('') + '</div></div>';

      // Render charts
      if (window.Chart) {
        setTimeout(function () {
          // Hourly chart
          var hLabels = [], hData = [];
          for (var h = 6; h <= 22; h++) {
            hLabels.push(h + ':00');
            var found = hourlyData.find(function (r) { return r.hora === h; });
            hData.push(found ? parseFloat(found.total) : 0);
          }
          new Chart(document.getElementById('chartHour'), {
            type: 'line',
            data: {
              labels: hLabels,
              datasets: [{
                label: 'Ventas ($)', data: hData,
                borderColor: '#6C3BFF', backgroundColor: 'rgba(108,59,255,0.1)',
                fill: true, tension: 0.4
              }]
            },
            options: {
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: '#5C5C78', font: { size: 9 } }, grid: { color: 'rgba(30,30,56,0.5)' } },
                y: { ticks: { color: '#5C5C78', font: { size: 9 } }, grid: { color: 'rgba(30,30,56,0.5)' } }
              }
            }
          });

          // Top products chart
          if (topProducts.length) {
            new Chart(document.getElementById('chartTop'), {
              type: 'bar',
              data: {
                labels: topProducts.map(function (p) { return p.nombre; }),
                datasets: [{
                  label: 'Unidades', data: topProducts.map(function (p) { return p.unidades; }),
                  backgroundColor: 'rgba(108,59,255,0.6)', borderColor: '#6C3BFF', borderWidth: 1
                }]
              },
              options: {
                indexAxis: 'y',
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { color: '#5C5C78', font: { size: 9 } }, grid: { color: 'rgba(30,30,56,0.5)' } },
                  y: { ticks: { color: '#9494B8', font: { size: 9 } }, grid: { display: false } }
                }
              }
            });
          }
        }, 100);
      }
    } catch (err) {
      v.querySelector('.content-body').innerHTML = '<div class="empty"><p>Error cargando dashboard: ' + err.message + '</p></div>';
    }
  };

  // ═══════════════════════════════════════════════════════
  //  PRODUCTS ADMIN (with pagination + search)
  // ═══════════════════════════════════════════════════════
  var prodPage = 1;
  var prodSearch = '';

  Modules.products = async function (page) {
    if (page) prodPage = page;
    var v = document.getElementById('view_products');

    var params = 'page=' + prodPage + '&limit=15';
    if (prodSearch) params += '&search=' + encodeURIComponent(prodSearch);

    v.innerHTML = '<div class="content-header"><h2>📦 Productos</h2>' +
      '<div style="display:flex;gap:8px;align-items:center">' +
      '<input class="fi" id="prodSearchInput" placeholder="Buscar..." value="' + prodSearch + '" style="width:200px">' +
      '<button class="btn btn-primary btn-sm" id="addProdBtn">+ Nuevo</button></div></div>' +
      '<div class="content-body"><div class="loading-spinner">Cargando...</div></div>';

    try {
      var res = await API.getProductos(params);
      var prods = res.data || [];
      var body = v.querySelector('.content-body');

      if (!prods.length) {
        body.innerHTML = '<div class="empty"><p>Sin productos</p></div>';
      } else {
        body.innerHTML = '<table class="dtable"><thead><tr>' +
          '<th>Nombre</th><th>Descripción</th><th>Precio</th><th>Stock</th><th>Acciones</th>' +
          '</tr></thead><tbody>' +
          prods.map(function (p) {
            return '<tr><td><strong>' + p.nombre + '</strong></td>' +
              '<td style="color:var(--text-3);font-size:.72rem">' + (p.descripcion || '—') + '</td>' +
              '<td>' + UI.fmtP(p.precio) + '</td>' +
              '<td><span class="badge ' + (p.stock > 0 ? 'badge-ok' : 'badge-soldout') + '">' + p.stock + '</span></td>' +
              '<td class="actions">' +
              '<button class="btn btn-ghost btn-sm ed-p" data-id="' + p.id + '">✏️</button>' +
              '<button class="btn btn-danger btn-sm dl-p" data-id="' + p.id + '">🗑️</button></td></tr>';
          }).join('') +
          '</tbody></table>' +
          UI.pagination(res.page, res.totalPages);
      }

      // Bind pagination
      UI.bindPagination(body, function (pg) { Modules.products(pg); });

      // Bind search
      var searchInput = v.querySelector('#prodSearchInput');
      var searchTimeout;
      searchInput.oninput = function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function () {
          prodSearch = searchInput.value;
          prodPage = 1;
          Modules.products();
        }, 400);
      };

      // Bind edit
      v.querySelectorAll('.ed-p').forEach(function (b) {
        b.onclick = function () { prodForm(parseInt(b.dataset.id)); };
      });

      // Bind delete
      v.querySelectorAll('.dl-p').forEach(function (b) {
        b.onclick = async function () {
          var yes = await UI.confirm('¿Eliminar este producto?');
          if (yes) {
            try {
              await API.deleteProducto(b.dataset.id);
              UI.toast('Producto eliminado', 'success');
              Modules.products();
              window.MoraApp.reloadData();
            } catch (err) {
              UI.toast(err.message, 'error');
            }
          }
        };
      });
    } catch (err) {
      v.querySelector('.content-body').innerHTML = '<div class="empty"><p>Error: ' + err.message + '</p></div>';
    }

    // New product button
    v.querySelector('#addProdBtn').onclick = function () { prodForm(); };
  };

  async function prodForm(editId) {
    var p = null;
    if (editId) {
      try {
        var res = await API.request('GET', '/api/productos/' + editId);
        p = res.data;
      } catch (e) { UI.toast('Error cargando producto', 'error'); return; }
    }

    var body = '<div class="fg"><label class="fl">Nombre</label><input class="fi" id="pN" value="' + (p ? p.nombre : '') + '"></div>' +
      '<div class="fg"><label class="fl">Descripción</label><input class="fi" id="pD" value="' + (p ? (p.descripcion || '') : '') + '"></div>' +
      '<div class="fg"><label class="fl">Precio</label><input class="fi" id="pP" type="number" step="0.01" value="' + (p ? p.precio : '') + '"></div>' +
      '<div class="fg"><label class="fl">Stock</label><input class="fi" id="pS" type="number" value="' + (p ? p.stock : '0') + '"></div>';
    var foot = '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>' +
      '<button class="btn btn-primary" id="spB">' + (p ? 'Guardar' : 'Crear') + '</button>';
    UI.modal(p ? 'Editar Producto' : 'Nuevo Producto', body, foot);

    document.getElementById('spB').onclick = async function () {
      var data = {
        nombre: document.getElementById('pN').value.trim(),
        descripcion: document.getElementById('pD').value.trim(),
        precio: parseFloat(document.getElementById('pP').value),
        stock: parseInt(document.getElementById('pS').value)
      };
      if (!data.nombre || isNaN(data.precio)) { UI.toast('Completa campos requeridos', 'error'); return; }
      try {
        if (p) {
          await API.updateProducto(p.id, data);
          UI.toast('Producto actualizado', 'success');
        } else {
          await API.createProducto(data);
          UI.toast('Producto creado', 'success');
        }
        UI.closeModal();
        Modules.products();
        window.MoraApp.reloadData();
      } catch (err) {
        UI.toast(err.message, 'error');
      }
    };
  }

  // ═══════════════════════════════════════════════════════
  //  CLIENTS ADMIN (with pagination + search)
  // ═══════════════════════════════════════════════════════
  var clientPage = 1;
  var clientSearch = '';

  Modules.clients = async function (page) {
    if (page) clientPage = page;
    var v = document.getElementById('view_clients');

    var params = 'page=' + clientPage + '&limit=15';
    if (clientSearch) params += '&search=' + encodeURIComponent(clientSearch);

    v.innerHTML = '<div class="content-header"><h2>👥 Clientes</h2>' +
      '<div style="display:flex;gap:8px;align-items:center">' +
      '<input class="fi" id="clientSearchInput" placeholder="Buscar..." value="' + clientSearch + '" style="width:200px">' +
      '<button class="btn btn-primary btn-sm" id="addClientBtn">+ Nuevo</button></div></div>' +
      '<div class="content-body"><div class="loading-spinner">Cargando...</div></div>';

    try {
      var res = await API.getClientes(params);
      var clients = res.data || [];
      var body = v.querySelector('.content-body');

      if (!clients.length) {
        body.innerHTML = '<div class="empty"><p>Sin clientes registrados</p></div>';
      } else {
        body.innerHTML = '<table class="dtable"><thead><tr>' +
          '<th>Nombre</th><th>Teléfono</th><th>Email</th><th>Puntos</th><th>Acciones</th>' +
          '</tr></thead><tbody>' +
          clients.map(function (c) {
            return '<tr><td><strong>' + c.nombre + '</strong></td>' +
              '<td style="color:var(--text-3);font-size:.82rem">' + (c.telefono || '—') + '</td>' +
              '<td style="color:var(--text-3);font-size:.82rem">' + (c.email || '—') + '</td>' +
              '<td><span class="points-badge points-badge-lg" style="display:inline-block">⭐ ' + (c.puntos || 0) + ' pts</span></td>' +
              '<td class="actions">' +
              '<button class="btn btn-ghost btn-sm ed-c" data-id="' + c.id + '">✏️</button>' +
              '<button class="btn btn-danger btn-sm dl-c" data-id="' + c.id + '">🗑️</button></td></tr>';
          }).join('') +
          '</tbody></table>' +
          UI.pagination(res.page, res.totalPages);
      }

      UI.bindPagination(body, function (pg) { Modules.clients(pg); });

      // Search
      var searchInput = v.querySelector('#clientSearchInput');
      var searchTimeout;
      searchInput.oninput = function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function () {
          clientSearch = searchInput.value;
          clientPage = 1;
          Modules.clients();
        }, 400);
      };

      // Edit
      v.querySelectorAll('.ed-c').forEach(function (b) {
        b.onclick = function (e) {
          e.stopPropagation();
          clientForm(parseInt(b.dataset.id));
        };
      });

      // Delete
      v.querySelectorAll('.dl-c').forEach(function (b) {
        b.onclick = async function (e) {
          e.stopPropagation();
          var yes = await UI.confirm('¿Eliminar este cliente?');
          if (yes) {
            try {
              await API.deleteCliente(b.dataset.id);
              UI.toast('Cliente eliminado', 'success');
              Modules.clients();
              window.MoraApp.reloadData();
            } catch (err) {
              UI.toast(err.message, 'error');
            }
          }
        };
      });
    } catch (err) {
      v.querySelector('.content-body').innerHTML = '<div class="empty"><p>Error: ' + err.message + '</p></div>';
    }

    v.querySelector('#addClientBtn').onclick = function () { clientForm(); };
  };

  async function clientForm(editId) {
    var c = null;
    if (editId) {
      try {
        var res = await API.request('GET', '/api/clientes/' + editId);
        c = res.data;
      } catch (e) { UI.toast('Error cargando cliente', 'error'); return; }
    }

    var body = '';
    if (c) {
      body += '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--bg-card);border-radius:var(--r-md);margin-bottom:4px">' +
        '<span style="font-size:.88rem;color:var(--text-2)">Puntos acumulados</span>' +
        '<div class="points-badge points-badge-lg">⭐ ' + (c.puntos || 0) + ' pts</div></div>';
    }
    body += '<div class="fg"><label class="fl">Nombre</label><input class="fi" id="cN" value="' + (c ? c.nombre : '') + '"></div>' +
      '<div class="fg"><label class="fl">Teléfono</label><input class="fi" id="cT" value="' + (c ? (c.telefono || '') : '') + '"></div>' +
      '<div class="fg"><label class="fl">Email</label><input class="fi" id="cE" value="' + (c ? (c.email || '') : '') + '"></div>';
    var foot = '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>' +
      '<button class="btn btn-primary" id="scB">' + (c ? 'Guardar' : 'Crear') + '</button>';
    UI.modal(c ? 'Editar Cliente' : 'Nuevo Cliente', body, foot);

    document.getElementById('scB').onclick = async function () {
      var data = {
        nombre: document.getElementById('cN').value.trim(),
        telefono: document.getElementById('cT').value.trim(),
        email: document.getElementById('cE').value.trim()
      };
      if (!data.nombre) { UI.toast('Nombre requerido', 'error'); return; }
      try {
        if (c) {
          await API.updateCliente(c.id, data);
          UI.toast('Cliente actualizado', 'success');
        } else {
          await API.createCliente(data);
          UI.toast('Cliente creado', 'success');
        }
        UI.closeModal();
        Modules.clients();
        window.MoraApp.reloadData();
      } catch (err) {
        UI.toast(err.message, 'error');
      }
    };
  }

  // ═══════════════════════════════════════════════════════
  //  SALES HISTORY (with pagination + search)
  // ═══════════════════════════════════════════════════════
  var histPage = 1;
  var histSearch = '';

  Modules.history = async function (page) {
    if (page) histPage = page;
    var v = document.getElementById('view_history');

    var params = 'page=' + histPage + '&limit=15';
    if (histSearch) params += '&search=' + encodeURIComponent(histSearch);

    v.innerHTML = '<div class="content-header"><h2>📋 Historial de Ventas</h2>' +
      '<div style="display:flex;gap:8px;align-items:center">' +
      '<input class="fi" id="histSearchInput" placeholder="Buscar factura o cliente..." value="' + histSearch + '" style="width:240px">' +
      '</div></div>' +
      '<div class="content-body"><div class="loading-spinner">Cargando...</div></div>';

    try {
      var res = await API.getVentas(params);
      var ventas = res.data || [];
      var body = v.querySelector('.content-body');

      if (!ventas.length) {
        body.innerHTML = '<div class="empty"><p>Sin ventas registradas</p></div>';
      } else {
        body.innerHTML = '<table class="dtable"><thead><tr>' +
          '<th>#Factura</th><th>Fecha</th><th>Cliente</th><th>Cajero</th><th>Total</th><th>Acciones</th>' +
          '</tr></thead><tbody>' +
          ventas.map(function (v) {
            return '<tr>' +
              '<td><strong style="color:var(--primary)">#' + String(v.numero_factura).padStart(4, '0') + '</strong></td>' +
              '<td style="font-size:.72rem">' + UI.fmtDS(v.fecha) + '</td>' +
              '<td style="color:var(--text-2)">' + (v.cliente_nombre || '—') + '</td>' +
              '<td style="color:var(--text-3);font-size:.7rem">' + (v.cajero || '—') + '</td>' +
              '<td><strong>' + UI.fmtP(v.total) + '</strong></td>' +
              '<td class="actions">' +
              '<button class="btn btn-ghost btn-sm vw-v" data-id="' + v.id + '">👁️ Ver</button>' +
              '<button class="btn btn-secondary btn-sm pr-v" data-id="' + v.id + '">🖨️</button></td></tr>';
          }).join('') +
          '</tbody></table>' +
          UI.pagination(res.page, res.totalPages);
      }

      UI.bindPagination(body, function (pg) { Modules.history(pg); });

      // Search
      var searchInput = v.querySelector('#histSearchInput');
      var searchTimeout;
      searchInput.oninput = function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function () {
          histSearch = searchInput.value;
          histPage = 1;
          Modules.history();
        }, 400);
      };

      // View receipt
      v.querySelectorAll('.vw-v').forEach(function (b) {
        b.onclick = async function () {
          try {
            var res = await API.getVenta(b.dataset.id);
            window.MoraApp.showReceipt(res.data);
          } catch (err) {
            UI.toast(err.message, 'error');
          }
        };
      });

      // Print receipt
      v.querySelectorAll('.pr-v').forEach(function (b) {
        b.onclick = async function () {
          try {
            var res = await API.getVenta(b.dataset.id);
            var venta = res.data;
            var w = window.open('', '_blank', 'width=320,height=600');
            w.document.write('<!DOCTYPE html><html><head><style>' +
              'body{font-family:"Courier New",monospace;font-size:12px;margin:0;padding:16px;width:280px;color:#000}' +
              '.rcpt-hdr{text-align:center;padding-bottom:8px;margin-bottom:8px}' +
              '.rcpt-logo{width:50px;height:50px;display:block;margin:0 auto 6px;object-fit:contain}' +
              '.rcpt-brand{font-size:18px;font-weight:800}.rcpt-sub{font-size:10px;color:#666}' +
              '.rcpt-sep{border-bottom:1px dotted #999;margin:6px 0}' +
              '.rcpt-info div{display:flex;justify-content:space-between;font-size:11px}' +
              '.rcpt-items{padding:6px 0}.rcpt-item{display:flex;justify-content:space-between;padding:2px 0}' +
              '.rcpt-item-nm{flex:1}.rcpt-item-detail{font-size:9px;color:#888;padding-left:10px}' +
              '.rcpt-tot-row{display:flex;justify-content:space-between}' +
              '.rcpt-tot-row.grand{font-size:16px;font-weight:800;margin-top:4px}' +
              '.rcpt-notes{font-size:10px;color:#666;padding:4px 0}' +
              '.rcpt-ftr{text-align:center;padding-top:8px;font-size:11px}' +
              '.rcpt-thanks{font-size:14px;font-weight:700;margin-bottom:4px}' +
              '.rcpt-bc{text-align:center;margin-top:6px}.rcpt-bc svg{max-width:100%}' +
              '</style></head><body>' +
              window.MoraApp.buildReceiptHTML(venta) +
              '<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>' +
              '<script>setTimeout(function(){try{JsBarcode("#rcptBarcode","FAC-' +
              String(venta.numero_factura).padStart(6, '0') +
              '",{format:"CODE128",width:1.5,height:35,displayValue:true,fontSize:10,margin:4})}catch(e){}window.print()},500)<\/script>' +
              '</body></html>');
            w.document.close();
          } catch (err) {
            UI.toast(err.message, 'error');
          }
        };
      });
    } catch (err) {
      v.querySelector('.content-body').innerHTML = '<div class="empty"><p>Error: ' + err.message + '</p></div>';
    }
  };

  // ═══════════════════════════════════════════════════════
  //  USUARIOS ADMIN
  // ═══════════════════════════════════════════════════════
  Modules.usuarios = async function () {
    var v = document.getElementById('view_usuarios');

    v.innerHTML = '<div class="content-header"><h2>🛡️ Usuarios del Sistema</h2></div>' +
      '<div class="content-body"><div class="loading-spinner">Cargando...</div></div>';

    try {
      var res = await API.getUsuarios();
      var users = res.data || [];
      var body = v.querySelector('.content-body');

      if (!users.length) {
        body.innerHTML = '<div class="empty"><p>Sin usuarios registrados</p></div>';
      } else {
        body.innerHTML = '<table class="dtable"><thead><tr>' +
          '<th>Usuario</th><th>Rol</th><th>Estado</th><th>Registro</th><th>Acciones</th>' +
          '</tr></thead><tbody>' +
          users.map(function (u) {
            var badgeCls = 'badge-ok';
            var statText = 'Aprobado';
            if (u.status === 'pending') { badgeCls = 'badge-warn'; statText = 'Pendiente'; }
            if (u.status === 'rejected') { badgeCls = 'badge-soldout'; statText = 'Rechazado'; }

            var actionBtns = '';
            if (u.role !== 'admin') {
              if (u.status === 'pending' || u.status === 'rejected') {
                actionBtns += '<button class="btn btn-success btn-sm st-u" data-id="'+u.id+'" data-st="approved">Aprobar</button> ';
              }
              if (u.status === 'pending' || u.status === 'approved') {
                actionBtns += '<button class="btn btn-danger btn-sm st-u" data-id="'+u.id+'" data-st="rejected">Rechazar</button>';
              }
            } else {
              actionBtns = '<span style="color:var(--text-3);font-size:.8rem">Administrador Principal</span>';
            }

            return '<tr><td><strong>' + u.username + '</strong></td>' +
              '<td>' + (u.role === 'admin' ? 'Administrador' : 'Cajero') + '</td>' +
              '<td><span class="badge ' + badgeCls + '">' + statText + '</span></td>' +
              '<td style="color:var(--text-3);font-size:.82rem">' + UI.fmtDS(u.created_at) + '</td>' +
              '<td class="actions">' + actionBtns + '</td></tr>';
          }).join('') +
          '</tbody></table>';
      }

      v.querySelectorAll('.st-u').forEach(function (b) {
        b.onclick = async function () {
          var id = b.dataset.id;
          var st = b.dataset.st;
          var msg = st === 'approved' ? '¿Aprobar este usuario para que pueda iniciar sesión?' : '¿Rechazar este usuario?';
          var yes = await UI.confirm(msg);
          if (yes) {
            try {
              await API.updateUsuarioStatus(id, st);
              UI.toast('Estado actualizado', 'success');
              Modules.usuarios(); // reload
            } catch (err) {
              UI.toast(err.message, 'error');
            }
          }
        };
      });

    } catch (err) {
      v.querySelector('.content-body').innerHTML = '<div class="empty"><p>Error: ' + err.message + '</p></div>';
    }
  };

})();
