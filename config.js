/* ==========================================================
   CONFIG.JS - CONFIGURAȚIA SITE-ULUI
   Poate fi modificată din admin.html.
========================================================== */

const DEFAULT_CONFIG = {
  event: {
    name: "Destindere de Toamnă",
    congregation: "Congregația Orhei-Vest",
    date: "2026-09-27",
    time: "13:00",
    location: "Poiana OV",
    heroTitle: "DESTINDERE",
    heroSubtitle: "Iată ce bine și ce plăcut este ca frații să locuiască împreună în unitate!",
    heroVerse: "Iată ce bine și ce plăcut este ca frații să locuiască împreună în unitate!",
    heroImage: "./assets/images/hero/hero.jpg",
    footer: "© 2026 Destindere de Toamnă • Congregația Orhei-Vest"
  },

  countdown: {
    enabled: true,
    title: "Până la eveniment a mai rămas...",
    startedMessage: "🎉 Evenimentul a început!",
    hideAfterStart: false,
    afterStartHours: 24
  },

  location: {
    enabled: true,
    title: "Locația evenimentului",
    name: "Poiana OV",
    mapUrl: "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1910.036346085665!2d28.838144542019688!3d47.388544042061945!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40cbef00641c883f%3A0xc51ae9283bc54452!2sPoiana%20OV!5e0!3m2!1sen!2s!4v1786436855627!5m2!1sen!2s"
  },

  gallery: {
    enabled: true,
    title: "Galerie",
    driveEnabled: true,
    driveUrl: "https://drive.google.com/drive/folders/1UrOCtN2ixkyoykDeaV43UakTHbn8DiKE?usp=sharing",
    driveText: "📸 Vezi toate fotografiile în Google Drive",
    images: [
      {
        src: "./assets/images/gallery/photo1.png",
        title: "Amintiri",
        alt: "Amintiri frumoase"
      },
      {
        src: "./assets/images/gallery/photo2.png",
        title: "Amintiri",
        alt: "Amintiri frumoase"
      },
      {
        src: "./assets/images/gallery/photo3.jpg",
        title: "Amintiri",
        alt: "Amintiri de la Destindere"
      },
      {
        src: "./assets/images/gallery/photo4.jpg",
        title: "Amintiri",
        alt: "Amintiri de la Destindere"
      }
    ]
  },

  memories: {
    enabled: true,
    title: "Amintiri de la destindere",
    text: "Ai făcut o fotografie sau un videoclip? Împărtășește-l cu ceilalți."
  },

  participation: {
    enabled: true,
    visibility: "untilEvent",
    afterStart: "hide",
    manualAfterStart: false,
    title: "Confirmă participarea",
    description: "Ne-ar face plăcere să știm dacă vei participa.",
    buttonText: "Trimite",
    fields: {
      name: true,
      participation: true,
      persons: true,
      products: true,
      notes: true
    },
    productChoices: true,
    productRows: 2
  },

  stats: {
    enabled: true,
    title: "Cine va veni?",
    afterStart: "hide",
    manualAfterStart: false,
    cards: [
      {
        id: "invited",
        label: "Invitații",
        enabled: true
      },
      {
        id: "confirmed",
        label: "Participă",
        enabled: true
      },
      {
        id: "declined",
        label: "Nu participă",
        enabled: true
      },
      {
        id: "waiting",
        label: "Fără răspuns",
        enabled: true
      },
      {
        id: "persons",
        label: "Total persoane",
        enabled: true
      }
    ]
  },

  features: {
    enabled: true,
    titleBefore: "Ce am pregătit?",
    titleAfter: "Cum a fost?",
    menuBefore: "Ce am pregătit?",
    menuAfter: "Cum a fost?",
    items: [
      {
        icon: "🎶",
        title: "Muzică Live",
        enabled: true
      },
      {
        icon: "📸",
        title: "Photo Zone",
        enabled: true
      },
      {
        icon: "🎁",
        title: "O Surpriză Specială",
        enabled: true
      },
      {
        icon: "🎯",
        title: "Activități interesante",
        enabled: true
      },
      {
        icon: "☕",
        title: "Relaxare",
        enabled: true
      },
      {
        icon: "🍂",
        title: "Decor de Toamnă",
        enabled: true
      }
    ]
  },

  food: {
    enabled: true,
    title: "Vreau să contribui",
    hideCompleted: false,
    autoDisableHoursAfterStart: 24,
    description: "Ajută-ne să completăm necesarul pentru eveniment.",
    products: [
      {
        id: "food_001",
        name: "Legume",
        required: 10,
        unit: "kg",
        icon: "🥗"
      },
      {
        id: "food_002",
        name: "Fructe",
        required: 10,
        unit: "kg",
        icon: "🍎"
      },
      {
        id: "food_003",
        name: "Prăjituri",
        required: 5,
        unit: "kg",
        icon: "🍰"
      },
      {
        id: "food_004",
        name: "Plăcinte",
        required: 10,
        unit: "kg",
        icon: "🥧"
      },
      {
        id: "food_005",
        name: "Snack-uri",
        required: 15,
        unit: "pachete",
        icon: "🍟"
      },
      {
        id: "food_006",
        name: "Suc",
        required: 10,
        unit: "L",
        icon: "🧃"
      },
      {
        id: "food_007",
        name: "Apă minerală",
        required: 18,
        unit: "sticle de 1.5 L",
        icon: "💧"
      },
      {
        id: "food_008",
        name: "Apă dulce",
        required: 12,
        unit: "sticle de 1.25 L",
        icon: "🥤"
      },
      {
        id: "food_009",
        name: "Pâine",
        required: 7,
        unit: "franzele feliate",
        icon: "🍞"
      },
      {
        id: "food_010",
        name: "Altceva",
        required: 10,
        unit: "bucăți",
        icon: "🎁"
      }
    ]
  },

  modules: [
    {
      id: "hero",
      label: "Hero",
      enabled: true,
      showInMenu: false
    },
    {
      id: "countdown",
      label: "Countdown",
      enabled: true,
      showInMenu: false
    },
    {
      id: "memories",
      label: "Amintiri",
      enabled: true,
      showInMenu: true
    },
    {
      id: "features",
      label: "Ce am pregătit?",
      enabled: true,
      showInMenu: true
    },
    {
      id: "gallery",
      label: "Galerie",
      enabled: true,
      showInMenu: true
    },
    {
      id: "participation",
      label: "Confirmă participarea",
      enabled: true,
      showInMenu: false
    },
    {
      id: "stats",
      label: "Statistici",
      enabled: true,
      showInMenu: true
    },
    {
      id: "food",
      label: "Vreau să contribui",
      enabled: true,
      showInMenu: true
    },
    {
      id: "location",
      label: "Locație",
      enabled: true,
      showInMenu: true
    }
  ],

  // ==========================================================
  // GOOGLE APPS SCRIPT
  // Acesta este URL-ul oficial folosit de site.
  // ==========================================================
  apiUrl:
    "https://script.google.com/macros/s/AKfycbwuZAlb0ur5x2aJTWyP0YbWWxi4f-R--Dc3uj0Y1dbCgv9bYyANEwRfTAE-2GzanRQuqw/exec"
};


