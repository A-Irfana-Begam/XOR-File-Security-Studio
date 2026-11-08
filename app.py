
from flask import Flask, render_template, request, send_file, jsonify
import io

app = Flask(__name__)

app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB


def xor_encrypt_decrypt(data, key):
    key_bytes = key.encode("utf-8")

    return bytes(
        byte ^ key_bytes[i % len(key_bytes)]
        for i, byte in enumerate(data)
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

        # Check file
        if not uploaded_file or not uploaded_file.filename:
            return jsonify({"error": "Please select a file."}), 400

        # Check key
        if not key.strip():
            return jsonify({"error": "Please enter your secret key."}), 400

        if len(key) < 8:
            return jsonify({
                "error": "Weak key! Use at least 8 characters."
            }), 400

        # Check operation
        if action not in ["encrypt", "decrypt"]:
            return jsonify({"error": "Invalid operation."}), 400

        # Validate extension
        filename = uploaded_file.filename

        if action == "encrypt" and not filename.lower().endswith(".txt"):
            return jsonify({
                "error": "Please upload a .txt file for encryption."
            }), 400

        if action == "decrypt" and not filename.lower().endswith(".bin"):
            return jsonify({
                "error": "Please upload a .bin file for decryption."
            }), 400

        # Read file
        data = uploaded_file.read()

        if not data:
            return jsonify({"error": "File is empty."}), 400

        # XOR processing
        result = xor_encrypt_decrypt(data, key)

        # Output filename
        original_name = filename.rsplit(".", 1)[0]

        if action == "encrypt":
            output_name = original_name + "_encrypted.bin"
        else:
            output_name = original_name + "_decrypted.txt"

        return send_file(
            io.BytesIO(result),
            as_attachment=True,
            download_name=output_name,
            mimetype="application/octet-stream"
        )

    except Exception as error:
        app.logger.exception("File processing failed")
        return jsonify({
            "error": "File processing failed. Please try again."
        }), 500


@app.errorhandler(413)
def file_too_large(error):
    return jsonify({
        "error": "File is too large. Maximum size is 10 MB."
    }), 413


if __name__ == "__main__":
    app.run(debug=True)
