/* ==========================================================
   MEMORIES UPLOAD
========================================================== */

document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("memoryFiles");

  const selectedFiles = document.getElementById("selectedFiles");

  const uploadButton = document.getElementById("uploadMemories");

  const uploadStatus = document.getElementById("uploadStatus");

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

    let uploaded = 0;

    try {
      for (const file of filesToUpload) {
        uploadStatus.textContent = `Se încarcă ${uploaded + 1} din ${filesToUpload.length}: ${file.name}`;

        const base64 = await fileToBase64(file);

        const formData = new URLSearchParams();

        formData.append("action", "uploadMemory");

        formData.append("fileName", file.name);

        formData.append(
          "fileCategory",
          file.type.startsWith("video/") ? "video" : "photo",
        );

        formData.append("mimeType", file.type || "application/octet-stream");

        formData.append("fileData", base64);

        const response = await fetch(CONFIG.apiUrl, {
          method: "POST",

          body: formData,
        });

        const result = await response.json();

        if (!result || result.result !== "success") {
          throw new Error(result.message || "Fișierul nu a putut fi încărcat.");
        }

        uploaded++;
      }

      uploadStatus.textContent = `✓ ${uploaded} fișier(e) încărcat(e) cu succes.`;

      selectedFiles.innerHTML = "";

      fileInput.value = "";

      filesToUpload = [];
    } catch (error) {
      console.error("Eroare upload:", error);

      uploadStatus.textContent =
        "Eroare la încărcarea fișierelor. Încearcă din nou.";
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
