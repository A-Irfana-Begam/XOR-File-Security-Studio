from flask import Flask, render_template, request, send_file, jsonify
import io

app = Flask(__name__)

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
        file = request.files.get("file")
        key = request.form.get("key", "").strip()
        action = request.form.get("action", "")

        if not file or not file.filename:
            return jsonify({"error": "Please select a file."}), 400

        if not key:
            return jsonify({"error": "Encryption key is required."}), 400

        if action not in ["encrypt", "decrypt"]:
            return jsonify({"error": "Invalid operation."}), 400

        data = file.read()

        if not data:
            return jsonify({"error": "File is empty."}), 400

        result = xor_encrypt_decrypt(data, key)

        filename = file.filename.rsplit(".", 1)[0]

        output_name = (
            filename + "_encrypted.bin"
            if action == "encrypt"
            else filename + "_decrypted.txt"
        )

        return send_file(
            io.BytesIO(result),
            as_attachment=True,
            download_name=output_name,
            mimetype="application/octet-stream"
        )

    except Exception:
        return jsonify({"error": "File processing failed."}), 500


if __name__ == "__main__":
    app.run(debug=True)
