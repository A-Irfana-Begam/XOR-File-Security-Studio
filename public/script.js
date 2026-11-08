const fileInput = document.getElementById("fileInput");
const uploadArea = document.getElementById("uploadArea");
const fileInfo = document.getElementById("fileInfo");
const keyInput = document.getElementById("keyInput");
const toggleKey = document.getElementById("toggleKey");
const strengthBar = document.getElementById("strengthBar");
const strengthText = document.getElementById("strengthText");
const actionInput = document.getElementById("action");
const processBtn = document.getElementById("processBtn");
const buttonText = document.getElementById("buttonText");
const processVisual = document.getElementById("processVisual");
const message = document.getElementById("message");
const resultPanel = document.getElementById("resultPanel");
const resultText = document.getElementById("resultText");
const downloadLink = document.getElementById("downloadLink");

let selectedFile = null;
let downloadUrl = null;

// Encrypt / Decrypt mode
document.querySelectorAll(".operation-btn").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".operation-btn")
            .forEach(btn => btn.classList.remove("active"));

        button.classList.add("active");

        const mode = button.dataset.action;
        actionInput.value = mode;

        buttonText.textContent =
            mode === "encrypt" ? "ENCRYPT MY FILE" : "DECRYPT MY FILE";

        fileInput.accept = mode === "encrypt" ? ".txt" : ".bin";

        uploadArea.querySelector("small").textContent =
            mode === "encrypt" ? "TEXT FILES • .TXT" : "ENCRYPTED FILES • .BIN";

        resetResult();
        clearFile();
    });
});

// Upload file
uploadArea.addEventListener("click", event => {
    if (event.target === fileInput) return;
    fileInput.click();
});

fileInput.addEventListener("change", () => {
    if (fileInput.files.length) {
        selectFile(fileInput.files[0]);
    }
});

function selectFile(file) {
    const mode = actionInput.value;
    const extension = file.name.split(".").pop().toLowerCase();

    if (mode === "encrypt" && extension !== "txt") {
        showMessage("Please select a .txt file for encryption.", "error");
        clearFile();
        return;
    }

    if (mode === "decrypt" && extension !== "bin") {
        showMessage("Please select an encrypted .bin file for decryption.", "error");
        clearFile();
        return;
    }

    if (file.size === 0) {
        showMessage("This file is empty. Please select another file.", "error");
        clearFile();
        return;
    }

    selectedFile = file;
    fileInfo.textContent =
        `✓ ${file.name} • ${formatSize(file.size)}`;

    hideMessage();
    resetResult();
}

function clearFile() {
    selectedFile = null;
    fileInput.value = "";
    fileInfo.textContent = "";
}

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Drag and drop
["dragenter", "dragover"].forEach(eventName => {
    uploadArea.addEventListener(eventName, event => {
        event.preventDefault();
        uploadArea.classList.add("drag-over");
    });
});

["dragleave", "drop"].forEach(eventName => {
    uploadArea.addEventListener(eventName, event => {
        event.preventDefault();
        uploadArea.classList.remove("drag-over");
    });
});

uploadArea.addEventListener("drop", event => {
    const file = event.dataTransfer.files[0];

    if (file) {
        selectFile(file);
    }
});

// Show / hide key
toggleKey.addEventListener("click", () => {
    const visible = keyInput.type === "text";

    keyInput.type = visible ? "password" : "text";
    toggleKey.textContent = visible ? "SHOW" : "HIDE";
});

// Key strength indicator
keyInput.addEventListener("input", () => {
    const key = keyInput.value;
    let score = 0;

    if (key.length >= 8) score++;
    if (key.length >= 12) score++;
    if (/[A-Z]/.test(key) && /[a-z]/.test(key)) score++;
    if (/[0-9]/.test(key)) score++;
    if (/[^A-Za-z0-9]/.test(key)) score++;

    const levels = [
        { width: "0%", text: "Waiting for encryption key", color: "#26384c" },
        { width: "20%", text: "Very weak key", color: "#ff8294" },
        { width: "40%", text: "Weak key", color: "#ffb36b" },
        { width: "60%", text: "Moderate key", color: "#f0d477" },
        { width: "80%", text: "Strong key", color: "#70c8ff" },
        { width: "100%", text: "Excellent key", color: "#68e0b0" }
    ];

    const level = key.length === 0 ? levels[0] : levels[score];

    strengthBar.style.width = level.width;
    strengthBar.style.background = level.color;
    strengthText.textContent = level.text;
});

