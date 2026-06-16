/**
 * Bracket.js - Render tournament brackets
 */

const Bracket = {
  /**
   * Render single elimination bracket
   * @param {HTMLElement} container
   * @param {Array} matches
   */
  render(container, matches) {
    if (!matches || matches.length === 0) {
      App.showEmpty(
        container,
        '📊',
        'Сетка еще не создана',
        'Администратор опубликует сетку, когда начнется турнир.'
      );
      return;
    }

    container.innerHTML = '';

    // Group matches by round_number
    const rounds = {};
    matches.forEach(match => {
      if (!rounds[match.round_number]) {
        rounds[match.round_number] = [];
      }
      rounds[match.round_number].push(match);
    });

    // Sort rounds
    const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);

    // Create bracket wrapper
    const bracketWrapper = document.createElement('div');
    bracketWrapper.className = 'bracket animate-fade-in';

    roundNumbers.forEach(roundNum => {
      const roundMatches = rounds[roundNum];
      // Sort matches by match_number
      roundMatches.sort((a, b) => a.match_number - b.match_number);

      const roundColumn = document.createElement('div');
      roundColumn.className = 'bracket__round';

      // Round Title
      const roundTitle = document.createElement('div');
      roundTitle.className = 'bracket__round-title';
      roundTitle.textContent = this.getRoundName(roundNum, roundNumbers.length);
      roundColumn.appendChild(roundTitle);

      roundMatches.forEach(match => {
        const matchEl = this.createMatchElement(match);
        roundColumn.appendChild(matchEl);
      });

      bracketWrapper.appendChild(roundColumn);
    });

    container.appendChild(bracketWrapper);
  },

  /**
   * Get human readable round name
   * @param {number} roundNum
   * @param {number} totalRounds
   * @returns {string}
   */
  getRoundName(roundNum, totalRounds) {
    if (roundNum === totalRounds) {
      return 'Финал';
    }
    if (roundNum === totalRounds - 1) {
      return 'Полуфинал';
    }
    if (roundNum === totalRounds - 2) {
      return '1/4 финала';
    }
    return `Раунд ${roundNum}`;
  },

  /**
   * Create HTML element for a match
   * @param {object} match
   * @returns {HTMLElement}
   */
  createMatchElement(match) {
    const matchEl = document.createElement('div');
    matchEl.className = 'bracket__match';
    if (match.status === 'in_progress') {
      matchEl.classList.add('bracket__match--active');
    }

    const player1 = match.player1;
    const player2 = match.player2;
    const winnerId = match.winner ? match.winner.id : null;

    // Parse score: "2:1" -> [2, 1]
    let score1 = '';
    let score2 = '';
    if (match.score && match.score.includes(':')) {
      const scores = match.score.split(':');
      score1 = scores[0];
      score2 = scores[1];
    }

    const p1Html = this.getPlayerHtml(player1, winnerId, score1);
    const p2Html = this.getPlayerHtml(player2, winnerId, score2);

    matchEl.innerHTML = p1Html + p2Html;

    // Optional click to view details or edit (if admin)
    matchEl.addEventListener('click', () => {
      // Custom event for matching click
      const event = new CustomEvent('matchClick', { detail: match });
      document.dispatchEvent(event);
    });

    return matchEl;
  },

  /**
   * Generate player row HTML
   * @param {object|null} player
   * @param {number|null} winnerId
   * @param {string} score
   * @returns {string}
   */
  getPlayerHtml(player, winnerId, score) {
    if (!player) {
      return `
        <div class="bracket__player bracket__player--tbd">
          <span class="bracket__player-name">Ожидает игрока</span>
          <span class="bracket__player-score">—</span>
        </div>`;
    }

    let statusClass = '';
    if (winnerId) {
      statusClass = player.id === winnerId ? 'bracket__player--winner' : 'bracket__player--loser';
    }

    const displayName = App.escapeHtml(player.display_name);
    const tagSuffix = player.brawl_stars_tag ? ` <small style="color:var(--text-muted)">#${player.brawl_stars_tag}</small>` : '';

    return `
      <div class="bracket__player ${statusClass}">
        <span class="bracket__player-name">${displayName}${tagSuffix}</span>
        <span class="bracket__player-score">${score !== '' ? score : (winnerId && player.id === winnerId ? 'W' : '—')}</span>
      </div>`;
  }
};
