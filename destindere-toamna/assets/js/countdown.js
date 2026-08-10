/* ==========================================
   COUNTDOWN
========================================== */

// Data evenimentului
// Format: An, Luna(0-11), Zi, Ora, Minut
const eventDate = new Date(CONFIG.eventDate).getTime();

// Elemente din pagină
const daysElement = document.getElementById("days");
const hoursElement = document.getElementById("hours");
const minutesElement = document.getElementById("minutes");
const secondsElement = document.getElementById("seconds");

// Funcție pentru afișare cu două cifre
function formatNumber(number) {
  return number.toString().padStart(2, "0");
}

// Actualizare countdown
function updateCountdown() {
  const now = new Date().getTime();
  const distance = eventDate - now;

  // Dacă evenimentul a început
  if (distance <= 0) {
    daysElement.textContent = "00";
    hoursElement.textContent = "00";
    minutesElement.textContent = "00";
    secondsElement.textContent = "00";

    const countdownSection = document.querySelector(".countdown");

    countdownSection.innerHTML = `
            <div class="container">
                <div class="countdown-card" style="grid-column:1/-1;">
                    <h2>🎉 Destinderea de Toamnă a început!</h2>
                </div>
            </div>
        `;

    clearInterval(timer);

    return;
  }

  // Calcule
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));

  const hours = Math.floor(
    (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );

  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  // Actualizare HTML
  daysElement.textContent = formatNumber(days);
  hoursElement.textContent = formatNumber(hours);
  minutesElement.textContent = formatNumber(minutes);
  secondsElement.textContent = formatNumber(seconds);
}

// Prima rulare
updateCountdown();

// Actualizare la fiecare secundă
const timer = setInterval(updateCountdown, 1000);
