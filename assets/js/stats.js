/* ==========================================
   STATS.JS - Adaptat pentru Google Sheets
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  /* ==========================
     Counter Animation
  ========================== */
  const counters = document.querySelectorAll(".stat-card span");

  const animateCounter = (element) => {
    // Citește valoarea pusă de google-sheet.js sau din HTML
    const target = parseInt(
      element.dataset.target || element.textContent || "0",
    );

    let current = 0;
    const increment = Math.max(1, Math.ceil(target / 60));

    if (target === 0) {
      element.textContent = "0";
      return;
    }

    const timer = setInterval(() => {
      current += increment;

      if (current >= target) {
        current = target;
        clearInterval(timer);
      }

      element.textContent = current;
    }, 20);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.5,
    },
  );

  counters.forEach((counter) => {
    observer.observe(counter);
  });

  /* ==========================
     Food Progress (dacă există CONFIG)
  ========================== */
  const container = document.getElementById("foodProgress");

  if (container && typeof CONFIG !== "undefined" && CONFIG.products) {
    const products = CONFIG.products.map((product) => ({
      name: product.name,
      current: 0,
      total: product.required,
    }));

    container.innerHTML = ""; // Curățăm containerul înainte de populare

    products.forEach((item) => {
      const percent = Math.round((item.current / item.total) * 100);

      container.innerHTML += `
        <div class="food-item">
          <div class="food-item-header">
            <span>${item.name}</span>
            <span>${item.current} / ${item.total}</span>
          </div>
          <div class="progress">
            <div class="progress-bar" style="width:${percent}%"></div>
          </div>
        </div>
      `;
    });
  }
});
