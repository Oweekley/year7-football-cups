(() => {
  const App = window.App || {};
  const {
    workerURL,
    translate = (key) => key,
    logger = console,
    loadData = async () => {},
    renderAll = () => {},
    state = {},
  } = App;

  if (!workerURL) {
    logger.warn?.("Admin controller skipped: workerURL missing");
    return;
  }

  const PASSWORD_KEY = "admin_password";
  const UNLOCK_KEY = "admin_unlocked";
  const modalResolvers = [];
  let modalBound = false;

  const modalIds = {
    modal: "admin-access-modal",
    close: "admin-access-close",
    password: "admin-access-pass",
    submit: "admin-access-submit",
    error: "admin-access-error",
  };

  function getModalElements() {
    return {
      modal: document.getElementById(modalIds.modal),
      closeBtn: document.getElementById(modalIds.close),
      passwordInput: document.getElementById(modalIds.password),
      submitBtn: document.getElementById(modalIds.submit),
      errorEl: document.getElementById(modalIds.error),
    };
  }

  function openPasswordModal() {
    const { modal, errorEl, passwordInput } = getModalElements();
    if (!modal) return;

    modal.setAttribute("aria-hidden", "false");
    errorEl && (errorEl.hidden = true);

    const stored = sessionStorage.getItem(PASSWORD_KEY) || "";
    if (passwordInput) {
      passwordInput.value = stored;
      setTimeout(() => {
        try {
          passwordInput.focus({ preventScroll: true });
          if (stored) passwordInput.select();
        } catch (_) {}
      }, 0);
    }
  }

  function closePasswordModal({ success = false } = {}) {
    const { modal } = getModalElements();
    if (!modal) return;
    modal.setAttribute("aria-hidden", "true");

    if (!success) {
      while (modalResolvers.length) {
        const resolver = modalResolvers.shift();
        resolver(null);
      }
    }
  }

  async function verifyPassword(password) {
    const response = await fetch(workerURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      mode: "cors",
      body: JSON.stringify({ password, intent: "verify" }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.success) {
      const message =
        response.status === 401
          ? translate("invalidPassword")
          : data?.error || `Request failed (${response.status})`;
      throw new Error(message);
    }
    return true;
  }

  async function handleModalSubmit(event) {
    event?.preventDefault?.();
    const { passwordInput, submitBtn, errorEl } = getModalElements();
    if (!passwordInput || !submitBtn) return;

    errorEl && (errorEl.hidden = true);
    const password = passwordInput.value.trim();
    if (!password) {
      if (errorEl) {
        errorEl.textContent = translate("pleaseEnterPassword");
        errorEl.hidden = false;
      }
      passwordInput.focus();
      return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = `${originalText}...`;

    try {
      await verifyPassword(password);
      sessionStorage.setItem(UNLOCK_KEY, "true");
      sessionStorage.setItem(PASSWORD_KEY, password);
      closePasswordModal({ success: true });
      while (modalResolvers.length) {
        const resolver = modalResolvers.shift();
        resolver(password);
      }
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err?.message || translate("networkError");
        errorEl.hidden = false;
      }
      passwordInput.focus();
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  function bindModalEvents() {
    if (modalBound) return;
    modalBound = true;

    const { modal, closeBtn, passwordInput, submitBtn, errorEl } =
      getModalElements();

    closeBtn?.addEventListener("click", () => closePasswordModal());
    modal?.addEventListener("click", (event) => {
      if (event.target === modal) closePasswordModal();
    });
    submitBtn?.addEventListener("click", handleModalSubmit);
    passwordInput?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") handleModalSubmit(event);
    });
    passwordInput?.addEventListener("input", () => {
      errorEl && (errorEl.hidden = true);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closePasswordModal();
      }
    });
  }

  function requestAdminPassword() {
    const stored = sessionStorage.getItem(PASSWORD_KEY);
    if (stored) {
      sessionStorage.setItem(UNLOCK_KEY, "true");
      return Promise.resolve(stored);
    }

    bindModalEvents();
    openPasswordModal();
    return new Promise((resolve) => {
      modalResolvers.push(resolve);
    });
  }

  async function ensureDataLoaded() {
    try {
      if (!Array.isArray(state.teams) || state.teams.length === 0) {
        await loadData();
        renderAll();
      }
    } catch (error) {
      logger.warn?.("[ADMIN] ensureDataLoaded failed", error);
    }
  }

  function download(filename, dataObj) {
    const blob = new Blob([JSON.stringify(dataObj, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function initAdminPage() {
    const adminLocked = document.getElementById("admin-locked");
    const adminBody = document.getElementById("admin-body");
    if (!adminLocked && !adminBody) return;

    await ensureDataLoaded();

    const query = (sel) => document.querySelector(sel);
    const notesTeam = query("#notes-team");
    const notesTextarea = query("#notes-text");
    const notesSaveBtn = query("#notes-save");
    const notesSaved = query("#notes-saved");
    const frDate = query("#fr-date");
    const frHome = query("#fr-home");
    const frAway = query("#fr-away");
    const frHomeGoals = query("#fr-home-goals");
    const frAwayGoals = query("#fr-away-goals");
    const frNotes = query("#fr-notes");
    const frSubmit = query("#fr-submit");
    const exportTeamsBtn = query("#export-teams");
    const exportFriendliesBtn = query("#export-friendlies");
    const unlockBtn = query("#admin-unlock");
    const passInput = query("#admin-pass");

    function initTeams() {
      if (!Array.isArray(state.teams) || state.teams.length === 0) {
        setTimeout(initTeams, 200);
        return;
      }
      const sorted = [...state.teams].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      if (notesTeam)
        notesTeam.innerHTML = `<option value="">--${translate(
          "chooseTeam"
        )}--</option>`;
      if (frHome)
        frHome.innerHTML = `<option value="">--${translate(
          "chooseTeam"
        )}--</option>`;
      if (frAway)
        frAway.innerHTML = `<option value="">--${translate(
          "chooseTeam"
        )}--</option>`;
      sorted.forEach((t) => {
        const createOption = (el) => {
          if (!el) return;
          const opt = document.createElement("option");
          opt.value = t.name;
          opt.textContent = t.name;
          el.appendChild(opt);
        };
        createOption(notesTeam);
        createOption(frHome);
        createOption(frAway);
      });
      notesTeam?.removeAttribute("disabled");
      frHome?.removeAttribute("disabled");
      frAway?.removeAttribute("disabled");

      if (notesTeam && notesTextarea && notesSaved) {
        notesTeam.addEventListener("change", () => {
          const team = state.teams.find((team) => team.name === notesTeam.value);
          notesTextarea.value = team?.notes || "";
          notesSaved.textContent = "";
        });
      }
    }
    initTeams();

    if (notesSaveBtn && notesTeam && notesTextarea && notesSaved) {
      notesSaveBtn.addEventListener("click", () => {
        const name = notesTeam.value;
        if (!name) {
          notesTeam.focus();
          return;
        }
        const team = state.teams.find((t) => t.name === name);
        if (!team) return;
        const oldNotes = team.notes || "";
        team.notes = String(notesTextarea.value || "").trim();
        if (oldNotes !== team.notes) {
          logger.dataChange?.("team-notes", oldNotes, team.notes);
        }
        notesSaved.textContent = translate("saved");
        setTimeout(() => (notesSaved.textContent = ""), 1500);
      });
    }

    function updateFriendlyValidity() {
      if (!frHome || !frAway || !frSubmit) return;
      const valid = Boolean(
        frHome.value && frAway.value && frHome.value !== frAway.value
      );
      frSubmit.disabled = !valid;
      if (!valid) frSubmit.setAttribute("disabled", "disabled");
      else frSubmit.removeAttribute("disabled");
    }

    [frDate, frHome, frAway].forEach((el) =>
      el?.addEventListener("input", updateFriendlyValidity)
    );
    [frHome, frAway].forEach((el) =>
      el?.addEventListener("change", updateFriendlyValidity)
    );

    if (frSubmit) {
      frSubmit.addEventListener("click", async () => {
        if (!frDate || !frHome || !frAway) return;
        const date = frDate.value;
        const home = frHome.value;
        const away = frAway.value;
        const hs = frHomeGoals ? frHomeGoals.value : "";
        const as = frAwayGoals ? frAwayGoals.value : "";
        if (!date || !home || !away || home === away) return;
        const friendly = {
          date,
          home_team: home,
          away_team: away,
          home_score: hs !== "" ? Number(hs) : null,
          away_score: as !== "" ? Number(as) : null,
          notes: frNotes?.value || "",
        };
        const cup =
          state.cups.Friendlies || (state.cups.Friendlies = { rounds: [] });
        if (!Array.isArray(cup.rounds)) cup.rounds = [];
        let round = cup.rounds[0];
        if (!round) {
          round = { round_number: 1, deadlines: {}, games: [] };
          cup.rounds.push(round);
        }
        round.games = Array.isArray(round.games) ? round.games : [];
        round.games.push(friendly);
        logger.success?.("Friendly result added");
        if (frDate) frDate.value = "";
        if (frHome) frHome.selectedIndex = 0;
        if (frAway) frAway.selectedIndex = 0;
        if (frHomeGoals) frHomeGoals.value = "";
        if (frAwayGoals) frAwayGoals.value = "";
        if (frNotes) frNotes.value = "";
        updateFriendlyValidity();

        try {
          const commitURL = workerURL.replace("/run", "/commit");
          let password = sessionStorage.getItem(PASSWORD_KEY) || "";
          if (!password) {
            password = await requestAdminPassword();
          }
          if (!password) return;
          const friendliesState = state.cups.Friendlies || { rounds: [] };
          const friendliesPayload = {
            cup_name: "Friendlies",
            season: state?.currentSeason || translate("currentSeason") || "",
            rounds: friendliesState.rounds || [],
            team_statistics: {},
          };
          const lastUpdatedPayload = {
            lastUpdated: new Date().toISOString(),
          };

          const res = await fetch(commitURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            mode: "cors",
            body: JSON.stringify({
              password,
              message: "Auto-commit friendlies update from Admin UI",
              files: [
                {
                  path: "friendlies.json",
                  content: JSON.stringify(friendliesPayload, null, 2),
                },
                {
                  path: "last_updated.json",
                  content: JSON.stringify(lastUpdatedPayload, null, 2),
                },
              ],
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data?.success)
            throw new Error(data?.error || "Commit failed");
          logger.success?.("Committed friendlies.json to GitHub");
          try {
            await loadData();
            renderAll();
          } catch (_) {}
        } catch (err) {
          logger.warn?.("Auto-commit failed", { error: err?.message });
        }
      });
    }

    if (exportTeamsBtn) {
      exportTeamsBtn.addEventListener("click", () => {
        const payload = {
          teams: state.teams.map((t) => ({
            name: t.name,
            notes: t.notes || "",
            played: t.played || 0,
            wins: t.wins || 0,
            gf: t.gf || 0,
            ga: t.ga || 0,
            gd: t.gd || 0,
          })),
        };
        download("teams.json", payload);
      });
    }

    if (exportFriendliesBtn) {
      exportFriendliesBtn.addEventListener("click", () => {
        const friendliesState = state.cups.Friendlies || { rounds: [] };
        const payload = {
          cup_name: "Friendlies",
          season: state?.currentSeason || translate("currentSeason") || "",
          rounds: friendliesState.rounds || [],
          team_statistics: {},
        };
        download("friendlies.json", payload);
      });
    }

    const commitURL = workerURL.replace("/run", "/commit");
    const commitBtn =
      document.getElementById("commit-github") ||
      (() => {
        const btn = document.createElement("button");
        btn.id = "commit-github";
        btn.type = "button";
        btn.textContent = "Commit to GitHub";
        btn.className = "btn btn-secondary";
        const exportActions = document
          .querySelector("#export-title")
          ?.parentElement?.querySelector(".admin-actions");
        if (exportActions) exportActions.appendChild(btn);
        return btn;
      })();

    commitBtn?.addEventListener("click", async () => {
      try {
        const teamsPayload = {
          teams: state.teams.map((t) => ({
            name: t.name,
            notes: t.notes || "",
            played: t.played || 0,
            wins: t.wins || 0,
            gf: t.gf || 0,
            ga: t.ga || 0,
            gd: t.gd || 0,
          })),
        };
        const friendliesState = state.cups.Friendlies || { rounds: [] };
        const friendliesPayload = {
          cup_name: "Friendlies",
          season: state?.currentSeason || translate("currentSeason") || "",
          rounds: friendliesState.rounds || [],
          team_statistics: {},
        };
        const password =
          sessionStorage.getItem(PASSWORD_KEY) ||
          (await requestAdminPassword());
        if (!password) return;
        if (!commitURL) return alert("Commit URL not configured.");
        commitBtn.disabled = true;
        commitBtn.textContent = "Committing…";
        const res = await fetch(commitURL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          mode: "cors",
          body: JSON.stringify({
            password,
            message: "Update data via admin",
            files: [
              {
                path: "teams.json",
                content: JSON.stringify(teamsPayload, null, 2),
              },
              {
                path: "friendlies.json",
                content: JSON.stringify(friendliesPayload, null, 2),
              },
            ],
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success)
          throw new Error(data?.error || "Commit failed");
        alert("Committed to GitHub successfully");
      } catch (err) {
        alert(`Commit failed: ${err.message || err}`);
      } finally {
        commitBtn.disabled = false;
        commitBtn.textContent = "Commit to GitHub";
      }
    });

    if (sessionStorage.getItem(UNLOCK_KEY) === "true") {
      if (adminLocked) adminLocked.hidden = true;
      if (adminBody) adminBody.hidden = false;
      initTeams();
    }

    unlockBtn?.addEventListener("click", async () => {
      const val = (passInput?.value || "").trim();
      if (!val) {
        passInput?.focus();
        return;
      }
      adminLocked && (adminLocked.hidden = true);
      adminBody && (adminBody.hidden = false);
      sessionStorage.setItem(UNLOCK_KEY, "true");
      sessionStorage.setItem(PASSWORD_KEY, val);
      await ensureDataLoaded();
      initTeams();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindModalEvents();
    const adminLink = document.getElementById("admin-link");
    if (adminLink) {
      adminLink.addEventListener("click", (event) => {
        event.preventDefault();
        requestAdminPassword().then((password) => {
          if (!password) return;
          window.location.href = "admin.html";
        });
      });
    }

    initAdminPage();
  });
})();
