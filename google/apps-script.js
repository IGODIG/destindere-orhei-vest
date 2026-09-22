// ==========================================================
// CONFIGURARE PRODUSE ȘI UNITĂȚI DE MĂSURĂ
// (Sincronizate exact cu CONFIG.JS din site)
// ==========================================================

var CONFIG_PRODUSE_FALLBACK = {
  "food_001": { id:"food_001", name:"Legume",       required:10, unit:"kg",                    icon:"🥗", active:true, order:1 },
  "food_002": { id:"food_002", name:"Fructe",       required:10, unit:"kg",                    icon:"🍎", active:true, order:2 },
  "food_003": { id:"food_003", name:"Prăjituri",    required:5,  unit:"kg",                    icon:"🍰", active:true, order:3 },
  "food_004": { id:"food_004", name:"Plăcinte",     required:10, unit:"kg",                    icon:"🥧", active:true, order:4 },
  "food_005": { id:"food_005", name:"Snack-uri",    required:15, unit:"pachete",               icon:"🍟", active:true, order:5 },
  "food_006": { id:"food_006", name:"Suc",          required:10, unit:"L",                     icon:"🧃", active:true, order:6 },
  "food_007": { id:"food_007", name:"Apă minerală", required:18, unit:"sticle de 1.5 L",       icon:"💧", active:true, order:7 },
  "food_008": { id:"food_008", name:"Apă dulce",    required:12, unit:"sticle de 1.25 L",      icon:"🥤", active:true, order:8 },
  "food_009": { id:"food_009", name:"Pâine",        required:7,  unit:"franzele feliate",       icon:"🍞", active:true, order:9 },
  "food_010": { id:"food_010", name:"Altceva",      required:10, unit:"Alune, Semințe",         icon:"🎁", active:true, order:10 }
};

var CONFIG_PRODUSE = {};


// ==========================================================
// GET: RĂSPUNS PENTRU SITE
// ==========================================================

function doGet(e) {

  try {

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    CONFIG_PRODUSE = getProductConfig(ss);

    // CONFIGURAȚIE CENTRALĂ V1.8
    if (e && e.parameter && e.parameter.type === "config") {
      return getCentralConfigResponse(ss);
    }

    // ======================================================
    // EVENIMENTE
    // ======================================================
    if (e && e.parameter && e.parameter.type === "events") {
      return getEventsResponse(ss);
    }

    if (e && e.parameter && e.parameter.type === "event") {
      return getEventResponse(ss, e.parameter.eventId || "");
    }

    if (e && e.parameter && e.parameter.type === "activeEvent") {
      return getActiveEventResponse(ss);
    }

    // Returnează configurația produselor pentru site/admin.
    // ?type=produse
    if (e && e.parameter && e.parameter.type === "produse") {
      return jsonOutput({
        success: true,
        produse: productConfigArray(CONFIG_PRODUSE)
      });
    }

    // ======================================================
    // 1. LISTA INVITAȚI
    // ======================================================

    var sheetInvitati = ss.getSheetByName("Invitati");

    var listaNume = [];

    if (sheetInvitati) {

      var dataInvitati =
        sheetInvitati.getDataRange().getValues();

      for (var i = 1; i < dataInvitati.length; i++) {

        var prenume =
          dataInvitati[i][0]
            ? String(dataInvitati[i][0]).trim()
            : "";

        var nume =
          dataInvitati[i][1]
            ? String(dataInvitati[i][1]).trim()
            : "";

        var numeComplet =
          (prenume + " " + nume).trim();

        if (numeComplet !== "") {
          listaNume.push(numeComplet);
        }
      }
    }


    // ======================================================
    // DOAR LISTA DE NUME
    // ?type=nume
    // ======================================================

    if (
      e &&
      e.parameter &&
      e.parameter.type === "nume"
    ) {

      return ContentService
        .createTextOutput(
          JSON.stringify(listaNume)
        )
        .setMimeType(
          ContentService.MimeType.JSON
        );
    }


    // ======================================================
    // 2. PARTICIPANȚI + PRODUSE
    // ======================================================

    var sheetParticipanti =
      ss.getSheetByName("Participanti");

    var confirmed = 0;
    var declined = 0;
    var totalPersons = 0;

    var produseAdunate = {};


    if (sheetParticipanti) {

      var dataParticipanti =
        sheetParticipanti.getDataRange().getValues();

      for (
        var j = 1;
        j < dataParticipanti.length;
        j++
      ) {

        var status =
          String(
            dataParticipanti[j][2] || ""
          )
          .trim()
          .toLowerCase();

        var nrPers =
          parseInt(
            dataParticipanti[j][3],
            10
          ) || 0;


        var ceAduce1 =
          cleanProductKey(
            dataParticipanti[j][4]
          );

        var cantitate1 =
          parseCantitate(
            dataParticipanti[j][5]
          );


        var ceAduce2 =
          cleanProductKey(
            dataParticipanti[j][6]
          );

        var cantitate2 =
          parseCantitate(
            dataParticipanti[j][7]
          );


        if (status === "da") {

          confirmed++;

          totalPersons += nrPers;


          if (ceAduce1) {

            produtosAdunateSafe(
              produseAdunate,
              ceAduce1,
              cantitate1
            );

          }


          if (ceAduce2) {

            produtosAdunateSafe(
              produseAdunate,
              ceAduce2,
              cantitate2
            );

          }

        } else if (status === "nu") {

          declined++;

        }
      }
    }


    // ======================================================
    // STRUCTURARE PRODUSE
    // ======================================================

    var produseFinale = {};

    for (var productId in CONFIG_PRODUSE) {

      var conf = CONFIG_PRODUSE[productId];
      var adus = produseAdunate[productId] || 0;

      produseFinale[productId] = {
        id: conf.id,
        name: conf.name,
        adus: adus,
        collected: adus,
        required: conf.required,
        unit: conf.unit,
        icon: conf.icon,
        active: conf.active !== false,
        order: conf.order || 999,
        percent: conf.required > 0
          ? Math.min(100, Math.round((adus / conf.required) * 100))
          : 0,
        complete: conf.required > 0 && adus >= conf.required,
        textFormatat: adus + " " + conf.unit
      };
    }

    var totalInvited =
      listaNume.length;

    var waiting =
      Math.max(
        0,
        totalInvited -
        confirmed -
        declined
      );


    var responseData = {

      nume: listaNume,

      stats: {

        invited: totalInvited,

        confirmed: confirmed,

        declined: declined,

        waiting: waiting,

        persons: totalPersons
      },

      produse: produseFinale
    };


    return ContentService

      .createTextOutput(
        JSON.stringify(responseData)
      )

      .setMimeType(
        ContentService.MimeType.JSON
      );


  } catch (error) {

    return ContentService

      .createTextOutput(
        JSON.stringify({
          error: error.toString()
        })
      )

      .setMimeType(
        ContentService.MimeType.JSON
      );
  }
}