/* ==========================================================
   NORMALIZARE CONFIGURAȚIE
========================================================== */

function normalizeConfig(config) {

  config.event = config.event || {};

  config.gallery = config.gallery || {};
  config.gallery.images = Array.isArray(config.gallery.images) ? config.gallery.images : [];
  config.gallery.images = config.gallery.images.map(img => {
    const item = img || {};
    return { src: item.src || "", title: item.title || "", showTitle: item.showTitle !== false };
  });

  if (config.event.heroImage == null) config.event.heroImage = "./assets/images/hero/hero.jpg";

  if (config.event.heroVerse == null) {
    config.event.heroVerse =
      (config.bible && config.bible.text) || "";
  }

  delete config.bible;


  /* ----------------------------------------------------------
     FEATURES
  ---------------------------------------------------------- */

  config.features = config.features || {};

  config.features.titleBefore =
    config.features.titleBefore ||
    config.features.title ||
    "Ce am pregătit?";

  config.features.titleAfter =
    config.features.titleAfter ||
    "Cum a fost?";

  config.features.menuBefore =
    config.features.menuBefore ||
    config.features.titleBefore;

  config.features.menuAfter =
    config.features.menuAfter ||
    config.features.titleAfter;


  /* ----------------------------------------------------------
     COUNTDOWN
  ---------------------------------------------------------- */

  config.countdown = config.countdown || {};

  config.countdown.afterStartHours = Number(config.countdown.afterStartHours || 24);

  if (!config.countdown.afterStart) {
    config.countdown.afterStart =
      config.countdown.hideAfterStart === false
        ? "keep"
        : "hide";
  }

  config.countdown.manualAfterStart =
    !!config.countdown.manualAfterStart;


  /* ----------------------------------------------------------
     STATS
  ---------------------------------------------------------- */

  config.stats = config.stats || {};

  config.stats.afterStart =
    config.stats.afterStart === "keep"
      ? "keep"
      : "hide";

  config.stats.manualAfterStart =
    !!config.stats.manualAfterStart;


  /* ----------------------------------------------------------
     PARTICIPATION
  ---------------------------------------------------------- */

  config.participation =
    config.participation || {};

  config.participation.afterStart =
    config.participation.afterStart === "keep"
      ? "keep"
      : "hide";

  config.participation.manualAfterStart =
    !!config.participation.manualAfterStart;


  /* ----------------------------------------------------------
     FOOD
  ---------------------------------------------------------- */

  config.food = config.food || {};

  config.food.title =
    config.food.title ||
    "Vreau să contribui";

  config.food.autoDisableHoursAfterStart =
    Number(
      config.food.autoDisableHoursAfterStart || 24
    );


  const eventStart = new Date(
    `${config.event.date || ""}T${config.event.time || "00:00"}:00`
  ).getTime();


  if (
    config.food.autoDisabled &&
    Number.isFinite(eventStart) &&
    Date.now() < eventStart
  ) {

    const fm =
      Array.isArray(config.modules)
        ? config.modules.find(
            m => m.id === "food"
          )
        : null;

    if (fm) {
      fm.enabled = true;
    }

    config.food.enabled = true;
    config.food.autoDisabled = false;
    config.food.manualAfterAutoDisable = false;
  }


  config.food.products =
    Array.isArray(config.food.products)
      ? config.food.products
      : [];


  /* ----------------------------------------------------------
     FOOD IDs
  ---------------------------------------------------------- */

  const used = new Set();

  let nextFoodNumber =
    config.food.products.reduce(
      (max, p) => {

        const match =
          String(p.id || "").match(
            /^food_(\d+)$/
          );

        return match
          ? Math.max(
              max,
              Number(match[1])
            )
          : max;
      },
      0
    ) + 1;


  config.food.products.forEach((p) => {

    let id =
      String(p.id || "").trim();

    if (
      !/^food_\d+$/.test(id) ||
      used.has(id)
    ) {

      do {

        id =
          `food_${String(
            nextFoodNumber
          ).padStart(3, "0")}`;

        nextFoodNumber++;

      } while (used.has(id));
    }

    p.id = id;

    used.add(id);
  });


  /* ----------------------------------------------------------
     MODULES
  ---------------------------------------------------------- */

  config.modules =
    Array.isArray(config.modules)
      ? config.modules
      : [];


  const moduleDefaults = {

    countdown: "Countdown",

    memories: "Amintiri",

    features: "Ce am pregătit?",

    gallery: "Galerie",

    participation:
      "Confirmă participarea",

    stats: "Statistici",

    food: "Vreau să contribui",

    location: "Locație"
  };


  config.modules.forEach(m => {

    if (!m.label) {

      m.label =
        moduleDefaults[m.id] ||
        m.id;
    }
  });


  const pm =
    config.modules.find(
      m => m.id === "participation"
    );

  if (pm) {
    pm.showInMenu = false;
  }


  return config;
}


