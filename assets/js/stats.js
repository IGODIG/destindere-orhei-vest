/* ==========================================================
   STATS.JS
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  /* ==========================================================
     COUNTER ANIMATION
  ========================================================== */

  const counters = document.querySelectorAll(".stat-card span");

  const animateCounter = (element) => {
    const target = parseInt(
      element.dataset.target || element.textContent || "0",
      10,
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

  /* ==========================================================
     COUNTER OBSERVER
  ========================================================== */

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

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
});