// ==========================================================
// POST
// ==========================================================

function doPost(e) {

  try {

    var ss =
      SpreadsheetApp.getActiveSpreadsheet();

    CONFIG_PRODUSE = getProductConfig(ss);


    if (!e) {
      throw new Error(
        "Request-ul este gol."
      );
    }


    // ======================================================
    // CITIRE DATE
    // ======================================================

    var data = {};


    if (
      e.postData &&
      e.postData.contents
    ) {

      try {

        data =
          JSON.parse(
            e.postData.contents
          );

      } catch (err) {

        data =
          e.parameter || {};
      }

    } else if (e.parameter) {

      data = e.parameter;
    }


    // ======================================================
    // ACTION
    // ======================================================

    var action =
      cleanValue(
        getValue(
          data,
          ["action"]
        )
      );


    // ======================================================
    // UPLOAD AMINTIRI
    //
    // IMPORTANT:
    // Aici NU cerem numele invitatului.
    // ======================================================

    if (action === "saveConfig") {
      return saveCentralConfig(ss, data);
    }

    // ======================================================
    // EVENIMENTE
    // ======================================================
    if (action === "saveEvent") return saveEvent(ss, data);
    if (action === "createEvent") return createEvent(ss, data);
    if (action === "activateEvent") return activateEvent(ss, data);
    if (action === "archiveEvent") return archiveEvent(ss, data);

    if (action === "login") {
      return loginUser(ss, data);
    }

    if (action === "syncProducts") {
      return syncProductsToSheet(ss, data);
    }

    if (action === "initProducts") {
      ensureProductsSheet(ss);
      CONFIG_PRODUSE = getProductConfig(ss);
      return jsonOutput({
        result: "success",
        success: true,
        produse: productConfigArray(CONFIG_PRODUSE)
      });
    }

    if (action === "migrateProducts") {
      return migrateParticipantProductNamesToIds();
    }

    if (
      action === "uploadMemory"
    ) {

      return uploadMemory(data);
    }


    // ======================================================
    // PARTICIPANȚI
    // LOGICA TA EXISTENTĂ RĂMÂNE
    // ======================================================

    var sheet =
      ss.getSheetByName(
        "Participanti"
      );


    if (!sheet) {

      throw new Error(
        "Foaia 'Participanti' nu există."
      );
    }


    var numeComplet =
      cleanValue(
        getValue(
          data,
          ["nume_complet"]
        )
      );


    if (!numeComplet) {

      throw new Error(
        "Numele invitatului lipsește."
      );
    }


    var sheetInvitati =
      ss.getSheetByName(
        "Invitati"
      );


    if (!sheetInvitati) {

      throw new Error(
        "Foaia 'Invitati' nu există."
      );
    }


    var dataInvitati =
      sheetInvitati
        .getDataRange()
        .getValues();


    var prenume = "";
    var nume = "";


    for (
      var i = 1;
      i < dataInvitati.length;
      i++
    ) {

      var invComplet =
        (
          (dataInvitati[i][0] || "") +
          " " +
          (dataInvitati[i][1] || "")
        ).trim();


      if (
        invComplet ===
        numeComplet
      ) {

        prenume =
          String(
            dataInvitati[i][0]
          ).trim();

        nume =
          String(
            dataInvitati[i][1]
          ).trim();

        break;
      }
    }


    var participa =
      cleanValue(
        getValue(
          data,
          [
            "participa",
            "participă",
            "status",
            "participation",
            "attending"
          ]
        )
      );


    var nrPersoane =
      parseInt(
        getValue(
          data,
          [
            "persoane",
            "nrPers",
            "nrPersoane",
            "persons"
          ]
        ),
        10
      ) || 0;


    // ======================================================
    // PRODUSE
    // ======================================================

    var ceAduce1 =
      resolveProductId(
        getValue(
          data,
          [
            "productId1",
            "product_id_1",
            "ceAduce1",
            "ce_aduce_1",
            "ceAduce",
            "produs1"
          ]
        ),
        CONFIG_PRODUSE
      );


    var cantitate1Raw =
      parseCantitate(
        getValue(
          data,
          [
            "cantitate1",
            "cantitate_1",
            "quantity1"
          ]
        )
      );


    var ceAduce2 =
      resolveProductId(
        getValue(
          data,
          [
            "productId2",
            "product_id_2",
            "ceAduce2",
            "ce_aduce_2",
            "produs2"
          ]
        ),
        CONFIG_PRODUSE
      );


    var cantitate2Raw =
      parseCantitate(
        getValue(
          data,
          [
            "cantitate2",
            "cantitate_2",
            "quantity2"
          ]
        )
      );


    var observatii =
      cleanValue(
        getValue(
          data,
          [
            "observatii",
            "observații",
            "notes"
          ]
        )
      );


    // ======================================================
    // UNITATEA DE MĂSURĂ
    // ======================================================

    var cantitate1Finala = "";


    if (
      ceAduce1 !== "" &&
      cantitate1Raw > 0
    ) {

      var unit1 =
        CONFIG_PRODUSE[ceAduce1]
          ? CONFIG_PRODUSE[ceAduce1].unit
          : "";


      cantitate1Finala =
        cantitate1Raw +
        (
          unit1
            ? " " + unit1
            : ""
        );
    }


    var cantitate2Finala = "";


    if (
      ceAduce2 !== "" &&
      cantitate2Raw > 0
    ) {

      var unit2 =
        CONFIG_PRODUSE[ceAduce2]
          ? CONFIG_PRODUSE[ceAduce2].unit
          : "";


      cantitate2Finala =
        cantitate2Raw +
        (
          unit2
            ? " " + unit2
            : ""
        );
    }


    // ======================================================
    // SALVARE PARTICIPANT
    // ======================================================

    sheet.appendRow([

      prenume,

      nume,

      participa,

      nrPersoane,

      ceAduce1,

      cantitate1Finala,

      ceAduce2,

      cantitate2Finala,

      observatii,

      new Date()

    ]);


    return ContentService

      .createTextOutput(
        JSON.stringify({
          result: "success",
          success: true
        })
      )

      .setMimeType(
        ContentService.MimeType.JSON
      );


  } catch (error) {

    return ContentService

      .createTextOutput(
        JSON.stringify({

          result: "error",

          success: false,

          message:
            error.toString()

        })
      )

      .setMimeType(
        ContentService.MimeType.JSON
      );
  }
}


