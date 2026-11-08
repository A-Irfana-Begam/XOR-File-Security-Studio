
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

    let selectedFile = null;
    let currentObjectURL = null;

    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    // Message handling
    function showMessage(text, type = "error") {
        message.textContent = text;
        message.className = `message ${type}`;
    }

    function clearMessage() {
        message.textContent = "";
        message.className = "message";
    }

    // Result handling
    function resetResult() {
        resultPanel.classList.remove("show");

        if (currentObjectURL) {
            URL.revokeObjectURL(currentObjectURL);
            currentObjectURL = null;
        }

        downloadLink.removeAttribute("href");
    }

    // File validation
    function validateFile(file) {
        if (!file) {
            return "Please select a file.";
        }

        if (file.size === 0) {
            return "The selected file is empty.";
        }

        if (file.size > MAX_FILE_SIZE) {
            return "File size must be below 10 MB.";
        }

        const action = actionInput.value;
        const extension = file.name.split(".").pop().toLowerCase();

        if (action === "encrypt" && extension !== "txt") {
            return "Please select a .txt file for encryption.";
        }

        if (action === "decrypt" && extension !== "bin") {
            return "Please select an encrypted .bin file.";
        }

        return null;
    }

    function handleFile(file) {
        clearMessage();
        resetResult();

        const error = validateFile(file);

        if (error) {
            selectedFile = null;
            fileInput.value = "";
            fileInfo.textContent = "No file selected";
            showMessage(error);
            return;
        }

        selectedFile = file;

        fileInfo.textContent =
            `${file.name} • ${(file.size / 1024).toFixed(2)} KB`;

        uploadArea.classList.add("has-file");
    }

    // File selection
    fileInput.addEventListener("change", () => {
        if (fileInput.files.length > 0) {
            handleFile(fileInput.files[0]);
        }
    });

    // Drag and drop
    uploadArea.addEventListener("dragover", (event) => {
        event.preventDefault();
        uploadArea.classList.add("drag-active");
    });

    uploadArea.addEventListener("dragleave", (event) => {
        event.preventDefault();
        uploadArea.classList.remove("drag-active");
    });

    uploadArea.addEventListener("drop", (event) => {
        event.preventDefault();
        uploadArea.classList.remove("drag-active");

        const file = event.dataTransfer.files[0];

        if (!file) return;

        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;

        handleFile(file);
    });

    // Operation switching
    operationButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const action = button.dataset.action;

            if (!action) return;

            actionInput.value = action;

            operationButtons.forEach((item) => {
                item.classList.toggle("active", item === button);
            });

            selectedFile = null;
            fileInput.value = "";
            fileInfo.textContent = "No file selected";

            uploadArea.classList.remove("has-file", "drag-active");

            fileInput.accept = action === "encrypt" ? ".txt" : ".bin";

            fileTypeHint.textContent =
                action === "encrypt"
                    ? "TEXT FILES • .TXT"
                    : "ENCRYPTED FILES • .BIN";

            buttonText.textContent =
                action === "encrypt"
                    ? "ENCRYPT FILE"
                    : "DECRYPT FILE";

            clearMessage();
            resetResult();
        });
    });

    // Show / hide key
    toggleKey.addEventListener("click", () => {
        const isPassword = keyInput.type === "password";

        keyInput.type = isPassword ? "text" : "password";

        toggleKey.textContent = isPassword ? "HIDE" : "SHOW";
        toggleKey.setAttribute(
            "aria-label",
            isPassword ? "Hide encryption key" : "Show encryption key"
        );
    });

    // Key strength
    function updateStrength() {
        const key = keyInput.value;
        let score = 0;

        if (key.length >= 8) score++;
        if (key.length >= 12) score++;
        if (/[A-Z]/.test(key)) score++;
        if (/[a-z]/.test(key)) score++;
        if (/[0-9]/.test(key)) score++;
        if (/[^A-Za-z0-9]/.test(key)) score++;

        const percentage = Math.round((score / 6) * 100);

        strengthBar.style.width = `${percentage}%`;

        if (key.length === 0) {
            strengthText.textContent = "KEY STRENGTH: NOT SET";
            strengthBar.style.width = "0%";
        } else if (key.length < 8) {
            strengthText.textContent = "WEAK — MINIMUM 8 CHARACTERS";
        } else if (score <= 3) {
            strengthText.textContent = "MODERATE KEY";
        } else if (score <= 4) {
            strengthText.textContent = "GOOD KEY";
        } else {
            strengthText.textContent = "STRONG KEY";
        }
    }

    keyInput.addEventListener("input", () => {
        updateStrength();
        clearMessage();
    });

    // File processing
    fileForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        clearMessage();
        resetResult();

        if (!selectedFile) {
            showMessage("Please select a file first.");
            return;
        }

        const fileError = validateFile(selectedFile);

        if (fileError) {
            showMessage(fileError);
            return;
        }

        if (!keyInput.value || !keyInput.value.trim()) {
            showMessage("Please enter an encryption key.");
            return;
        }

        if (keyInput.value.length < 8) {
            showMessage("Your key must contain at least 8 characters.");
            return;
        }

        const action = actionInput.value;

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("key", keyInput.value);
        formData.append("action", action);

        processBtn.disabled = true;
        processBtn.classList.add("processing");

        if (processVisual) {
            processVisual.classList.add("active");
        }

        buttonText.textContent =
            action === "encrypt" ? "ENCRYPTING..." : "DECRYPTING...";

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
                } catch {
                    // Keep the default error message.
                }

                throw new Error(errorMessage);
            }

            const blob = await response.blob();

            if (!blob.size) {
                throw new Error("The server returned an empty file.");
            }

            currentObjectURL = URL.createObjectURL(blob);

            const originalName = selectedFile.name.replace(/\.[^/.]+$/, "");

            const outputName =
                action === "encrypt"
                    ? `${originalName}_encrypted.bin`
                    : `${originalName}_decrypted.txt`;

            downloadLink.href = currentObjectURL;
            downloadLink.download = outputName;

            resultText.textContent =
                action === "encrypt"
                    ? "Your file has been encrypted successfully."
                    : "Your file has been decrypted successfully.";

            resultPanel.classList.add("show");

            downloadLink.click();

            showMessage(
                action === "encrypt"
                    ? "Encryption completed successfully!"
                    : "Decryption completed successfully!",
                "success"
            );

        } catch (error) {
            showMessage(error.message || "Something went wrong.");
        } finally {
            processBtn.disabled = false;
            processBtn.classList.remove("processing");

            if (processVisual) {
                processVisual.classList.remove("active");
            }

            buttonText.textContent =
                actionInput.value === "encrypt"
                    ? "ENCRYPT FILE"
                    : "DECRYPT FILE";
        }
    });
});
