document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("registrationForm");
  const guestSelect = document.getElementById("guestSelect");

  const scriptURL =
    "https://script.google.com/macros/s/AKfycbwuZAlb0ur5x2aJTWyP0YbWWxi4f-R--Dc3uj0Y1dbCgv9bYyANEwRfTAE-2GzanRQuqw/exec";

  // Funcție simplă de afișare text
  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // ==========================================
  // 1. ÎNCĂRCAREA LISTEI ȘI A STATISTICILOR
  // ==========================================
  fetch(scriptURL)
    .then((response) => response.json())
    .then((data) => {
      console.log("Date primite din Google Sheets:", data);

      if (data.error) {
        console.error("Eroare de la Apps Script:", data.error);
        if (guestSelect)
          guestSelect.innerHTML = '<option value="">Eroare la citire</option>';
        return;
      }

      // Încărcare Nume în Dropdown
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

      // Încărcare Statistici pe ecran
      if (data.stats) {
        setVal("invited", data.stats.invited);
        setVal("confirmed", data.stats.confirmed);
        setVal("declined", data.stats.declined);
        setVal("waiting", data.stats.waiting);
        setVal("persons", data.stats.persons);
      }
    })
    .catch((error) => {
      console.error("Eroare de conexiune/CORS:", error);
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