// ==========================================================
// UPLOAD AMINTIRI
// ==========================================================

function uploadMemory(data) {

  try {

    // ======================================================
    // IMPORTANT:
    // PUNE AICI ID-UL FOLDERULUI GOOGLE DRIVE
    // ======================================================

    var FOLDER_ID =
      "1UrOCtN2ixkyoykDeaV43UakTHbn8DiKE";


    var folder =
      DriveApp.getFolderById(
        FOLDER_ID
      );


    if (!folder) {

      throw new Error(
        "Folderul Google Drive nu a fost găsit."
      );
    }


    // ======================================================
    // DATE FIȘIER
    // ======================================================

    var fileName =
      cleanValue(
        getValue(
          data,
          ["fileName"]
        )
      );


    var fileCategory =
      cleanValue(
        getValue(
          data,
          ["fileCategory"]
        )
      );


    var mimeType =
      cleanValue(
        getValue(
          data,
          ["mimeType"]
        )
      );


    var fileData =
      cleanValue(
        getValue(
          data,
          ["fileData"]
        )
      );


    if (!fileName) {

      throw new Error(
        "Numele fișierului lipsește."
      );
    }


    if (!fileData) {

      throw new Error(
        "Datele fișierului lipsesc."
      );
    }


    // ======================================================
    // BASE64 → BLOB
    // ======================================================

    var decoded =
      Utilities.base64Decode(
        fileData
      );


    var blob =
      Utilities.newBlob(
        decoded,
        mimeType ||
          "application/octet-stream",
        fileName
      );


    // ======================================================
    // SALVARE GOOGLE DRIVE
    // ======================================================

    var file =
      folder.createFile(
        blob
      );


    // ======================================================
    // RĂSPUNS
    // ======================================================

    return ContentService

      .createTextOutput(
        JSON.stringify({

          result: "success",

          success: true,

          message:
            "Fișier încărcat cu succes.",

          fileName:
            file.getName(),

          fileId:
            file.getId(),

          fileUrl:
            file.getUrl(),

          category:
            fileCategory

        })
      )

      .setMimeType(
        ContentService.MimeType.JSON
      );


  } catch (error) {

    return ContentService

      .createTextOutput(
        JSON.stringify({

          result: "error",

          success: false,

          message:
            error.toString()

        })
      )

      .setMimeType(
        ContentService.MimeType.JSON
      );
  }
}




/* ==========================================================
   EVENIMENTE - MULTI-EVENT
   Păstrează configurația actuală și adaugă doar un strat
   de administrare pentru ACTIV / PLANIFICAT / ARHIVAT.
========================================================== */

