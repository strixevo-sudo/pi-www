/* ── BIRTHDAY BANNER ─────────────────────────
   Shows on 23/03/2026 only, auto-hides at midnight
   ────────────────────────────────────────── */
(function() {
  const BIRTHDAY = '03-23';
  const today = new Date();
  const todayStr =
    String(today.getMonth()+1).padStart(2,'0') + '-' +
    String(today.getDate()).padStart(2,'0');

  if (todayStr !== BIRTHDAY) return;

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #bday-banner {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      z-index: 9998;
      background: #080808;
      border-top: 1px solid rgba(255,200,0,0.3);
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      animation: bdaySlideUp 0.6s ease both;
    }
    @keyframes bdaySlideUp {
      from { transform: translateY(100%); opacity: 0; }
      to   { transform: translateY(0); opacity: 1; }
    }
    #bday-banner .bday-text {
      font-family: 'Share Tech Mono', monospace;
      font-size: 0.8rem;
      letter-spacing: 2px;
      color: #e0e0e0;
    }
    #bday-banner .bday-text span {
      color: #ffd700;
    }
    #bday-banner .bday-link {
      font-family: 'Share Tech Mono', monospace;
      font-size: 0.75rem;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #ffd700;
      border: 1px solid rgba(255,215,0,0.3);
      padding: 0.5rem 1.2rem;
      text-decoration: none;
      transition: all 0.2s;
      white-space: nowrap;
    }
    #bday-banner .bday-link:hover {
      background: rgba(255,215,0,0.1);
      border-color: #ffd700;
    }
    #bday-banner .bday-close {
      font-family: 'Share Tech Mono', monospace;
      font-size: 0.7rem;
      color: #555;
      cursor: pointer;
      background: none;
      border: none;
      letter-spacing: 1px;
      padding: 0.2rem 0.5rem;
      transition: color 0.2s;
    }
    #bday-banner .bday-close:hover { color: #ffd700; }
    #bday-canvas {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9997;
    }
  `;
  document.head.appendChild(style);

  // Banner HTML
  const banner = document.createElement('div');
  banner.id = 'bday-banner';
  banner.innerHTML = `
    <div class="bday-text">
      🎂 &nbsp; HAPPY BIRTHDAY <span>SKETCHY KOKO</span> &nbsp; — &nbsp; GO SHOW HIM SOME LOVE
    </div>
    <a href="https://www.twitch.tv/sketchykoko" target="_blank" rel="noopener noreferrer" class="bday-link">→ TWITCH</a>
    <button class="bday-close" onclick="document.getElementById('bday-banner').remove(); document.getElementById('bday-canvas').remove();">✕ CLOSE</button>
  `;
  document.body.appendChild(banner);

  // Confetti canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'bday-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COLORS = ['#ffd700', '#00ff88', '#00cfff', '#ff003c', '#ffffff', '#ff9900'];
  const particles = [];

  for (let i = 0; i < 120; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * -window.innerHeight,
      w: Math.random() * 8 + 4,
      h: Math.random() * 4 + 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      speed: Math.random() * 2 + 1,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.15,
      drift: (Math.random() - 0.5) * 1.2,
      opacity: Math.random() * 0.6 + 0.4
    });
  }

  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.y += p.speed;
      p.x += p.drift;
      p.angle += p.spin;
      if (p.y > canvas.height) {
        p.y = -20;
        p.x = Math.random() * canvas.width;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
    });
    frame++;
    // Stop after 12 seconds to save performance
    if (frame < 720) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  draw();

  // Auto hide at midnight
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const msUntilMidnight = midnight - now;
  setTimeout(() => {
    const b = document.getElementById('bday-banner');
    const c = document.getElementById('bday-canvas');
    if (b) b.remove();
    if (c) c.remove();
  }, msUntilMidnight);
})();
