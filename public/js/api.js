/**
 * MoraSuite — API Client (cookie-based auth)
 * All requests send cookies automatically via credentials: 'include'.
 */
(function () {
  'use strict';

  window.API = {
    /**
     * Core fetch wrapper with automatic JSON parsing and error handling.
     */
    async request(method, url, body = null) {
      const opts = {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      };
      if (body && method !== 'GET') {
        opts.body = JSON.stringify(body);
      }
      try {
        const res = await fetch(url, opts);
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 401) {
            // Session expired — redirect to login
            window.MoraApp && window.MoraApp.showLogin && window.MoraApp.showLogin();
          }
          throw new Error(data.message || 'Error del servidor');
        }
        return data;
      } catch (err) {
        throw err;
      }
    },

    get(url) { return this.request('GET', url); },
    post(url, body) { return this.request('POST', url, body); },
    put(url, body) { return this.request('PUT', url, body); },
    del(url) { return this.request('DELETE', url); },

    // ── Auth ───────────────────────
    login(username, password) {
      return this.post('/api/auth/login', { username, password });
    },
    register(username, password, nombre_mostrar, documento) {
      return this.post('/api/auth/register', { username, password, nombre_mostrar, documento });
    },
    logout() {
      return this.post('/api/auth/logout');
    },
    me() {
      return this.get('/api/auth/me');
    },

    // ── Usuarios ───────────────────
    getUsuarios() {
      return this.get('/api/usuarios');
    },
    updateUsuarioStatus(id, status) {
      return this.put('/api/usuarios/' + id + '/status', { status });
    },

    // ── Productos ──────────────────
    getProductos(params = '') {
      return this.get('/api/productos' + (params ? '?' + params : ''));
    },
    getAllProductos() {
      return this.get('/api/productos/all');
    },
    createProducto(data) {
      return this.post('/api/productos', data);
    },
    updateProducto(id, data) {
      return this.put('/api/productos/' + id, data);
    },
    deleteProducto(id) {
      return this.del('/api/productos/' + id);
    },

    // ── Clientes ───────────────────
    getClientes(params = '') {
      return this.get('/api/clientes' + (params ? '?' + params : ''));
    },
    getAllClientes() {
      return this.get('/api/clientes/all');
    },
    createCliente(data) {
      return this.post('/api/clientes', data);
    },
    updateCliente(id, data) {
      return this.put('/api/clientes/' + id, data);
    },
    deleteCliente(id) {
      return this.del('/api/clientes/' + id);
    },

    // ── Ventas ─────────────────────
    getVentas(params = '') {
      return this.get('/api/ventas' + (params ? '?' + params : ''));
    },
    getVenta(id) {
      return this.get('/api/ventas/' + id);
    },
    createVenta(data) {
      return this.post('/api/ventas', data);
    },

    // ── Dashboard ──────────────────
    getDashStats() {
      return this.get('/api/dashboard/stats');
    },
    getDashTopProducts() {
      return this.get('/api/dashboard/top-products');
    },
    getDashRecentSales() {
      return this.get('/api/dashboard/recent-sales');
    },
    getDashHourly() {
      return this.get('/api/dashboard/hourly');
    }
  };
})();