function ensureEventsSheet(ss) {
  var sheet = ss.getSheetByName("Evenimente");
  if (!sheet) {
    sheet = ss.insertSheet("Evenimente");
    sheet.getRange(1, 1, 1, 14).setValues([[
      "ID", "Nume", "Congregație", "Data", "Ora", "Locație", "Status",
      "ActivDin", "ActivPana", "ConfigJSON", "Version", "CreatedAt", "UpdatedAt", "UpdatedBy"
    ]]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function eventEffectiveStatus(status, activeFrom, activeUntil) {
  var raw = String(status || "PLANIFICAT").toUpperCase();
  if (raw === "ARHIVAT") return "ARHIVAT";

  var now = new Date();
  var from = activeFrom ? new Date(activeFrom) : null;
  var until = activeUntil ? new Date(activeUntil) : null;

  if (until && !isNaN(until.getTime()) && now > until) return "ARHIVAT";
  if (from && !isNaN(from.getTime()) && now < from) return "PLANIFICAT";
  if (raw === "ACTIV") return "ACTIV";
  if (raw === "PLANIFICAT" && from && !isNaN(from.getTime()) && now >= from) return "ACTIV";
  return raw === "ACTIV" ? "ACTIV" : "PLANIFICAT";
}

function eventRecordFromRow(row) {
  var config = {};
  try { config = row[9] ? JSON.parse(String(row[9])) : {}; } catch (e) { config = {}; }
  var activeFrom = row[7] ? new Date(row[7]) : null;
  var activeUntil = row[8] ? new Date(row[8]) : null;
  return {
    id: String(row[0] || ""),
    name: String(row[1] || ""),
    congregation: String(row[2] || ""),
    date: row[3] ? Utilities.formatDate(new Date(row[3]), Session.getScriptTimeZone(), "yyyy-MM-dd") : "",
    time: String(row[4] || ""),
    location: String(row[5] || ""),
    status: eventEffectiveStatus(row[6], activeFrom, activeUntil),
    storedStatus: String(row[6] || "PLANIFICAT").toUpperCase(),
    activeFrom: activeFrom && !isNaN(activeFrom.getTime()) ? activeFrom.toISOString() : "",
    activeUntil: activeUntil && !isNaN(activeUntil.getTime()) ? activeUntil.toISOString() : "",
    version: Number(row[10] || 1),
    createdAt: row[11] ? new Date(row[11]).toISOString() : "",
    updatedAt: row[12] ? new Date(row[12]).toISOString() : "",
    updatedBy: String(row[13] || ""),
    config: config
  };
}

function migrateLegacyConfigToEvents(ss) {
  var events = ensureEventsSheet(ss);
  if (events.getLastRow() >= 2) return;

  var legacy = getCentralConfigRecord(ss);
  if (!legacy || !legacy.config) return;

  var config = legacy.config;
  var event = config.event || {};
  var start = event.date && event.time ? new Date(event.date + "T" + event.time + ":00") : new Date();
  var until = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  var id = "EVT-001";
  var now = new Date();

  events.getRange(2, 1, 1, 14).setValues([[
    id,
    event.name || "Eveniment",
    event.congregation || "",
    event.date || "",
    event.time || "",
    event.location || "",
    "ACTIV",
    start,
    until,
    JSON.stringify(config),
    Number(legacy.version || 1),
    now,
    now,
    legacy.updatedBy || ""
  ]]);
}

function getEventRows(ss) {
  migrateLegacyConfigToEvents(ss);
  var sheet = ensureEventsSheet(ss);
  if (sheet.getLastRow() < 2) return [];
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 14).getValues();
  return values.filter(function(row) { return String(row[0] || "").trim() !== ""; }).map(eventRecordFromRow);
}

function getEventsResponse(ss) {
  var events = getEventRows(ss);
  return jsonOutput({ success: true, events: events.map(function(e) {
    return {
      id:e.id, name:e.name, congregation:e.congregation, date:e.date, time:e.time,
      location:e.location, status:e.status, storedStatus:e.storedStatus,
      activeFrom:e.activeFrom, activeUntil:e.activeUntil, version:e.version,
      updatedAt:e.updatedAt, updatedBy:e.updatedBy
    };
  }) });
}

function findEventRow(ss, eventId) {
  var sheet = ensureEventsSheet(ss);
  if (sheet.getLastRow() < 2) return null;
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 14).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0] || "").trim() === String(eventId || "").trim()) {
      return { sheet: sheet, rowNumber: i + 2, row: values[i] };
    }
  }
  return null;
}

function getEventResponse(ss, eventId) {
  var found = findEventRow(ss, eventId);
  if (!found) return jsonOutput({ success:false, message:"Evenimentul nu a fost găsit." });
  var event = eventRecordFromRow(found.row);
  return jsonOutput({ success:true, event:event });
}

function getActiveEventResponse(ss) {
  var events = getEventRows(ss);
  var active = events.filter(function(e) { return e.status === "ACTIV"; });
  active.sort(function(a,b) { return String(a.activeFrom || "").localeCompare(String(b.activeFrom || "")); });
  if (!active.length) return jsonOutput({ success:true, configured:false, event:null });
  return jsonOutput({ success:true, configured:true, event:active[active.length - 1] });
}

