// ══════════════════════════════════════
//  ESTATÍSTICAS — Focus Study
//  estatisticas-new.js  (corrigido) //criar tela nova
// ══════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  // ── Date ──
  const today = new Date();
  document.getElementById('current-date').innerText = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  // Load avatar
  const profile = JSON.parse(localStorage.getItem('fs_profile') || '{}');
  if (profile.avatar) {
    const navAv = document.getElementById('nav-avatar');
    if (navAv) navAv.src = profile.avatar;
  }

  // ── Year navigation ──
  let viewYear = today.getFullYear();
  document.getElementById('year-label').textContent = viewYear;

  document.getElementById('prev-year').addEventListener('click', () => { viewYear--; document.getElementById('year-label').textContent = viewYear; renderAll(); });
  document.getElementById('next-year').addEventListener('click', () => { viewYear++; document.getElementById('year-label').textContent = viewYear; renderAll(); });

  // ── Week offset for weekly hours ──
  let weekOffset = 0;

  function getWeekDates(offset) {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay() + 1 + offset * 7); // Monday
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(d);
      day.setDate(d.getDate() + i);
      return day;
    });
  }

  function formatWeekLabel(offset) {
    const dates = getWeekDates(offset);
    const fmt = d => d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    return `${fmt(dates[0])} – ${fmt(dates[6])}`;
  }

  function updateWeekLabel() {
    const el = document.getElementById('wh-week-label');
    if (el) el.textContent = weekOffset === 0 ? 'Esta semana' : formatWeekLabel(weekOffset);
  }

  document.getElementById('wh-prev-week')?.addEventListener('click', () => { weekOffset--; updateWeekLabel(); renderWeeklyHours(); });
  document.getElementById('wh-next-week')?.addEventListener('click', () => { weekOffset++; updateWeekLabel(); renderWeeklyHours(); });

  // ── Study hours data ──
  function getStudyData() { return JSON.parse(localStorage.getItem('fs_study_hours') || '{}'); }
  function saveStudyData(data) { localStorage.setItem('fs_study_hours', JSON.stringify(data)); }

  // Weekly goals: { 0: 60, 1: 90, ... } (Sun=0 ... Sat=6), minutes
  function getWeekGoals() {
    const defaults = { 0: 0, 1: 90, 2: 90, 3: 90, 4: 90, 5: 90, 6: 30 };
    return { ...defaults, ...JSON.parse(localStorage.getItem('fs_week_goals') || '{}') };
  }
  function saveWeekGoals(g) { localStorage.setItem('fs_week_goals', JSON.stringify(g)); }

  // ── Summary ──
  function updateSummary() {
    const data = getStudyData();
    const pomosTotal = parseInt(localStorage.getItem('fs_pomo_total') || '0');
    const settings = JSON.parse(localStorage.getItem('fs_settings') || '{}');

    document.getElementById('s-sessions').textContent = pomosTotal;

    const totalMins = Object.values(data).reduce((a, b) => a + b, 0);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    document.getElementById('s-hours').textContent = mins ? `${hours}h${mins}m` : `${hours}h`;

    // Streak
    let streak = 0, d = new Date(today);
    while (true) {
      const k = fmtKey(d);
      if (!data[k] || data[k] === 0) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    localStorage.setItem('fs_streak', streak);
    document.getElementById('s-streak').textContent = streak + (streak === 1 ? ' dia' : ' dias');

    // Habits done
    const habits = JSON.parse(localStorage.getItem('fs_habits') || '[]');
    let habitsDone = 0;
    const yearStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
    habits.forEach(h => {
      habitsDone += Object.keys(h.checks || {}).filter(k => k.startsWith(yearStr)).length;
    });
    document.getElementById('s-habits-done').textContent = habitsDone;
  }

  function fmtKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // ── Weekly hours ──
  const DAYS_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  function renderWeeklyHours() {
    const grid = document.getElementById('weekly-hours-grid');
    const data = getStudyData();
    const goals = getWeekGoals();

    const weekDates = getWeekDates(weekOffset);

    grid.innerHTML = '';

    let maxMins = 0;
    const days = weekDates.map(d => {
      const key = fmtKey(d);
      const mins = data[key] || 0;
      const goal = goals[d.getDay()] || 0;
      if (mins > maxMins) maxMins = mins;
      if (goal > maxMins) maxMins = goal;
      return { d, key, mins, goal, dayOfWeek: d.getDay() };
    });

    const barMax = Math.max(maxMins, 120); // at least 2h scale

    days.forEach(({ d, key, mins, goal, dayOfWeek }) => {
      const isTodayDay = d.toDateString() === today.toDateString();
      const overGoal = goal > 0 && mins >= goal;
      const barH = mins ? Math.max(Math.round(mins / barMax * 100), 3) : 0;
      const goalH = goal ? Math.round(goal / barMax * 100) : 0;

      const col = document.createElement('div');
      col.className = 'wh-day-col';
      col.innerHTML = `
        <div class="wh-day-name${isTodayDay ? ' today-name' : ''}">${DAYS_NAMES[dayOfWeek]}</div>
        <div class="wh-bar-track">
          ${goal ? `<div class="wh-goal-line" style="bottom:${goalH}%"></div>` : ''}
          <div class="wh-bar-fill${overGoal ? ' over-goal' : ''}" style="height:${barH}%"></div>
        </div>
        <div class="wh-day-info">
          <div class="wh-day-hours">${mins ? (Math.floor(mins / 60) ? Math.floor(mins / 60) + 'h' : '') + (mins % 60 ? (mins % 60) + 'm' : '') : '0m'}</div>
          <div class="wh-day-goal">
            Meta: <span class="goal-text-${dayOfWeek}">${goal ? (Math.floor(goal / 60) ? Math.floor(goal / 60) + 'h' : '') + (goal % 60 ? (goal % 60) + 'm' : '') : '--'}</span>
            <button class="wh-edit-goal" data-day="${dayOfWeek}">✎</button>
          </div>
        </div>
        <button class="wh-log-btn" data-key="${key}" data-day="${dayOfWeek}">+ Log</button>
      `;
      grid.appendChild(col);
    });

    // Edit goal buttons
    grid.querySelectorAll('.wh-edit-goal').forEach(btn => {
      btn.addEventListener('click', () => {
        const dow = parseInt(btn.dataset.day);
        const g = getWeekGoals();
        const currentGoal = g[dow] || 0;
        const inp = prompt(`Meta para ${DAYS_NAMES[dow]} (minutos):`, currentGoal);
        if (inp === null) return;
        const val = Math.max(0, parseInt(inp) || 0);
        g[dow] = val;
        saveWeekGoals(g);
        renderWeeklyHours();
      });
    });

    // Log hours buttons
    grid.querySelectorAll('.wh-log-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const dow = parseInt(btn.dataset.day);
        const data = getStudyData();
        const cur = data[key] || 0;
        const inp = prompt(`Horas estudadas em ${DAYS_NAMES[dow]} (minutos totais, atual: ${cur}min):`);
        if (inp === null) return;
        const val = Math.max(0, parseInt(inp) || 0);
        data[key] = val;
        saveStudyData(data);
        renderWeeklyHours();
        updateSummary();
        renderAnnual();
        checkAchievements();
      });
    });

    // Month header — place labels above corresponding week columns
    // Each cell = 15px (12px + 3px gap)
    let monthHeaderHtml = '<div style="display:flex;margin-left:40px;margin-bottom:4px;position:relative;">';
    monthPositions.forEach(({ wi, month }) => {
      monthHeaderHtml += `<div class="annual-month-label" style="position:absolute;left:${wi * 15}px;white-space:nowrap">${MONTH_ABBR[month]}</div>`;
    });
    monthHeaderHtml += '</div>';

    // Grid cells
    let gridHtml = '<div class="annual-grid">';
    weeks.forEach(wk => {
      gridHtml += '<div class="annual-week-col">';
      wk.forEach(d => {
        if (!d) {
          gridHtml += '<div class="annual-cell" style="background:transparent;cursor:default;pointer-events:none"></div>';
          return;
        }
        const k = fmtKey(d);
        const val = data[k] || 0;
        let level = 0;
        if (val > 0) level = Math.min(4, Math.ceil(val / maxVal * 4));
        const isT = d.toDateString() === today.toDateString();
        gridHtml += `<div class="annual-cell" data-level="${level}" data-date="${k}" data-mins="${val}"
          title="${d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}: ${val}min"
          ${isT ? 'style="outline:2px solid var(--cyan);outline-offset:1px;"' : ''}></div>`;
      });
      gridHtml += '</div>';
    });
    gridHtml += '</div>';

    // Compute total width of the grid for the month header container
    const totalWeeks = weeks.length;
    const gridWidth = totalWeeks * 15; // 12px cell + 3px gap

    wrap.innerHTML =
      `<div style="position:relative;height:18px;margin-left:40px;width:${gridWidth}px;margin-bottom:2px">${monthPositions.map(({ wi, month }) =>
        `<span class="annual-month-label" style="position:absolute;left:${wi * 15}px">${MONTH_ABBR[month]}</span>`
      ).join('')}</div>` +
      `<div style="display:flex">${dayLabelsHtml}${gridHtml}</div>`;
  }

  function renderAll() {
    updateSummary();
    updateWeekLabel();
    renderWeeklyHours();
  }
  function aplicarTema(settings) {
    if (!settings || !settings.accentColor) return;

    const cores = {
      'cyan': '#06b6d4',
      'pink': '#ec4899',
      'violet': '#8b5cf6',
      'green': '#10b981',
      'orange': '#f59e0b'
    };

    const hex = cores[settings.accentColor] || cores['cyan'];

    // Aplica a cor no root do documento (afeta todo o CSS que usa var(--cyan))
    document.documentElement.style.setProperty('--cyan', hex);

    // Se quiser aplicar o modo compacto também:
    document.body.classList.toggle('compact-mode', settings.compact);
  }

  // Executa ao carregar a página
  const settingsSalvas = JSON.parse(localStorage.getItem('fs_settings') || '{}');
  aplicarTema(settingsSalvas);

  // Escuta mudanças em tempo real (se mudar a cor na aba de configurações)
  window.addEventListener('storage', (e) => {
    if (e.key === 'fs_settings') {
      const novosSettings = JSON.parse(e.newValue);
      aplicarTema(novosSettings);
    }
  });

  renderAll();
});