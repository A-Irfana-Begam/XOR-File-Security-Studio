
# XOR Security Lab | Cyber Chrome

A web-based file encryption and decryption application built using Python Flask and JavaScript.

## Features

- XOR-based file encryption and decryption
- Manual encryption key entry
- Key strength indicator
- Drag-and-drop file upload
- TXT file encryption
- BIN file decryption
- Instant file download
- Responsive metallic Cyber Chrome interface

## Technologies Used

- Python
- Flask
- HTML
- CSS
- JavaScript
- XOR Algorithm
- Vercel

## Supported Files

| Operation | Supported File |
|---|---|
| Encryption | .txt |
| Decryption | .bin |

Maximum file size: 10 MB.

## How to Use

1. Select Encrypt or Decrypt.
2. Upload the supported file.
3. Enter your encryption key (minimum 8 characters).
4. Click the operation button.
5. Download the processed file.

Use the same exact key for decryption that was used during encryption.

## Run Locally

Install dependencies:

pip install -r requirements.txt

Run the application:

python app.py

Open:

http://127.0.0.1:5000

## Important Note

This project demonstrates the XOR encryption algorithm for educational purposes. Repeating-key XOR is not secure enough for protecting confidential or sensitive data.