function parseEventDateTime(value, fallback) {
  var text = String(value || "").trim();
  if (!text) return fallback || new Date();
  var d = new Date(text);
  return isNaN(d.getTime()) ? (fallback || new Date()) : d;
}

function authorizeEventAdmin(ss, data) {
  var userId = cleanValue(getValue(data, ["updatedBy", "userId"]));
  if (!isActiveAdmin(ss, userId)) throw new Error("Utilizatorul nu este autorizat pentru administrarea evenimentelor.");
  return userId;
}

function createEvent(ss, data) {
  try {
    var userId = authorizeEventAdmin(ss, data);
    var sheet = ensureEventsSheet(ss);
    var events = getEventRows(ss);
    var number = events.reduce(function(max, e) {
      var m = e.id.match(/^EVT-(\\d+)$/); return m ? Math.max(max, Number(m[1])) : max;
    }, 0) + 1;
    var id = "EVT-" + String(number).padStart(3, "0");
    var source = null;
    if (data.sourceEventId) {
      var sourceRow = findEventRow(ss, data.sourceEventId);
      if (sourceRow) source = eventRecordFromRow(sourceRow.row);
    }
    if (!source && events.length) source = events[events.length - 1];
    if (!source) {
      var legacy = getCentralConfigRecord(ss);
      if (legacy) source = { config: legacy.config };
    }
    var config = source && source.config ? JSON.parse(JSON.stringify(source.config)) : {};
    var name = cleanValue(getValue(data, ["name"])) || "Eveniment nou";
    var congregation = cleanValue(getValue(data, ["congregation"])) || (config.event && config.event.congregation) || "";
    var date = cleanValue(getValue(data, ["date"])) || (config.event && config.event.date) || "";
    var time = cleanValue(getValue(data, ["time"])) || (config.event && config.event.time) || "00:00";
    var location = cleanValue(getValue(data, ["location"])) || (config.event && config.event.location) || "";
    var activeFrom = parseEventDateTime(getValue(data, ["activeFrom"]), new Date());
    var activeUntil = parseEventDateTime(getValue(data, ["activeUntil"]), new Date(activeFrom.getTime() + 7*24*60*60*1000));
    config.event = config.event || {};
    config.event.name = name; config.event.congregation = congregation; config.event.date = date; config.event.time = time; config.event.location = location;
    config.event.eventId = id;
    var now = new Date();
    sheet.appendRow([id,name,congregation,date,time,location,"PLANIFICAT",activeFrom,activeUntil,JSON.stringify(config),1,now,now,userId]);
    return jsonOutput({success:true,event:eventRecordFromRow(sheet.getRange(sheet.getLastRow(),1,1,14).getValues()[0])});
  } catch (error) { return jsonOutput({success:false,message:error.toString()}); }
}

function saveEvent(ss, data) {
  try {
    var userId = authorizeEventAdmin(ss, data);
    var eventId = cleanValue(getValue(data, ["eventId"]));
    var found = findEventRow(ss, eventId);
    if (!found) throw new Error("Evenimentul nu a fost găsit.");
    var raw = getValue(data, ["config"]);
    if (!raw) throw new Error("Configurația lipsește.");
    var config = typeof raw === "string" ? JSON.parse(raw) : raw;
    var old = eventRecordFromRow(found.row);
    var name = cleanValue(getValue(data,["name"])) || old.name;
    var congregation = cleanValue(getValue(data,["congregation"])) || old.congregation;
    var date = cleanValue(getValue(data,["date"])) || old.date;
    var time = cleanValue(getValue(data,["time"])) || old.time;
    var location = cleanValue(getValue(data,["location"])) || old.location;
    var status = String(getValue(data,["status"]) || old.storedStatus || "PLANIFICAT").toUpperCase();
    if (["ACTIV","PLANIFICAT","ARHIVAT"].indexOf(status) === -1) status = "PLANIFICAT";
    var activeFrom = parseEventDateTime(getValue(data,["activeFrom"]), old.activeFrom ? new Date(old.activeFrom) : new Date());
    var activeUntil = parseEventDateTime(getValue(data,["activeUntil"]), old.activeUntil ? new Date(old.activeUntil) : new Date(activeFrom.getTime()+7*24*60*60*1000));
    config.event = config.event || {};
    config.event.eventId = eventId; config.event.name=name; config.event.congregation=congregation; config.event.date=date; config.event.time=time; config.event.location=location;
    var version = Number(old.version || 0) + 1; var now = new Date();
    found.sheet.getRange(found.rowNumber,1,1,14).setValues([[eventId,name,congregation,date,time,location,status,activeFrom,activeUntil,JSON.stringify(config),version,found.row[11]||now,now,userId]]);
    SpreadsheetApp.flush();
    return jsonOutput({success:true,event:eventRecordFromRow(found.sheet.getRange(found.rowNumber,1,1,14).getValues()[0])});
  } catch (error) { return jsonOutput({success:false,message:error.toString()}); }
}

