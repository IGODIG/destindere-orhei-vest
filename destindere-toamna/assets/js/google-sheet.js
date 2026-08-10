document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("registrationForm");
  const guestSelect = document.getElementById("guestSelect");

  // AICI ESTE LINKUL TĂU CORECT PENTRU APPS SCRIPT
  const scriptURL =
    "https://script.google.com/macros/s/AKfycbwuZAlb0ur5x2aJTWyP0YbWWxi4f-R--Dc3uj0Y1dbCgv9bYyANEwRfTAE-2GzanRQuqw/exec";

  // ==========================================
  // PARTEA 1: ÎNCĂRCAREA LISTEI DE INVITAȚI
  // ==========================================
  if (guestSelect) {
    // Adăugăm redirect: "follow" pentru siguranță
    fetch(scriptURL, { method: "GET", redirect: "follow" })
      .then((response) => response.text()) // Citim mai întâi ca text pur
      .then((text) => {
        try {
          const data = JSON.parse(text); // Încercăm să-l transformăm în listă

          if (data.error) {
            guestSelect.innerHTML =
              '<option value="">Eroare din baza de date</option>';
            console.error("Eroare de la script:", data.error);
            return;
          }

          guestSelect.innerHTML = '<option value="">Alege numele...</option>';

          data.forEach((nume) => {
            const option = document.createElement("option");
            option.value = nume;
            option.textContent = nume;
            guestSelect.appendChild(option);
          });
        } catch (e) {
          console.error("Nu s-a primit JSON valid. Răspunsul a fost:", text);
          guestSelect.innerHTML =
            '<option value="">Eroare de format (vezi consola)</option>';
        }
      })
      .catch((error) => {
        console.error("Eroare de rețea/CORS:", error);
        guestSelect.innerHTML =
          '<option value="">Eroare la încărcare internet</option>';
      });
  }

  // ==========================================
  // PARTEA 2: TRIMITEREA DATELOR DIN FORMULAR
  // ==========================================
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.innerText;

    submitButton.innerText = "Se trimite...";
    submitButton.disabled = true;

    const formData = new FormData(form);

    fetch(scriptURL, { method: "POST", body: formData })
      .then((response) => response.json())
      .then((data) => {
        if (data.result === "success") {
          alert("Te-ai înregistrat cu succes!");
          form.reset();
        } else {
          alert("A apărut o eroare: " + data.message);
        }
      })
      .catch((error) => {
        console.error("Eroare:", error);
        alert("Nu am putut trimite datele. Verifică conexiunea la internet.");
      })
      .finally(() => {
        submitButton.innerText = originalText;
        submitButton.disabled = false;
      });
  });
});
