(async function(){
  const cfg=await loadCentralConfig();
  startCentralConfigWatcher(60000);
  const app=document.getElementById("app");
  const nav=document.getElementById("mainNav");
  const esc=v=>String(v??"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));
  const attr=v=>esc(v).replace(/'/g,"&#39;");
  const eventStarted=()=>{const t=new Date(`${cfg.event.date}T${cfg.event.time||"00:00"}:00`).getTime();return Date.now()>=t};
  const moduleEnabled=id=>{
    const m=cfg.modules.find(x=>x.id===id);
    if(!m||!m.enabled)return false;
    const started=eventStarted();
    if(!started)return true;
    if(id==="countdown") return cfg.countdown.afterStart!=="hide" || !!cfg.countdown.manualAfterStart;
    if(id==="stats") return cfg.stats.afterStart!=="hide" || !!cfg.stats.manualAfterStart;
    if(id==="participation"){const mode=cfg.participation.visibility||"untilEvent";if(mode==="alwaysOff")return false;return cfg.participation.afterStart!=="hide" || !!cfg.participation.manualAfterStart;}
    if(id==="food"){const cutoff=new Date(`${cfg.event.date}T${cfg.event.time||"00:00"}:00`).getTime()+Number(cfg.food.autoDisableHoursAfterStart||24)*3600000;return Date.now()<cutoff || !!cfg.food.manualAfterAutoDisable;}
    return true;
  };
  const enabledModules=[...cfg.modules].filter(m=>m.id!=="hero" && moduleEnabled(m.id));
  const section=(id,cl,inner)=>`<section class="${cl}" id="${id}"><div class="container">${inner}</div></section>`;

  function renderHero(){
    const verse=cfg.event.heroVerse?`<p class="hero-bible-ref">${esc(cfg.event.heroVerse)}</p>`:"";
    const participationButton=moduleEnabled("participation")?`<div class="hero-action"><a class="btn hero-participation-btn" href="#register">${esc(cfg.participation.buttonText||"Confirmă participarea")}</a></div>`:"";
    const heroImage=cfg.event.heroImage||"";
    const heroStyle=heroImage?` style="background-image:linear-gradient(rgba(20,20,20,.45),rgba(20,20,20,.45)),url('${attr(heroImage)}')"`:"";
    return `<section class="hero" id="home"${heroStyle}><div class="container"><h2>${esc(formatDate(cfg.event.date))}</h2><h1>${esc(cfg.event.heroTitle)}</h1><h2>${esc(cfg.event.heroSubtitle)}</h2>${verse}${participationButton}</div></section>`;
  }
  function renderCountdown(){
    return section("countdown","countdown",`<h2 class="section-title">${esc(cfg.countdown.title)}</h2><div class="countdown-grid"><div class="countdown-card"><span id="days">00</span><small>Zile</small></div><div class="countdown-card"><span id="hours">00</span><small>Ore</small></div><div class="countdown-card"><span id="minutes">00</span><small>Minute</small></div><div class="countdown-card"><span id="seconds">00</span><small>Secunde</small></div></div>`);
  }
  function renderMemories(){
    return section("memories","memories",`<h2 class="section-title">${esc(cfg.memories.title)}</h2><p class="memories-text">${esc(cfg.memories.text)}</p><div class="upload-card"><div class="upload-icon">📸</div><h3>Încarcă fotografii și videoclipuri</h3><p>Fotografii până la 10 MB și videoclipuri până la 50 MB.</p><label for="memoryFiles" class="upload-button">📁 Selectează fișiere</label><input type="file" id="memoryFiles" accept="image/*,video/*" multiple hidden><div id="selectedFiles"></div><button type="button" id="uploadMemories" class="btn upload-submit" disabled>Încarcă</button><div id="uploadStatus"></div><div id="uploadProgressContainer" style="display:none"><div id="uploadProgressBar"></div></div><div id="uploadProgressText"></div></div>`);
  }
  function renderFeatures(){
    const started=eventStarted();
    const title=started?(cfg.features.titleAfter||"Cum a fost?"):(cfg.features.titleBefore||"Ce am pregătit?");
    return section("event","features",`<h2 class="section-title">${esc(title)}</h2><div class="features-grid">${cfg.features.items.filter(x=>x.enabled).map(x=>`<div class="feature-card"><div class="icon">${esc(x.icon)}</div><h3>${esc(x.title)}</h3></div>`).join("")}</div>`);
  }
  function renderGallery(){
    const imgs=cfg.gallery.images.map((x,i)=>{
      const has=!!x.src;
      return `<div class="gallery-card ${has?"":"gallery-placeholder-card"}">${has?`<img src="${attr(x.src)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">`:""}<div class="gallery-missing" style="display:${has?"none":"grid"}"><span>🖼️</span><small>Imagine indisponibilă</small></div>${has&&x.showTitle!==false&&x.title?`<div class="gallery-title">${esc(x.title)}</div>`:""}</div>`;
    }).join("");
    const drive=cfg.gallery.driveEnabled&&cfg.gallery.driveUrl?`<div class="gallery-drive"><a href="${attr(cfg.gallery.driveUrl)}" target="_blank" rel="noopener noreferrer" class="btn">${esc(cfg.gallery.driveText)}</a></div>`:"";
    return section("gallery","gallery",`<h2 class="section-title">${esc(cfg.gallery.title)}</h2><div class="gallery-grid">${imgs}</div>${drive}`);
  }
  function renderParticipation(){
    const f=cfg.participation.fields;
    const choices=cfg.food.products.filter(p=>p.enabled!==false).map(p=>`<option value="${attr(p.id)}" data-product-name="${attr(p.name)}">${esc(p.name)}</option>`).join("");
    let products="";
    if(f.products){for(let i=1;i<=Math.max(0,cfg.participation.productRows||2);i++)products+=`<div class="product-row"><select name="productId${i}" data-product-select="${i}"><option value="">${i===1?"Ce dorești să aduci?":"Ce dorești să mai aduci?"}</option>${choices}</select><input type="hidden" name="ceAduce${i}" value=""><input type="text" name="cantitate${i}" inputmode="decimal" autocomplete="off" placeholder="Cantitate (ex. 2 kg)"></div>`;}
    return `<section class="register" id="register"><div class="container"><h2 class="section-title">${esc(cfg.participation.title)}</h2><p style="text-align:center;margin-bottom:20px">${esc(cfg.participation.description)}</p><form id="registrationForm">${f.name?`<select id="guestSelect" name="nume_complet" required><option value="">Se încarcă lista...</option></select>`:""}${f.participation?`<select name="participa" required><option value="">Particip?</option><option value="Da">Da</option><option value="Nu">Nu</option></select>`:""}${f.persons?`<select name="persoane" required><option value="">Număr persoane</option>${Array.from({length:10},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join("")}</select>`:""}${products}${f.notes?`<textarea name="observatii" rows="5" placeholder="Informații suplimentare"></textarea>`:""}<button type="submit">${esc(cfg.participation.buttonText)}</button></form></div></section>`;
  }
  function renderStats(){
    return section("stats","stats",`<h2 class="section-title">${esc(cfg.stats.title)}</h2><div class="stats-grid">${cfg.stats.cards.filter(x=>x.enabled).map(x=>`<div class="stat-card"><h3>${esc(x.label)}</h3><span id="${attr(x.id)}">0</span></div>`).join("")}</div>`);
  }
  function renderFood(){
    const products=cfg.food.products.filter(p=>p.enabled!==false);
    const cards=products.map((p,index)=>`
      <article class="food-card" data-product-id="${attr(p.id||"")}" data-product-name="${attr(p.name)}" data-product-index="${index}">
        <div class="food-card-icon" aria-hidden="true">${esc(p.icon || "🍂")}</div>
        <div class="food-card-content">
          <h3>${esc(p.name)}</h3>
          <p class="food-required-text">Necesar: ${esc(p.required)} ${esc(p.unit)}</p>
          <div class="food-card-bottom">
            <span class="food-progress-label">PROGRES</span>
            <strong class="food-progress-number">0 / ${esc(p.required)} ${esc(p.unit)}</strong>
          </div>
          <div class="food-progress" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" aria-label="Progres ${attr(p.name)}">
            <div class="food-progress-bar" style="width:0%"></div>
          </div>
        </div>
      </article>`).join("");
    return section("food","food",`<h2 class="section-title">${esc(cfg.food.title)}</h2>${cfg.food.description?`<p class="food-description">${esc(cfg.food.description)}</p>`:""}<div id="foodProgress" class="food-grid">${cards}</div>`);
  }
  function renderLocation(){return section("location","location",`<h2 class="section-title">${esc(cfg.location.title)}</h2><p style="text-align:center;margin-bottom:20px">${esc(cfg.location.name)}</p><div class="map"><iframe src="${attr(cfg.location.mapUrl)}" width="100%" height="460" style="border:0" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`)}

  const renderers={hero:renderHero,countdown:renderCountdown,memories:renderMemories,features:renderFeatures,gallery:renderGallery,participation:renderParticipation,stats:renderStats,food:renderFood,location:renderLocation};
  app.innerHTML=renderHero()+enabledModules.map(m=>renderers[m.id]?renderers[m.id]() : "").join("");

  const navItems=[{id:"home",label:"Acasă"}].concat(enabledModules.filter(m=>m.showInMenu!==false && !["hero","countdown","participation"].includes(m.id)).map(m=>({id:m.id==="features"?"event":m.id,label:m.label})));
  nav.innerHTML=navItems.map(x=>`<li><a href="#${x.id}">${esc(x.label)}</a></li>`).join("");
  document.title=`${cfg.event.name} • ${cfg.event.congregation}`;
  const ft=document.getElementById("footerText");if(ft){ft.textContent=cfg.event.footer;const loginLink=document.createElement("a");loginLink.className="admin-login-link";loginLink.href="login.html";loginLink.textContent="Login";try{const u=JSON.parse(localStorage.getItem("destindereUser")||"null");if(u&&u.id){loginLink.href="admin.html";loginLink.textContent="Înapoi la Admin";}}catch(e){}ft.appendChild(document.createTextNode(" · "));ft.appendChild(loginLink);}
  const logo=document.getElementById("navLogo");if(logo)logo.textContent=`🍂 ${cfg.event.congregation.replace("Congregația ","")}`;
  document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener("click",e=>{const t=document.querySelector(link.getAttribute("href"));if(t){e.preventDefault();t.scrollIntoView({behavior:"smooth"})}}));
  if(moduleEnabled("countdown")&&cfg.countdown.enabled&&document.getElementById("countdown"))startCountdown();

  // Trecerea în starea „după eveniment” se aplică și dacă pagina a rămas deschisă.
  function applyPostEventState(){
    if(!eventStarted()) return;
    ["countdown","stats","participation","food"].forEach(id=>{
      if(!moduleEnabled(id)){
        const el=document.getElementById(id==="participation"?"register":id); if(el)el.remove();
        const hash=id==="participation"?"register":id; const link=document.querySelector(`#mainNav a[href="#${hash}"]`); if(link)link.closest("li")?.remove();
        if(id==="participation")document.querySelector(".hero-participation-btn")?.remove();
      }
    });
    const featureTitle=document.querySelector("#event .section-title");
    if(featureTitle)featureTitle.textContent=cfg.features.titleAfter||"Cum a fost?";
    const eventLink=document.querySelector('#mainNav a[href="#event"]');
    if(eventLink)eventLink.textContent=cfg.modules.find(m=>m.id==="features")?.label||cfg.features.titleAfter||"Cum a fost?";
    if(moduleEnabled("food"))scheduleFoodAutoDisable();
  }

  function scheduleFoodAutoDisable(){
    const cutoff=new Date(`${cfg.event.date}T${cfg.event.time||"00:00"}:00`).getTime()+Number(cfg.food.autoDisableHoursAfterStart||24)*3600000;
    const delay=cutoff-Date.now();
    if(delay<=0){ disableFoodNow(); return; }
    setTimeout(disableFoodNow,delay+100);
  }
  function disableFoodNow(){
    if(cfg.food.manualAfterAutoDisable)return;
    const foodModule=cfg.modules.find(m=>m.id==="food");
    if(foodModule && !foodModule.enabled && !cfg.food.autoDisabled)return;
    cfg.food.autoDisabled=true;
    cfg.food.enabled=false;
    if(foodModule) foodModule.enabled=false;
    try{localStorage.setItem("destindereConfig",JSON.stringify(cfg));}catch(e){}
    const section=document.getElementById("food");
    if(section) section.remove();
    const link=document.querySelector('#mainNav a[href="#food"]');
    if(link) link.closest("li")?.remove();
  }
  document.querySelectorAll("select[data-product-select]").forEach(select=>select.addEventListener("change",()=>{const n=select.dataset.productSelect;const option=select.options[select.selectedIndex];const hidden=document.querySelector(`input[name="ceAduce${n}"]`);const quantity=document.querySelector(`input[name="cantitate${n}"]`);if(hidden) hidden.value=option?.dataset.productName||"";if(quantity){const productId=option?.value||"";const product=cfg.food.products.find(p=>String(p.id)===String(productId));quantity.placeholder=product?.unit?`Cantitate (ex. 2 ${product.unit})`:"Cantitate (ex. 2 kg)";}}));

  const eventTarget=new Date(`${cfg.event.date}T${cfg.event.time||"00:00"}:00`).getTime();
  const countdownCutoff=eventTarget+Number(cfg.countdown.afterStartHours||24)*3600000;
  if(eventTarget>Date.now()) setTimeout(applyPostEventState, Math.max(0,eventTarget-Date.now()+250));
  if(countdownCutoff>Date.now()) setTimeout(applyPostEventState, Math.max(0,countdownCutoff-Date.now()+250));
  if(eventStarted()) scheduleFoodAutoDisable();
  else setTimeout(scheduleFoodAutoDisable, Math.max(0,eventTarget-Date.now()+250));

  function startCountdown(){
    const target=new Date(`${cfg.event.date}T${cfg.event.time||"00:00"}:00`).getTime();
    const cutoff=target+Number(cfg.countdown.afterStartHours||24)*3600000;
    const root=document.getElementById("countdown");
    if(!root)return;
    let timer=null;
    function hideCountdown(){
      root.remove();
      const link=document.querySelector('#mainNav a[href="#countdown"]');
      if(link) link.closest("li")?.remove();
      if(timer)clearInterval(timer);
    }
    function tick(){
      const now=Date.now();
      if(now>=cutoff && !cfg.countdown.manualAfterStart){hideCountdown();return;}
      const d=target-now;
      if(d<=0){
        root.querySelector(".container").innerHTML=`<div class="countdown-card" style="grid-column:1/-1"><h2>${esc(cfg.countdown.startedMessage||"Evenimentul a început.")}</h2></div>`;
        return;
      }
      set("days",Math.floor(d/86400000));set("hours",Math.floor(d/3600000)%24);set("minutes",Math.floor(d/60000)%60);set("seconds",Math.floor(d/1000)%60);
    }
    tick();
    timer=setInterval(tick,1000);
  }
  function set(id,n){const e=document.getElementById(id);if(e)e.textContent=String(n).padStart(2,"0")}
  function formatDate(v){return v?new Intl.DateTimeFormat("ro-RO",{day:"numeric",month:"long",year:"numeric"}).format(new Date(`${v}T12:00:00`)):""}
})();
