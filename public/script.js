const fileInput = document.getElementById("fileInput");
const uploadArea = document.getElementById("uploadArea");
const fileInfo = document.getElementById("fileInfo");
const keyInput = document.getElementById("keyInput");
const fileForm = document.getElementById("fileForm");
const actionInput = document.getElementById("action");
const processBtn = document.getElementById("processBtn");
const buttonText = document.getElementById("buttonText");
const message = document.getElementById("message");
const resultPanel = document.getElementById("resultPanel");
const resultText = document.getElementById("resultText");
const downloadLink = document.getElementById("downloadLink");

let selectedFile = null;
let downloadURL = null;

// Switch encryption and decryption modes
document.querySelectorAll(".operation-btn").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".operation-btn").forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        actionInput.value = button.dataset.action;

        buttonText.textContent =
            actionInput.value === "encrypt"
                ? "ENCRYPT FILE"
                : "DECRYPT FILE";

        fileInput.accept =
            actionInput.value === "encrypt"
                ? ".txt"
                : ".bin";

        resetResults();
        clearFile();
    });
});

// Open file browser
uploadArea.addEventListener("click", event => {
    if (event.target !== fileInput) {
        fileInput.click();
    }
});

// File selection
fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
        handleFile(fileInput.files[0]);
    }
});

// Drag and drop
uploadArea.addEventListener("dragover", event => {
    event.preventDefault();
    uploadArea.classList.add("dragover");
});

uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover");
});

uploadArea.addEventListener("drop", event => {
    event.preventDefault();
    uploadArea.classList.remove("dragover");

    const file = event.dataTransfer.files[0];

    if (file) {
        handleFile(file);
    }
});

// Validate selected file
function handleFile(file) {
    const action = actionInput.value;
    const extension = file.name.split(".").pop().toLowerCase();

    if (action === "encrypt" && extension !== "txt") {
        showError("Please select a .txt file for encryption.");
        clearFile();
        return;
    }

    if (action === "decrypt" && extension !== "bin") {
        showError("Please select an encrypted .bin file.");
        clearFile();
        return;
    }

    selectedFile = file;

    fileInfo.style.display = "block";
    fileInfo.textContent =
        "✓ " + file.name + " (" + formatSize(file.size) + ")";

    hideMessage();
    resetResults();
}

// Format file size
function formatSize(bytes) {
    if (bytes < 1024) return bytes + " bytes";
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / 1048576).toFixed(2) + " MB";
}

// Show or hide password
document.getElementById("toggleKey").addEventListener("click", () => {
    const visible = keyInput.type === "text";

    keyInput.type = visible ? "password" : "text";

    document.getElementById("toggleKey").textContent =
        visible ? "SHOW" : "HIDE";
});

// Process file
fileForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!selectedFile) {
        showError("Please select a file first.");
        return;
    }

    const key = keyInput.value;

    if (!key.trim()) {
        showError("Please enter your encryption key.");
        return;
    }

    const formData = new FormData();

    formData.append("file", selectedFile);
    formData.append("key", key);
    formData.append("action", actionInput.value);

    processBtn.disabled = true;
    buttonText.textContent = "PROCESSING...";

    hideMessage();
    resetResults();

    try {
        const response = await fetch("/process", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Processing failed.");
        }

        const blob = await response.blob();

        if (downloadURL) {
            URL.revokeObjectURL(downloadURL);
        }

        downloadURL = URL.createObjectURL(blob);

        const filename =
            actionInput.value === "encrypt"
                ? selectedFile.name.replace(/\.txt$/i, "") + "_encrypted.bin"
                : selectedFile.name.replace(/\.bin$/i, "") + "_decrypted.txt";

        downloadLink.href = downloadURL;
        downloadLink.download = filename;

        resultText.textContent =
            filename + " is ready to download.";

        resultPanel.style.display = "flex";

    } catch (error) {
        showError(error.message);
    } finally {
        processBtn.disabled = false;

        buttonText.textContent =
            actionInput.value === "encrypt"
                ? "ENCRYPT FILE"
                : "DECRYPT FILE";
    }
});

// Display errors
function showError(text) {
    message.textContent = "⚠ " + text;
    message.className = "message error";
}

function hideMessage() {
    message.textContent = "";
    message.className = "message";
}

// Reset results
function resetResults() {
    resultPanel.style.display = "none";

    if (downloadURL) {
        URL.revokeObjectURL(downloadURL);
        downloadURL = null;
    }
}

// Clear selected file
function clearFile() {
    selectedFile = null;
    fileInput.value = "";
    fileInfo.style.display = "none";
    hideMessage();
}

window.addEventListener("beforeunload", () => {
    if (downloadURL) {
        URL.revokeObjectURL(downloadURL);
    }
});
