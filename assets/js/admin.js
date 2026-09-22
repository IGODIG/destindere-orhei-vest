(function(){
  let currentUser = null;
  try {
    const saved = localStorage.getItem("destindereUser");
    if (saved) currentUser = JSON.parse(saved);
  } catch (e) {
    currentUser = null;
  }

  if (!currentUser || !currentUser.id) {
    window.location.replace("login.html");
    return;
  }

  const clone=o=>structuredClone(o), $=id=>document.getElementById(id);

  const adminUserName = $("adminUserName");
  const adminUserCongregation = $("adminUserCongregation");
  if (adminUserName) adminUserName.textContent = `${currentUser.prenume || ""} ${currentUser.nume || ""}`.trim();
  if (adminUserCongregation) adminUserCongregation.textContent = currentUser.congregatie || "";

  $("logoutAdmin")?.addEventListener("click", () => {
    localStorage.removeItem("destindereUser");
    window.location.replace("login.html");
  });
  let cfg=clone(DEFAULT_CONFIG);
  cfg=normalizeConfig(cfg);
  let events=[];
  let currentEvent=null;

  const toLocalDateTime = value => {
    if(!value) return "";
    const d=new Date(value);
    if(Number.isNaN(d.getTime())) return "";
    const pad=n=>String(n).padStart(2,"0");
    return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+"T"+pad(d.getHours())+":"+pad(d.getMinutes());
  };
  const fromLocalDateTime = value => value ? new Date(value).toISOString() : "";

  async function selectEvent(eventId){
    const event=await fetchEvent(eventId);
    currentEvent=event;
    cfg=normalizeConfig(deepMerge(clone(DEFAULT_CONFIG),event.config||{}));
    cfg.event.eventId=event.id;
    normalizeModules();
    applyFoodAutoState();
    renderEventManager();
    render();
  }

  function renderEventManager(){
    const selector=$("eventSelector"), list=$("eventsList");
    if(selector){
      selector.innerHTML=events.map(e=>"<option value=\""+escAttr(e.id)+"\">"+esc(e.name)+" • "+esc(e.status)+"</option>").join("");
      if(currentEvent) selector.value=currentEvent.id;
      selector.onchange=()=>selectEvent(selector.value).catch(err=>alert(err.message));
    }
    if(currentEvent){
      val("eventStatus",currentEvent.storedStatus||currentEvent.status||"PLANIFICAT");
      val("activeFrom",toLocalDateTime(currentEvent.activeFrom));
      val("activeUntil",toLocalDateTime(currentEvent.activeUntil));
    }
    if(list){
      list.innerHTML=events.map(e=>"<div class=\"event-manager-row\"><div><strong>"+esc(e.name)+"</strong><small>"+esc(e.date||"")+" "+esc(e.time||"")+" • "+esc(e.location||"")+"</small></div><span>"+e.status+"</span><button type=\"button\" data-event-open=\""+escAttr(e.id)+"\">👁 Vezi</button></div>").join("");
      list.querySelectorAll("[data-event-open]").forEach(btn=>btn.onclick=()=>selectEvent(btn.dataset.eventOpen).catch(err=>alert(err.message)));
    }
  }

  async function loadEventList(){
    events=await fetchEvents();
    if(!events.length){
      cfg=await loadCentralConfig({bootstrapIfMissing:true});
      currentEvent={id:"",name:cfg.event.name,status:"ACTIV",storedStatus:"ACTIV",activeFrom:"",activeUntil:"",config:cfg};
      normalizeModules();
      applyFoodAutoState();
      renderEventManager();
      render();
      return;
    }
    const active=events.find(e=>e.status==="ACTIV")||events[0];
    await selectEvent(active.id);
  }

  const MODULE_IDS=["countdown","memories","features","gallery","participation","stats","food","location"];
  const META={
    countdown:["⏱","Countdown"], memories:["🖼","Amintiri / Adaugă poze"], features:["✨","Ce am pregătit? / Cum a fost?"],
    gallery:["📸","Galerie"], participation:["👥","Confirmă participarea"], stats:["📊","Statistici"],
    food:["🍎","Vreau să contribui"], location:["📍","Locație"]
  };
  const val=(id,v)=>{const e=$(id);if(e)e.value=v??""};
  function syncHeroPreview(){const input=$("heroImage"),thumb=$("heroImagePreview"),ph=$("heroImagePlaceholder");if(!input||!thumb||!ph)return;const src=input.value.trim();if(!src){thumb.style.display="none";ph.style.display="grid";return;}thumb.onload=()=>{thumb.style.display="block";ph.style.display="none"};thumb.onerror=()=>{thumb.style.display="none";ph.style.display="grid"};thumb.src=src;}
  const checked=(id,v)=>{const e=$(id);if(e)e.checked=!!v};
  const getModule=id=>cfg.modules.find(m=>m.id===id);
  const syncLegacyEnabled=()=>{
    const map={countdown:"countdown",memories:"memories",features:"features",gallery:"gallery",participation:"participation",stats:"stats",food:"food",location:"location"};
    Object.entries(map).forEach(([id,key])=>{const m=getModule(id);if(m&&cfg[key])cfg[key].enabled=!!m.enabled});
  };
  function normalizeModules(){
    const existing=Array.isArray(cfg.modules)?cfg.modules:[];
    const byId=new Map(existing.map(m=>[m.id,m]));
    cfg.modules=MODULE_IDS.map(id=>{const m=byId.get(id)||{id,label:META[id][1],enabled:true,showInMenu:id!=="countdown"};if(!m.label)m.label=META[id][1];return m;});
    syncLegacyEnabled();
  }
  function eventStarted(){return Date.now()>=new Date(`${cfg.event.date}T${cfg.event.time||"00:00"}:00`).getTime();}
  function effectiveModuleEnabled(id){
    const m=getModule(id); if(!m||!m.enabled)return false;
    if(!eventStarted())return true;
    if(id==="countdown") return cfg.countdown.afterStart!=="hide" || !!cfg.countdown.manualAfterStart;
    if(id==="stats") return cfg.stats.afterStart!=="hide" || !!cfg.stats.manualAfterStart;
    if(id==="participation") { if((cfg.participation.visibility||"untilEvent")==="alwaysOff")return false; return cfg.participation.afterStart!=="hide" || !!cfg.participation.manualAfterStart; }
    if(id==="food") { const cutoff=new Date(`${cfg.event.date}T${cfg.event.time||"00:00"}:00`).getTime()+Number(cfg.food.autoDisableHoursAfterStart||24)*3600000; return Date.now()<cutoff || !!cfg.food.manualAfterAutoDisable; }
    return true;
  }
  normalizeModules();
  function applyFoodAutoState(){
    const m=getModule("food");
    if(!m) return;
    const start=new Date(`${cfg.event.date}T${cfg.event.time||"00:00"}:00`).getTime();
    const cutoff=start + Number(cfg.food.autoDisableHoursAfterStart||24)*3600000;
    if(Date.now() < start){
      if(cfg.food.autoDisabled){ m.enabled=true; cfg.food.enabled=true; cfg.food.autoDisabled=false; cfg.food.manualAfterAutoDisable=false; }
      return;
    }
    if(Date.now() >= cutoff && !cfg.food.manualAfterAutoDisable){ m.enabled=false; cfg.food.enabled=false; cfg.food.autoDisabled=true; }
  }
  applyFoodAutoState();

  function render(){
    val("eventName",cfg.event.name);val("congregation",cfg.event.congregation);val("eventDate",cfg.event.date);val("eventTime",cfg.event.time);val("eventLocation",cfg.event.location);val("heroTitle",cfg.event.heroTitle);val("heroSubtitle",cfg.event.heroSubtitle);val("heroVerse",cfg.event.heroVerse);val("heroImage",cfg.event.heroImage);val("footerText",cfg.event.footer);
    val("countdownTitle",cfg.countdown.title);val("startedMessage",cfg.countdown.startedMessage);
    val("galleryTitle",cfg.gallery.title);checked("driveEnabled",cfg.gallery.driveEnabled);val("driveText",cfg.gallery.driveText);val("driveUrl",cfg.gallery.driveUrl);
    val("featuresTitleBefore",cfg.features.titleBefore);val("featuresTitleAfter",cfg.features.titleAfter);val("featuresMenuBefore",cfg.features.menuBefore);val("featuresMenuAfter",cfg.features.menuAfter);val("memoriesTitle",cfg.memories.title);val("memoriesText",cfg.memories.text);
    val("locationTitle",cfg.location.title);val("locationName",cfg.location.name);val("mapUrl",cfg.location.mapUrl);
    val("participationTitle",cfg.participation.title);val("participationDescription",cfg.participation.description);val("participationButtonText",cfg.participation.buttonText);val("participationProductRows",cfg.participation.productRows);val("participationVisibility",cfg.participation.visibility||"manual");
    Object.entries(cfg.participation.fields).forEach(([k,v])=>checked({name:"fieldName",participation:"fieldParticipation",persons:"fieldPersons",products:"fieldProducts",notes:"fieldNotes"}[k],v));
    val("statsTitle",cfg.stats.title);val("statsAfterStart",cfg.stats.afterStart||"hide");val("participationAfterStart",cfg.participation.afterStart||"hide");val("foodTitle",cfg.food.title);val("foodDescription",cfg.food.description||"");checked("foodHideCompleted",cfg.food.hideCompleted);
    syncHeroPreview();syncPanelOrder();syncPanelHeaders();renderGallery();renderFeatures();renderFood();renderStats();updateParticipationHint();bindAccordion();bindSortable();
  }

  function syncPanelOrder(){
    const wrap=$("settingsPanels");if(!wrap)return;
    const panels=[...wrap.querySelectorAll(":scope > .accordion")];
    const rank=new Map(cfg.modules.map((m,i)=>[m.id,i]));
    panels.sort((a,b)=>(rank.get(a.dataset.panel)??999)-(rank.get(b.dataset.panel)??999)).forEach(p=>wrap.appendChild(p));
  }
  function syncPanelHeaders(){
    cfg.modules.forEach(m=>{
      const panel=document.querySelector(`.accordion[data-panel="${m.id}"]`);if(!panel)return;
      const effective=effectiveModuleEnabled(m.id);
      panel.classList.toggle("module-inactive",!effective);
      const status=panel.querySelector(".module-status");
      if(status){status.textContent=effective?"● ACTIV":"○ INACTIV";status.classList.toggle("is-off",!effective);}
      const menu=panel.querySelector(`[data-menu-for="${m.id}"]`);if(menu)menu.checked=effective && m.showInMenu!==false;
      const input=panel.querySelector(`[data-label-for="${m.id}"]`);if(input)input.value=m.label||"";
      const title=panel.querySelector(".accordion-head strong");if(title)title.textContent=m.label||META[m.id]?.[1]||m.id;
      panel.draggable=true;
    });
  }
  function bindAccordion(){
    document.querySelectorAll(".accordion-head").forEach(btn=>{
      if(btn.dataset.bound)return;btn.dataset.bound="1";
      btn.addEventListener("click",e=>{
        if(e.target.closest(".module-status,.menu-toggle"))return;
        btn.closest(".accordion").classList.toggle("open");
      });
    });
    document.querySelectorAll(".module-status").forEach(status=>{
      if(status.dataset.bound)return;status.dataset.bound="1";
      status.addEventListener("click",e=>{e.stopPropagation();const id=status.dataset.statusFor;const m=getModule(id);if(!m)return;const wasEffective=effectiveModuleEnabled(id);m.enabled=!wasEffective;if(m.enabled && eventStarted()){if(id==="countdown")cfg.countdown.manualAfterStart=true;if(id==="stats")cfg.stats.manualAfterStart=true;if(id==="participation")cfg.participation.manualAfterStart=true;if(id==="food"){cfg.food.manualAfterAutoDisable=true;cfg.food.autoDisabled=false;}}else{if(id==="countdown")cfg.countdown.manualAfterStart=false;if(id==="stats")cfg.stats.manualAfterStart=false;if(id==="participation")cfg.participation.manualAfterStart=false;if(id==="food"){cfg.food.manualAfterAutoDisable=false;cfg.food.autoDisabled=false;}}syncLegacyEnabled();syncPanelHeaders();});
    });
    document.querySelectorAll(".menu-toggle").forEach(label=>{
      if(label.dataset.bound)return;label.dataset.bound="1";
      label.addEventListener("click",e=>e.stopPropagation());
      const input=label.querySelector("input");
      input?.addEventListener("change",e=>{const id=input.dataset.menuFor;const m=getModule(id);if(m)m.showInMenu=e.target.checked;});
    });
  }
  function bindSortable(){
    const wrap=$("settingsPanels");if(!wrap||wrap.dataset.sortBound)return;wrap.dataset.sortBound="1";
    let dragging=null;
    wrap.querySelectorAll(":scope > .accordion").forEach(panel=>{
      panel.addEventListener("dragstart",e=>{dragging=panel;panel.classList.add("dragging-module");e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",panel.dataset.panel);});
      panel.addEventListener("dragend",()=>{panel.classList.remove("dragging-module");dragging=null;wrap.querySelectorAll(".drag-over-module").forEach(x=>x.classList.remove("drag-over-module"));});
      panel.addEventListener("dragover",e=>{e.preventDefault();if(!dragging||dragging===panel)return;panel.classList.add("drag-over-module");});
      panel.addEventListener("dragleave",()=>panel.classList.remove("drag-over-module"));
      panel.addEventListener("drop",e=>{e.preventDefault();panel.classList.remove("drag-over-module");if(!dragging||dragging===panel)return;const rect=panel.getBoundingClientRect();const before=e.clientY<rect.top+rect.height/2;wrap.insertBefore(dragging,before?panel:panel.nextSibling);syncOrderFromDOM();});
    });
  }
  function syncOrderFromDOM(){
    const ids=[...$("settingsPanels").querySelectorAll(":scope > .accordion")].map(p=>p.dataset.panel);const byId=new Map(cfg.modules.map(m=>[m.id,m]));cfg.modules=ids.map(id=>byId.get(id)).filter(Boolean);syncLegacyEnabled();}

  function renderGallery(){
    const box=$("galleryList");if(!box)return;
    box.innerHTML=cfg.gallery.images.map((x,i)=>`<div class="gallery-card-editor"><span class="row-drag">☰</span><div class="gallery-thumb-wrap"><img class="gallery-thumb" src="${escAttr(x.src)}" alt=""><span class="gallery-placeholder">🖼️</span></div><input class="img-src" placeholder="Imagine / cale" value="${esc(x.src)}"><input class="img-title" placeholder="Titlu" value="${esc(x.title)}"><label class="switch-line gallery-title-toggle"><input type="checkbox" class="img-show-title" ${x.showTitle!==false?"checked":""}><span class="switch"></span><span>Afișează titlul</span></label><button class="remove-btn remove-img" data-i="${i}" type="button">×</button></div>`).join("");
    box.querySelectorAll(".gallery-card-editor").forEach((r,i)=>{const thumb=r.querySelector(".gallery-thumb"),ph=r.querySelector(".gallery-placeholder");const sync=()=>{const has=!!cfg.gallery.images[i].src;if(has){thumb.style.display="block";ph.style.display="none";thumb.src=cfg.gallery.images[i].src}else{thumb.style.display="none";ph.style.display="grid"}};r.querySelector(".img-src").oninput=e=>{cfg.gallery.images[i].src=e.target.value;sync()};thumb.onerror=()=>{thumb.style.display="none";ph.style.display="grid"};r.querySelector(".img-title").oninput=e=>cfg.gallery.images[i].title=e.target.value;r.querySelector(".img-show-title").onchange=e=>cfg.gallery.images[i].showTitle=e.target.checked;r.querySelector(".remove-img").onclick=()=>{cfg.gallery.images.splice(i,1);renderGallery()};sync();});
  }
  function renderFeatures(){
    const box=$("featuresList");if(!box)return;box.innerHTML=cfg.features.items.map((x,i)=>`<div class="feature-row"><span class="row-drag">☰</span><input class="feature-icon" value="${esc(x.icon)}"><input class="feat-title" value="${esc(x.title)}" placeholder="Titlu element"><label class="switch-line"><input type="checkbox" class="feat-check" ${x.enabled!==false?"checked":""}><span class="switch"></span></label><button class="remove-btn remove-feature" type="button">×</button></div>`).join("");box.querySelectorAll(".feature-row").forEach((r,i)=>{r.querySelector(".feat-check").onchange=e=>cfg.features.items[i].enabled=e.target.checked;r.querySelector(".feature-icon").oninput=e=>cfg.features.items[i].icon=e.target.value;r.querySelector(".feat-title").oninput=e=>cfg.features.items[i].title=e.target.value;r.querySelector(".remove-feature").onclick=()=>{cfg.features.items.splice(i,1);renderFeatures()}});
  }
  function renderFood(){
    const box=$("foodList");if(!box)return;
    box.innerHTML=cfg.food.products.map((x,i)=>`<div class="food-row" draggable="true" data-food-id="${escAttr(x.id)}"><span class="row-drag">☰</span><input class="food-icon" value="${esc(x.icon)}" title="Icon"><input class="food-name" value="${esc(x.name)}" placeholder="Produs"><input class="food-required" type="number" min="0" step="0.1" value="${esc(x.required)}" placeholder="Necesar"><input class="food-unit" value="${esc(x.unit)}" placeholder="Unitate"><label class="switch-line food-active" title="Produs activ"><input type="checkbox" class="food-check" ${x.enabled!==false?"checked":""}><span class="switch"></span></label><button class="remove-btn remove-food" type="button">×</button></div>`).join("");
    box.querySelectorAll(".food-row").forEach((r,i)=>{
      r.querySelector(".food-icon").oninput=e=>cfg.food.products[i].icon=e.target.value;
      r.querySelector(".food-name").oninput=e=>cfg.food.products[i].name=e.target.value;
      r.querySelector(".food-required").oninput=e=>cfg.food.products[i].required=Number(e.target.value||0);
      r.querySelector(".food-unit").oninput=e=>cfg.food.products[i].unit=e.target.value;
      r.querySelector(".food-check").onchange=e=>cfg.food.products[i].enabled=e.target.checked;
      r.querySelector(".remove-food").onclick=()=>{cfg.food.products.splice(i,1);renderFood()};
      r.addEventListener("dragstart",e=>{r.classList.add("dragging-food");e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",x.id)});
      r.addEventListener("dragend",()=>{r.classList.remove("dragging-food");box.querySelectorAll(".drag-over-food").forEach(el=>el.classList.remove("drag-over-food"));});
      r.addEventListener("dragover",e=>{e.preventDefault();r.classList.add("drag-over-food")});
      r.addEventListener("dragleave",()=>r.classList.remove("drag-over-food"));
      r.addEventListener("drop",e=>{e.preventDefault();r.classList.remove("drag-over-food");const fromId=e.dataTransfer.getData("text/plain");if(!fromId||fromId===x.id)return;const fromIndex=cfg.food.products.findIndex(p=>p.id===fromId);if(fromIndex<0)return;const [moved]=cfg.food.products.splice(fromIndex,1);const targetIndex=cfg.food.products.findIndex(p=>p.id===x.id);if(targetIndex<0){cfg.food.products.push(moved)}else{const rect=r.getBoundingClientRect();const insertIndex=e.clientY<rect.top+rect.height/2?targetIndex:targetIndex+1;cfg.food.products.splice(insertIndex,0,moved)}renderFood();});
    });
  }
  function renderStats(){
    const box=$("statsList");if(!box)return;box.innerHTML=cfg.stats.cards.map((x,i)=>`<div class="stat-row"><span class="row-drag">☰</span><input class="stat-label" value="${esc(x.label)}"><label class="switch-line"><input type="checkbox" class="stat-check" ${x.enabled!==false?"checked":""}><span class="switch"></span><span>Activ</span></label></div>`).join("");box.querySelectorAll(".stat-row").forEach((r,i)=>{r.querySelector(".stat-label").oninput=e=>cfg.stats.cards[i].label=e.target.value;r.querySelector(".stat-check").onchange=e=>cfg.stats.cards[i].enabled=e.target.checked});
  }
  function updateParticipationHint(){const e=$("participationVisibility"),note=$("participationVisibilityNote");if(!e||!note)return;note.textContent=e.value==="untilEvent"?"Formularul și butonul central de pe Home sunt vizibile până la data și ora evenimentului. După începere, dispar automat.":e.value==="manual"?"Vizibilitatea este controlată de statusul modulului. Poți reactiva modulul manual după eveniment.":"Formularul și butonul central rămân ascunse.";}
  function collect(){
    syncOrderFromDOM();
    cfg.event.eventId=currentEvent?.id||cfg.event.eventId||"";
    if(currentEvent){
      currentEvent.status=$("eventStatus").value;
      currentEvent.storedStatus=currentEvent.status;
      currentEvent.activeFrom=fromLocalDateTime($("activeFrom").value);
      currentEvent.activeUntil=fromLocalDateTime($("activeUntil").value);
    }
    cfg.event.name=$("eventName").value;cfg.event.congregation=$("congregation").value;cfg.event.date=$("eventDate").value;cfg.event.time=$("eventTime").value;cfg.event.location=$("eventLocation").value;cfg.event.heroTitle=$("heroTitle").value;cfg.event.heroSubtitle=$("heroSubtitle").value;cfg.event.heroVerse=$("heroVerse").value;cfg.event.heroImage=$("heroImage").value.trim() || DEFAULT_CONFIG.event.heroImage;cfg.event.footer=$("footerText").value;
    cfg.countdown.title=$("countdownTitle").value;cfg.countdown.startedMessage=$("startedMessage").value;cfg.countdown.hideAfterStart=false;cfg.countdown.afterStartHours=24;
    cfg.gallery.title=$("galleryTitle").value;cfg.gallery.driveEnabled=$("driveEnabled").checked;cfg.gallery.driveText=$("driveText").value;cfg.gallery.driveUrl=$("driveUrl").value;
    cfg.features.titleBefore=$("featuresTitleBefore").value;cfg.features.titleAfter=$("featuresTitleAfter").value;cfg.features.menuBefore=$("featuresMenuBefore").value;cfg.features.menuAfter=$("featuresMenuAfter").value;cfg.features.title=cfg.features.titleBefore;cfg.memories.title=$("memoriesTitle").value;cfg.memories.text=$("memoriesText").value;cfg.location.title=$("locationTitle").value;cfg.location.name=$("locationName").value;cfg.location.mapUrl=$("mapUrl").value;
    cfg.participation.visibility=$("participationVisibility").value;cfg.participation.title=$("participationTitle").value;cfg.participation.description=$("participationDescription").value;cfg.participation.buttonText=$("participationButtonText").value;cfg.participation.productRows=Number($("participationProductRows").value||2);cfg.participation.fields={name:$("fieldName").checked,participation:$("fieldParticipation").checked,persons:$("fieldPersons").checked,products:$("fieldProducts").checked,notes:$("fieldNotes").checked};
    cfg.stats.title=$("statsTitle").value;cfg.stats.afterStart=$("statsAfterStart").value;cfg.participation.afterStart=$("participationAfterStart").value;cfg.food.title=$("foodTitle").value;cfg.food.description=$("foodDescription").value;cfg.food.hideCompleted=$("foodHideCompleted").checked;cfg.food.autoDisableHoursAfterStart=24;cfg.features.title=cfg.features.titleBefore;document.querySelectorAll("[data-label-for]").forEach(input=>{const m=getModule(input.dataset.labelFor);if(m)m.label=input.value.trim()||m.label;});syncLegacyEnabled();syncPanelHeaders();
  }
  document.querySelectorAll(".accordion-head").forEach(()=>{});
  $("participationVisibility")?.addEventListener("change",updateParticipationHint);
  $("heroImage")?.addEventListener("input",syncHeroPreview);
  document.querySelectorAll(".module-label-input").forEach(input=>input.addEventListener("input",()=>{const m=getModule(input.dataset.labelFor);if(m){m.label=input.value;syncPanelHeaders();}}));
  $("statsAfterStart")?.addEventListener("change",syncPanelHeaders);
  $("participationAfterStart")?.addEventListener("change",syncPanelHeaders);
  $("countdownAfterStart")?.addEventListener("change",syncPanelHeaders);
  $("addImage").onclick=()=>{cfg.gallery.images.push({src:"",title:"Amintiri",showTitle:true});renderGallery()};
  $("addFeature").onclick=()=>{cfg.features.items.push({icon:"✨",title:"Element nou",enabled:true});renderFeatures()};
  $("addFood").onclick=()=>{
    const maxId=cfg.food.products.reduce((max,p)=>{const m=String(p.id||"").match(/^food_(\d+)$/);return m?Math.max(max,Number(m[1])):max},0);
    const id=`food_${String(maxId+1).padStart(3,"0")}`;
    cfg.food.products.push({id,name:"Produs nou",required:1,unit:"bucăți",icon:"🎁",enabled:true});
    renderFood();
  };
  $("saveBtn").onclick=async ()=>{
    collect();
    const button=$("saveBtn");
    const state=$("saveState");
    button.disabled=true;
    state.textContent="Se salvează online...";
    state.classList.remove("saved");
    try{
      const result=currentEvent?.id
        ? await saveEventCentral({...currentEvent,config:cfg},currentUser?.id||"")
        : await saveCentralConfig(cfg,currentUser?.id||"");
      if(currentEvent?.id){
        currentEvent=result;
        cfg=normalizeConfig(deepMerge(clone(DEFAULT_CONFIG),result.config||{}));
      }else{
        cfg=result.config;
      }
      normalizeModules();
      render();
      state.textContent="✓ Salvat online"+(result.version?" • v"+result.version:"");
      state.classList.add("saved");
    }catch(error){
      console.error("Eroare salvare configurație:",error);
      state.textContent="❌ Nu s-a putut salva online";
      state.classList.remove("saved");
      alert(`Configurația nu a putut fi salvată online. ${error?.message || "Verifică conexiunea și Google Apps Script."}`);
    }finally{
      button.disabled=false;
      setTimeout(()=>{state.textContent="Configurație online";state.classList.remove("saved")},3000);
    }
  };
  $("resetBtn").onclick=async ()=>{
    if(!confirm("Revii la configurația implicită și o salvezi online?"))return;
    cfg=normalizeConfig(clone(DEFAULT_CONFIG));
    normalizeModules();
    collect();
    try{
      const result=await saveCentralConfig(cfg, currentUser?.id || "");
      cfg=result.config;
      normalizeModules();
      render();
      $("saveState").textContent=`✓ Configurație implicită salvată online • v${result.version}`;
      $("saveState").classList.add("saved");
    }catch(error){
      console.error(error);
      alert("Configurația implicită nu a putut fi salvată online.");
    }
  };
  $("exportBtn").onclick=()=>{collect();const blob=new Blob([JSON.stringify(cfg,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="destindere-config.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
  $("importBtn").onclick=()=>$("importFile").click();
  $("importFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{cfg=deepMerge(clone(DEFAULT_CONFIG),JSON.parse(r.result));normalizeModules();render()}catch{alert("Fișier de configurare invalid.")}};r.readAsText(f)};
  function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")};function escAttr(v){return esc(v).replace(/'/g,"&#39;")}
  $("createEventBtn")?.addEventListener("click",async()=>{
    try{
      const result=await createEventCentral(currentEvent?.id||"",currentUser?.id||"");
      events=await fetchEvents();
      await selectEvent(result.id);
    }catch(error){alert(error.message||"Evenimentul nu a putut fi creat.");}
  });
  $("activateEventBtn")?.addEventListener("click",async()=>{
    if(!currentEvent?.id)return;
    try{
      await activateEventCentral(currentEvent.id,currentUser?.id||"");
      events=await fetchEvents();
      await selectEvent(currentEvent.id);
    }catch(error){alert(error.message||"Evenimentul nu a putut fi activat.");}
  });
  $("archiveEventBtn")?.addEventListener("click",async()=>{
    if(!currentEvent?.id)return;
    try{
      await archiveEventCentral(currentEvent.id,currentUser?.id||"");
      events=await fetchEvents();
      await selectEvent(currentEvent.id);
    }catch(error){alert(error.message||"Evenimentul nu a putut fi arhivat.");}
  });
  $("previewEventBtn")?.addEventListener("click",()=>{
    if(currentEvent?.id)window.open("index.html?previewEvent="+encodeURIComponent(currentEvent.id),"_blank","noopener");
  });
  loadEventList().catch(error=>{console.error(error);loadCentralConfig({bootstrapIfMissing:true}).then(()=>{normalizeModules();render();}).catch(()=>render());});
})();
