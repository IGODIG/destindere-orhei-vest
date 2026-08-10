document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("registrationForm");
  const guestSelect = document.getElementById("guestSelect");

  // URL-ul este preluat din config.js
  const scriptURL = CONFIG.apiUrl;

  // ==========================================
  // FUNCȚIE PENTRU AFIȘAREA STATISTICILOR
  // ==========================================

  function setVal(id, val) {
    const el = document.getElementById(id);

    if (el) {
      el.textContent = val;
    }
  }

  // ==========================================
  // 1. ÎNCĂRCARE LISTĂ INVITAȚI + STATISTICI
  // ==========================================

  fetch(scriptURL)
    .then(function (response) {
      if (!response.ok) {
        throw new Error("HTTP error: " + response.status);
      }

      return response.json();
    })

    .then(function (data) {
      console.log("Date primite din Google Sheets:", data);

      // ==========================================
      // VERIFICARE EROARE APPS SCRIPT
      // ==========================================

      if (data.error) {
        console.error("Eroare de la Apps Script:", data.error);

        if (guestSelect) {
          guestSelect.innerHTML = '<option value="">Eroare la citire</option>';
        }

        return;
      }

      // ==========================================
      // ÎNCĂRCARE LISTĂ INVITAȚI
      // ==========================================

      if (guestSelect && Array.isArray(data.nume)) {
        guestSelect.innerHTML = '<option value="">Alege numele...</option>';

        data.nume.forEach(function (nume) {
          if (nume && String(nume).trim() !== "") {
            const option = document.createElement("option");

            option.value = nume;
            option.textContent = nume;

            guestSelect.appendChild(option);
          }
        });
      }

      // ==========================================
      // ÎNCĂRCARE STATISTICI
      // ==========================================

      if (data.stats) {
        setVal("invited", data.stats.invited);

        setVal("confirmed", data.stats.confirmed);

        setVal("declined", data.stats.declined);

        setVal("waiting", data.stats.waiting);

        setVal("persons", data.stats.persons);
      }
    })

    .catch(function (error) {
      console.error("Eroare la conectarea cu Google Sheets:", error);

      if (guestSelect) {
        guestSelect.innerHTML = '<option value="">Eroare la încărcare</option>';
      }
    });

  // ==========================================
  // 2. TRIMITERE FORMULAR
  // ==========================================

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const submitButton = form.querySelector('button[type="submit"]');

      if (!submitButton) {
        return;
      }

      const originalText = submitButton.innerText;

      submitButton.innerText = "Se trimite...";

      submitButton.disabled = true;

      // ==========================================
      // TRIMITERE DATE CĂTRE GOOGLE SHEETS
      // ==========================================

      fetch(scriptURL, {
        method: "POST",

        body: new FormData(form),
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error("HTTP error: " + response.status);
          }

          return response.json();
        })

        .then(function (res) {
          console.log("Răspuns Apps Script:", res);

          if (res.result === "success") {
            alert("Te-ai înregistrat cu succes!");

            form.reset();

            // Reîncarcă lista și statisticile
            window.location.reload();
          } else {
            alert(
              "A apărut o eroare: " + (res.message || "Eroare necunoscută"),
            );
          }
        })

        .catch(function (error) {
          console.error("Eroare la trimitere:", error);

          alert(
            "Nu am putut trimite datele. " + "Verifică conexiunea la internet.",
          );
        })

        .finally(function () {
          submitButton.innerText = originalText;

          submitButton.disabled = false;
        });
    });
  }
});
