/**
 * Admin.js - Admin panel logic
 */

const Admin = {
  /**
   * Verify if current user has admin access
   * Redirects if not authorized
   */
  async checkAccess() {
    try {
      const data = await API.checkAdmin();
      console.log('[Admin] Access granted', data);
      return true;
    } catch (err) {
      console.error('[Admin] Access denied', err);
      TG.alert('Доступ запрещен. Эта страница только для администраторов.').then(() => {
        window.location.href = '../index.html';
      });
      return false;
    }
  },

  /**
   * Initialize Admin Dashboard
   */
  async initDashboard() {
    const isOk = await this.checkAccess();
    if (!isOk) return;

    const statsContainer = document.getElementById('admin-stats');
    const listContainer = document.getElementById('admin-tournaments-list');

    try {
      // Load Stats
      const stats = await API.getAdminStats();
      document.getElementById('stat-active-tournaments').textContent = stats.active_tournaments;
      document.getElementById('stat-total-users').textContent = stats.total_users;

      // Load Tournaments
      const tournaments = await API.getTournaments();
      listContainer.innerHTML = '';

      if (tournaments.length === 0) {
        listContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-state__icon">⚔️</div>
            <div class="empty-state__title">Турниров пока нет</div>
            <div class="empty-state__text">Создайте свой первый турнир прямо сейчас!</div>
          </div>`;
        return;
      }

      tournaments.forEach(t => {
        const card = document.createElement('div');
        card.className = 'card tournament-card';
        card.innerHTML = `
          <div class="tournament-card__header">
            <h3 class="tournament-card__title">${App.escapeHtml(t.title)}</h3>
            ${App.statusBadge(t.status)}
          </div>
          <div class="tournament-card__meta">
            ${App.modeBadge(t.game_mode)}
            <span class="badge badge--mode">${App.escapeHtml(t.tournament_type)}</span>
          </div>
          <div class="tournament-card__footer">
            <span class="tournament-card__players">👥 ${t.participant_count} / ${t.max_participants}</span>
            <div style="display:flex;gap:var(--space-sm)">
              <button class="btn btn--secondary btn--sm" onclick="App.navigate('manage.html', {id: ${t.id}})">⚙️ Управлять</button>
              <button class="btn btn--secondary btn--sm" onclick="App.navigate('create.html', {id: ${t.id}})">✏️ Редактировать</button>
            </div>
          </div>`;
        listContainer.appendChild(card);
      });
    } catch (err) {
      App.toast(err.message, 'error');
    }
  },

  /**
   * Initialize Create/Edit form
   */
  async initCreateForm() {
    const isOk = await this.checkAccess();
    if (!isOk) return;

    const form = document.getElementById('tournament-form');
    const tournamentId = App.getParam('id');
    const pageTitle = document.getElementById('form-page-title');
    const submitBtn = document.getElementById('form-submit-btn');

    if (tournamentId) {
      pageTitle.innerHTML = '<span>✏️</span> Редактировать турнир';
      submitBtn.textContent = 'Сохранить изменения';
      // Load existing data
      try {
        const t = await API.getTournament(tournamentId);
        document.getElementById('title').value = t.title;
        document.getElementById('description').value = t.description || '';
        document.getElementById('game_mode').value = t.game_mode;
        document.getElementById('tournament_type').value = t.tournament_type;
        document.getElementById('bracket_type').value = t.bracket_type;
        document.getElementById('max_participants').value = t.max_participants;
        document.getElementById('prize_1st').value = t.prize_1st || '';
        document.getElementById('prize_2nd').value = t.prize_2nd || '';
        document.getElementById('prize_3rd').value = t.prize_3rd || '';
        document.getElementById('status').value = t.status;

        if (t.start_date) {
          document.getElementById('start_date').value = t.start_date.substring(0, 16);
        }
        if (t.registration_deadline) {
          document.getElementById('registration_deadline').value = t.registration_deadline.substring(0, 16);
        }
      } catch (err) {
        App.toast(err.message, 'error');
      }
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const payload = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value || null,
        game_mode: document.getElementById('game_mode').value,
        tournament_type: document.getElementById('tournament_type').value,
        bracket_type: document.getElementById('bracket_type').value,
        max_participants: parseInt(document.getElementById('max_participants').value, 10),
        prize_1st: document.getElementById('prize_1st').value || null,
        prize_2nd: document.getElementById('prize_2nd').value || null,
        prize_3rd: document.getElementById('prize_3rd').value || null,
        status: document.getElementById('status').value,
        start_date: document.getElementById('start_date').value ? new Date(document.getElementById('start_date').value).toISOString() : null,
        registration_deadline: document.getElementById('registration_deadline').value ? new Date(document.getElementById('registration_deadline').value).toISOString() : null,
      };

      try {
        if (tournamentId) {
          await API.updateTournament(tournamentId, payload);
          App.toast('Турнир успешно обновлен!', 'success');
        } else {
          await API.createTournament(payload);
          App.toast('Турнир успешно создан!', 'success');
        }
        setTimeout(() => {
          App.navigate('index.html');
        }, 1000);
      } catch (err) {
        App.toast(err.message, 'error');
      }
    });
  },

  /**
   * Initialize Tournament Management Page
   */
  async initManagePage() {
    const isOk = await this.checkAccess();
    if (!isOk) return;

    const tId = App.getParam('id');
    if (!tId) {
      App.navigate('index.html');
      return;
    }

    // Modal elements
    const modal = document.getElementById('match-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');
    const p1Btn = document.getElementById('match-player1-btn');
    const p2Btn = document.getElementById('match-player2-btn');
    const score1Input = document.getElementById('match-score1');
    const score2Input = document.getElementById('match-score2');
    const saveMatchBtn = document.getElementById('match-save-btn');

    let selectedWinnerId = null;
    let activeMatch = null;

    const loadData = async () => {
      try {
        const t = await API.getTournament(tId);
        document.getElementById('tournament-title').textContent = t.title;
        document.getElementById('tournament-status-badge').innerHTML = App.statusBadge(t.status);
        document.getElementById('tournament-players-count').textContent = `${t.participant_count} / ${t.max_participants}`;

        // Toggle bracket action button
        const generateBtn = document.getElementById('generate-bracket-btn');
        const notifyBtn = document.getElementById('notify-bracket-btn');

        if (t.status === 'draft' || t.status === 'registration') {
          generateBtn.classList.remove('hidden');
          notifyBtn.classList.add('hidden');
        } else {
          generateBtn.classList.add('hidden');
          notifyBtn.classList.remove('hidden');
        }

        // Load Bracket Matches
        const matches = await API.getBracket(tId);
        const bracketContainer = document.getElementById('manage-bracket-container');
        Bracket.render(bracketContainer, matches);

        // Load list of users/participants
        const participantsContainer = document.getElementById('manage-participants-list');
        participantsContainer.innerHTML = '';
        
        // Load full participant list (since we don't have a direct endpoint, we can check tournament registrations if we had them)
        // For simplicity, let's display a generic info or message if we don't list registrations.
        // Actually, we can fetch users list and show it, but bracket handles matches anyway.
      } catch (err) {
        App.toast(err.message, 'error');
      }
    };

    // Load initially
    await loadData();

    // Event listener for bracket match click
    document.addEventListener('matchClick', (e) => {
      const match = e.detail;
      if (match.status === 'completed') {
        App.toast('Матч уже завершен!', 'info');
        return;
      }
      if (!match.player1 || !match.player2) {
        App.toast('Нельзя установить результат матча, пока не определены оба игрока!', 'info');
        return;
      }

      activeMatch = match;
      selectedWinnerId = null;

      // Reset selection
      p1Btn.classList.remove('match-edit__player--selected');
      p2Btn.classList.remove('match-edit__player--selected');
      p1Btn.textContent = match.player1.display_name;
      p2Btn.textContent = match.player2.display_name;

      score1Input.value = '0';
      score2Input.value = '0';

      // Show modal
      modalOverlay.classList.add('modal-overlay--visible');
    });

    p1Btn.addEventListener('click', () => {
      selectedWinnerId = activeMatch.player1.id;
      p1Btn.classList.add('match-edit__player--selected');
      p2Btn.classList.remove('match-edit__player--selected');
      TG.haptic('light');
    });

    p2Btn.addEventListener('click', () => {
      selectedWinnerId = activeMatch.player2.id;
      p2Btn.classList.add('match-edit__player--selected');
      p1Btn.classList.remove('match-edit__player--selected');
      TG.haptic('light');
    });

    // Close modal
    const closeModal = () => {
      modalOverlay.classList.remove('modal-overlay--visible');
      activeMatch = null;
      selectedWinnerId = null;
    };
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });

    // Save match result
    saveMatchBtn.addEventListener('click', async () => {
      if (!activeMatch || !selectedWinnerId) {
        App.toast('Выберите победителя матча!', 'error');
        return;
      }

      const s1 = parseInt(score1Input.value || 0, 10);
      const s2 = parseInt(score2Input.value || 0, 10);
      const scoreString = `${s1}:${s2}`;

      try {
        await API.setMatchResult(activeMatch.id, {
          winner_id: selectedWinnerId,
          score: scoreString
        });
        App.toast('Результат матча сохранен!', 'success');
        closeModal();
        await loadData();
      } catch (err) {
        App.toast(err.message, 'error');
      }
    });

    // Generate bracket button
    document.getElementById('generate-bracket-btn').addEventListener('click', async () => {
      const ok = await TG.confirm('Сгенерировать сетку? Это сбросит существующую сетку этого турнира и переведет турнир в Активный статус.');
      if (!ok) return;

      try {
        await API.generateBracket(tId);
        App.toast('Сетка успешно создана!', 'success');
        await loadData();
      } catch (err) {
        App.toast(err.message, 'error');
      }
    });

    // Notify about bracket button
    document.getElementById('notify-bracket-btn').addEventListener('click', async () => {
      const type = await TG.confirm('Отправить участникам уведомление о новой сетке в личные сообщения бота?') ? 'bracket' : null;
      if (!type) return;

      try {
        const res = await API.notifyBracket(tId);
        App.toast(`Уведомления отправлены! Получателей: ${res.sent_count}`, 'success');
      } catch (err) {
        App.toast(err.message, 'error');
      }
    });

    // Delete tournament button
    document.getElementById('delete-tournament-btn').addEventListener('click', async () => {
      const ok = await TG.confirm('Вы действительно хотите удалить этот турнир? Это действие необратимо!');
      if (!ok) return;

      try {
        await API.deleteTournament(tId);
        App.toast('Турнир успешно удален!', 'success');
        setTimeout(() => {
          App.navigate('index.html');
        }, 1000);
      } catch (err) {
        App.toast(err.message, 'error');
      }
    });
  }
};
