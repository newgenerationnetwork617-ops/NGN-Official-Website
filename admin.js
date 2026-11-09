(() => {
  const cfg = window.NGN_SUPABASE_CONFIG;
  if (!cfg || !window.supabase) return;
  const db = window.supabase.createClient(cfg.url, cfg.publishableKey);
  const loginPanel = document.getElementById("loginPanel");
  const workspace = document.getElementById("adminWorkspace");
  const loginStatus = document.getElementById("loginStatus");
  const setStatus = (id, message) => { const el = document.getElementById(id); if (el) el.textContent = message; };
  const showWorkspace = () => { loginPanel.hidden = true; workspace.hidden = false; };
  const showLogin = () => { workspace.hidden = true; loginPanel.hidden = false; };
  const formObject = form => Object.fromEntries(new FormData(form).entries());
  const isChecked = form => form.querySelector('[name="publish"]').checked;
  const nowIso = () => new Date().toISOString();

  async function verifyAdmin(user) {
    if (!user) { showLogin(); return false; }
    const { data, error } = await db.from("admin_members").select("user_id").eq("user_id", user.id).maybeSingle();
    if (error || !data) {
      await db.auth.signOut();
      showLogin();
      loginStatus.textContent = "This account is not authorised for NGN administration.";
      return false;
    }
    showWorkspace();
    await refreshOverview();
    await loadTeachingList();
    return true;
  }

  document.getElementById("loginForm").addEventListener("submit", async event => {
    event.preventDefault();
    loginStatus.textContent = "Signing in…";
    const values = formObject(event.currentTarget);
    const { data, error } = await db.auth.signInWithPassword({ email: values.email, password: values.password });
    if (error) { loginStatus.textContent = error.message; return; }
    const ok = await verifyAdmin(data.user);
    if (ok) loginStatus.textContent = "";
  });

  document.getElementById("signOutBtn").addEventListener("click", async () => {
    await db.auth.signOut();
    showLogin();
    loginStatus.textContent = "You have signed out.";
  });

  document.querySelectorAll("[data-tab]").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-tab]").forEach(item => item.classList.toggle("active", item === button));
      document.querySelectorAll("[data-panel]").forEach(panel => { panel.hidden = panel.dataset.panel !== button.dataset.tab; });
    });
  });

  async function countRows(table) {
    const { count, error } = await db.from(table).select("id", { count: "exact", head: true }).eq("is_archived", false);
    return error ? "—" : (count ?? 0);
  }
  async function refreshOverview() {
    const [teachings, devotionals, announcements, events] = await Promise.all([
      countRows("teachings"), countRows("devotionals"), countRows("announcements"), countRows("events")
    ]);
    document.getElementById("countTeachings").textContent = teachings;
    document.getElementById("countDevotionals").textContent = devotionals;
    document.getElementById("countAnnouncements").textContent = announcements;
    document.getElementById("countEvents").textContent = events;
  }

  async function loadTeachingList() {
    const root = document.getElementById("teachingList");
    root.replaceChildren();
    const { data, error } = await db.from("teachings").select("id,title,content_type,published_at,is_archived")
      .eq("is_archived", false).order("created_at", { ascending: false }).limit(30);
    if (error) { root.textContent = "Could not load teaching records: " + error.message; return; }
    if (!data.length) { root.textContent = "No teaching records yet."; return; }
    data.forEach(item => {
      const row = document.createElement("div"); row.className = "admin-list-item";
      const details = document.createElement("div");
      const title = document.createElement("strong"); title.textContent = item.title;
      const meta = document.createElement("small"); meta.textContent = (item.content_type || "resource") + (item.published_at ? " · Published" : " · Draft");
      details.append(title, meta);
      const archive = document.createElement("button"); archive.type = "button"; archive.textContent = "Archive";
      archive.addEventListener("click", async () => {
        if (!window.confirm("Archive this teaching? It will no longer appear in the public teaching library.")) return;
        const { error: updateError } = await db.from("teachings").update({ is_archived: true }).eq("id", item.id);
        if (updateError) { setStatus("teachingStatus", updateError.message); return; }
        setStatus("teachingStatus", "Teaching archived.");
        await loadTeachingList(); await refreshOverview();
      });
      row.append(details, archive); root.append(row);
    });
  }

  document.getElementById("teachingForm").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget, values = formObject(form);
    const statusId = "teachingStatus";
    setStatus(statusId, "Saving teaching…");
    try {
      let mediaUrl = null, youtubeUrl = null, audioUrl = null;
      const file = form.querySelector('[name="media_file"]').files[0];
      if (file) {
        if (file.size > 45 * 1024 * 1024) throw new Error("Please keep uploads under 45 MB for this first version.");
        const allowed = file.type.startsWith("video/") || file.type.startsWith("audio/") || file.type === "application/pdf";
        if (!allowed) throw new Error("Only video, audio, and PDF files are accepted.");
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = "website-teachings/" + (await db.auth.getUser()).data.user.id + "/" + Date.now() + "-" + safeName;
        const { error: uploadError } = await db.storage.from("ngn-media").upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        const publicUrl = db.storage.from("ngn-media").getPublicUrl(path).data.publicUrl;
        if (file.type.startsWith("audio/")) audioUrl = publicUrl;\n        else mediaUrl = publicUrl;
      } else if (values.media_link) {
        const parsed = new URL(values.media_link);
        if (!["https:", "http:"].includes(parsed.protocol)) throw new Error("Please enter a valid http or https media link.");
        if (parsed.hostname.includes("youtube.com") || parsed.hostname === "youtu.be") youtubeUrl = parsed.href;
        else if (values.content_type === "audio") audioUrl = parsed.href;
        else mediaUrl = parsed.href;
      }
      const published = isChecked(form);
      const record = {
        title: values.title.trim(), description: values.description.trim() || null,
        speaker: values.speaker.trim() || null, content_type: values.content_type,
        series_name: values.series_name.trim() || null, media_url: mediaUrl,
        youtube_url: youtubeUrl, audio_url: audioUrl,
        published_at: published ? nowIso() : null, is_archived: false
      };
      const { error } = await db.from("teachings").insert(record);
      if (error) throw error;
      form.reset(); form.querySelector('[name="speaker"]').value = "N.G.N. Team";
      form.querySelector('[name="publish"]').checked = true;
      setStatus(statusId, "Teaching saved successfully.");
      await loadTeachingList(); await refreshOverview();
    } catch (error) { setStatus(statusId, error.message || "Could not save teaching."); }
  });

  document.getElementById("devotionalForm").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget, v = formObject(form);
    setStatus("devotionalStatus", "Saving devotional…");
    const { error } = await db.from("devotionals").insert({
      title: v.title.trim(), theme: v.theme.trim() || null, bible_reference: v.bible_reference.trim() || null,
      memory_verse: v.memory_verse.trim() || null, message: v.message.trim(),
      life_application: v.life_application.trim() || null, prayer: v.prayer.trim() || null,
      published_at: isChecked(form) ? nowIso() : null, is_archived: false
    });
    if (error) { setStatus("devotionalStatus", error.message); return; }
    form.reset(); form.querySelector('[name="publish"]').checked = true;
    setStatus("devotionalStatus", "Devotional saved successfully."); await refreshOverview();
  });

  document.getElementById("announcementForm").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget, v = formObject(form);
    setStatus("announcementStatus", "Saving announcement…");
    const { error } = await db.from("announcements").insert({
      title: v.title.trim(), body: v.body.trim(),
      published_at: isChecked(form) ? nowIso() : null, is_archived: false
    });
    if (error) { setStatus("announcementStatus", error.message); return; }
    form.reset(); form.querySelector('[name="publish"]').checked = true;
    setStatus("announcementStatus", "Announcement saved successfully."); await refreshOverview();
  });

  document.getElementById("eventForm").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget, v = formObject(form);
    setStatus("eventStatus", "Saving event…");
    const startsAt = new Date(v.starts_at);
    if (Number.isNaN(startsAt.getTime())) { setStatus("eventStatus", "Please enter a valid event date and time."); return; }
    const { error } = await db.from("events").insert({
      title: v.title.trim(), description: v.description.trim() || null, starts_at: startsAt.toISOString(),
      venue: v.venue.trim() || null, published: isChecked(form),
      published_at: isChecked(form) ? nowIso() : null, is_archived: false
    });
    if (error) { setStatus("eventStatus", error.message); return; }
    form.reset(); form.querySelector('[name="publish"]').checked = true;
    setStatus("eventStatus", "Event saved successfully."); await refreshOverview();
  });

  db.auth.getSession().then(({ data }) => verifyAdmin(data.session?.user || null));
})();