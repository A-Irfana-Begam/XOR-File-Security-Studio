
document.addEventListener("DOMContentLoaded", () => {
    const fileForm = document.getElementById("fileForm");
    const fileInput = document.getElementById("fileInput");
    const uploadArea = document.getElementById("uploadArea");
    const fileInfo = document.getElementById("fileInfo");

    const keyInput = document.getElementById("keyInput");
    const toggleKey = document.getElementById("toggleKey");
    const strengthBar = document.getElementById("strengthBar");
    const strengthText = document.getElementById("strengthText");

    const actionInput = document.getElementById("action");
    const operationButtons = document.querySelectorAll(".operation-btn");

    const processBtn = document.getElementById("processBtn");
    const buttonText = document.getElementById("buttonText");
    const processVisual = document.getElementById("processVisual");

    const message = document.getElementById("message");
    const resultPanel = document.getElementById("resultPanel");
    const resultText = document.getElementById("resultText");
    const downloadLink = document.getElementById("downloadLink");

    let selectedFile = null;
    let currentDownloadUrl = null;

    // Display messages
    function showMessage(text, type = "error") {
        message.textContent = text;
        message.className = `message ${type}`;
    }

    function clearMessage() {
        message.textContent = "";
        message.className = "message";
    }

    // Reset previous result
    function resetResult() {
        resultPanel.classList.remove("show");

        if (currentDownloadUrl) {
            URL.revokeObjectURL(currentDownloadUrl);
            currentDownloadUrl = null;
        }

        downloadLink.removeAttribute("href");
    }

    // File validation
    function validateFile(file, action) {
        if (!file) {
            return "Please select a file.";
        }

        const extension = file.name.split(".").pop().toLowerCase();

        if (action === "encrypt" && extension !== "txt") {
            return "Please select a .txt file for encryption.";
        }

        if (action === "decrypt" && extension !== "bin") {
            return "Please select a .bin file for decryption.";
        }

        if (file.size === 0) {
            return "The selected file is empty.";
        }

        if (file.size > 10 * 1024 * 1024) {
            return "File size must be below 10 MB.";
        }

        return null;
    }

    // Handle selected file
    function handleFile(file) {
        clearMessage();
        resetResult();

        const error = validateFile(file, actionInput.value);

        if (error) {
            selectedFile = null;
            fileInput.value = "";
            fileInfo.textContent = "No file selected";
            showMessage(error);
            return;
        }

        selectedFile = file;

        const sizeKB = (file.size / 1024).toFixed(2);

        fileInfo.textContent = `${file.name} • ${sizeKB} KB`;
        showMessage("File selected successfully.", "success");
    }

    // File input selection
    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];

        if (file) {
            handleFile(file);
        }
    });

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

        if (!file) return;

        try {
            const transfer = new DataTransfer();
            transfer.items.add(file);
            fileInput.files = transfer.files;
        } catch (error) {
            // The selected file is still processed below.
        }

        handleFile(file);
    });

    // Switch encryption / decryption mode
    operationButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const selectedAction = button.dataset.action;

            actionInput.value = selectedAction;

            operationButtons.forEach((item) => {
                item.classList.toggle("active", item === button);
            });

            // Clear previous file and key
            selectedFile = null;
            fileInput.value = "";
            keyInput.value = "";
            keyInput.type = "password";

            toggleKey.textContent = "SHOW";

            fileInfo.textContent = "No file selected";

            fileInput.accept =
                selectedAction === "encrypt" ? ".txt" : ".bin";

            buttonText.textContent =
                selectedAction === "encrypt"
                    ? "ENCRYPT MY FILE"
                    : "DECRYPT MY FILE";

            strengthBar.style.width = "0%";
            strengthText.textContent = "Waiting for encryption key";

            clearMessage();
            resetResult();
        });
    });

    // Show / hide key
    toggleKey.addEventListener("click", () => {
        const isHidden = keyInput.type === "password";

        keyInput.type = isHidden ? "text" : "password";
        toggleKey.textContent = isHidden ? "HIDE" : "SHOW";
    });

    // Password strength
    keyInput.addEventListener("input", () => {
        const key = keyInput.value;
        let score = 0;

        if (key.length >= 8) score++;
        if (key.length >= 12) score++;
        if (/[A-Z]/.test(key)) score++;
        if (/[a-z]/.test(key)) score++;
        if (/[0-9]/.test(key)) score++;
        if (/[^A-Za-z0-9]/.test(key)) score++;

        const percentage = Math.min((score / 6) * 100, 100);

        strengthBar.style.width = `${percentage}%`;

        if (!key) {
            strengthText.textContent = "Waiting for encryption key";
        } else if (key.length < 8) {
            strengthText.textContent = "Too short — minimum 8 characters";
        } else if (score <= 3) {
            strengthText.textContent = "Moderate key — add more variety";
        } else if (score <= 4) {
            strengthText.textContent = "Good key";
        } else {
            strengthText.textContent = "Strong key";
        }
    });

    // Process file
    fileForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        clearMessage();
        resetResult();

        const action = actionInput.value;
        const key = keyInput.value;

        const fileError = validateFile(selectedFile, action);

        if (fileError) {
            showMessage(fileError);
            return;
        }

        if (!key || !key.trim()) {
            showMessage("Please enter your encryption key.");
            keyInput.focus();
            return;
        }

        if (key.length < 8) {
            showMessage(
                "Your encryption key is too weak. Use at least 8 characters."
            );
            keyInput.focus();
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
                let errorMessage = "File processing failed.";

                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (error) {
                    // Keep default error message.
                }

                throw new Error(errorMessage);
            }

            const blob = await response.blob();

            currentDownloadUrl = URL.createObjectURL(blob);

            const originalName = selectedFile.name.replace(/\.[^/.]+$/, "");

            const outputName =
                action === "encrypt"
                    ? `${originalName}_encrypted.bin`
                    : `${originalName}_decrypted.txt`;

            downloadLink.href = currentDownloadUrl;
            downloadLink.download = outputName;

            resultText.textContent =
                action === "encrypt"
                    ? "Your encrypted .bin file is ready to download."
                    : "Your decrypted .txt file is ready to download.";

            resultPanel.classList.add("show");

            showMessage("File processed successfully!", "success");

            // Start download
            const temporaryLink = document.createElement("a");
            temporaryLink.href = currentDownloadUrl;
            temporaryLink.download = outputName;

            document.body.appendChild(temporaryLink);
            temporaryLink.click();
            temporaryLink.remove();

        } catch (error) {
            showMessage(error.message || "Something went wrong.");
        } finally {
            processBtn.disabled = false;

            buttonText.textContent =
                actionInput.value === "encrypt"
                    ? "ENCRYPT MY FILE"
                    : "DECRYPT MY FILE";

            processVisual.classList.remove("processing");
        }
    });

    console.log("XOR Security Lab initialized successfully.");
});
