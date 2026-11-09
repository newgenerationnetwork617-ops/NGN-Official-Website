(() => {
  const cfg = window.NGN_SUPABASE_CONFIG;
  if (!cfg || !window.supabase) return;
  const db = window.supabase.createClient(cfg.url, cfg.publishableKey);
  const safeUrl = value => {
    try { const u = new URL(value); return ["https:", "http:"].includes(u.protocol) ? u.href : ""; }
    catch { return ""; }
  };
  const make = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const card = (meta, title, description, url, label) => {
    const article = make("article", "content-card");
    const image = make("div", "card-image", "✦");
    image.setAttribute("aria-hidden", "true");
    const body = make("div", "card-body");
    body.append(make("span", "meta", meta || "NGN resource"));
    body.append(make("h3", "", title || "NGN resource"));
    if (description) body.append(make("p", "", description));
    const href = safeUrl(url || "");
    if (href) {
      const a = make("a", "text-link", label || "Open resource →");
      a.href = href; a.target = "_blank"; a.rel = "noopener noreferrer";
      body.append(a);
    }
    article.append(image, body);
    return article;
  };
  async function loadTeachings() {
    const root = document.querySelector("[data-teachings-list]");
    if (!root) return;
    const { data, error } = await db.from("teachings")
      .select("title,description,speaker,content_type,media_url,youtube_url,audio_url,published_at")
      .eq("is_archived", false).not("published_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false }).limit(60);
    root.replaceChildren();
    if (error || !data || data.length === 0) {
      root.append(make("div", "empty-state", "Published NGN teachings will appear here when available."));
      return;
    }
    data.forEach(item => {
      const url = item.youtube_url || item.audio_url || item.media_url;
      const type = (item.content_type || "resource").replaceAll("_", " ");
      const meta = [type, item.speaker].filter(Boolean).join(" · ");
      root.append(card(meta, item.title, item.description, url, "Open teaching →"));
    });
  }
  async function loadEvents() {
    const root = document.querySelector("[data-events-list]");
    if (!root) return;
    const now = new Date().toISOString();
    const { data, error } = await db.from("events")
      .select("title,description,starts_at,venue")
      .eq("is_archived", false).eq("published", true).gte("starts_at", now)
      .or("published_at.is.null,published_at.lte." + now)
      .order("starts_at", { ascending: true }).limit(30);
    root.replaceChildren();
    if (error || !data || data.length === 0) {
      root.append(make("div", "empty-state", "There are no upcoming NGN events published at the moment. Please check back for updates."));
      return;
    }
    data.forEach(item => {
      const article = make("article", "content-card");
      const body = make("div", "card-body");
      body.append(make("span", "meta", new Date(item.starts_at).toLocaleString()));
      body.append(make("h3", "", item.title));
      if (item.description) body.append(make("p", "", item.description));
      if (item.venue) body.append(make("p", "notice", "Venue: " + item.venue));
      article.append(body); root.append(article);
    });
  }
  async function loadAnnouncements() {
    const root = document.querySelector("[data-announcements-list]");
    if (!root) return;
    const { data, error } = await db.from("announcements")
      .select("title,body,published_at")
      .eq("is_archived", false).not("published_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false }).limit(30);
    root.replaceChildren();
    if (error || !data || data.length === 0) {
      root.append(make("div", "empty-state", "New NGN announcements will appear here when published."));
      return;
    }
    data.forEach(item => {
      const article = make("article", "content-card");
      const body = make("div", "card-body");
      body.append(make("span", "meta", new Date(item.published_at).toLocaleDateString()));
      body.append(make("h3", "", item.title));
      body.append(make("p", "", item.body));
      article.append(body); root.append(article);
    });
  }
  loadTeachings();
  loadEvents();
  loadAnnouncements();
})();