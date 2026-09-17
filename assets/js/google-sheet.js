document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("registrationForm");

  const guestSelect = document.getElementById("guestSelect");

  const scriptURL = CONFIG.apiUrl;

  // ==========================================
  // FUNCȚIE STATISTICI
  // ==========================================

  function setVal(id, value) {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = value;
    }
  }

  // ==========================================
  // ACTUALIZARE PRODUSE
  // ==========================================

  function updateFoodProgress(produse) {
    if (!produse) {
      return;
    }

    const foodItems = document.querySelectorAll(".food-item");

    foodItems.forEach(function (item) {
      const nameElement = item.querySelector(".food-name span:last-child");

      const numberElement = item.querySelector(
        ".food-item-header > span:last-child",
      );

      const progressBar = item.querySelector(".progress-bar");

      if (!nameElement) {
        return;
      }

      const productName = nameElement.textContent.trim();

      // ==========================================
      // GĂSEȘTE PRODUSUL
      // ==========================================

      const productKey = Object.keys(produse).find(function (key) {
        return key === productName || productName.startsWith(key);
      });

      // Cantitatea totală din Google Sheets
      const current = productKey ? Number(produse[productKey]) : 0;

      // ==========================================
      // GĂSEȘTE NECESARUL DIN CONFIG
      // ==========================================

      const configProduct = CONFIG.products.find(function (product) {
        return (
          productName === product.name || productName.startsWith(product.name)
        );
      });

      if (!configProduct) {
        return;
      }

      const required = Number(configProduct.required);

      // ==========================================
      // PROCENTAJ
      // ==========================================

      const percentage =
        required > 0 ? Math.min((current / required) * 100, 100) : 0;

      // ==========================================
      // TEXT
      // Exemplu:
      // 4 / 15
      // ==========================================

      if (numberElement) {
        numberElement.textContent = current + " / " + required;
      }

      // ==========================================
      // BARA DE PROGRES
      // ==========================================

      if (progressBar) {
        progressBar.style.width = percentage + "%";
      }
    });
  }

  // ==========================================
  // ÎNCĂRCARE DATE
  // ==========================================

  function loadData() {
    fetch(scriptURL)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("HTTP " + response.status);
        }

        return response.json();
      })

      .then(function (data) {
        console.log("Date Google Sheets:", data);

        // ==========================================
        // INVITAȚI
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
        // STATISTICI
        // ==========================================

        if (data.stats) {
          setVal("invited", data.stats.invited);

          setVal("confirmed", data.stats.confirmed);

          setVal("declined", data.stats.declined);

          setVal("waiting", data.stats.waiting);

          setVal("persons", data.stats.persons);
        }

        // ==========================================
        // PRODUSE
        // ==========================================

        updateFoodProgress(data.produse);
      })

      .catch(function (error) {
        console.error("Eroare Google Sheets:", error);
      });
  }

  // Încărcăm datele
  loadData();

  // ==========================================
  // TRIMITERE FORMULAR
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
      // DATE FORMULAR
      // ==========================================

      const formData = new FormData(form);

      // ==========================================
      // GOOGLE APPS SCRIPT
      // ==========================================

      fetch(scriptURL, {
        method: "POST",
        body: formData,
      })
        .then(function (response) {
          return response.json();
        })

        .then(function (result) {
          console.log("Răspuns Google Apps Script:", result);

          // ==========================================
          // IMPORTANT:
          // doPost() returnează success: true
          // NU result: "success"
          // ==========================================

          if (result.success === true) {
            alert("Te-ai înregistrat cu succes!");

            form.reset();

            loadData();
          } else {
            alert(
              "A apărut o eroare: " +
                (result.error || result.message || "Eroare necunoscută"),
            );
          }
        })

        .catch(function (error) {
          console.error("Eroare trimitere:", error);

          alert("Nu am putut trimite datele.");
        })

        .finally(function () {
          submitButton.innerText = originalText;

          submitButton.disabled = false;
        });
    });
  }
});
