
document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("fileInput");
    const uploadArea = document.getElementById("uploadArea");
    const fileInfo = document.getElementById("fileInfo");
    const keyInput = document.getElementById("keyInput");
    const toggleKey = document.getElementById("toggleKey");
    const strengthBar = document.getElementById("strengthBar");
    const strengthText = document.getElementById("strengthText");
    const keyFeedback = document.getElementById("keyFeedback");

    const fileForm = document.getElementById("fileForm");
    const actionInput = document.getElementById("action");
    const processBtn = document.getElementById("processBtn");
    const buttonText = document.getElementById("buttonText");
    const processVisual = document.getElementById("processVisual");

    const message = document.getElementById("message");
    const resultPanel = document.getElementById("resultPanel");
    const resultText = document.getElementById("resultText");
    const downloadLink = document.getElementById("downloadLink");

    const modeButtons = document.querySelectorAll(".operation-btn");

    let currentMode = "encrypt";
    let downloadURL = null;

    // MESSAGE
    function showMessage(text, type = "error") {
        if (!message) return;

        message.textContent = text;
        message.className = `message ${type}`;
        message.style.display = "block";
    }

    function hideMessage() {
        if (!message) return;

        message.textContent = "";
        message.style.display = "none";
    }

    // RESET RESULT
    function resetResult() {
        if (downloadURL) {
            URL.revokeObjectURL(downloadURL);
            downloadURL = null;
        }

        if (resultPanel) resultPanel.style.display = "none";

        if (downloadLink) {
            downloadLink.removeAttribute("href");
        }
    }

    // MODE SWITCH
    modeButtons.forEach(button => {
        button.addEventListener("click", () => {
            currentMode = button.dataset.action;

            modeButtons.forEach(btn => {
                btn.classList.toggle("active", btn === button);
            });

            // Clear key whenever mode changes
            keyInput.value = "";
            keyInput.type = "password";

            if (toggleKey) {
                toggleKey.textContent = "Show";
            }

            updateStrength();
            hideMessage();
            resetResult();

            if (fileInput) {
                fileInput.value = "";
            }

            if (fileInfo) {
                fileInfo.textContent = "No file selected";
            }

            if (actionInput) {
                actionInput.value = currentMode;
            }

            if (uploadArea) {
                uploadArea.classList.remove("drag-over");
            }

            if (buttonText) {
                buttonText.textContent =
                    currentMode === "encrypt"
                        ? "ENCRYPT MY FILE"
                        : "DECRYPT MY FILE";
            }

            if (fileInput) {
                fileInput.accept =
                    currentMode === "encrypt" ? ".txt" : ".bin";
            }

            const uploadText = uploadArea?.querySelector("small");

            if (uploadText) {
                uploadText.textContent =
                    currentMode === "encrypt"
                        ? "Supported format: .txt"
                        : "Supported format: .bin";
            }
        });
    });

    // FILE SELECTION
    function handleFile(file) {
        if (!file) return;

        const extension = file.name.split(".").pop().toLowerCase();

        if (currentMode === "encrypt" && extension !== "txt") {
            showMessage("Please select a .txt file for encryption.");
            fileInput.value = "";
            return;
        }

        if (currentMode === "decrypt" && extension !== "bin") {
            showMessage("Please select a .bin file for decryption.");
            fileInput.value = "";
            return;
        }

        if (file.size === 0) {
            showMessage("Selected file is empty.");
            fileInput.value = "";
            return;
        }

        hideMessage();
        resetResult();

        if (fileInfo) {
            fileInfo.textContent =
                `${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
        }
    }

    fileInput?.addEventListener("change", () => {
        handleFile(fileInput.files[0]);
    });

    // DRAG AND DROP
    uploadArea?.addEventListener("dragover", event => {
        event.preventDefault();
        uploadArea.classList.add("drag-over");
    });

    uploadArea?.addEventListener("dragleave", () => {
        uploadArea.classList.remove("drag-over");
    });

    uploadArea?.addEventListener("drop", event => {
        event.preventDefault();
        uploadArea.classList.remove("drag-over");

        const file = event.dataTransfer.files[0];

        if (!file) return;

        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;

        handleFile(file);
    });

    // SHOW / HIDE KEY
    toggleKey?.addEventListener("click", () => {
        if (keyInput.type === "password") {
            keyInput.type = "text";
            toggleKey.textContent = "Hide";
        } else {
            keyInput.type = "password";
            toggleKey.textContent = "Show";
        }
    });

    // KEY STRENGTH
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

        if (strengthBar) {
            strengthBar.style.width = percentage + "%";
        }

        let label = "No key entered";

        if (key.length > 0) {
            if (key.length < 8) {
                label = "Too short";
            } else if (score <= 2) {
                label = "Weak";
            } else if (score <= 4) {
                label = "Medium";
            } else {
                label = "Strong";
            }
        }

        if (strengthText) {
            strengthText.textContent = label;
        }

        if (keyFeedback) {
            keyFeedback.textContent =
                key.length > 0 && key.length < 8
                    ? "Use at least 8 characters."
                    : "";
        }
    }

    keyInput?.addEventListener("input", () => {
        updateStrength();
        hideMessage();
    });

    // FORM SUBMISSION
    fileForm?.addEventListener("submit", async event => {
        event.preventDefault();

        hideMessage();
        resetResult();

        const file = fileInput.files[0];
        const key = keyInput.value.trim();

        if (!file) {
            showMessage("Please select a file first.");
            return;
        }

        if (!key) {
            showMessage("Please enter your encryption key.");
            keyInput.focus();
            return;
        }

        if (key.length < 8) {
            showMessage("Key must contain at least 8 characters.");
            keyInput.focus();
            return;
        }

        const extension = file.name.split(".").pop().toLowerCase();

        if (currentMode === "encrypt" && extension !== "txt") {
            showMessage("Encryption requires a .txt file.");
            return;
        }

        if (currentMode === "decrypt" && extension !== "bin") {
            showMessage("Decryption requires a .bin file.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("key", key);
        formData.append("action", currentMode);

        if (processBtn) {
            processBtn.disabled = true;
        }

        if (buttonText) {
            buttonText.textContent = "PROCESSING...";
        }

        if (processVisual) {
            processVisual.classList.add("processing");
        }

        try {
            const response = await fetch("/process", {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();

                try {
                    const errorData = JSON.parse(errorText);
                    throw new Error(
                        errorData.error || errorData.message || "Processing failed."
                    );
                } catch (error) {
                    if (error.message !== "Processing failed.") {
                        throw error;
                    }

                    throw new Error("File processing failed. Check your key and file.");
                }
            }

            const blob = await response.blob();

            if (blob.size === 0) {
                throw new Error("The processed file is empty.");
            }

            downloadURL = URL.createObjectURL(blob);

            const disposition = response.headers.get("Content-Disposition");
            let filename = currentMode === "encrypt"
                ? "encrypted_file.bin"
                : "decrypted_file.txt";

            if (disposition) {
                const match = disposition.match(/filename="?([^"]+)"?/i);

                if (match) {
                    filename = match[1];
                }
            }

            if (downloadLink) {
                downloadLink.href = downloadURL;
                downloadLink.download = filename;
                downloadLink.style.display = "inline-block";
            }

            if (resultText) {
                resultText.textContent =
                    currentMode === "encrypt"
                        ? "Your file has been encrypted successfully!"
                        : "Your file has been decrypted successfully!";
            }

            if (resultPanel) {
                resultPanel.style.display = "block";
            }

            showMessage("File processed successfully!", "success");

        } catch (error) {
            showMessage(error.message || "Something went wrong.");
        } finally {
            if (processBtn) {
                processBtn.disabled = false;
            }

            if (buttonText) {
                buttonText.textContent =
                    currentMode === "encrypt"
                        ? "ENCRYPT MY FILE"
                        : "DECRYPT MY FILE";
            }

            if (processVisual) {
                processVisual.classList.remove("processing");
            }
        }
    });

    // FEATURE CARD INTERACTION
    document.querySelectorAll(".feature-card").forEach(card => {
        card.addEventListener("mousemove", event => {
            const rect = card.getBoundingClientRect();

            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            const rotateX = ((y / rect.height) - 0.5) * -8;
            const rotateY = ((x / rect.width) - 0.5) * 8;

            card.style.transform =
                `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        card.addEventListener("mouseleave", () => {
            card.style.transform =
                "perspective(800px) rotateX(0deg) rotateY(0deg)";
        });
    });

    // INITIAL SETTINGS
    if (actionInput) {
        actionInput.value = currentMode;
    }

    if (fileInput) {
        fileInput.accept = ".txt";
    }

    updateStrength();
});
