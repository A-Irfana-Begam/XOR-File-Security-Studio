document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("fileInput");
    const uploadArea = document.getElementById("uploadArea");
    const fileInfo = document.getElementById("fileInfo");
    const fileTypeHint = document.getElementById("fileTypeHint");

    const keyInput = document.getElementById("keyInput");
    const toggleKey = document.getElementById("toggleKey");
    const strengthBar = document.getElementById("strengthBar");
    const strengthText = document.getElementById("strengthText");

    const actionInput = document.getElementById("action");
    const operationButtons = document.querySelectorAll(".operation-btn");

    const fileForm = document.getElementById("fileForm");
    const processBtn = document.getElementById("processBtn");
    const buttonText = document.getElementById("buttonText");
    const processVisual = document.getElementById("processVisual");

    const message = document.getElementById("message");
    const resultPanel = document.getElementById("resultPanel");
    const resultText = document.getElementById("resultText");
    const downloadLink = document.getElementById("downloadLink");

    let selectedAction = "encrypt";
    let currentDownloadUrl = null;

    function showMessage(text, type) {
        message.textContent = text;
        message.className = `message ${type}`;
    }

    function clearMessage() {
        message.textContent = "";
        message.className = "message";
    }

    function resetResult() {
        resultPanel.classList.remove("show");
        resultText.textContent = "";

        if (currentDownloadUrl) {
            URL.revokeObjectURL(currentDownloadUrl);
            currentDownloadUrl = null;
        }

        downloadLink.removeAttribute("href");
    }

    function clearSelectedFile() {
        fileInput.value = "";
        fileInfo.textContent = "No file selected";
        uploadArea.classList.remove("drag-over");
    }

    function updateMode(action) {
        selectedAction = action;
        actionInput.value = action;

        operationButtons.forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.action === action
            );
        });

        if (action === "encrypt") {
            fileInput.accept = ".txt";
            fileTypeHint.textContent = "TEXT FILES • .TXT";
            buttonText.textContent = "ENCRYPT FILE";
        } else {
            fileInput.accept = ".bin";
            fileTypeHint.textContent = "ENCRYPTED FILES • .BIN";
            buttonText.textContent = "DECRYPT FILE";
        }

        clearSelectedFile();
        clearMessage();
        resetResult();
    }

    operationButtons.forEach(button => {
        button.addEventListener("click", () => {
            updateMode(button.dataset.action);
        });
    });

    // File selection
    fileInput.addEventListener("change", () => {
        clearMessage();
        resetResult();

        const file = fileInput.files[0];

        if (!file) {
            fileInfo.textContent = "No file selected";
            return;
        }

        const extension = file.name.split(".").pop().toLowerCase();
        const expectedExtension =
            selectedAction === "encrypt" ? "txt" : "bin";

        if (extension !== expectedExtension) {
            showMessage(
                `Please select a .${expectedExtension} file.`,
                "error"
            );
            clearSelectedFile();
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showMessage("Maximum file size is 10 MB.", "error");
            clearSelectedFile();
            return;
        }

        if (file.size === 0) {
            showMessage("The selected file is empty.", "error");
            clearSelectedFile();
            return;
        }

        fileInfo.textContent =
            `${file.name} • ${(file.size / 1024).toFixed(2)} KB`;
    });

    // Drag and drop
    uploadArea.addEventListener("dragover", event => {
        event.preventDefault();
        uploadArea.classList.add("drag-over");
    });

    uploadArea.addEventListener("dragleave", event => {
        if (!uploadArea.contains(event.relatedTarget)) {
            uploadArea.classList.remove("drag-over");
        }
    });

    uploadArea.addEventListener("drop", event => {
        event.preventDefault();
        uploadArea.classList.remove("drag-over");

        const file = event.dataTransfer.files[0];

        if (!file) return;

        const extension = file.name.split(".").pop().toLowerCase();
        const expectedExtension =
            selectedAction === "encrypt" ? "txt" : "bin";

        if (extension !== expectedExtension) {
            showMessage(
                `Please drop a .${expectedExtension} file.`,
                "error"
            );
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showMessage("Maximum file size is 10 MB.", "error");
            return;
        }

        if (file.size === 0) {
            showMessage("The selected file is empty.", "error");
            return;
        }

        const transfer = new DataTransfer();
        transfer.items.add(file);
        fileInput.files = transfer.files;

        fileInfo.textContent =
            `${file.name} • ${(file.size / 1024).toFixed(2)} KB`;

        clearMessage();
        resetResult();
    });

    // Show / hide key
    toggleKey.addEventListener("click", () => {
        const isHidden = keyInput.type === "password";

        keyInput.type = isHidden ? "text" : "password";
        toggleKey.textContent = isHidden ? "HIDE" : "SHOW";
    });

    // Key strength indicator
    keyInput.addEventListener("input", () => {
        const key = keyInput.value;

        if (!key) {
            strengthBar.style.width = "0%";
            strengthBar.style.background = "#9bd8b5";
            strengthText.textContent = "KEY STRENGTH: NOT SET";
            return;
        }

        let score = 0;

        if (key.length >= 8) score++;
        if (key.length >= 12) score++;
        if (/[A-Z]/.test(key)) score++;
        if (/[a-z]/.test(key)) score++;
        if (/[0-9]/.test(key)) score++;
        if (/[^A-Za-z0-9]/.test(key)) score++;

        strengthBar.style.width = `${Math.round(score / 6 * 100)}%`;

        if (score <= 2) {
            strengthBar.style.background = "#ff8585";
            strengthText.textContent = "KEY STRENGTH: WEAK";
        } else if (score <= 4) {
            strengthBar.style.background = "#e5c77e";
            strengthText.textContent = "KEY STRENGTH: MODERATE";
        } else {
            strengthBar.style.background = "#8dd9b0";
            strengthText.textContent = "KEY STRENGTH: STRONG";
        }
    });

    // File processing
    fileForm.addEventListener("submit", async event => {
        event.preventDefault();

        clearMessage();
        resetResult();

        const file = fileInput.files[0];
        const key = keyInput.value;

        if (!file) {
            showMessage("Please select a file first.", "error");
            return;
        }

        if (!key.trim()) {
            showMessage("Please enter an encryption key.", "error");
            keyInput.focus();
            return;
        }

        if (key.length < 8) {
            showMessage(
                "Your key must contain at least 8 characters.",
                "error"
            );
            keyInput.focus();
            return;
        }

        const extension = file.name.split(".").pop().toLowerCase();
        const expectedExtension =
            selectedAction === "encrypt" ? "txt" : "bin";

        if (extension !== expectedExtension) {
            showMessage(
                `Please select a .${expectedExtension} file.`,
                "error"
            );
            return;
        }

        if (file.size > 10 * 1024 * 1024 || file.size === 0) {
            showMessage(
                file.size === 0
                    ? "The selected file is empty."
                    : "Maximum file size is 10 MB.",
                "error"
            );
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("key", key);
        formData.append("action", selectedAction);

        processBtn.disabled = true;
        buttonText.textContent = "PROCESSING...";
        processVisual.style.animation = "orbit 1s linear infinite";

        try {
            const response = await fetch("/process", {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                let errorMessage = "File processing failed.";

                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (_) {
                    // Default error message
                }

                throw new Error(errorMessage);
            }

            const blob = await response.blob();

            if (!blob.size) {
                throw new Error("The server returned an empty file.");
            }

            currentDownloadUrl = URL.createObjectURL(blob);

            const originalName = file.name.replace(/\.[^.]+$/, "");

            const outputName = selectedAction === "encrypt"
                ? `${originalName}_encrypted.bin`
                : `${originalName}_decrypted.txt`;

            downloadLink.href = currentDownloadUrl;
            downloadLink.download = outputName;

            resultText.textContent =
                `${outputName} is ready to download.`;

            resultPanel.classList.add("show");

            showMessage(
                selectedAction === "encrypt"
                    ? "File encrypted successfully."
                    : "File decrypted successfully.",
                "success"
            );

        } catch (error) {
            showMessage(error.message, "error");

        } finally {
            processBtn.disabled = false;

            buttonText.textContent =
                selectedAction === "encrypt"
                    ? "ENCRYPT FILE"
                    : "DECRYPT FILE";

            processVisual.style.animation = "none";
        }
    });

    updateMode("encrypt");
});