function activateEvent(ss, data) {
  try {
    var userId = authorizeEventAdmin(ss, data);
    var eventId = cleanValue(getValue(data,["eventId"]));
    var sheet = ensureEventsSheet(ss);
    var events = getEventRows(ss);
    var found = findEventRow(ss,eventId);
    if (!found) throw new Error("Evenimentul nu a fost găsit.");
    events.forEach(function(e) {
      var row = findEventRow(ss,e.id);
      if (!row) return;
      var current = row.row;
      if (e.id === eventId) {
        current[6] = "ACTIV";
      } else if (String(current[6] || "").toUpperCase() === "ACTIV") {
        current[6] = "ARHIVAT";
      }
      current[12] = new Date(); current[13] = userId;
      row.sheet.getRange(row.rowNumber,1,1,14).setValues([current]);
    });
    SpreadsheetApp.flush();
    return getEventResponse(ss,eventId);
  } catch (error) { return jsonOutput({success:false,message:error.toString()}); }
}

function archiveEvent(ss, data) {
  try {
    var userId = authorizeEventAdmin(ss, data);
    var eventId = cleanValue(getValue(data,["eventId"]));
    var found = findEventRow(ss,eventId);
    if (!found) throw new Error("Evenimentul nu a fost găsit.");
    found.row[6] = "ARHIVAT"; found.row[12] = new Date(); found.row[13] = userId;
    found.sheet.getRange(found.rowNumber,1,1,14).setValues([found.row]);
    return getEventResponse(ss,eventId);
  } catch (error) { return jsonOutput({success:false,message:error.toString()}); }
}


/* ==========================================================
   CONFIGURAȚIE CENTRALĂ V1.8
========================================================== */

