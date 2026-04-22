/**
 * MoraSuite — UI Utilities (modal, toast, formatters)
 */
(function () {
  'use strict';

  window.UI = {
    toast: function (m, t) {
      t = t || 'info';
      var c = document.querySelector('.toast-c');
      if (!c) {
        c = document.createElement('div');
        c.className = 'toast-c';
        document.body.appendChild(c);
      }
      var d = document.createElement('div');
      d.className = 'toast toast-' + t;
      var ic = { success: '✅', error: '❌', info: 'ℹ️' };
      d.innerHTML = '<span>' + (ic[t] || '') + '</span><span>' + m + '</span>';
      c.appendChild(d);
      setTimeout(function () {
        d.classList.add('removing');
        setTimeout(function () { d.remove(); }, 260);
      }, 3000);
    },

    modal: function (title, body, footer) {
      var o = document.getElementById('appModal');
      if (!o) {
        o = document.createElement('div');
        o.id = 'appModal';
        o.className = 'modal-overlay';
        document.body.appendChild(o);
      }
      o.innerHTML = '<div class="modal"><div class="modal-header"><h3>' + title +
        '</h3><button class="modal-close" id="mcBtn">&times;</button></div><div class="modal-body">' +
        body + '</div>' + (footer ? '<div class="modal-footer">' + footer + '</div>' : '') + '</div>';
      requestAnimationFrame(function () { o.classList.add('active'); });
      o.querySelector('#mcBtn').onclick = function () { UI.closeModal(); };
      o.addEventListener('click', function (e) { if (e.target === o) UI.closeModal(); });
      return o;
    },

    closeModal: function () {
      var m = document.getElementById('appModal');
      if (m) {
        m.classList.remove('active');
        setTimeout(function () { m.remove(); }, 300);
      }
    },

    confirm: function (m) {
      return new Promise(function (r) {
        var f = '<button class="btn btn-ghost" id="cN">Cancelar</button><button class="btn btn-primary" id="cY">Confirmar</button>';
        var modal = UI.modal('Confirmar', '<p style="color:var(--text-2);font-size:.85rem">' + m + '</p>', f);
        modal.querySelector('#cY').onclick = function () { UI.closeModal(); r(true); };
        modal.querySelector('#cN').onclick = function () { UI.closeModal(); r(false); };
      });
    },

    fmtP: function (n) {
      return '$' + Number(n).toLocaleString('es-CO');
    },

    fmtD: function (d) {
      return new Date(d).toLocaleDateString('es-CO', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    },

    fmtDS: function (d) {
      return new Date(d).toLocaleDateString('es-CO', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    },

    /**
     * Builds pagination controls HTML.
     */
    pagination: function (currentPage, totalPages, onPageClick) {
      if (totalPages <= 1) return '';
      var html = '<div class="pagination">';
      if (currentPage > 1) {
        html += '<button class="pg-btn" data-page="' + (currentPage - 1) + '">← Ant</button>';
      }
      // Show max 5 page buttons
      var start = Math.max(1, currentPage - 2);
      var end = Math.min(totalPages, start + 4);
      if (end - start < 4) start = Math.max(1, end - 4);
      for (var i = start; i <= end; i++) {
        html += '<button class="pg-btn' + (i === currentPage ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>';
      }
      if (currentPage < totalPages) {
        html += '<button class="pg-btn" data-page="' + (currentPage + 1) + '">Sig →</button>';
      }
      html += '</div>';
      return html;
    },

    /**
     * Bind pagination click events.
     */
    bindPagination: function (container, callback) {
      container.querySelectorAll('.pg-btn').forEach(function (btn) {
        btn.onclick = function () {
          callback(parseInt(btn.dataset.page));
        };
      });
    }
  };
})();
