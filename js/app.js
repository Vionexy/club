/**
 * App.js — Common application logic
 * Navigation, toast notifications, utility functions
 */

const App = {
  /**
   * Initialize the app on page load
   * @param {object} options
   * @param {string} options.page - Current page identifier
   * @param {boolean} options.showBack - Show back button
   * @param {string} options.activeNav - Active nav item id
   */
  init(options = {}) {
    // Init Telegram
    TG.init();

    // Setup navigation
    if (options.showBack) {
      TG.setupBackButton(options.backUrl || 'index.html');
    } else {
      TG.hideBackButton();
    }

    // Highlight active nav
    if (options.activeNav) {
      this.setActiveNav(options.activeNav);
    }

    console.log(`[App] Page "${options.page}" initialized`);
  },

  /**
   * Set active navigation item
   * @param {string} id
   */
  setActiveNav(id) {
    document.querySelectorAll('.bottom-nav__item').forEach(item => {
      item.classList.toggle('bottom-nav__item--active', item.dataset.nav === id);
    });
  },

  /**
   * Show toast notification
   * @param {string} message
   * @param {'success'|'error'|'info'} type
   * @param {number} duration - ms
   */
  toast(message, type = 'info', duration = 3000) {
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('toast--visible');
    });

    // Haptic
    if (type === 'success') TG.hapticNotification('success');
    if (type === 'error') TG.hapticNotification('error');

    setTimeout(() => {
      toast.classList.remove('toast--visible');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  /**
   * Navigate to a page with optional query params
   * @param {string} page
   * @param {object} params
   */
  navigate(page, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${page}?${query}` : page;
    window.location.href = url;
  },

  /**
   * Get URL query parameter
   * @param {string} name
   * @returns {string|null}
   */
  getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  },

  /**
   * Render loading skeletons
   * @param {HTMLElement} container
   * @param {number} count
   * @param {string} type - 'card' | 'row'
   */
  showSkeletons(container, count = 3, type = 'card') {
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      if (type === 'card') {
        container.innerHTML += `
          <div class="card tournament-card" style="pointer-events:none">
            <div class="tournament-card__header">
              <div class="skeleton skeleton--title"></div>
              <div class="skeleton skeleton--badge"></div>
            </div>
            <div class="skeleton skeleton--text" style="width:90%"></div>
            <div class="skeleton skeleton--text" style="width:60%"></div>
            <div class="tournament-card__meta" style="margin-top:12px">
              <div class="skeleton skeleton--badge"></div>
              <div class="skeleton skeleton--badge" style="width:60px"></div>
            </div>
            <div class="tournament-card__footer" style="margin-top:12px">
              <div class="skeleton skeleton--text" style="width:80px;margin:0"></div>
              <div class="skeleton skeleton--badge" style="width:100px"></div>
            </div>
          </div>`;
      } else if (type === 'row') {
        container.innerHTML += `
          <div class="leaderboard-row" style="pointer-events:none">
            <div class="skeleton" style="width:30px;height:20px"></div>
            <div class="skeleton skeleton--avatar"></div>
            <div class="skeleton skeleton--text" style="flex:1;margin:0"></div>
            <div class="skeleton" style="width:30px;height:20px"></div>
          </div>`;
      }
    }
  },

  /**
   * Show empty state
   * @param {HTMLElement} container
   * @param {string} icon
   * @param {string} title
   * @param {string} text
   */
  showEmpty(container, icon, title, text) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">${icon}</div>
        <div class="empty-state__title">${title}</div>
        <div class="empty-state__text">${text}</div>
      </div>`;
  },

  /**
   * Show error state with retry
   * @param {HTMLElement} container
   * @param {string} message
   * @param {function} retryFn
   */
  showError(container, message, retryFn) {
    container.innerHTML = `
      <div class="error-state">
        <div class="error-state__icon">😵</div>
        <div class="error-state__title">Ошибка</div>
        <div class="error-state__text">${message}</div>
        <button class="btn btn--secondary" onclick="(${retryFn})()">🔄 Попробовать снова</button>
      </div>`;
  },

  /**
   * Format date for display
   * @param {string} dateStr
   * @returns {string}
   */
  formatDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  },

  /**
   * Format datetime
   * @param {string} dateStr
   * @returns {string}
   */
  formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  /**
   * Get status badge HTML
   * @param {string} status
   * @returns {string}
   */
  statusBadge(status) {
    const map = {
      draft: { label: 'Черновик', class: 'badge--draft' },
      registration: { label: 'Регистрация', class: 'badge--registration' },
      active: { label: 'Активный', class: 'badge--active' },
      completed: { label: 'Завершён', class: 'badge--completed' },
    };
    const info = map[status] || { label: status, class: 'badge--draft' };
    return `<span class="badge ${info.class}">${info.label}</span>`;
  },

  /**
   * Get mode badge HTML
   * @param {string} mode
   * @returns {string}
   */
  modeBadge(mode) {
    return `<span class="badge badge--mode">${this.escapeHtml(mode)}</span>`;
  },

  /**
   * Escape HTML to prevent XSS
   * @param {string} str
   * @returns {string}
   */
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Debounce function
   * @param {function} fn
   * @param {number} delay
   * @returns {function}
   */
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }
};
