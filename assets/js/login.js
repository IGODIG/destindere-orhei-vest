(function () {
  const form = document.getElementById("loginForm");
  const msg = document.getElementById("loginMessage");

  const api = (window.CONFIG && window.CONFIG.apiUrl) || "";

  const setMsg = (text, type) => {
    if (!msg) return;

    msg.textContent = text;
    msg.className = "login-message " + (type || "");
  };

  // ----------------------------------------------------------
  // VERIFICĂ DACĂ UTILIZATORUL ESTE DEJA AUTENTIFICAT
  // ----------------------------------------------------------

  try {
    const saved = localStorage.getItem("destindereUser");

    if (saved) {
      const u = JSON.parse(saved);

      if (u && u.id) {
        window.location.href = "admin.html";
        return;
      }
    }
  } catch (e) {
    // Ignorăm datele locale invalide
  }

  // ----------------------------------------------------------
  // LOGIN
  // ----------------------------------------------------------

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const nume = document.getElementById("loginNume").value.trim();

    const prenume = document.getElementById("loginPrenume").value.trim();

    const congregatie = document
      .getElementById("loginCongregatie")
      .value.trim();

    if (!nume || !prenume || !congregatie) {
      setMsg("Completează toate câmpurile.", "error");

      return;
    }

    if (!api) {
      setMsg("Adresa Google Apps Script nu este configurată.", "error");

      return;
    }

    const btn = form.querySelector("button");

    btn.disabled = true;
    btn.textContent = "Se verifică...";

    setMsg("");

    try {
      const body = new URLSearchParams({
        action: "login",
        nume: nume,
        prenume: prenume,
        congregatie: congregatie,
      });

      const response = await fetch(api, {
        method: "POST",
        body: body,
      });

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch (parseError) {
        setMsg("Serverul a returnat un răspuns neașteptat.", "error");

        return;
      }

      // ------------------------------------------------------
      // LOGIN REUȘIT
      // ------------------------------------------------------

      if (data.success === true && data.user) {
        localStorage.setItem("destindereUser", JSON.stringify(data.user));

        setMsg("Autentificare reușită. Se deschide site-ul...", "success");

        setTimeout(function () {
          window.location.href = "admin.html";
        }, 350);

        return;
      }

      // ------------------------------------------------------
      // LOGIN RESPINS
      // ------------------------------------------------------

      setMsg(data.error || "Datele introduse nu au fost găsite.", "error");
    } catch (error) {
      setMsg(
        "Nu am putut verifica datele. Verifică conexiunea și încearcă din nou.",
        "error",
      );
    } finally {
      btn.disabled = false;
      btn.textContent = "INTRĂ";
    }
  });
})();