// Form submission
document.getElementById("fileForm").addEventListener("submit", async event => {
    event.preventDefault();

    const key = keyInput.value.trim();
    const action = actionInput.value;

    hideMessage();
    resetResult();

    if (!selectedFile) {
        showMessage("Please select a file first.", "error");
        return;
    }

    if (!key) {
        showMessage("Please enter your encryption key.", "error");
        keyInput.focus();
        return;
    }

    if (key.length < 8) {
        showMessage("Use a key with at least 8 characters for better protection.", "error");
        keyInput.focus();
        return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("key", key);
    formData.append("action", action);

    processBtn.disabled = true;
    buttonText.textContent = "PROCESSING FILE...";
    processVisual.classList.add("processing");

    try {
        const response = await fetch("/process", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            let errorMessage = "File processing failed.";

            try {
                const data = await response.json();
                errorMessage = data.error || errorMessage;
            } catch (_) {}

            throw new Error(errorMessage);
        }

        const blob = await response.blob();

        if (downloadUrl) {
            URL.revokeObjectURL(downloadUrl);
        }

        downloadUrl = URL.createObjectURL(blob);

        const disposition = response.headers.get("Content-Disposition");
        const match = disposition && disposition.match(/filename="?([^"]+)"?/);

        const filename = match
            ? match[1]
            : action === "encrypt"
                ? "encrypted_file.bin"
                : "decrypted_file.txt";

        downloadLink.href = downloadUrl;
        downloadLink.download = filename;

        resultText.textContent =
            action === "encrypt"
                ? "Your encrypted file is ready to download."
                : "Your decrypted file is ready to download.";

        resultPanel.classList.add("show");
        showMessage("File processed successfully!", "success");

    } catch (error) {
        showMessage(error.message || "Something went wrong.", "error");

    } finally {
        processBtn.disabled = false;
        buttonText.textContent =
            action === "encrypt" ? "ENCRYPT MY FILE" : "DECRYPT MY FILE";

        processVisual.classList.remove("processing");
    }
});

function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type}`;
}

function hideMessage() {
    message.textContent = "";
    message.className = "message";
}

function resetResult() {
    resultPanel.classList.remove("show");

    if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
        downloadUrl = null;
    }

    downloadLink.removeAttribute("href");
}s

// ===== FLOATING OCEAN PARTICLES =====

for (let i = 0; i < 24; i++) {
    const particle = document.createElement("span");
    particle.className = "ocean-particle";

    particle.style.left = Math.random() * 100 + "vw";
    particle.style.animationDuration = (8 + Math.random() * 12) + "s";
    particle.style.animationDelay = (Math.random() * 12) + "s";
    particle.style.opacity = Math.random() * 0.7 + 0.2;

    const size = 2 + Math.random() * 4;
    particle.style.width = size + "px";
    particle.style.height = size + "px";

    document.body.appendChild(particle);
}

// ===== 3D FEATURE CARD MOVEMENT =====

document.querySelectorAll(".feature-card").forEach(card => {
    card.addEventListener("mousemove", event => {
        if (window.matchMedia("(pointer: coarse)").matches) return;

        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const rotateY = ((x / rect.width) - 0.5) * 9;
        const rotateX = ((y / rect.height) - 0.5) * -9;

        card.style.transform =
            `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
    });

    card.addEventListener("mouseleave", () => {
        card.style.transform = "";
    });
});

// ===== UPLOAD FEEDBACK =====

uploadArea.addEventListener("dragenter", () => {
    uploadArea.querySelector(".upload-symbol").style.transform =
        "scale(1.15) translateY(-5px)";
});

uploadArea.addEventListener("dragleave", () => {
    uploadArea.querySelector(".upload-symbol").style.transform = "";
});

uploadArea.addEventListener("drop", () => {
    uploadArea.querySelector(".upload-symbol").style.transform = "";
});