function ensureConfigSheet(ss) {
  var sheet = ss.getSheetByName("Configurare");
  if (!sheet) {
    sheet = ss.insertSheet("Configurare");
    sheet.getRange(1, 1, 1, 5).setValues([[
      "ID", "ConfigJSON", "Version", "UpdatedAt", "UpdatedBy"
    ]]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getCentralConfigRecord(ss) {
  var sheet = ensureConfigSheet(ss);
  if (sheet.getLastRow() < 2) return null;

  var values = sheet.getRange(2, 1, 1, 5).getValues()[0];
  if (!values[1]) return null;

  var config;
  try {
    config = JSON.parse(String(values[1]));
  } catch (error) {
    throw new Error("ConfigJSON din foaia 'Configurare' nu este JSON valid.");
  }

  return {
    config: config,
    version: Number(values[2]) || 1,
    updatedAt: values[3] ? new Date(values[3]).toISOString() : "",
    updatedBy: String(values[4] || "")
  };
}

function getCentralConfigResponse(ss) {
  var record = getCentralConfigRecord(ss);
  if (!record) {
    return jsonOutput({
      success: true,
      configured: false,
      config: null,
      version: 0,
      updatedAt: "",
      updatedBy: ""
    });
  }

  return jsonOutput({
    success: true,
    configured: true,
    config: record.config,
    version: record.version,
    updatedAt: record.updatedAt,
    updatedBy: record.updatedBy
  });
}

function isActiveAdmin(ss, userId) {
  var id = String(userId || "").trim();
  if (!id) return false;

  var sheet = ss.getSheetByName("Utilizatori");
  if (!sheet || sheet.getLastRow() < 2) return false;

  var values = sheet.getDataRange().getValues();

  for (var i = 1; i < values.length; i++) {
    var rowId = String(values[i][0] || "").trim();
    var active = String(values[i][4] || "DA").trim().toLowerCase();

    if (rowId === id && active !== "nu") {
      return true;
    }
  }
  return false;
}

function saveCentralConfig(ss, data) {
  try {
    var raw = getValue(data, ["config"]);
    if (!raw) throw new Error("Configurația lipsește.");

    var config;
    try {
      config = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (error) {
      throw new Error("Configurația trimisă nu este JSON valid.");
    }

    if (!config || typeof config !== "object") {
      throw new Error("Configurația este invalidă.");
    }

    var updatedBy = cleanValue(getValue(data, ["updatedBy"]));
    if (!isActiveAdmin(ss, updatedBy)) {
      throw new Error("Utilizatorul nu este autorizat să salveze configurația (ID invalid sau inactiv).");
    }

    delete config.apiUrl;

    var sheet = ensureConfigSheet(ss);
    var record = getCentralConfigRecord(ss);
    var nextVersion = record ? Number(record.version || 0) + 1 : 1;
    var now = new Date();

    sheet.getRange(2, 1, 1, 5).setValues([[
      "site", JSON.stringify(config), nextVersion, now, updatedBy
    ]]);

    SpreadsheetApp.flush();

    return jsonOutput({
      success: true,
      configured: true,
      config: config,
      version: nextVersion,
      updatedAt: now.toISOString(),
      updatedBy: updatedBy
    });
  } catch (error) {
    return jsonOutput({
      success: false,
      message: error.toString()
    });
  }
}

// ==========================================================
// CONFIGURAȚIA PRODUSELOR
// ==========================================================

function getProductConfig(ss) {

  var result = {};
  var sheet = ss.getSheetByName("Produse");

  if (sheet) {

    var values = sheet.getDataRange().getValues();

    for (var i = 1; i < values.length; i++) {

      var id = cleanValue(values[i][0]);
      var name = cleanValue(values[i][1]);

      if (!id || !name) continue;

      var required = parseCantitate(values[i][2]);
      var unit = cleanValue(values[i][3]);
      var icon = cleanValue(values[i][4]) || "🎁";
      var active = parseBoolean(values[i][5], true);
      var order = parseInt(values[i][6], 10) || i;

      result[id] = {
        id: id,
        name: name,
        required: required,
        unit: unit,
        icon: icon,
        active: active,
        order: order
      };
    }
  }

  // Dacă foaia nu există sau nu conține produse, folosim lista implicită.
  if (Object.keys(result).length === 0) {
    result = cloneProductConfig(CONFIG_PRODUSE_FALLBACK);
  }

  return result;
}


function productConfigArray(config) {

  var arr = [];

  for (var id in config) {
    arr.push(config[id]);
  }

  arr.sort(function(a, b) {
    return (a.order || 999) - (b.order || 999);
  });

  return arr;
}


function cloneProductConfig(source) {

  var result = {};

  for (var id in source) {
    result[id] = {
      id: source[id].id,
      name: source[id].name,
      required: source[id].required,
      unit: source[id].unit,
      icon: source[id].icon,
      active: source[id].active !== false,
      order: source[id].order || 999
    };
  }

  return result;
}


function parseBoolean(value, defaultValue) {

  if (value === true || value === false) return value;

  var v = String(value === undefined || value === null ? "" : value)
    .trim()
    .toLowerCase();

  if (v === "") return defaultValue;

  return [
    "true", "1", "da", "yes", "activ", "active"
  ].indexOf(v) !== -1;
}


function normalizeProductName(value) {

  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}


function resolveProductId(value, config) {

  var raw = cleanProductKey(value);

  if (!raw) return "";

  // ID nou, stabil.
  if (config[raw]) {
    return raw;
  }

  var normalized = normalizeProductName(raw);

  for (var id in config) {

    if (
      normalizeProductName(config[id].name) === normalized
    ) {
      return id;
    }
  }

  // Compatibilitate cu formatul vechi: numele poate avea emoji la început.
  var withoutEmoji = raw
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .trim();

  normalized = normalizeProductName(withoutEmoji);

  for (var id2 in config) {

    if (
      normalizeProductName(config[id2].name) === normalized
    ) {
      return id2;
    }
  }

  return "";
}


function ensureProductsSheet(ss) {

  var sheet = ss.getSheetByName("Produse");

  if (!sheet) {
    sheet = ss.insertSheet("Produse");
  }

  if (sheet.getLastRow() === 0) {

    sheet.getRange(1, 1, 1, 7).setValues([[
      "ID", "Nume", "Necesar", "Unitate", "Icon", "Activ", "Ordine"
    ]]);

    var defaults = productConfigArray(CONFIG_PRODUSE_FALLBACK);

    var rows = defaults.map(function(p) {
      return [
        p.id,
        p.name,
        p.required,
        p.unit,
        p.icon,
        p.active,
        p.order
      ];
    });

    if (rows.length) {
      sheet.getRange(2, 1, rows.length, 7).setValues(rows);
    }

    sheet.setFrozenRows(1);
  }

  return sheet;
}


function syncProductsToSheet(ss, data) {

  var raw = getValue(data, ["products", "produse"]);

  if (!raw) {
    throw new Error("Lista de produse lipsește.");
  }

  var products;

  if (typeof raw === "string") {
    try {
      products = JSON.parse(raw);
    } catch (err) {
      throw new Error("Lista de produse nu este JSON valid.");
    }
  } else {
    products = raw;
  }

  if (!Array.isArray(products)) {
    throw new Error("Lista de produse trebuie să fie un array.");
  }

  var sheet = ss.getSheetByName("Produse");

  if (!sheet) {
    sheet = ss.insertSheet("Produse");
  }

  sheet.clearContents();

  sheet.getRange(1, 1, 1, 7).setValues([[
    "ID", "Nume", "Necesar", "Unitate", "Icon", "Activ", "Ordine"
  ]]);

  var rows = [];
  var usedIds = {};

  products.forEach(function(p, index) {

    var id = cleanValue(p && (p.id || p.ID));
    var name = cleanValue(p && (p.name || p.nume || p.Nume));

    if (!id || !name) return;

    if (usedIds[id]) {
      throw new Error("ID de produs duplicat: " + id);
    }

    usedIds[id] = true;

    rows.push([
      id,
      name,
      parseCantitate(p && (p.required !== undefined ? p.required : p.necesar)),
      cleanValue(p && (p.unit || p.unitate)) || "buc.",
      cleanValue(p && (p.icon || p.Icon)) || "🎁",
      p && p.active !== undefined ? !!p.active : true,
      parseInt(p && (p.order !== undefined ? p.order : p.ordine), 10) || index + 1
    ]);
  });

  if (rows.length) {
    sheet.getRange(2, 1, rows.length, 7).setValues(rows);
  }

  sheet.setFrozenRows(1);

  CONFIG_PRODUSE = getProductConfig(ss);

  return jsonOutput({
    result: "success",
    success: true,
    message: "Produsele au fost sincronizate.",
    produse: productConfigArray(CONFIG_PRODUSE)
  });
}


function migrateParticipantProductNamesToIds() {

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Participanti");

  if (!sheet) {
    throw new Error("Foaia 'Participanti' nu există.");
  }

  ensureProductsSheet(ss);

  var config = getProductConfig(ss);
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return jsonOutput({
      success: true,
      updated: 0,
      message: "Nu există participanți de migrat."
    });
  }

  var range = sheet.getRange(2, 5, lastRow - 1, 4);
  var values = range.getValues();
  var updated = 0;

  for (var i = 0; i < values.length; i++) {

    var old1 = values[i][0];
    var old2 = values[i][2];

    var id1 = resolveProductId(old1, config);
    var id2 = resolveProductId(old2, config);

    if (id1 && String(old1) !== id1) {
      values[i][0] = id1;
      updated++;
    }

    if (id2 && String(old2) !== id2) {
      values[i][2] = id2;
      updated++;
    }
  }

  range.setValues(values);

  return jsonOutput({
    success: true,
    updated: updated,
    message: "Produsele existente au fost convertite la ID-uri stabile."
  });
}



// ==========================================================
// UTILIZATORI / LOGIN DESTINDERI JW MOLDOVA
// ==========================================================

function ensureUsersSheet(ss) {
  var sheet = ss.getSheetByName("Utilizatori");
  if (!sheet) {
    sheet = ss.insertSheet("Utilizatori");
    sheet.appendRow(["ID", "Nume", "Prenume", "Congregație", "Activ", "CreatedAt", "UpdatedAt"]);
  }
  return sheet;
}

function normalizeLoginValue(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

function loginUser(ss, data) {
  var sheet = ensureUsersSheet(ss);
  var nume = cleanValue(getValue(data, ["nume"]));
  var prenume = cleanValue(getValue(data, ["prenume"]));
  var congregatie = cleanValue(getValue(data, ["congregatie", "congregație"]));

  if (!nume || !prenume || !congregatie) {
    return jsonOutput({
      success: false,
      error: "Completează toate datele."
    });
  }

  if (sheet.getLastRow() < 2) {
    return jsonOutput({
      success: false,
      error: "Foaia Utilizatori nu conține utilizatori."
    });
  }

  var rows = sheet.getDataRange().getValues();
  var headers = rows[0].map(function(value) {
    return normalizeLoginValue(value);
  });

  function findHeader(names, fallbackIndex) {
    for (var i = 0; i < names.length; i++) {
      var index = headers.indexOf(normalizeLoginValue(names[i]));
      if (index !== -1) return index;
    }
    return fallbackIndex;
  }

  var idCol = findHeader(["ID", "Id", "id"], 0);
  var numeCol = findHeader(["Nume", "Nume de familie", "Familie"], 1);
  var prenumeCol = findHeader(["Prenume", "First name"], 2);
  var congregatieCol = findHeader(["Congregație", "Congregatie", "Congregaţia", "Congregatia"], 3);
  var activeCol = findHeader(["Activ", "Active"], 4);

  var nNume = normalizeLoginValue(nume);
  var nPrenume = normalizeLoginValue(prenume);
  var nCong = normalizeLoginValue(congregatie);

  for (var i = 1; i < rows.length; i++) {
    var active = String(rows[i][activeCol] || "DA").trim().toLowerCase();

    if (active === "nu" || active === "no" || active === "false" || active === "0") {
      continue;
    }

    var rowNume = normalizeLoginValue(rows[i][numeCol]);
    var rowPrenume = normalizeLoginValue(rows[i][prenumeCol]);
    var rowCong = normalizeLoginValue(rows[i][congregatieCol]);

    if (
      rowNume === nNume &&
      rowPrenume === nPrenume &&
      rowCong === nCong
    ) {
      var userId = String(rows[i][idCol] || "").trim();

      if (!userId) {
        return jsonOutput({
          success: false,
          error: "Utilizatorul există, dar nu are ID în coloana ID."
        });
      }

      return jsonOutput({
        success: true,
        user: {
          id: userId,
          nume: String(rows[i][numeCol] || "").trim(),
          prenume: String(rows[i][prenumeCol] || "").trim(),
          congregatie: String(rows[i][congregatieCol] || "").trim()
        }
      });
    }
  }

  return jsonOutput({
    success: false,
    error: "Datele introduse nu corespund unui utilizator activ din foaia Utilizatori."
  });
}

function jsonOutput(obj) {

  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


// ==========================================================
// UTILS
// ==========================================================

function cleanValue(val) {

  return val
    ? String(val).trim()
    : "";
}


// ==========================================================

function getValue(
  data,
  keys
) {

  for (
    var i = 0;
    i < keys.length;
    i++
  ) {

    if (
      data[keys[i]] !== undefined &&
      data[keys[i]] !== null
    ) {

      return data[keys[i]];
    }
  }

  return "";
}


// ==========================================================

function parseCantitate(val) {

  if (!val) {
    return 0;
  }


  if (
    typeof val === "number"
  ) {

    return val;
  }


  var strVal =
    String(val)
      .replace(",", ".");


  var match =
    strVal.match(
      /[\d\.]+/
    );


  return match
    ? parseFloat(match[0])
    : 0;
}


// ==========================================================

function cleanProductKey(val) {

  if (!val) {
    return "";
  }


  return String(val)

    .replace(
      /^[^\wăâîșțĂÂÎȘȚ\-]+/gi,
      ""
    )

    .trim();
}


// ==========================================================
// AJUTĂTOR PENTRU CALCULAREA PRODUSELOR
// ==========================================================

function produtosAdunateSafe(
  obiect,
  produs,
  cantitate
) {

  obiect[produs] =
    (obiect[produs] || 0) +
    cantitate;
}