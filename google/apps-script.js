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
      return getEventsResponseV2(ss);
    }

    if (e && e.parameter && e.parameter.type === "event") {
      return getEventResponseV2(ss, e.parameter.eventId || "");
    }

    if (e && e.parameter && e.parameter.type === "activeEvent") {
      return getActiveEventResponseV2(ss);
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
    if (action === "saveEvent") return saveEventV2(ss, data);
    if (action === "createEvent") return createEventV2(ss, data);
    if (action === "activateEvent") return activateEventV2(ss, data);
    if (action === "archiveEvent") return archiveEventV2(ss, data);
    if (action === "deleteEvent") return deleteEventV2(ss, data);

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
   EVENIMENTE - MULTI-EVENT V2
   Fiecare eveniment are:
   - fișier config.json propriu în Google Drive
   - folder propriu
   - foi proprii pentru invitați și participanți
   - status independent: PLANIFICAT / ACTIV / ARHIVAT
========================================================== */

var EVENT_HEADERS_V2 = [
  "ID","Nume","Congregație","Data","Ora","Locație","Status",
  "ActivDin","ActivPana","ConfigJSON","Version","CreatedAt",
  "UpdatedAt","UpdatedBy","ConfigFileId","FolderId"
];

function getEventsRootFolder() {
  var props = PropertiesService.getScriptProperties();
  var savedId = props.getProperty("DESTINDERE_EVENTS_ROOT_FOLDER_ID");
  if (savedId) {
    try { return DriveApp.getFolderById(savedId); } catch (e) {}
  }
  var folders = DriveApp.getFoldersByName("DESTINDERE - EVENIMENTE");
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder("DESTINDERE - EVENIMENTE");
  props.setProperty("DESTINDERE_EVENTS_ROOT_FOLDER_ID", folder.getId());
  return folder;
}

function getOrCreateEventFolder(eventId, eventName, folderId) {
  if (folderId) {
    try { return DriveApp.getFolderById(folderId); } catch (e) {}
  }
  var root = getEventsRootFolder();
  var safeName = String(eventName || "Eveniment").replace(/[\\/:*?"<>|]/g, "-").trim() || "Eveniment";
  var folderName = eventId + "_" + safeName;
  var folders = root.getFoldersByName(folderName);
  var folder = folders.hasNext() ? folders.next() : root.createFolder(folderName);
  return folder;
}

function getEventConfigFile(folder, eventId, config, fileId) {
  if (fileId) {
    try {
      var existing = DriveApp.getFileById(fileId);
      existing.setContent(JSON.stringify(config, null, 2));
      return existing;
    } catch (e) {}
  }
  var files = folder.getFilesByName("config.json");
  if (files.hasNext()) {
    var file = files.next();
    file.setContent(JSON.stringify(config, null, 2));
    return file;
  }
  return folder.createFile("config.json", JSON.stringify(config, null, 2), MimeType.PLAIN_TEXT);
}

function readEventConfig(record) {
  if (!record) return null;
  if (record.configFileId) {
    try {
      var file = DriveApp.getFileById(record.configFileId);
      return JSON.parse(file.getBlob().getDataAsString());
    } catch (e) {}
  }
  if (record.configJSON) {
    try { return JSON.parse(String(record.configJSON)); } catch (e) {}
  }
  return null;
}

function ensureEventsSheetV2(ss) {
  var sheet = ss.getSheetByName("Evenimente");
  if (!sheet) {
    sheet = ss.insertSheet("Evenimente");
    sheet.getRange(1,1,1,EVENT_HEADERS_V2.length).setValues([EVENT_HEADERS_V2]);
    sheet.setFrozenRows(1);
    return sheet;
  }

  var headers = sheet.getRange(1,1,1,Math.max(sheet.getLastColumn(), EVENT_HEADERS_V2.length)).getValues()[0];
  var changed = false;
  EVENT_HEADERS_V2.forEach(function(h, i) {
    if (String(headers[i] || "").trim() !== h) {
      sheet.getRange(1,i+1).setValue(h);
      changed = true;
    }
  });
  if (changed) SpreadsheetApp.flush();
  return sheet;
}

function normalizeEventStatus(status) {
  var s = String(status || "PLANIFICAT").trim().toUpperCase();
  return ["PLANIFICAT","ACTIV","ARHIVAT"].indexOf(s) >= 0 ? s : "PLANIFICAT";
}

function parseOptionalEventDateTime(value) {
  if (!value) return null;
  var d = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function validateActivationDates(activeFrom, activeUntil) {
  if (!activeFrom) throw new Error("Câmpul „Activ din” este obligatoriu.");
  if (activeUntil && activeUntil.getTime() <= activeFrom.getTime()) {
    throw new Error("„Activ până la” trebuie să fie după „Activ din”.");
  }
}

function eventRecordFromRowV2(row) {
  var activeFrom = row[7] ? parseOptionalEventDateTime(row[7]) : null;
  var activeUntil = row[8] ? parseOptionalEventDateTime(row[8]) : null;
  return {
    id: String(row[0] || "").trim(),
    name: String(row[1] || "").trim(),
    congregation: String(row[2] || "").trim(),
    date: String(row[3] || "").trim(),
    time: String(row[4] || "").trim(),
    location: String(row[5] || "").trim(),
    status: normalizeEventStatus(row[6]),
    storedStatus: normalizeEventStatus(row[6]),
    activeFrom: activeFrom ? activeFrom.toISOString() : "",
    activeUntil: activeUntil ? activeUntil.toISOString() : "",
    version: Number(row[10]) || 0,
    createdAt: row[11] ? new Date(row[11]).toISOString() : "",
    updatedAt: row[12] ? new Date(row[12]).toISOString() : "",
    updatedBy: String(row[13] || "").trim(),
    configJSON: String(row[9] || "").trim(),
    configFileId: String(row[14] || "").trim(),
    folderId: String(row[15] || "").trim()
  };
}

function getEventRowsV2(ss) {
  var sheet = ensureEventsSheetV2(ss);
  if (sheet.getLastRow() < 2) return [];
  var lastCol = Math.max(16, sheet.getLastColumn());
  return sheet.getRange(2,1,sheet.getLastRow()-1,lastCol).getValues()
    .filter(function(row){ return String(row[0] || "").trim(); })
    .map(eventRecordFromRowV2);
}

function findEventRowV2(ss, eventId) {
  var sheet = ensureEventsSheetV2(ss);
  var id = String(eventId || "").trim();
  if (!id || sheet.getLastRow() < 2) return null;
  var values = sheet.getRange(2,1,sheet.getLastRow()-1,Math.max(16,sheet.getLastColumn())).getValues();
  for (var i=0;i<values.length;i++) {
    if (String(values[i][0] || "").trim() === id) {
      return { sheet: sheet, rowNumber: i+2, row: values[i], record: eventRecordFromRowV2(values[i]) };
    }
  }
  return null;
}

function nextEventIdV2(ss) {
  var rows = getEventRowsV2(ss);
  var max = 0;
  rows.forEach(function(e){
    var m = String(e.id).match(/^EVT-(\d+)$/i);
    if (m) max = Math.max(max, Number(m[1]));
  });
  return "EVT-" + String(max + 1).padStart(3,"0");
}

function ensureEventOperationalSheetsV2(ss, eventId) {
  var result = {};
  var inviteName = eventId + "_Invitati";
  var participantName = eventId + "_Participanti";

  var invite = ss.getSheetByName(inviteName);
  if (!invite) invite = ss.insertSheet(inviteName);
  if (invite.getLastRow() === 0) {
    invite.getRange(1,1,1,7).setValues([[
      "Prenume","Nume","ID","Activ","CreatedAt","UpdatedAt","EventID"
    ]]);
    invite.setFrozenRows(1);
  }

  var participant = ss.getSheetByName(participantName);
  if (!participant) participant = ss.insertSheet(participantName);
  if (participant.getLastRow() === 0) {
    participant.getRange(1,1,1,11).setValues([[
      "Prenume","Nume","Participa","Persoane","ProdusID1","Cantitate1",
      "ProdusID2","Cantitate2","Observatii","CreatedAt","EventID"
    ]]);
    participant.setFrozenRows(1);
  }

  result.invitiati = inviteName;
  result.participanti = participantName;
  return result;
}

function migrateLegacyOperationalDataToEventV2(ss, eventId) {
  var target = ensureEventOperationalSheetsV2(ss, eventId);
  var oldInv = ss.getSheetByName("Invitati");
  var oldPart = ss.getSheetByName("Participanti");

  var targetInv = ss.getSheetByName(target.invitiati);
  var targetPart = ss.getSheetByName(target.participanti);

  if (oldInv && oldInv.getLastRow() > 1 && targetInv.getLastRow() <= 1) {
    var rows = oldInv.getRange(2,1,oldInv.getLastRow()-1,Math.min(oldInv.getLastColumn(),2)).getValues();
    var mapped = rows.filter(function(r){return String(r[0]||"").trim() || String(r[1]||"").trim();})
      .map(function(r){return [r[0]||"",r[1]||"","",true,new Date(),new Date(),eventId];});
    if (mapped.length) targetInv.getRange(2,1,mapped.length,7).setValues(mapped);
  }

  if (oldPart && oldPart.getLastRow() > 1 && targetPart.getLastRow() <= 1) {
    var width = Math.min(oldPart.getLastColumn(),10);
    var rows2 = oldPart.getRange(2,1,oldPart.getLastRow()-1,width).getValues();
    var mapped2 = rows2.filter(function(r){return r.some(function(v){return String(v||"").trim()!=="";});})
      .map(function(r){
        return [
          r[0]||"",r[1]||"",r[2]||"",r[3]||"",r[4]||"",r[5]||"",
          r[6]||"",r[7]||"",r[8]||"",r[9]||new Date(),eventId
        ];
      });
    if (mapped2.length) targetPart.getRange(2,1,mapped2.length,11).setValues(mapped2);
  }
}

function migrateLegacyEventsV2(ss) {
  var sheet = ensureEventsSheetV2(ss);
  var rows = getEventRowsV2(ss);
  if (rows.length) {
    rows.forEach(function(e){
      ensureEventOperationalSheetsV2(ss,e.id);
      var found = findEventRowV2(ss,e.id);
      var config = readEventConfig(found.record);
      if (!config) return;
      var folder = getOrCreateEventFolder(e.id,e.name,e.folderId);
      var file = getEventConfigFile(folder,e.id,config,e.configFileId);
      found.row[14] = file.getId();
      found.row[15] = folder.getId();
      found.row[9] = "";
      sheet.getRange(found.rowNumber,1,1,16).setValues([found.row]);
    });
  }
  var legacy = ss.getSheetByName("Configurare");
  if (!rows.length && legacy && legacy.getLastRow() >= 2) {
    var legacyRec = getCentralConfigRecord(ss);
    if (legacyRec && legacyRec.config) {
      var id = "EVT-001";
      var now = new Date();
      var cfg = legacyRec.config;
      cfg.event = cfg.event || {};
      cfg.event.eventId = id;
      var folder = getOrCreateEventFolder(id,cfg.event.name || "Destindere", "");
      var file = getEventConfigFile(folder,id,cfg,"");
      sheet.getRange(2,1,1,16).setValues([[
        id,cfg.event.name||"Eveniment",cfg.event.congregation||"",cfg.event.date||"",
        cfg.event.time||"",cfg.event.location||"","ACTIV",now,"", "",1,now,now,
        legacyRec.updatedBy||"",file.getId(),folder.getId()
      ]]);
      ensureEventOperationalSheetsV2(ss,id);
      migrateLegacyOperationalDataToEventV2(ss,id);
    }
  }
  SpreadsheetApp.flush();
}

function getEventsResponseV2(ss) {
  migrateLegacyEventsV2(ss);
  return jsonOutput({success:true,events:getEventRowsV2(ss)});
}

function getEventResponseV2(ss,eventId,includeConfig) {
  migrateLegacyEventsV2(ss);
  var found = findEventRowV2(ss,eventId);
  if (!found) throw new Error("Evenimentul nu a fost găsit.");
  var config = readEventConfig(found.record);
  if (!config) throw new Error("Fișierul config.json al evenimentului nu este disponibil.");
  return jsonOutput({
    success:true,
    event:Object.assign(found.record,{config:config})
  });
}

function getActiveEventResponseV2(ss) {
  migrateLegacyEventsV2(ss);
  var events = getEventRowsV2(ss);
  var active = events.find(function(e){return e.status==="ACTIV";});
  if (!active) return jsonOutput({success:true,event:null});
  var config = readEventConfig(active);
  if (!config) throw new Error("Configurația evenimentului activ nu este disponibilă.");
  return jsonOutput({success:true,event:Object.assign(active,{config:config})});
}

function getActiveEventIdV2(ss) {
  migrateLegacyEventsV2(ss);
  var active = getEventRowsV2(ss).find(function(e){return e.status==="ACTIV";});
  return active ? active.id : "";
}

function authorizeEventAdminV2(ss,data) {
  var userId = cleanValue(getValue(data,["updatedBy"]));
  if (!isActiveAdmin(ss,userId)) throw new Error("Utilizatorul nu este autorizat.");
  return userId;
}

function writeEventRowV2(found, config, status, activeFrom, activeUntil, userId) {
  var now = new Date();
  var old = found.record;
  config.event = config.event || {};
  config.event.eventId = old.id;
  config.event.name = cleanValue(config.event.name) || old.name;
  config.event.congregation = cleanValue(config.event.congregation) || old.congregation;
  config.event.date = cleanValue(config.event.date) || old.date;
  config.event.time = cleanValue(config.event.time) || old.time;
  config.event.location = cleanValue(config.event.location) || old.location;

  var folder = getOrCreateEventFolder(old.id,config.event.name,old.folderId);
  var file = getEventConfigFile(folder,old.id,config,old.configFileId);

  var row = found.row.slice();
  while (row.length < 16) row.push("");
  row[0]=old.id; row[1]=config.event.name; row[2]=config.event.congregation;
  row[3]=config.event.date; row[4]=config.event.time; row[5]=config.event.location;
  row[6]=normalizeEventStatus(status);
  row[7]=activeFrom || ""; row[8]=activeUntil || "";
  row[9]="";
  row[10]=Number(old.version||0)+1; row[11]=old.createdAt ? new Date(old.createdAt) : now;
  row[12]=now; row[13]=userId; row[14]=file.getId(); row[15]=folder.getId();
  found.sheet.getRange(found.rowNumber,1,1,16).setValues([row]);
  return Object.assign(eventRecordFromRowV2(row),{config:config});
}

function createEventV2(ss,data) {
  var userId = authorizeEventAdminV2(ss,data);
  migrateLegacyEventsV2(ss);
  var sourceId = cleanValue(getValue(data,["sourceEventId"]));
  var source = findEventRowV2(ss,sourceId);
  if (!source) {
    var activeId = getActiveEventIdV2(ss);
    source = findEventRowV2(ss,activeId);
  }
  if (!source) throw new Error("Nu există un eveniment sursă pentru clonare.");

  var sourceConfig = readEventConfig(source.record);
  if (!sourceConfig) throw new Error("Configurația evenimentului sursă nu este disponibilă.");

  var id = nextEventIdV2(ss);
  var cloned = JSON.parse(JSON.stringify(sourceConfig));
  cloned.event = cloned.event || {};
  cloned.event.eventId = id;

  var name = cloned.event.name || source.record.name || "Eveniment nou";
  var folder = getOrCreateEventFolder(id,name,"");
  var file = getEventConfigFile(folder,id,cloned,"");
  ensureEventOperationalSheetsV2(ss,id);

  var now = new Date();
  var sheet = ensureEventsSheetV2(ss);
  sheet.appendRow([
    id,name,cloned.event.congregation||source.record.congregation||"",
    cloned.event.date||source.record.date||"",cloned.event.time||source.record.time||"",
    cloned.event.location||source.record.location||"","PLANIFICAT","","","",
    1,now,now,userId,file.getId(),folder.getId()
  ]);
  SpreadsheetApp.flush();

  return jsonOutput({
    success:true,
    event:Object.assign({
      id:id,name:name,congregation:cloned.event.congregation||"",
      date:cloned.event.date||"",time:cloned.event.time||"",location:cloned.event.location||"",
      status:"PLANIFICAT",storedStatus:"PLANIFICAT",activeFrom:"",activeUntil:"",
      version:1,configFileId:file.getId(),folderId:folder.getId()
    },{config:cloned})
  });
}

function saveEventV2(ss,data) {
  try {
    var userId = authorizeEventAdminV2(ss,data);
    migrateLegacyEventsV2(ss);
    var eventId = cleanValue(getValue(data,["eventId"]));
    var found = findEventRowV2(ss,eventId);
    if (!found) throw new Error("Evenimentul nu a fost găsit.");
    var raw = getValue(data,["config"]);
    if (!raw) throw new Error("Configurația lipsește.");
    var config = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!config || typeof config !== "object") throw new Error("Configurația este invalidă.");

    var status = found.record.status;
    var requestedStatus = cleanValue(getValue(data,["status"])).toUpperCase();
    if (requestedStatus && requestedStatus !== status) {
      if (requestedStatus === "ACTIV") throw new Error("Folosește „Setează ACTIV” pentru a activa un eveniment.");
      status = requestedStatus === "ARHIVAT" ? "ARHIVAT" : "PLANIFICAT";
    }

    var activeFrom = parseOptionalEventDateTime(getValue(data,["activeFrom"])) || parseOptionalEventDateTime(found.record.activeFrom);
    var activeUntil = parseOptionalEventDateTime(getValue(data,["activeUntil"])) || parseOptionalEventDateTime(found.record.activeUntil);
    if (status === "ACTIV") validateActivationDates(activeFrom,activeUntil);

    var saved = writeEventRowV2(found,config,status,activeFrom ? activeFrom : "",activeUntil ? activeUntil : "",userId);
    return jsonOutput({success:true,event:saved});
  } catch (error) {
    return jsonOutput({success:false,message:error.toString()});
  }
}

function activateEventV2(ss,data) {
  try {
    var userId = authorizeEventAdminV2(ss,data);
    migrateLegacyEventsV2(ss);
    var eventId = cleanValue(getValue(data,["eventId"]));
    var found = findEventRowV2(ss,eventId);
    if (!found) throw new Error("Evenimentul nu a fost găsit.");

    var requestedFrom = parseOptionalEventDateTime(getValue(data,["activeFrom"]));
    var requestedUntil = parseOptionalEventDateTime(getValue(data,["activeUntil"]));
    var activeFrom = requestedFrom || parseOptionalEventDateTime(found.record.activeFrom);
    var activeUntil = requestedUntil || parseOptionalEventDateTime(found.record.activeUntil);
    validateActivationDates(activeFrom,activeUntil);

    var config = readEventConfig(found.record);
    if (!config) throw new Error("Configurația evenimentului nu este disponibilă.");

    var events = getEventRowsV2(ss);
    events.forEach(function(e){
      var row = findEventRowV2(ss,e.id);
      if (!row) return;
      if (e.id === eventId) {
        var saved = row.row.slice();
        while(saved.length<16)saved.push("");
        saved[6]="ACTIV"; saved[7]=activeFrom; saved[8]=activeUntil||"";
        saved[12]=new Date(); saved[13]=userId;
        row.sheet.getRange(row.rowNumber,1,1,16).setValues([saved]);
      } else if (e.status === "ACTIV") {
        var old = row.row.slice();
        while(old.length<16)old.push("");
        old[6]="ARHIVAT"; old[12]=new Date(); old[13]=userId;
        row.sheet.getRange(row.rowNumber,1,1,16).setValues([old]);
      }
    });
    ensureEventOperationalSheetsV2(ss,eventId);
    SpreadsheetApp.flush();
    return getEventResponseV2(ss,eventId);
  } catch (error) {
    return jsonOutput({success:false,message:error.toString()});
  }
}

function archiveEventV2(ss,data) {
  try {
    var userId = authorizeEventAdminV2(ss,data);
    migrateLegacyEventsV2(ss);
    var eventId = cleanValue(getValue(data,["eventId"]));
    var found = findEventRowV2(ss,eventId);
    if (!found) throw new Error("Evenimentul nu a fost găsit.");
    if (found.record.status === "ACTIV") throw new Error("Evenimentul ACTIV trebuie mai întâi înlocuit cu alt eveniment.");
    var row = found.row.slice(); while(row.length<16)row.push("");
    row[6]="ARHIVAT"; row[12]=new Date(); row[13]=userId;
    found.sheet.getRange(found.rowNumber,1,1,16).setValues([row]);
    return getEventResponseV2(ss,eventId);
  } catch (error) {
    return jsonOutput({success:false,message:error.toString()});
  }
}

function deleteEventV2(ss,data) {
  try {
    var userId = authorizeEventAdminV2(ss,data);
    migrateLegacyEventsV2(ss);
    var eventId = cleanValue(getValue(data,["eventId"]));
    var found = findEventRowV2(ss,eventId);
    if (!found) throw new Error("Evenimentul nu a fost găsit.");
    if (found.record.status === "ACTIV") throw new Error("Evenimentul ACTIV nu poate fi șters. Activează mai întâi alt eveniment.");

    var folderId = found.record.folderId;
    var sheetNames = [eventId+"_Invitati",eventId+"_Participanti"];
    sheetNames.forEach(function(name){
      var sh=ss.getSheetByName(name); if(sh) ss.deleteSheet(sh);
    });

    if (folderId) {
      try { DriveApp.getFolderById(folderId).setTrashed(true); } catch(e) {}
    }

    found.sheet.deleteRow(found.rowNumber);
    SpreadsheetApp.flush();
    return jsonOutput({success:true,eventId:eventId,deletedBy:userId});
  } catch(error) {
    return jsonOutput({success:false,message:error.toString()});
  }
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