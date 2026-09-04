document.addEventListener("DOMContentLoaded", async () => {
  const statusBadge = document.getElementById("statusBadge");
  const statusText = document.getElementById("statusText");
  const authCookieVal = document.getElementById("authCookieVal");
  const cookieCountVal = document.getElementById("cookieCountVal");
  const exportBtn = document.getElementById("exportBtn");

  try {
    const cookies = await chrome.cookies.getAll({ domain: "linkedin.com" });
    const authCookie = cookies.find((c) => c.name === "li_at");

    cookieCountVal.textContent = cookies.length.toString();

    if (authCookie && authCookie.value) {
      statusBadge.className = "status-badge status-active";
      statusText.textContent = "Session Active (Logged In)";
      authCookieVal.textContent = "Found (" + authCookie.value.slice(0, 8) + "...)";
      exportBtn.disabled = false;

      exportBtn.addEventListener("click", async () => {
        exportBtn.disabled = true;
        exportBtn.textContent = "Exporting Session...";

        // Format into Playwright-compatible storageState JSON
        const playwrightCookies = cookies.map((c) => {
          let sameSite = "Lax";
          if (c.sameSite === "no_restriction") sameSite = "None";
          else if (c.sameSite === "strict") sameSite = "Strict";
          else if (c.sameSite === "lax") sameSite = "Lax";

          return {
            name: c.name,
            value: c.value,
            domain: c.domain,
            path: c.path,
            expires: c.expirationDate || -1,
            httpOnly: c.httpOnly,
            secure: c.secure,
            sameSite: sameSite,
          };
        });

        // Try to get account info from current tab if on LinkedIn
        let accountName = "LinkedIn Account";
        let accountHeadline = "Active Browser Session";

        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab && tab.url && tab.url.includes("linkedin.com")) {
            accountName = tab.title ? tab.title.split("|")[0].trim() : accountName;
          }
        } catch (_) {}

        const payload = {
          exportedAt: new Date().toISOString(),
          accountInfo: {
            name: accountName,
            headline: accountHeadline,
          },
          cookies: playwrightCookies,
          origins: [
            {
              origin: "https://www.linkedin.com",
              localStorage: [],
            },
          ],
        };

        const jsonString = JSON.stringify(payload, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "linkedin-session.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        exportBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Exported! Check Downloads
        `;

        setTimeout(() => {
          exportBtn.disabled = false;
          exportBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export Again
          `;
        }, 3000);
      });
    } else {
      statusBadge.className = "status-badge status-inactive";
      statusText.textContent = "Not Logged In";
      authCookieVal.textContent = "Missing (li_at not found)";
      exportBtn.disabled = true;
    }
  } catch (err) {
    console.error("Failed to read cookies:", err);
    statusText.textContent = "Permission Error";
  }
});
