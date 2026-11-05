# XOR File Security Studio 🔐

A web-based Text File Encryption and Decryption application built using Python Flask and the XOR algorithm.

## Features

- Upload text files (.txt).
- Encrypt files using the XOR algorithm.
- Decrypt encrypted files using the same secret key.
- Download encrypted and decrypted files.
- Drag and drop file upload.
- Responsive user interface.
- Error handling and input validation.

## Technologies Used

- Python
- Flask
- HTML5
- CSS3
- JavaScript

## Installation

1. Clone the repository.

2. Install dependencies:

   pip install -r requirements.txt

3. Run the application:

   python app.py

4. Open your browser and visit:

   http://127.0.0.1:5000

## How It Works

1. Select a text file.
2. Enter a secret encryption key.
3. Click Encrypt File.
4. Download the encrypted file.
5. Select the encrypted BIN file.
6. Enter the same secret key.
7. Click Decrypt File.
8. Download the restored text file.

## XOR Algorithm

The XOR operation is reversible:

A XOR B XOR B = A

The same key is used for both encryption and decryption.

## Security Note

This project demonstrates basic XOR encryption for educational purposes. Simple repeating-key XOR is not suitable for protecting sensitive real-world data.

## Author

Internship Project – Basic Text File Encryption using XOR.
