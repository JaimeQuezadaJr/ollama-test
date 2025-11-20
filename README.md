# Local AI Assistant

Built AIME (AI Messaging Expert). This is a full-stack local AI assistant application powered by Llama 3.2 using langchain_ollama, langchain_core, Flask for the backend, and React with Material-UI for the frontend. Customized to present the information in a user friendly graphical interface with the ability to save conversations.

**Access from any device:** Use this application on any browser on any device within your home network - including phones, tablets, and other computers.

## Prerequisites

- Python 3.8 or higher
- Pipenv
- Node.js and npm
- Ollama installed locally

## Installation

1. Clone the repository:
    ```sh
    git clone <repository_url>
    cd ollama-test
    ```

2. Install Python dependencies (from the root `ollama-test` directory):
    ```sh
    pipenv install
    ```

3. Install frontend dependencies:
    ```sh
    cd chatbot-ui
    npm install
    cd ..
    ```

4. Install Ollama and download the llama3.2 model:
    ```sh
    # Follow installation instructions at https://ollama.ai
    ollama pull llama3.2
    ```

## Running the Application

### Step 1: Start the Ollama Server

Ollama typically runs automatically in the background after installation. To verify it's running:

```sh
ollama list
```

If you need to start it manually:

```sh
ollama serve
```

### Step 2: Start the Backend (Flask)

Open a terminal in the root `ollama-test` directory and run:

```sh
pipenv shell
python app.py
```

The Flask backend API will start on `http://localhost:8000`.

### Step 3: Start the Frontend (React)

Open another terminal and run:

```sh
cd ollama-test/chatbot-ui
npm start
```

The React app will start on `http://localhost:3000` and automatically open in your browser.

## Project Structure

- `app.py` - Flask backend server
  - Handles chat requests and conversation management
  - SQLite database for conversation history (`conversations.db`)

- `chatbot-ui/` - React frontend application
  - Built with Material-UI
  - Features: dark mode, conversation history, auto-scrolling chat

## Features

- Real-time chat with AI powered by Ollama's llama2 model
- Conversation history management (save, load, delete)
- Dark mode toggle
- Responsive Material-UI design
- Context-aware responses

## Accessing from Other Devices on Your Network

To use the application from other devices (phones, tablets, etc.) on your home network:

### Step 1: Find Your Computer's IP Address

On Mac/Linux:
```sh
ifconfig | grep "inet " | grep -v 127.0.0.1
```

On Windows:
```sh
ipconfig
```

Look for your local IP address (usually starts with `192.168.x.x` or `10.0.x.x`)

### Step 2: Configure the Frontend

Create a `.env` file in the `chatbot-ui/` directory with your IP address:

```env
REACT_APP_API_URL=http://YOUR_IP_ADDRESS:8000
```

For example:
```env
REACT_APP_API_URL=http://192.168.1.100:8000
```

**Important:** After creating or modifying the `.env` file, restart your React development server.

### Step 3: Access from Other Devices

On any device connected to the same network, open a web browser and navigate to:

```
http://YOUR_IP_ADDRESS:3000
```

For example: `http://192.168.1.100:3000`

**Note:** The application will automatically fall back to `http://localhost:8000` if the configured IP address is not reachable, making it work seamlessly on your local machine even when the network configuration changes.

## Environment Variables (Optional)

### Backend
The Flask backend runs on port 8000 by default. You can modify the port in `app.py` if needed.

### Frontend (Local Use Only)
If you're only using the app on your local machine, the frontend will automatically use `http://localhost:8000` without any configuration needed.

## License

This project is licensed under the MIT License.