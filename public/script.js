
document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("fileInput");
    const uploadArea = document.getElementById("uploadArea");
    const fileInfo = document.getElementById("fileInfo");

    const keyInput = document.getElementById("keyInput");
    const toggleKey = document.getElementById("toggleKey");
    const strengthBar = document.getElementById("strengthBar");
    const strengthText = document.getElementById("strengthText");

    const fileForm = document.getElementById("fileForm");
    const actionInput = document.getElementById("action");
    const processBtn = document.getElementById("processBtn");
    const buttonText = document.getElementById("buttonText");

    const message = document.getElementById("message");
    const resultPanel = document.getElementById("resultPanel");
    const resultText = document.getElementById("resultText");
    const downloadLink = document.getElementById("downloadLink");

    const modeButtons = document.querySelectorAll(".operation-btn");

    let currentMode = "encrypt";
    let downloadURL = null;

    // CHECK REQUIRED HTML ELEMENTS
    if (!fileInput || !uploadArea || !fileForm || !keyInput || !processBtn) {
        console.error("Required HTML elements are missing.");
        return;
    }

    // MESSAGES
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

    // RESET DOWNLOAD
    function resetResult() {
        if (downloadURL) {
            URL.revokeObjectURL(downloadURL);
            downloadURL = null;
        }

        if (resultPanel) {
            resultPanel.style.display = "none";
        }

        if (downloadLink) {
            downloadLink.removeAttribute("href");
        }
    }

    // UPDATE FILE INFORMATION
    function handleFile(file) {
        if (!file) return;

        const extension = file.name.split(".").pop().toLowerCase();

        if (currentMode === "encrypt" && extension !== "txt") {
            showMessage("Please select a .txt file for encryption.");
            fileInput.value = "";
            if (fileInfo) fileInfo.textContent = "No file selected";
            return;
        }

        if (currentMode === "decrypt" && extension !== "bin") {
            showMessage("Please select a .bin file for decryption.");
            fileInput.value = "";
            if (fileInfo) fileInfo.textContent = "No file selected";
            return;
        }

        if (file.size === 0) {
            showMessage("Selected file is empty.");
            fileInput.value = "";
            if (fileInfo) fileInfo.textContent = "No file selected";
            return;
        }

        hideMessage();
        resetResult();

        if (fileInfo) {
            fileInfo.textContent =
                `${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
        }
    }

    // CLICK UPLOAD AREA TO OPEN FILE SELECTOR
    uploadArea.addEventListener("click", (event) => {
        if (event.target === fileInput) return;

        if (event.target.closest("button, a")) return;

        fileInput.click();
    });

    // FILE SELECTED
    fileInput.addEventListener("change", () => {
        handleFile(fileInput.files[0]);
    });

    // DRAG OVER
    uploadArea.addEventListener("dragover", (event) => {
        event.preventDefault();
        event.stopPropagation();
        uploadArea.classList.add("drag-over");
    });

    // DRAG LEAVE
    uploadArea.addEventListener("dragleave", (event) => {
        event.preventDefault();

        if (!uploadArea.contains(event.relatedTarget)) {
            uploadArea.classList.remove("drag-over");
        }
    });

    // DROP FILE
    uploadArea.addEventListener("drop", (event) => {
        event.preventDefault();
        event.stopPropagation();

        uploadArea.classList.remove("drag-over");

        const file = event.dataTransfer.files[0];

        if (!file) return;

        const extension = file.name.split(".").pop().toLowerCase();

        if (
            (currentMode === "encrypt" && extension !== "txt") ||
            (currentMode === "decrypt" && extension !== "bin")
        ) {
            showMessage(
                currentMode === "encrypt"
                    ? "Please drop a .txt file."
                    : "Please drop a .bin file."
            );
            return;
        }

        const transfer = new DataTransfer();
        transfer.items.add(file);
        fileInput.files = transfer.files;

        handleFile(file);
    });

    // MODE SWITCH
    modeButtons.forEach(button => {
        button.addEventListener("click", () => {
            const selectedMode = button.dataset.action;

            if (!["encrypt", "decrypt"].includes(selectedMode)) return;

            currentMode = selectedMode;

            modeButtons.forEach(btn => {
                btn.classList.toggle("active", btn === button);
            });

            // Clear key: user must enter it manually
            keyInput.value = "";
            keyInput.type = "password";

            if (toggleKey) {
                toggleKey.textContent = "SHOW";
            }

            // Clear previous file
            fileInput.value = "";

            if (fileInfo) {
                fileInfo.textContent = "No file selected";
            }

            if (actionInput) {
                actionInput.value = currentMode;
            }

            fileInput.accept =
                currentMode === "encrypt" ? ".txt" : ".bin";

            const uploadText = uploadArea.querySelector("small");

            if (uploadText) {
                uploadText.textContent =
                    currentMode === "encrypt"
                        ? "TEXT FILES • .TXT"
                        : "ENCRYPTED FILES • .BIN";
            }

            if (buttonText) {
                buttonText.textContent =
                    currentMode === "encrypt"
                        ? "ENCRYPT MY FILE"
                        : "DECRYPT MY FILE";
            }

            updateStrength();
            hideMessage();
            resetResult();
        });
    });

    // SHOW / HIDE KEY
    if (toggleKey) {
        toggleKey.addEventListener("click", () => {
            if (keyInput.type === "password") {
                keyInput.type = "text";
                toggleKey.textContent = "HIDE";
            } else {
                keyInput.type = "password";
                toggleKey.textContent = "SHOW";
            }
        });
    }

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

        if (strengthBar) {
            strengthBar.style.width = `${(score / 6) * 100}%`;
        }

        if (strengthText) {
            if (!key) {
                strengthText.textContent = "Waiting for encryption key";
            } else if (key.length < 8) {
                strengthText.textContent = "Too short";
            } else if (score <= 2) {
                strengthText.textContent = "Weak";
            } else if (score <= 4) {
                strengthText.textContent = "Medium";
            } else {
                strengthText.textContent = "Strong";
            }
        }
    }

    keyInput.addEventListener("input", () => {
        updateStrength();
        hideMessage();
    });

    // PROCESS FILE
    async function processFile(event) {
        event.preventDefault();

        hideMessage();
        resetResult();

        const file = fileInput.files[0];
        const key = keyInput.value;

        if (!file) {
            showMessage("Please select a file first.");
            return;
        }

        if (!key.trim()) {
            showMessage("Please enter your secret key manually.");
            keyInput.focus();
            return;
        }

        if (key.trim().length < 8) {
            showMessage("Key must contain at least 8 characters.");
            keyInput.focus();
            return;
        }

        const extension = file.name.split(".").pop().toLowerCase();

        if (currentMode === "encrypt" && extension !== "txt") {
            showMessage("Please select a .txt file.");
            return;
        }

        if (currentMode === "decrypt" && extension !== "bin") {
            showMessage("Please select a .bin file.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("key", key);
        formData.append("action", currentMode);

        processBtn.disabled = true;

        if (buttonText) {
            buttonText.textContent = "PROCESSING...";
        }

        try {
            const response = await fetch("/process", {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = "File processing failed.";

                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage =
                        errorData.error || errorData.message || errorMessage;
                } catch (error) {
                    // Keep default error message
                }

                throw new Error(errorMessage);
            }

            const blob = await response.blob();

            if (!blob.size) {
                throw new Error("The output file is empty.");
            }

            downloadURL = URL.createObjectURL(blob);

            let filename = currentMode === "encrypt"
                ? "encrypted_file.bin"
                : "decrypted_file.txt";

            const disposition =
                response.headers.get("Content-Disposition");

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
                resultPanel.style.display = "flex";
            }

            showMessage("File processed successfully!", "success");

        } catch (error) {
            showMessage(error.message || "Something went wrong.");
        } finally {
            processBtn.disabled = false;

            if (buttonText) {
                buttonText.textContent =
                    currentMode === "encrypt"
                        ? "ENCRYPT MY FILE"
                        : "DECRYPT MY FILE";
            }
        }
    }

    // FORM SUBMIT
    fileForm.addEventListener("submit", processFile);

    // INITIAL SETTINGS
    actionInput.value = currentMode;
    fileInput.accept = ".txt";

    updateStrength();

    console.log("XOR Security Lab JavaScript loaded successfully.");
});

document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("fileInput");
    const uploadArea = document.getElementById("uploadArea");
    const fileInfo = document.getElementById("fileInfo");

    const keyInput = document.getElementById("keyInput");
    const toggleKey = document.getElementById("toggleKey");
    const strengthBar = document.getElementById("strengthBar");
    const strengthText = document.getElementById("strengthText");

    const fileForm = document.getElementById("fileForm");
    const actionInput = document.getElementById("action");
    const processBtn = document.getElementById("processBtn");
    const buttonText = document.getElementById("buttonText");

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

    // FILE VALIDATION
    function handleFile(file) {
        if (!file) return;

        const extension = file.name.split(".").pop().toLowerCase();

        if (currentMode === "encrypt" && extension !== "txt") {
            showMessage("Please select a .txt file.");
            fileInput.value = "";
            return;
        }

        if (currentMode === "decrypt" && extension !== "bin") {
            showMessage("Please select a .bin file.");
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

    // CLICK TO SELECT FILE
    if (uploadArea && fileInput) {
        uploadArea.addEventListener("click", (event) => {
            if (
                event.target === fileInput ||
                event.target.closest("button") ||
                event.target.closest("a")
            ) return;

            fileInput.click();
        });
    }

    // FILE INPUT CHANGE
    fileInput?.addEventListener("change", () => {
        handleFile(fileInput.files[0]);
    });

    // DRAG OVER
    uploadArea?.addEventListener("dragover", (event) => {
        event.preventDefault();
        event.stopPropagation();
        uploadArea.classList.add("drag-over");
    });

    // DRAG LEAVE
    uploadArea?.addEventListener("dragleave", (event) => {
        event.preventDefault();
        uploadArea.classList.remove("drag-over");
    });

    // DROP FILE
    uploadArea?.addEventListener("drop", (event) => {
        event.preventDefault();
        event.stopPropagation();

        uploadArea.classList.remove("drag-over");

        const file = event.dataTransfer.files[0];
        if (!file) return;

        const extension = file.name.split(".").pop().toLowerCase();

        if (
            (currentMode === "encrypt" && extension !== "txt") ||
            (currentMode === "decrypt" && extension !== "bin")
        ) {
            showMessage(
                currentMode === "encrypt"
                    ? "Please drop a .txt file."
                    : "Please drop a .bin file."
            );
            return;
        }

        const transfer = new DataTransfer();
        transfer.items.add(file);
        fileInput.files = transfer.files;

        handleFile(file);
    });

    // MODE SWITCH
    modeButtons.forEach(button => {
        button.addEventListener("click", () => {
            currentMode = button.dataset.action;

            modeButtons.forEach(btn => {
                btn.classList.toggle("active", btn === button);
            });

            // Clear key for manual entry
            keyInput.value = "";
            keyInput.type = "password";

            if (toggleKey) toggleKey.textContent = "Show";

            fileInput.value = "";

            if (fileInfo) {
                fileInfo.textContent = "No file selected";
            }

            if (actionInput) {
                actionInput.value = currentMode;
            }

            fileInput.accept =
                currentMode === "encrypt" ? ".txt" : ".bin";

            const uploadText = uploadArea?.querySelector("small");

            if (uploadText) {
                uploadText.textContent =
                    currentMode === "encrypt"
                        ? "Supported format: .txt"
                        : "Supported format: .bin";
            }

            if (buttonText) {
                buttonText.textContent =
                    currentMode === "encrypt"
                        ? "ENCRYPT MY FILE"
                        : "DECRYPT MY FILE";
            }

            updateStrength();
            hideMessage();
            resetResult();
        });
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

    // PASSWORD STRENGTH
    function updateStrength() {
        const key = keyInput.value;
        let score = 0;

        if (key.length >= 8) score++;
        if (key.length >= 12) score++;
        if (/[A-Z]/.test(key)) score++;
        if (/[a-z]/.test(key)) score++;
        if (/[0-9]/.test(key)) score++;
        if (/[^A-Za-z0-9]/.test(key)) score++;

        if (strengthBar) {
            strengthBar.style.width = (score / 6 * 100) + "%";
        }

        if (strengthText) {
            if (!key) strengthText.textContent = "No key entered";
            else if (key.length < 8) strengthText.textContent = "Too short";
            else if (score <= 2) strengthText.textContent = "Weak";
            else if (score <= 4) strengthText.textContent = "Medium";
            else strengthText.textContent = "Strong";
        }
    }

    keyInput?.addEventListener("input", updateStrength);

    // ENCRYPT / DECRYPT
    async function processFile(event) {
        event.preventDefault();

        hideMessage();
        resetResult();

        const file = fileInput.files[0];
        const key = keyInput.value;

        if (!file) {
            showMessage("Please select a file.");
            return;
        }

        if (!key.trim()) {
            showMessage("Please enter your key manually.");
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
            showMessage("Select a .txt file for encryption.");
            return;
        }

        if (currentMode === "decrypt" && extension !== "bin") {
            showMessage("Select a .bin file for decryption.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("key", key);
        formData.append("action", currentMode);

        if (processBtn) processBtn.disabled = true;
        if (buttonText) buttonText.textContent = "PROCESSING...";

        try {
            const response = await fetch("/process", {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const error = await response.text();

                let errorMessage = "File processing failed.";

                try {
                    const data = JSON.parse(error);
                    errorMessage = data.error || data.message || errorMessage;
                } catch (_) {}

                throw new Error(errorMessage);
            }

            const blob = await response.blob();

            if (!blob.size) {
                throw new Error("The output file is empty.");
            }

            downloadURL = URL.createObjectURL(blob);

            let filename =
                currentMode === "encrypt"
                    ? "encrypted_file.bin"
                    : "decrypted_file.txt";

            const disposition = response.headers.get("Content-Disposition");

            if (disposition) {
                const match = disposition.match(/filename="?([^"]+)"?/i);
                if (match) filename = match[1];
            }

            if (downloadLink) {
                downloadLink.href = downloadURL;
                downloadLink.download = filename;
                downloadLink.style.display = "inline-block";
            }

            if (resultText) {
                resultText.textContent =
                    currentMode === "encrypt"
                        ? "File encrypted successfully!"
                        : "File decrypted successfully!";
            }

            if (resultPanel) resultPanel.style.display = "block";

            showMessage("File processed successfully!", "success");

        } catch (error) {
            showMessage(error.message);
        } finally {
            if (processBtn) processBtn.disabled = false;

            if (buttonText) {
                buttonText.textContent =
                    currentMode === "encrypt"
                        ? "ENCRYPT MY FILE"
                        : "DECRYPT MY FILE";
            }
        }
    }

    // FORM SUBMIT
    fileForm?.addEventListener("submit", processFile);

    // PROCESS BUTTON FALLBACK
    if (processBtn && fileForm && processBtn.type !== "submit") {
        processBtn.addEventListener("click", () => {
            fileForm.requestSubmit();
        });
    }

    // INITIAL SETTINGS
    if (actionInput) actionInput.value = currentMode;
    if (fileInput) fileInput.accept = ".txt";

    updateStrength();
});
