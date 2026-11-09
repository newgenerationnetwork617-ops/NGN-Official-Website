(() => {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      toggle.textContent = open ? "×" : "☰";
    });
    nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "☰";
    }));
  }
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  const releaseButton = document.querySelector("[data-latest-apk]");
  const releaseNote = document.querySelector("[data-release-note]");
  if (releaseButton && releaseNote) {
    fetch("https://api.github.com/repos/newgenerationnetwork617-ops/New-Generation-Network-/releases?per_page=10", {
      headers: { Accept: "application/vnd.github+json" }
    }).then(response => {
      if (!response.ok) throw new Error("Release list unavailable");
      return response.json();
    }).then(releases => {
      const release = releases.find(item => !item.draft && !item.prerelease &&
        (item.assets || []).some(asset => asset.name.toLowerCase().endsWith(".apk")));
      if (!release) {
        releaseNote.textContent = "The next official Android release will appear here when published.";
        return;
      }
      const apk = release.assets.find(asset => asset.name.toLowerCase().endsWith(".apk"));
      releaseButton.href = apk.browser_download_url;
      releaseButton.textContent = "Download the latest NGN APK";
      releaseNote.textContent = "Latest release: " + (release.name || release.tag_name);
    }).catch(() => {
      releaseNote.textContent = "Visit the official releases page to check for the latest APK.";
    });
  }

  const contactForm = document.querySelector("[data-contact-form]");
  if (contactForm) {
    contactForm.addEventListener("submit", event => {
      event.preventDefault();
      const data = new FormData(contactForm);
      const subject = encodeURIComponent("Message from NGN website: " + data.get("name"));
      const body = encodeURIComponent(
        "Name: " + data.get("name") + "\nEmail: " + data.get("email") +
        "\n\n" + data.get("message")
      );
      window.location.href = "mailto:ngnfaithconnect@gmail.com?subject=" + subject + "&body=" + body;
    });
  }
})();