/**
 * API Client for Brawl Stars Tournament Bot
 * Handles all HTTP requests to the backend
 */

const API = {
  // Change this to your deployed backend URL
  BASE_URL: 'http://localhost:8000/api',

  /**
   * Make an authenticated API request
   * @param {string} endpoint
   * @param {object} options
   * @returns {Promise<any>}
   */
  async request(endpoint, options = {}) {
    const url = `${this.BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add Telegram WebApp auth
    if (TG.initData) {
      headers['Authorization'] = `tma ${TG.initData}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new APIError(
          error.detail || `Ошибка сервера (${response.status})`,
          response.status
        );
      }

      // Handle 204 No Content
      if (response.status === 204) return null;

      return await response.json();
    } catch (err) {
      if (err instanceof APIError) throw err;
      throw new APIError('Нет связи с сервером. Проверьте подключение к интернету.', 0);
    }
  },

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return this.request(url);
  },

  /**
   * POST request
   */
  async post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * PUT request
   */
  async put(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  // ============ TOURNAMENTS ============

  /** Get all tournaments, optionally filtered by status */
  getTournaments(status = null) {
    const params = {};
    if (status) params.status = status;
    return this.get('/tournaments', params);
  },

  /** Get single tournament by ID */
  getTournament(id) {
    return this.get(`/tournaments/${id}`);
  },

  /** Get completed tournaments */
  getHistory() {
    return this.get('/tournaments', { status: 'completed' });
  },

  // ============ REGISTRATIONS ============

  /** Register for a tournament */
  register(tournamentId) {
    return this.post(`/tournaments/${tournamentId}/register`);
  },

  /** Unregister from a tournament */
  unregister(tournamentId) {
    return this.delete(`/tournaments/${tournamentId}/register`);
  },

  // ============ BRACKETS ============

  /** Get tournament bracket */
  getBracket(tournamentId) {
    return this.get(`/tournaments/${tournamentId}/bracket`);
  },

  // ============ USERS ============

  /** Get current user profile */
  getMe() {
    return this.get('/users/me');
  },

  /** Update profile */
  updateProfile(data) {
    return this.put('/users/me', data);
  },

  // ============ LEADERBOARD ============

  /** Get leaderboard */
  getLeaderboard(limit = 50) {
    return this.get('/leaderboard', { limit });
  },

  // ============ ADMIN ============

  /** Create tournament */
  createTournament(data) {
    return this.post('/admin/tournaments', data);
  },

  /** Update tournament */
  updateTournament(id, data) {
    return this.put(`/admin/tournaments/${id}`, data);
  },

  /** Delete tournament */
  deleteTournament(id) {
    return this.delete(`/admin/tournaments/${id}`);
  },

  /** Generate bracket */
  generateBracket(tournamentId) {
    return this.post(`/admin/tournaments/${tournamentId}/generate-bracket`);
  },

  /** Set match result */
  setMatchResult(matchId, data) {
    return this.put(`/admin/brackets/${matchId}/result`, data);
  },

  /** Send notification about bracket */
  notifyBracket(tournamentId) {
    return this.post(`/admin/tournaments/${tournamentId}/notify`);
  },

  /** Get all users (admin) */
  getUsers() {
    return this.get('/admin/users');
  },

  /** Get admin dashboard stats */
  getAdminStats() {
    return this.get('/admin/stats');
  },

  /** Check if current user is admin */
  checkAdmin() {
    return this.get('/admin/check');
  }
};

/**
 * Custom API Error
 */
class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}
