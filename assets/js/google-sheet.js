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

  function normalizeProductName(value) {
    return String(value ?? "")
      .trim()
      .toLocaleLowerCase("ro-RO")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function toNumber(value) {
    if (typeof value === "object" && value !== null) {
      value = value.adus ?? value.current ?? value.quantity ?? value.cantitate ?? value.total ?? value.value ?? value.valoare;
    }
    if (typeof value === "string") {
      value = value.replace(/\s/g, "").replace(",", ".");
    }
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function getProductsData(data) {
    if (!data) return {};
    return data.produse || data.products || data.food || {};
  }

  function getCurrentForProduct(produse, productId, productName) {
    if (!produse) return 0;

    const targetId = String(productId || "").trim();
    const target = normalizeProductName(productName);

    // Format obiect recomandat: { "food_001": 6, "food_002": 4 }
    if (!Array.isArray(produse) && typeof produse === "object") {
      if (targetId && Object.prototype.hasOwnProperty.call(produse, targetId)) return toNumber(produse[targetId]);
      const key = Object.keys(produse).find(function (key) {
        return normalizeProductName(key) === target;
      });
      if (key !== undefined) return toNumber(produse[key]);
    }

    // Format array recomandat: [{id:"food_001", name:"Suc", adus:6}, ...]
    if (Array.isArray(produse)) {
      const row = produse.find(function (item) {
        if (!item || typeof item !== "object") return false;
        if (targetId && String(item.id ?? item.productId ?? item.produsId ?? "").trim() === targetId) return true;
        return normalizeProductName(item.name ?? item.nume ?? item.produs ?? item.product) === target;
      });
      if (row) return toNumber(row);
    }

    return 0;
  }

  function updateFoodProgress(produse) {
    const foodItems = document.querySelectorAll("#foodProgress .food-card");
    if (!foodItems.length) return;

    foodItems.forEach(function (item) {
      const productName = item.dataset.productName || "";
      const productId = item.dataset.productId || "";
      const configProduct = (CONFIG.food?.products || []).find(function (product) {
        return (product.id && product.id === productId) || normalizeProductName(product.name) === normalizeProductName(productName);
      });

      if (!configProduct) return;

      const current = getCurrentForProduct(produse, productId, productName);
      const required = toNumber(configProduct.required);
      const percentage = required > 0 ? Math.min((current / required) * 100, 100) : 0;
      const rounded = Math.round(percentage);

      const numberElement = item.querySelector(".food-progress-number");
      const progressBar = item.querySelector(".food-progress-bar");
      const progress = item.querySelector(".food-progress");
      const label = item.querySelector(".food-progress-label");

      if (numberElement) numberElement.textContent = current + " / " + required + (configProduct.unit ? " " + configProduct.unit : "");
      if (progressBar) progressBar.style.width = rounded + "%";
      if (progress) progress.setAttribute("aria-valuenow", String(rounded));

      const complete = current >= required && required > 0;
      if (complete) {
        if (label) label.textContent = "COMPLET";
        item.classList.add("is-complete");
        // Poți ascunde produsele completate din Configurație.
        // După începerea evenimentului, cele completate rămân ascunse automat.
        if (typeof CONFIG !== "undefined") {
          const eventTime = new Date(`${CONFIG.event.date}T${CONFIG.event.time || "00:00"}:00`).getTime();
          const hideCompleted = CONFIG.food?.hideCompleted === true;
          item.hidden = hideCompleted || Date.now() >= eventTime;
        }
      } else {
        if (label) label.textContent = "PROGRES";
        item.classList.remove("is-complete");
        item.hidden = false;
      }

      const foodSection = document.getElementById("food");
      if (foodSection && typeof CONFIG !== "undefined") {
        const eventTime = new Date(`${CONFIG.event.date}T${CONFIG.event.time || "00:00"}:00`).getTime();
        if (Date.now() >= eventTime) {
          const remaining = document.querySelectorAll("#foodProgress .food-card:not([hidden])");
          const hasRemaining = remaining.length > 0;
          foodSection.hidden = !hasRemaining;
          const foodNav = document.querySelector('#mainNav a[href="#food"]');
          if (foodNav) foodNav.closest("li").hidden = !hasRemaining;
        }
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
