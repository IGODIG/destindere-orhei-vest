document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("registrationForm");
  const guestSelect = document.getElementById("guestSelect");

  const scriptURL =
    "https://script.google.com/macros/s/AKfycbwuZAlb0ur5x2aJTWyP0YbWWxi4f-R--Dc3uj0Y1dbCgv9bYyANEwRfTAE-2GzanRQuqw/exec";

  // Încărcarea listei de invitați
  if (guestSelect) {
    fetch(scriptURL)
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          guestSelect.innerHTML = '<option value="">Alege numele...</option>';
          data.forEach((nume) => {
            if (nume && nume.trim() !== "") {
              const option = document.createElement("option");
              option.value = nume;
              option.textContent = nume;
              guestSelect.appendChild(option);
            }
          });
        } else {
          console.error("Răspunsul nu este o listă validă:", data);
          guestSelect.innerHTML =
            '<option value="">Eroare la citirea numelor</option>';
        }
      })
      .catch((error) => {
        console.error("Eroare la aducerea numelor:", error);
        guestSelect.innerHTML =
          '<option value="">Eroare la încărcare internet</option>';
      });
  }

  // Trimiterea formularului
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton.innerText;

      submitButton.innerText = "Se trimite...";
      submitButton.disabled = true;

      fetch(scriptURL, { method: "POST", body: new FormData(form) })
        .then((response) => response.json())
        .then((data) => {
          if (data.result === "success") {
            alert("Te-ai înregistrat cu succes!");
            form.reset();
          } else {
            alert(
              "A apărut o eroare: " + (data.message || "Eroare necunoscută"),
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
