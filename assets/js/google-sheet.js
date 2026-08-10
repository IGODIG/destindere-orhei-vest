document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("registrationForm");
  const guestSelect = document.getElementById("guestSelect");

  const scriptURL =
    "https://script.google.com/macros/s/AKfycbwuZAlb0ur5x2aJTWyP0YbWWxi4f-R--Dc3uj0Y1dbCgv9bYyANEwRfTAE-2GzanRQuqw/exec";

  // Funcție pentru numărare animată
  function animateValue(element, start, end, duration) {
    if (!element || start === end) {
      if (element) element.textContent = end;
      return;
    }
    let range = end - start;
    let current = start;
    let increment = end > start ? 1 : -1;
    let stepTime = Math.abs(Math.floor(duration / range)) || 20;

    let timer = setInterval(function () {
      current += increment;
      element.textContent = current;
      if (current == end) {
        clearInterval(timer);
      }
    }, stepTime);
  }

  // ==========================================
  // 1. ÎNCĂRCAREA LISTEI ȘI A STATISTICILOR
  // ==========================================
  fetch(scriptURL)
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        console.error("Eroare Apps Script:", data.error);
        return;
      }

      // Populate Dropdown
      if (guestSelect && Array.isArray(data.nume)) {
        guestSelect.innerHTML = '<option value="">Alege numele...</option>';
        data.nume.forEach((nume) => {
          if (nume && nume.trim() !== "") {
            const option = document.createElement("option");
            option.value = nume;
            option.textContent = nume;
            guestSelect.appendChild(option);
          }
        });
      }

      // Populate & Animate Statistici cu Date Reale
      if (data.stats) {
        const updateStat = (id, targetValue) => {
          const el = document.getElementById(id);
          if (el) {
            animateValue(el, 0, parseInt(targetValue) || 0, 1000);
          }
        };

        updateStat("invited", data.stats.invited);
        updateStat("confirmed", data.stats.confirmed);
        updateStat("declined", data.stats.declined);
        updateStat("waiting", data.stats.waiting);
        updateStat("persons", data.stats.persons);
      }
    })
    .catch((error) => {
      console.error("Eroare încărcare date:", error);
      if (guestSelect) {
        guestSelect.innerHTML =
          '<option value="">Eroare la încărcare internet</option>';
      }
    });

  // ==========================================
  // 2. TRIMITEREA FORMULARULUI
  // ==========================================
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton.innerText;

      submitButton.innerText = "Se trimite...";
      submitButton.disabled = true;

      fetch(scriptURL, {
        method: "POST",
        body: new FormData(form),
      })
        .then((response) => response.json())
        .then((res) => {
          if (res.result === "success") {
            alert("Te-ai înregistrat cu succes!");
            form.reset();
            window.location.reload();
          } else {
            alert(
              "A apărut o eroare: " + (res.message || "Eroare necunoscută"),
            );
          }
        })
        .catch((error) => {
          console.error("Eroare la trimitere:", error);
          alert("Nu am putut trimite datele. Verifică conexiunea la internet.");
        })
        .finally(() => {
          submitButton.innerText = originalText;
          submitButton.disabled = false;
        });
    });
  }
});
