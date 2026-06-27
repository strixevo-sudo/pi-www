# STRIXEVO — str1x3vo.xyz

The creator hub for sim racing, PC optimization, and self-hosting. Static
HTML/CSS/vanilla JS — no framework, no build step — self-hosted on a Raspberry
Pi 3B behind a Cloudflare Tunnel.

## Stack

- **Host:** Raspberry Pi 3B, nginx (static), Cloudflare Tunnel for HTTPS
- **Frontend:** hand-written HTML5, modular CSS (design tokens), vanilla ES6 JS
- **Comments:** self-hosted Remark42
- **Fonts:** Space Grotesk / Inter / JetBrains Mono (Google Fonts)

## Structure

```
/                     Landing (index.html)
/blog/                Blog index + posts (filter/search/sort)
/guides/              Curated step-by-step guides
/setup/               Hub: pc-specs, sim-rig, build-logs, iracing (Race Control)
/streams/  /about.html  /resources/  /404.html
/assets/css/          variables · reset · base · layout · components · pages · blog · setup
/assets/js/           main.js (theme/nav/reveal/copy) · blog.js (filter/search/sort)
/downloads/           zips + pdf
/deploy/redirects.conf  nginx 301s (old flat URLs -> new structure)
sitemap.xml · robots.txt · feed.xml
```

Design tokens live in `assets/css/variables.css` — the palette (pink `#ff006e`
+ cyan `#00d4ff` on black), type scale, spacing, and motion are all there.
Dark/light is toggled via `data-theme` and persisted to `localStorage`.

## Local preview

Absolute `/assets/...` paths need a server root (not `file://`):

```bash
python -m http.server 8080   # then open http://localhost:8080/
```

## Deploy to the Pi

The web root is `/var/www/html` (a clone of this repo).

```bash
ssh strixevo@<pi-ip>
cd /var/www/html
git pull origin main
```

### One-time nginx setup

1. Include the redirects in the site's `server { }` block:
   ```nginx
   include /var/www/html/deploy/redirects.conf;
   ```
2. Recommended performance headers (also in the `server` block):
   ```nginx
   gzip on;
   gzip_types text/css application/javascript image/svg+xml application/xml;
   location /assets/   { expires 1y; add_header Cache-Control "public, immutable"; }
   location /downloads/{ expires 30d; }
   location ~* \.html$ { expires 1h; }
   ```
3. Test + reload:
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

### Remark42 custom styling

`remark42-custom.css` restyles the comment widget to the site palette. Apply it
through the Remark42 instance's custom-CSS config (the widget runs in its own
iframe, so it can't be linked from the page).

## Adding a blog post

1. Copy an existing `blog/<slug>.html` as a template.
2. Update the `<head>` meta (title, description, canonical, OG, `article:*`),
   the article body, and the category badge.
3. Add a card to `blog/index.html` with matching `data-category` / `data-date`.
4. Regenerate `sitemap.xml` + `feed.xml`, then commit.
