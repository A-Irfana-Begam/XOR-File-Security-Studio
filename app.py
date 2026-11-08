
from flask import Flask, render_template, request, send_file, jsonify
from io import BytesIO
from pathlib import Path

app = Flask(
    __name__,
    static_folder="public",
    static_url_path=""
)

app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024


def xor_encrypt_decrypt(data, key):
    key_bytes = key.encode("utf-8")

    return bytes(
        byte ^ key_bytes[index % len(key_bytes)]
        for index, byte in enumerate(data)
    )


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/process", methods=["POST"])
def process_file():
    try:
        uploaded_file = request.files.get("file")
        key = request.form.get("key", "")
        action = request.form.get("action", "")

        if not uploaded_file or not uploaded_file.filename:
            return jsonify({"error": "Please select a file."}), 400

        if not key.strip():
            return jsonify({"error": "Please enter an encryption key."}), 400

        if len(key) < 12:
            return jsonify({
                "error": "Key must contain at least 12 characters."
            }), 400

        if (
            not any(char.isupper() for char in key)
            or not any(char.islower() for char in key)
            or not any(char.isdigit() for char in key)
            or not any(not char.isalnum() for char in key)
        ):
            return jsonify({
                "error": "Use uppercase, lowercase, numbers and special characters in your key."
            }), 400

        if action not in ("encrypt", "decrypt"):
            return jsonify({"error": "Invalid operation."}), 400

        filename = Path(uploaded_file.filename).name
        extension = Path(filename).suffix.lower()

        if action == "encrypt" and extension != ".txt":
            return jsonify({
                "error": "Please select a .txt file for encryption."
            }), 400

        if action == "decrypt" and extension != ".bin":
            return jsonify({
                "error": "Please select a .bin file for decryption."
            }), 400

        data = uploaded_file.read()

        if not data:
            return jsonify({"error": "Selected file is empty."}), 400

        result = xor_encrypt_decrypt(data, key)

        stem = Path(filename).stem

        output_name = (
            f"{stem}_encrypted.bin"
            if action == "encrypt"
            else f"{stem}_decrypted.txt"
        )

        return send_file(
            BytesIO(result),
            as_attachment=True,
            download_name=output_name,
            mimetype="application/octet-stream"
        )

    except Exception:
        app.logger.exception("File processing error")
        return jsonify({
            "error": "File processing failed. Please try again."
        }), 500


@app.errorhandler(413)
def file_too_large(error):
    return jsonify({
        "error": "Maximum file size is 10 MB."
    }), 413


if __name__ == "__main__":
    app.run(debug=True)
