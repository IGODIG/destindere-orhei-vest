/* ==========================================================
   STATS.JS
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  /* ==========================================================
     FETCH DATE DIN GOOGLE SHEETS
  ========================================================== */

  const updateStatsFromAPI = () => {
    if (typeof CONFIG === "undefined" || !CONFIG.apiUrl) {
      console.warn("CONFIG.apiUrl nu este definit.");
      return;
    }

    fetch(CONFIG.apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Eroare rețea: " + response.status);
        }
        return response.json();
      })
      .then((data) => {
        if (!data || !data.stats) return;

        const stats = data.stats;

        // Elementele din HTML (ID-urile din index.html)
        const invitedEl = document.getElementById("invited");
        const confirmedEl = document.getElementById("confirmed");
        const declinedEl = document.getElementById("declined");
        const waitingEl = document.getElementById("waiting");
        const personsEl = document.getElementById("persons");

        // Setăm valorile reale primite din Google Sheets ca target pentru animație
        if (invitedEl) invitedEl.dataset.target = stats.invited || 0;
        if (confirmedEl) confirmedEl.dataset.target = stats.confirmed || 0;
        if (declinedEl) declinedEl.dataset.target = stats.declined || 0;
        if (waitingEl) waitingEl.dataset.target = stats.waiting || 0;
        if (personsEl) personsEl.dataset.target = stats.persons || 0;

        // Repornim animația pentru elementele deja vizibile pe ecran
        document.querySelectorAll(".stat-card span").forEach((counter) => {
          animateCounter(counter);
        });
      })
      .catch((error) => {
        console.error("Eroare la preluarea statisticilor:", error);
      });
  };

  /* ==========================================================
     COUNTER ANIMATION
  ========================================================== */

  const animateCounter = (element) => {
    const target = parseInt(
      element.dataset.target || element.textContent || "0",
      10,
    );

    let current = 0;
    const increment = Math.max(1, Math.ceil(target / 60));

    if (target === 0) {
      element.textContent = "0";
      return;
    }

    const timer = setInterval(() => {
      current += increment;

      if (current >= target) {
        current = target;
        clearInterval(timer);
      }

      element.textContent = current;
    }, 20);
  };

  /* ==========================================================
     COUNTER OBSERVER
  ========================================================== */

  const counters = document.querySelectorAll(".stat-card span");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.5,
    },
  );

  counters.forEach((counter) => {
    observer.observe(counter);
  });

  // Apelăm funcția de preluare a datelor din Google Sheets
  updateStatsFromAPI();
});