/* ==========================================================
   CITIRE CONFIGURAȚIE
========================================================== */

function getSiteConfig() {

  try {

    const saved =
      localStorage.getItem(
        "destindereConfig"
      );


    if (saved) {

      const config =
        normalizeConfig(
          deepMerge(
            structuredClone(DEFAULT_CONFIG),
            JSON.parse(saved)
          )
        );


      // ======================================================
      // IMPORTANT:
      // apiUrl NU poate fi suprascris de localStorage.
      // Astfel evităm folosirea accidentală a unui URL vechi
      // de Google Apps Script.
      // ======================================================

      config.apiUrl =
        DEFAULT_CONFIG.apiUrl;


      return config;
    }

  } catch (error) {

    console.warn(
      "Configurația locală nu a putut fi încărcată.",
      error
    );
  }


  return normalizeConfig(
    structuredClone(DEFAULT_CONFIG)
  );
}


/* ==========================================================
   DEEP MERGE
========================================================== */

function deepMerge(
  target,
  source
) {

  Object.keys(
    source || {}
  ).forEach((key) => {

    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {

      target[key] =
        deepMerge(
          target[key] || {},
          source[key]
        );

    } else {

      target[key] =
        source[key];
    }

  });

  return target;
}



/* ==========================================================
   CONFIGURAȚIE CENTRALĂ - GOOGLE SHEETS
   V1.8
========================================================== */

let centralConfigPromise = null;

function getLocalCachedConfig() {
  try {
    const saved = localStorage.getItem("destindereConfig");
    if (saved) {
      const config = normalizeConfig(
        deepMerge(structuredClone(DEFAULT_CONFIG), JSON.parse(saved))
      );
      config.apiUrl = DEFAULT_CONFIG.apiUrl;
      return config;
    }
  } catch (error) {
    console.warn("Cache-ul local nu a putut fi încărcat.", error);
  }
  return normalizeConfig(structuredClone(DEFAULT_CONFIG));
}

