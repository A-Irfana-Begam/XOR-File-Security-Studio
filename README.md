
# XOR Security Lab | Cyber Chrome

An interactive web-based file encryption and decryption application built using Python Flask, HTML, CSS, and JavaScript.

## Features

- Encrypt text files using XOR encryption.
- Decrypt previously encrypted files.
- Secure key input with show/hide option.
- Live encryption key strength indicator.
- Drag-and-drop file upload.
- Interactive processing interface.
- Metallic silver and graphite Cyber Chrome design.
- Responsive layout for desktop and mobile.
- Maximum file upload size: 10 MB.

## Technologies Used

- Python
- Flask
- HTML5
- CSS3
- JavaScript
- Vercel

## Project Structure

```text
project/
├── public/
│   ├── script.js
│   └── style.css
├── templates/
│   └── index.html
├── README.md
├── app.py
├── requirements.txt
└── vercel.json
```

## How to Use

1. Open the application.
2. Select Encrypt or Decrypt.
3. Upload a `.txt` file for encryption.
4. Enter an encryption key containing at least 8 characters.
5. Click the processing button.
6. Download the generated file.

For decryption, upload the encrypted `.bin` file and enter the same key used during encryption.

## File Restrictions

- Encryption accepts `.txt` files.
- Decryption accepts `.bin` files.
- Maximum file size is 10 MB.
- The same key must be used for encryption and decryption.

## Run Locally

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the application:

```bash
python app.py
```

Open:

```text
http://127.0.0.1:5000
```

## Deployment

This project is configured for deployment using Vercel.

## Security Note

This project demonstrates the XOR encryption concept for educational purposes. Repeating-key XOR is not considered secure for protecting sensitive real-world data. Do not use it as a replacement for modern encryption algorithms.

## Author

Cybersecurity Internship Project
