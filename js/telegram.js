/**
 * Telegram WebApp SDK Integration
 * Handles initialization, theme, navigation, and user data
 */

const TG = {
  /** @type {WebApp} */
  webapp: null,
  /** @type {WebAppUser|null} */
  user: null,
  /** @type {string} */
  initData: '',
  /** @type {boolean} */
  isReady: false,

  /**
   * Initialize Telegram WebApp
   */
  init() {
    if (window.Telegram && window.Telegram.WebApp) {
      this.webapp = window.Telegram.WebApp;
      this.initData = this.webapp.initData || '';
      this.user = this.webapp.initDataUnsafe?.user || null;

      // Expand to full height
      this.webapp.expand();
      this.webapp.ready();

      // Apply theme
      this.applyTheme();

      // Enable closing confirmation
      this.webapp.enableClosingConfirmation();

      this.isReady = true;
      console.log('[TG] WebApp initialized', this.user);
    } else {
      console.warn('[TG] Telegram WebApp SDK not available, running in browser mode');
      // Dev fallback user
      this.user = {
        id: 123456789,
        first_name: 'Dev',
        last_name: 'User',
        username: 'devuser',
        language_code: 'ru'
      };
      this.initData = 'dev_mode';
      this.isReady = true;
    }
  },

  /**
   * Apply Telegram theme colors
   */
  applyTheme() {
    if (!this.webapp) return;

    const tp = this.webapp.themeParams;
    if (tp) {
      this.webapp.setHeaderColor('#0D1117');
      this.webapp.setBackgroundColor('#0D1117');
    }
  },

  /**
   * Setup back button for sub-pages
   * @param {string} fallbackUrl - URL to navigate to if history is empty
   */
  setupBackButton(fallbackUrl = 'index.html') {
    if (!this.webapp) return;

    this.webapp.BackButton.show();
    this.webapp.BackButton.onClick(() => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = fallbackUrl;
      }
    });
  },

  /**
   * Hide the back button (for main page)
   */
  hideBackButton() {
    if (!this.webapp) return;
    this.webapp.BackButton.hide();
  },

  /**
   * Show main button
   * @param {string} text
   * @param {function} callback
   * @param {string} [color]
   */
  showMainButton(text, callback, color = '#FF8C00') {
    if (!this.webapp) return;

    const btn = this.webapp.MainButton;
    btn.setText(text);
    btn.setParams({ color, text_color: '#000000' });
    btn.onClick(callback);
    btn.show();
  },

  /**
   * Hide main button
   */
  hideMainButton() {
    if (!this.webapp) return;
    this.webapp.MainButton.hide();
  },

  /**
   * Set main button loading state
   * @param {boolean} loading
   */
  setMainButtonLoading(loading) {
    if (!this.webapp) return;
    if (loading) {
      this.webapp.MainButton.showProgress();
    } else {
      this.webapp.MainButton.hideProgress();
    }
  },

  /**
   * Haptic feedback
   * @param {'light'|'medium'|'heavy'|'rigid'|'soft'} style
   */
  haptic(style = 'light') {
    if (!this.webapp?.HapticFeedback) return;
    this.webapp.HapticFeedback.impactOccurred(style);
  },

  /**
   * Haptic notification
   * @param {'success'|'warning'|'error'} type
   */
  hapticNotification(type = 'success') {
    if (!this.webapp?.HapticFeedback) return;
    this.webapp.HapticFeedback.notificationOccurred(type);
  },

  /**
   * Show confirm dialog
   * @param {string} message
   * @returns {Promise<boolean>}
   */
  confirm(message) {
    return new Promise((resolve) => {
      if (this.webapp?.showConfirm) {
        this.webapp.showConfirm(message, resolve);
      } else {
        resolve(window.confirm(message));
      }
    });
  },

  /**
   * Show alert dialog
   * @param {string} message
   * @returns {Promise<void>}
   */
  alert(message) {
    return new Promise((resolve) => {
      if (this.webapp?.showAlert) {
        this.webapp.showAlert(message, resolve);
      } else {
        window.alert(message);
        resolve();
      }
    });
  },

  /**
   * Get user display name
   * @returns {string}
   */
  getUserName() {
    if (!this.user) return 'Гость';
    return [this.user.first_name, this.user.last_name].filter(Boolean).join(' ');
  },

  /**
   * Get user avatar placeholder (first letter)
   * @returns {string}
   */
  getUserInitial() {
    if (!this.user) return '?';
    return (this.user.first_name || '?')[0].toUpperCase();
  }
};
