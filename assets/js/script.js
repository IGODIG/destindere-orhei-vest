/* ==========================================================
   SCRIPT.JS
========================================================== */

document.addEventListener("DOMContentLoaded", function () {
  /* ==========================================================
     SMOOTH SCROLL
  ========================================================== */

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      const target = document.querySelector(this.getAttribute("href"));

      if (!target) {
        return;
      }

      e.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  });

  /* ==========================================================
     ACTIVE MENU
  ========================================================== */

  const sections = document.querySelectorAll("section");
  const navLinks = document.querySelectorAll("nav a");

  window.addEventListener("scroll", function () {
    let current = "";

    sections.forEach(function (section) {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.offsetHeight;

      if (
        window.scrollY >= sectionTop &&
        window.scrollY < sectionTop + sectionHeight
      ) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach(function (link) {
      link.classList.remove("active");

      if (link.getAttribute("href") === "#" + current) {
        link.classList.add("active");
      }
    });
  });

  /* ==========================================================
     FOOD
  ========================================================== */

  const foodProgress = document.getElementById("foodProgress");

  if (
    foodProgress &&
    typeof CONFIG !== "undefined" &&
    Array.isArray(CONFIG.products)
  ) {
    foodProgress.innerHTML = "";

    CONFIG.products.forEach(function (product) {
      const item = document.createElement("div");

      item.className = "food-card";

      item.innerHTML = `

        <div class="food-card-icon">
          ${product.icon || "🍂"}
        </div>

        <div class="food-card-content">

          <h3>
            ${product.name}
          </h3>

          <p>
            Necesar pentru eveniment
          </p>

          <div class="food-card-bottom">

            <span>
              Progres
            </span>

            <strong>
              0 / ${product.required}
            </strong>

          </div>

          <div class="food-progress">

            <div
              class="food-progress-bar"
              style="width: 0%">
            </div>

          </div>

        </div>

      `;

      foodProgress.appendChild(item);
    });
  }

  /* ==========================================================
     REVEAL ANIMATION
  ========================================================== */

  const revealItems = document.querySelectorAll(
    ".feature-card, " +
      ".stat-card, " +
      ".countdown-card, " +
      ".register form, " +
      ".food-card",
  );

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("fade");

          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
    },
  );

  revealItems.forEach(function (item) {
    observer.observe(item);
  });

  /* ==========================================================
     BACK TO TOP
  ========================================================== */

  const button = document.createElement("button");

  button.innerHTML = "↑";

  button.id = "backToTop";

  document.body.appendChild(button);

  button.style.position = "fixed";
  button.style.right = "25px";
  button.style.bottom = "25px";

  button.style.width = "50px";
  button.style.height = "50px";

  button.style.border = "none";
  button.style.borderRadius = "50%";

  button.style.cursor = "pointer";

  button.style.fontSize = "22px";

  button.style.background = "#d97706";
  button.style.color = "#fff";

  button.style.boxShadow = "0 10px 30px rgba(0,0,0,.2)";

  button.style.display = "none";

  button.style.zIndex = "9999";

  window.addEventListener("scroll", function () {
    if (window.scrollY > 500) {
      button.style.display = "block";
    } else {
      button.style.display = "none";
    }
  });

  button.addEventListener("click", function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
});
