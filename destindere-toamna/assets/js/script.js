/* ==========================================
   SCRIPT.JS
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  /* ==========================
       Smooth Scroll
    ========================== */

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", function (e) {
      const target = document.querySelector(this.getAttribute("href"));

      if (!target) return;

      e.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  });

  /* ==========================
       Active Menu
    ========================== */

  const sections = document.querySelectorAll("section");
  const navLinks = document.querySelectorAll("nav a");

  window.addEventListener("scroll", () => {
    let current = "";

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.offsetHeight;

      if (
        window.scrollY >= sectionTop &&
        window.scrollY < sectionTop + sectionHeight
      ) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");

      if (link.getAttribute("href") === "#" + current) {
        link.classList.add("active");
      }
    });
  });

  /* ==========================
       Reveal Animation
    ========================== */

  const revealItems = document.querySelectorAll(
    ".feature-card, .stat-card, .countdown-card, .register form",
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("fade");
        }
      });
    },
    {
      threshold: 0.15,
    },
  );

  revealItems.forEach((item) => observer.observe(item));

  /* ==========================
       Back To Top
    ========================== */

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

  window.addEventListener("scroll", () => {
    if (window.scrollY > 500) {
      button.style.display = "block";
    } else {
      button.style.display = "none";
    }
  });

  button.addEventListener("click", () => {
    window.scrollTo({
      top: 0,

      behavior: "smooth",
    });
  });
});