async function fetchCentralConfig() {
  const url = `${DEFAULT_CONFIG.apiUrl}?type=config&_=${Date.now()}`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Config central HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data || data.success !== true) {
    throw new Error(data?.message || "Configurația centrală nu este disponibilă.");
  }

  return data;
}

async function saveCentralConfig(config, updatedBy) {
  const payload = normalizeConfig(
    deepMerge(structuredClone(DEFAULT_CONFIG), config || {})
  );

  payload.apiUrl = DEFAULT_CONFIG.apiUrl;

  const formData = new URLSearchParams();
  formData.append("action", "saveConfig");
  formData.append("config", JSON.stringify(payload));
  formData.append("updatedBy", updatedBy || "");

  const response = await fetch(DEFAULT_CONFIG.apiUrl, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Salvarea configurației a eșuat: HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data || data.success !== true) {
    throw new Error(data?.message || "Google Sheets nu a acceptat configurația.");
  }

  const savedConfig = normalizeConfig(
    deepMerge(structuredClone(DEFAULT_CONFIG), data.config || payload)
  );

  savedConfig.apiUrl = DEFAULT_CONFIG.apiUrl;

  try {
    localStorage.setItem("destindereConfig", JSON.stringify(savedConfig));
  } catch (error) {
    console.warn("Configurația a fost salvată central, dar cache-ul local nu a putut fi actualizat.", error);
  }

  window.CONFIG = savedConfig;
  window.CONFIG_VERSION = Number(data.version || 0);

  return {
    config: savedConfig,
    version: window.CONFIG_VERSION,
    updatedAt: data.updatedAt || "",
    updatedBy: data.updatedBy || ""
  };
}

async function loadCentralConfig(options = {}) {
  if (centralConfigPromise && !options.force) {
    return centralConfigPromise;
  }

  centralConfigPromise = (async () => {
    const fallback = getLocalCachedConfig();

    try {
      const data = await fetchCentralConfig();

      if (data.config && typeof data.config === "object") {
        const remote = normalizeConfig(
          deepMerge(structuredClone(DEFAULT_CONFIG), data.config)
        );

        remote.apiUrl = DEFAULT_CONFIG.apiUrl;

        try {
          localStorage.setItem("destindereConfig", JSON.stringify(remote));
        } catch (error) {
          console.warn("Cache-ul local nu a putut fi actualizat.", error);
        }

        window.CONFIG = remote;
        window.CONFIG_VERSION = Number(data.version || 0);
        window.CONFIG_UPDATED_AT = data.updatedAt || "";
        window.CONFIG_UPDATED_BY = data.updatedBy || "";

        return remote;
      }

      if (options.bootstrapIfMissing) {
        const user = (() => {
          try {
            return JSON.parse(localStorage.getItem("destindereUser") || "null");
          } catch {
            return null;
          }
        })();

        const saved = await saveCentralConfig(
          fallback,
          user?.id || ""
        );

        return saved.config;
      }

      window.CONFIG = fallback;
      window.CONFIG_VERSION = 0;
      return fallback;

    } catch (error) {
      console.warn(
        "Configurația centrală nu este disponibilă. Se folosește cache-ul local.",
        error
      );

      window.CONFIG = fallback;
      window.CONFIG_VERSION = 0;
      return fallback;
    }
  })();

  try {
    return await centralConfigPromise;
  } catch (error) {
    centralConfigPromise = null;
    throw error;
  }
}

async function refreshCentralConfigIfChanged() {
  try {
    const data = await fetchCentralConfig();
    const remoteVersion = Number(data.version || 0);
    const currentVersion = Number(window.CONFIG_VERSION || 0);

    if (
      data.config &&
      remoteVersion > 0 &&
      currentVersion > 0 &&
      remoteVersion !== currentVersion
    ) {
      return true;
    }
  } catch (error) {
    console.warn("Verificarea configurației centrale a eșuat.", error);
  }

  return false;
}

function startCentralConfigWatcher(intervalMs = 60000) {
  if (window.__destindereConfigWatcher) {
    clearInterval(window.__destindereConfigWatcher);
  }

  window.__destindereConfigWatcher = setInterval(async () => {
    const changed = await refreshCentralConfigIfChanged();

    if (changed) {
      window.location.reload();
    }
  }, intervalMs);
}

/* ==========================================================
   CONFIG GLOBAL
========================================================== */

window.CONFIG = getSiteConfig();
window.CONFIG_VERSION = 0;
window.CONFIG_UPDATED_AT = "";
window.CONFIG_UPDATED_BY = "";
