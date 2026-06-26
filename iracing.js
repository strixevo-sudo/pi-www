document.addEventListener('DOMContentLoaded', () => {
  const roots = document.querySelectorAll('[data-iracing-root]');
  if (roots.length === 0) {
    return;
  }

  const FALLBACK_POLL_MS = 5000;
  const SUPPLEMENTAL_POLL_MS = 15000;
  let stateLoading = false;
  let supplementalLoading = false;
  let lastStateUpdateAt = 0;
  let stream = null;

  const setField = (name, value) => {
    document.querySelectorAll(`[data-iracing-field="${name}"]`).forEach((element) => {
      element.textContent = value;
    });
  };

  const setStateDecor = (state) => {
    const code = state?.status?.code || 'offline';
    const isLive = state?.session?.isConnected ? 'true' : 'false';

    roots.forEach((root) => {
      root.dataset.state = code;
      root.dataset.live = isLive;
    });
  };

  const formatRelativeTime = (isoValue) => {
    if (!isoValue) {
      return 'No updates yet';
    }

    const timestamp = new Date(isoValue);
    if (Number.isNaN(timestamp.getTime())) {
      return 'Update time unavailable';
    }

    const deltaSeconds = Math.max(0, Math.round((Date.now() - timestamp.getTime()) / 1000));
    if (deltaSeconds < 5) {
      return 'Updated just now';
    }
    if (deltaSeconds < 60) {
      return `Updated ${deltaSeconds}s ago`;
    }

    const deltaMinutes = Math.round(deltaSeconds / 60);
    if (deltaMinutes < 60) {
      return `Updated ${deltaMinutes}m ago`;
    }

    const deltaHours = Math.round(deltaMinutes / 60);
    return `Updated ${deltaHours}h ago`;
  };

  const formatLapTime = (seconds) => {
    if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) {
      return '--';
    }

    const minutes = Math.floor(seconds / 60);
    const remainder = seconds - (minutes * 60);
    return `${minutes}:${remainder.toFixed(3).padStart(6, '0')}`;
  };

  const formatDuration = (seconds) => {
    if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) {
      return '--';
    }

    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainder = Math.round(seconds % 60);
    return `${minutes}m ${remainder}s`;
  };

  const formatCount = (value, prefix = '') => {
    return typeof value === 'number' && Number.isFinite(value)
      ? `${prefix}${value}`
      : '--';
  };

  const formatSpeedMph = (metrics) => {
    const speedMph = typeof metrics?.speedMph === 'number' && Number.isFinite(metrics.speedMph)
      ? metrics.speedMph
      : typeof metrics?.speedKph === 'number' && Number.isFinite(metrics.speedKph)
        ? metrics.speedKph * 0.621371
        : null;

    return typeof speedMph === 'number'
      ? `${speedMph.toFixed(0)} mph`
      : '--';
  };

  const formatEventType = (type) => {
    return String(type || 'note')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (character) => character.toUpperCase());
  };

  const renderStatusPills = (state) => {
    const code = state?.status?.code || 'offline';
    const label = state?.status?.label || 'Offline';

    document.querySelectorAll('[data-iracing-status-pill]').forEach((element) => {
      element.textContent = label;
      element.dataset.state = code;
      element.classList.toggle('is-stale', Boolean(state?.stale));
    });
  };

  const renderEvents = (items) => {
    document.querySelectorAll('[data-iracing-events-list]').forEach((list) => {
      list.innerHTML = '';

      if (!items || items.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'iracing-empty';
        empty.textContent = 'No updates yet.';
        list.appendChild(empty);
        return;
      }

      items.forEach((event) => {
        const item = document.createElement('li');
        item.className = 'iracing-feed-item';
        item.dataset.type = String(event.type || 'note');

        const top = document.createElement('div');
        top.className = 'iracing-feed-top';

        const badge = document.createElement('span');
        badge.className = 'iracing-event-type';
        badge.textContent = formatEventType(event.type);

        const time = document.createElement('span');
        time.className = 'iracing-meta-text';
        time.textContent = formatRelativeTime(event.postedAt);

        top.appendChild(badge);
        top.appendChild(time);

        const message = document.createElement('div');
        message.className = 'iracing-feed-message';
        message.textContent = event.message || 'Event captured';

        const meta = document.createElement('div');
        meta.className = 'iracing-feed-meta';
        const metaParts = [
          event.seriesName,
          event.trackName,
          typeof event.lap === 'number' ? `Lap ${event.lap}` : null,
          typeof event.position === 'number' ? `P${event.position}` : null
        ].filter(Boolean);
        meta.textContent = metaParts.join(' // ') || 'Session update';

        item.appendChild(top);
        item.appendChild(message);
        item.appendChild(meta);
        list.appendChild(item);
      });
    });
  };

  const renderResults = (items) => {
    document.querySelectorAll('[data-iracing-results-list]').forEach((list) => {
      list.innerHTML = '';

      if (!items || items.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'iracing-empty';
        empty.textContent = 'No recent results yet.';
        list.appendChild(empty);
        return;
      }

      items.forEach((result) => {
        const item = document.createElement('li');
        item.className = 'iracing-result-item';
        item.dataset.finish = result.finishPosition && result.finishPosition <= 3
          ? 'podium'
          : result.finishPosition && result.finishPosition <= 10
            ? 'points'
            : 'finish';

        const place = document.createElement('div');
        place.className = 'iracing-result-place';
        place.textContent = result.finishPosition ? `P${result.finishPosition}` : '--';

        const body = document.createElement('div');
        body.className = 'iracing-result-body';

        const title = document.createElement('div');
        title.className = 'iracing-result-title';
        title.textContent = result.seriesName || 'Session result';

        const subtitle = document.createElement('div');
        subtitle.className = 'iracing-result-subtitle';
        subtitle.textContent = result.trackName || result.carName || 'Track not listed';

        const meta = document.createElement('div');
        meta.className = 'iracing-result-meta';
        const parts = [
          result.carName,
          typeof result.classPosition === 'number' ? `Class P${result.classPosition}` : null,
          typeof result.incidents === 'number' ? `${result.incidents}x` : null,
          typeof result.bestLapSeconds === 'number' ? `Best ${formatLapTime(result.bestLapSeconds)}` : null,
          result.postedAt ? new Date(result.postedAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short'
          }).toUpperCase() : null
        ].filter(Boolean);
        meta.textContent = parts.join(' // ');

        body.appendChild(title);
        body.appendChild(subtitle);
        body.appendChild(meta);

        item.appendChild(place);
        item.appendChild(body);
        list.appendChild(item);
      });
    });
  };

  const renderWeek = (week) => {
    document.querySelectorAll('[data-iracing-week-grid]').forEach((grid) => {
      grid.innerHTML = '';

      if (!week?.days?.length) {
        const empty = document.createElement('div');
        empty.className = 'iracing-empty';
        empty.textContent = 'No weekly activity loaded yet.';
        grid.appendChild(empty);
        return;
      }

      week.days.forEach((day) => {
        const card = document.createElement('div');
        card.className = 'iracing-day-card';
        card.dataset.activity = day.podiums > 0
          ? 'podium'
          : day.sessions > 0
            ? 'active'
            : 'idle';

        const date = document.createElement('div');
        date.className = 'iracing-day-date';
        date.textContent = new Date(day.date).toLocaleDateString('en-GB', {
          weekday: 'short',
          day: '2-digit',
          month: 'short'
        }).toUpperCase();

        const stats = document.createElement('div');
        stats.className = 'iracing-day-stats';

        const firstLine = document.createElement('span');
        firstLine.textContent = `${day.sessions} sessions // ${day.incidents} incidents`;

        const secondLine = document.createElement('span');
        secondLine.textContent = day.bestFinish
          ? `Best finish P${day.bestFinish} // ${day.podiums} podiums`
          : `No results logged`;

        stats.appendChild(firstLine);
        stats.appendChild(secondLine);

        card.appendChild(date);
        card.appendChild(stats);
        grid.appendChild(card);
      });
    });
  };

  const renderState = (state) => {
    const session = state?.session || {};
    const metrics = state?.metrics || {};
    const summary = state?.summary || {};

    lastStateUpdateAt = Date.now();

    setStateDecor(state);
    renderStatusPills(state);

    setField('statusLabel', state?.status?.label || 'Offline');
    setField('updatedAt', `${formatRelativeTime(state?.updatedAt)}${state?.stale ? ' // delayed' : ''}`);
    setField('headline', state?.headline || 'Waiting for live session data');
    setField('series', session.seriesName || session.eventType || 'Offline');
    setField('track', session.trackName || 'No active track');
    setField('car', session.carName || 'Waiting for car data');
    setField('phase', session.phase || 'Offline');
    setField('sessionType', session.sessionType || session.eventType || 'No session');
    setField('connection', session.isConnected ? 'Live' : 'Offline');
    setField('position', formatCount(metrics.position, 'P'));
    setField('positionClass', formatCount(metrics.positionClass, 'P'));
    setField('incidents', formatCount(metrics.incidents));
    setField('fuelPct', typeof metrics.fuelPct === 'number' ? `${metrics.fuelPct.toFixed(1)}%` : '--');
    setField('speedMph', formatSpeedMph(metrics));
    setField('bestLap', formatLapTime(metrics.bestLapSeconds));
    setField('lastLap', formatLapTime(metrics.lastLapSeconds));
    setField('tow', formatDuration(metrics.towTimeSeconds));
    setField('repair', formatDuration(metrics.pitRepairRequiredSeconds));
    setField('sessionsWeek', String(summary.sessionsThisWeek ?? 0));
    setField('incidentsWeek', String(summary.incidentsThisWeek ?? 0));
    setField('podiumsWeek', String(summary.podiumsThisWeek ?? 0));
    setField(
      'latestResult',
      summary.latestResult
        ? `${summary.latestResult.finishPosition ? `P${summary.latestResult.finishPosition}` : '--'} ${summary.latestResult.trackName || ''}`.trim()
        : 'No result yet'
    );
  };

  const renderFailure = (message) => {
    setStateDecor({
      status: { code: 'offline' },
      session: { isConnected: false }
    });
    renderStatusPills({
      status: { code: 'offline', label: 'Dashboard Offline' },
      stale: true
    });
    setField('updatedAt', message);
    setField('connection', 'Offline');
  };

  const loadState = async () => {
    if (stateLoading) {
      return;
    }

    stateLoading = true;

    try {
      const stateResponse = await fetch('/api/iracing/state', { cache: 'no-store' });
      if (!stateResponse.ok) {
        throw new Error('API request failed');
      }

      const state = await stateResponse.json();
      renderState(state);
    } catch (error) {
      renderFailure('Live data unavailable right now');
    } finally {
      stateLoading = false;
    }
  };

  const loadSupplemental = async () => {
    if (supplementalLoading) {
      return;
    }

    supplementalLoading = true;

    try {
      const [eventsResponse, resultsResponse, weekResponse] = await Promise.all([
        fetch('/api/iracing/events?limit=8', { cache: 'no-store' }),
        fetch('/api/iracing/results?limit=6', { cache: 'no-store' }),
        fetch('/api/iracing/week', { cache: 'no-store' })
      ]);

      if (!eventsResponse.ok || !resultsResponse.ok || !weekResponse.ok) {
        throw new Error('API request failed');
      }

      const [events, results, week] = await Promise.all([
        eventsResponse.json(),
        resultsResponse.json(),
        weekResponse.json()
      ]);

      renderEvents(events.items);
      renderResults(results.items);
      renderWeek(week);
    } catch (error) {
      // Keep the last rendered data when the supplemental endpoints fail.
    } finally {
      supplementalLoading = false;
    }
  };

  const loadAll = async () => {
    await Promise.all([
      loadState(),
      loadSupplemental()
    ]);
  };

  const startPollingFallback = () => {
    window.setInterval(() => {
      if (document.hidden) {
        return;
      }

      if (Date.now() - lastStateUpdateAt >= FALLBACK_POLL_MS) {
        loadState();
      }
    }, FALLBACK_POLL_MS);
  };

  const connectLiveStream = () => {
    if (!('EventSource' in window)) {
      return false;
    }

    const ownsStream = !(window.__iracingLiveEventSource instanceof EventSource);
    stream = ownsStream
      ? new EventSource('/api/iracing/live')
      : window.__iracingLiveEventSource;

    if (ownsStream) {
      window.__iracingLiveEventSource = stream;
    }

    const handleStateEvent = (event) => {
      try {
        const payload = JSON.parse(event.data);
        renderState(payload?.state && typeof payload.state === 'object' ? payload.state : payload);
      } catch (error) {
        // Ignore malformed stream payloads and keep the connection alive.
      }
    };

    stream.addEventListener('state', handleStateEvent);
    stream.onerror = () => {
      if (Date.now() - lastStateUpdateAt >= FALLBACK_POLL_MS) {
        loadState();
      }
    };

    window.addEventListener('beforeunload', () => {
      stream.removeEventListener('state', handleStateEvent);
      if (ownsStream && stream) {
        stream.close();
      }
    }, { once: true });

    return true;
  };

  document.querySelectorAll('[data-iracing-refresh]').forEach((button) => {
    button.addEventListener('click', () => {
      loadAll();
    });
  });

  loadAll();
  if (!connectLiveStream()) {
    startPollingFallback();
  }

  window.setInterval(() => {
    if (!document.hidden) {
      loadSupplemental();
    }
  }, SUPPLEMENTAL_POLL_MS);
});
