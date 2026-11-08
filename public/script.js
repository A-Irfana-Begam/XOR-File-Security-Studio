
const fileInput = document.getElementById("fileInput");
const uploadArea = document.getElementById("uploadArea");
const fileInfo = document.getElementById("fileInfo");
const uploadTitle = document.getElementById("uploadTitle");

const keyInput = document.getElementById("keyInput");
const toggleKey = document.getElementById("toggleKey");
const strengthBar = document.getElementById("strengthBar");
const strengthText = document.getElementById("strengthText");

const encryptBtn = document.getElementById("encryptBtn");
const decryptBtn = document.getElementById("decryptBtn");
const actionInput = document.getElementById("actionInput");

const processForm = document.getElementById("processForm");
const processBtn = document.getElementById("processBtn");
const buttonText = document.getElementById("buttonText");
const processVisual = document.getElementById("processVisual");

const message = document.getElementById("message");
const resultPanel = document.getElementById("resultPanel");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");
const downloadLink = document.getElementById("downloadLink");

let selectedFile = null;
let currentDownloadUrl = null;

function getAction() {
    return actionInput.value;
}

function showMessage(text, type = "error") {
    message.textContent = text;
    message.className = `message ${type}`;
}

function clearMessage() {
    message.textContent = "";
    message.className = "message";
    resultPanel.classList.remove("show");
}

function updateFileType() {
    const action = getAction();

    fileInput.value = "";
    selectedFile = null;
    fileInfo.textContent = "";
    clearMessage();

    if (currentDownloadUrl) {
        URL.revokeObjectURL(currentDownloadUrl);
        currentDownloadUrl = null;
    }

    fileInput.accept = action === "encrypt" ? ".txt" : ".bin";

    uploadTitle.textContent = action === "encrypt"
        ? "Drop your TXT file here"
        : "Drop your encrypted BIN file here";
}

function setAction(action) {
    actionInput.value = action;

    encryptBtn.classList.toggle("active", action === "encrypt");
    decryptBtn.classList.toggle("active", action === "decrypt");

    buttonText.textContent = action === "encrypt"
        ? "ENCRYPT FILE"
        : "DECRYPT FILE";

    updateFileType();
}

encryptBtn.addEventListener("click", () => setAction("encrypt"));
decryptBtn.addEventListener("click", () => setAction("decrypt"));

uploadArea.addEventListener("click", () => fileInput.click());

uploadArea.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        fileInput.click();
    }
});

fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];

    if (file) {
        handleFile(file);
    }
});

function handleFile(file) {
    const action = getAction();
    const extension = file.name.split(".").pop().toLowerCase();

    const expectedExtension = action === "encrypt" ? "txt" : "bin";

    if (extension !== expectedExtension) {
        selectedFile = null;
        fileInput.value = "";
        fileInfo.textContent = "";
        showMessage(`Please select a .${expectedExtension} file.`);
        return;
    }

    if (file.size === 0) {
        selectedFile = null;
        fileInput.value = "";
        showMessage("Selected file is empty.");
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        selectedFile = null;
        fileInput.value = "";
        showMessage("Maximum file size is 10 MB.");
        return;
    }

    selectedFile = file;
    fileInfo.textContent =
        `✓ ${file.name} (${formatSize(file.size)})`;

    clearMessage();
}

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} Bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Drag and drop
uploadArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    uploadArea.classList.add("drag-over");
});

uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("drag-over");
});

uploadArea.addEventListener("drop", (event) => {
    event.preventDefault();
    uploadArea.classList.remove("drag-over");

    const file = event.dataTransfer.files[0];

    if (file) {
        handleFile(file);
    }
});

// Show / hide key
toggleKey.addEventListener("click", () => {
    const isPassword = keyInput.type === "password";

    keyInput.type = isPassword ? "text" : "password";
    toggleKey.textContent = isPassword ? "HIDE" : "SHOW";
});

// Key strength
function checkKeyStrength(key) {
    let score = 0;

    if (key.length >= 8) score++;
    if (key.length >= 12) score++;
    if (/[A-Z]/.test(key)) score++;
    if (/[a-z]/.test(key)) score++;
    if (/[0-9]/.test(key)) score++;
    if (/[^A-Za-z0-9]/.test(key)) score++;

    const percentage = Math.round((score / 6) * 100);

    strengthBar.style.width = `${percentage}%`;

    if (!key) {
        strengthText.textContent = "Key strength: Not entered";
    } else if (score <= 2) {
        strengthText.textContent = "Key strength: Weak";
    } else if (score <= 4) {
        strengthText.textContent = "Key strength: Medium";
    } else {
        strengthText.textContent = "Key strength: Strong";
    }
}

keyInput.addEventListener("input", () => {
    checkKeyStrength(keyInput.value);
    clearMessage();
});

// Process file
processForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    const key = keyInput.value;
    const action = getAction();

    if (!selectedFile) {
        showMessage("Please select a file first.");
        return;
    }

    if (!key.trim()) {
        showMessage("Please enter your encryption key.");
        keyInput.focus();
        return;
    }

    if (key.length < 8) {
        showMessage("Weak key! Use at least 8 characters.");
        return;
    }

    if (
        key.length < 12 ||
        !/[A-Z]/.test(key) ||
        !/[a-z]/.test(key) ||
        !/[0-9]/.test(key) ||
        !/[^A-Za-z0-9]/.test(key)
    ) {
        showMessage(
            "Improve your key: use 12+ characters with uppercase, lowercase, numbers and symbols."
        );
        return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("key", key);
    formData.append("action", action);

    processBtn.disabled = true;
    buttonText.textContent = "PROCESSING...";
    processVisual.classList.add("processing");

    try {
        const response = await fetch("/process", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "File processing failed.");
        }

        const blob = await response.blob();

        const disposition = response.headers.get("Content-Disposition");
        let filename = action === "encrypt"
            ? "encrypted.bin"
            : "decrypted.txt";

        if (disposition) {
            const match = disposition.match(/filename="?([^"]+)"?/);
            if (match) filename = match[1];
        }

        if (currentDownloadUrl) {
            URL.revokeObjectURL(currentDownloadUrl);
        }

        currentDownloadUrl = URL.createObjectURL(blob);

        downloadLink.href = currentDownloadUrl;
        downloadLink.download = filename;

        resultTitle.textContent = action === "encrypt"
            ? "Encryption Successful"
            : "Decryption Successful";

        resultText.textContent =
            `${filename} is ready to download.`;

        resultPanel.classList.add("show");

        showMessage(
            action === "encrypt"
                ? "Your file has been encrypted successfully."
                : "Your file has been decrypted successfully.",
            "success"
        );

        resultPanel.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });

    } catch (error) {
        showMessage(error.message || "Something went wrong.");
    } finally {
        processBtn.disabled = false;
        buttonText.textContent = action === "encrypt"
            ? "ENCRYPT FILE"
            : "DECRYPT FILE";

        processVisual.classList.remove("processing");
    }
});

setAction("encrypt");
