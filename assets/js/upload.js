/* ==========================================================
   MEMORIES UPLOAD
   ========================================================== */

document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("memoryFiles");

  const selectedFiles = document.getElementById("selectedFiles");

  const uploadButton = document.getElementById("uploadMemories");

  const uploadStatus = document.getElementById("uploadStatus");

  const uploadProgressContainer = document.getElementById(
    "uploadProgressContainer",
  );

  const uploadProgressBar = document.getElementById("uploadProgressBar");

  const uploadProgressText = document.getElementById("uploadProgressText");

  if (!fileInput || !selectedFiles || !uploadButton) {
    return;
  }

  let filesToUpload = [];

  /* ==========================================================
     SELECT FILES
     ========================================================== */

  fileInput.addEventListener("change", function () {
    filesToUpload = Array.from(fileInput.files);

    selectedFiles.innerHTML = "";

    if (filesToUpload.length === 0) {
      uploadButton.disabled = true;

      if (uploadProgressContainer) {
        uploadProgressContainer.style.display = "none";
      }

      return;
    }

    filesToUpload.forEach(function (file) {
      const item = document.createElement("div");

      item.className = "selected-file";

      const icon = file.type.startsWith("video/") ? "🎥" : "📸";

      const size = formatFileSize(file.size);

      item.innerHTML = `

        <span class="selected-file-icon">
          ${icon}
        </span>

        <span class="selected-file-name">
          ${file.name}
        </span>

        <span class="selected-file-size">
          ${size}
        </span>

      `;

      selectedFiles.appendChild(item);
    });

    uploadButton.disabled = false;

    uploadStatus.textContent = `${filesToUpload.length} fișier(e) selectat(e).`;

    if (uploadProgressContainer) {
      uploadProgressContainer.style.display = "none";
    }

    if (uploadProgressBar) {
      uploadProgressBar.style.width = "0%";
    }

    if (uploadProgressText) {
      uploadProgressText.textContent = "";
    }
  });

  /* ==========================================================
     UPLOAD
     ========================================================== */

  uploadButton.addEventListener("click", async function () {
    if (filesToUpload.length === 0) {
      return;
    }

    uploadButton.disabled = true;

    uploadStatus.textContent = "Se pregătesc fișierele...";

    if (uploadProgressContainer) {
      uploadProgressContainer.style.display = "block";
    }

    if (uploadProgressBar) {
      uploadProgressBar.style.width = "0%";
    }

    if (uploadProgressText) {
      uploadProgressText.textContent = "0%";
    }

    let uploaded = 0;

    try {
      for (const file of filesToUpload) {
        /* ==================================================
             LIMITE
             FOTO = 10 MB
             VIDEO = 50 MB
             ================================================== */

        const maxPhotoSize = 10 * 1024 * 1024;

        const maxVideoSize = 50 * 1024 * 1024;

        if (file.type.startsWith("video/") && file.size > maxVideoSize) {
          throw new Error(
            `❌ Videoclipul "${file.name}" depășește limita de 50 MB.`,
          );
        }

        if (!file.type.startsWith("video/") && file.size > maxPhotoSize) {
          throw new Error(
            `❌ Fotografia "${file.name}" depășește limita de 10 MB.`,
          );
        }

        /* ==================================================
             STATUS
             ================================================== */

        uploadStatus.textContent = `Se pregătește ${uploaded + 1} din ${filesToUpload.length}: ${file.name}`;

        /* ==================================================
             FILE → BASE64
             ================================================== */

        const base64 = await fileToBase64(file);

        /* ==================================================
             FORM DATA
             ================================================== */

        const formData = new URLSearchParams();

        formData.append("action", "uploadMemory");

        formData.append("fileName", file.name);

        /* ==================================================
             FOTO / VIDEO
             ================================================== */

        formData.append(
          "fileCategory",
          file.type.startsWith("video/") ? "video" : "photo",
        );

        /* ==================================================
             MIME TYPE
             ================================================== */

        formData.append("mimeType", file.type || "application/octet-stream");

        /* ==================================================
             BASE64
             ================================================== */

        formData.append("fileData", base64);

        /* ==================================================
             UPLOAD
             ================================================== */

        uploadStatus.textContent = `Se încarcă ${uploaded + 1} din ${filesToUpload.length}: ${file.name}`;

        const response = await fetch(CONFIG.apiUrl, {
          method: "POST",
          body: formData,
        });

        /* ==================================================
             RĂSPUNS
             ================================================== */

        if (!response.ok) {
          throw new Error("❌ Serverul a returnat eroarea " + response.status);
        }

        const result = await response.json();

        console.log("Răspuns upload:", result);

        if (!result || result.result !== "success") {
          throw new Error(
            "❌ " + (result.message || "Fișierul nu a putut fi încărcat."),
          );
        }

        /* ==================================================
             FIȘIER ÎNCĂRCAT
             ================================================== */

        uploaded++;

        /* ==================================================
             PROGRES PE FIȘIERE
             ================================================== */

        const progress = Math.round((uploaded / filesToUpload.length) * 100);

        if (uploadProgressBar) {
          uploadProgressBar.style.width = progress + "%";
        }

        if (uploadProgressText) {
          uploadProgressText.textContent = progress + "%";
        }
      }

      /* ======================================================
           FINAL
           ====================================================== */

      uploadStatus.textContent = `✓ ${uploaded} fișier(e) încărcat(e) cu succes.`;

      if (uploadProgressBar) {
        uploadProgressBar.style.width = "100%";
      }

      if (uploadProgressText) {
        uploadProgressText.textContent = "100%";
      }

      /* ======================================================
           CURĂȚARE
           ====================================================== */

      selectedFiles.innerHTML = "";

      fileInput.value = "";

      filesToUpload = [];
    } catch (error) {
      console.error("Eroare upload:", error);

      uploadStatus.textContent =
        "❌ " + (error.message || "Eroare la încărcarea fișierelor.");
    } finally {
      uploadButton.disabled = filesToUpload.length === 0;
    }
  });

  /* ==========================================================
     FILE → BASE64
     ========================================================== */

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();

      reader.onload = function () {
        const result = reader.result;

        const base64 = result.split(",")[1];

        resolve(base64);
      };

      reader.onerror = function () {
        reject(new Error("Fișierul nu poate fi citit."));
      };

      reader.readAsDataURL(file);
    });
  }

  /* ==========================================================
     FILE SIZE
     ========================================================== */

  function formatFileSize(bytes) {
    if (bytes < 1024) {
      return bytes + " B";
    }

    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + " KB";
    }

    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }
});
