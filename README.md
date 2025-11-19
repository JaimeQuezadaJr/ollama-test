# AI Chatbot

This is a full-stack AI Chatbot application using langchain_ollama, langchain_core, FastAPI for the backend, and React with Material-UI for the frontend.

## Prerequisites

- Python 3.8 or higher
- Pipenv
- Node.js and npm
- Ollama installed locally

## Installation

1. Clone the repository:
    ```sh
    git clone <repository_url>
    cd <repository_directory>
    ```

2. Install Python dependencies:
    ```sh
    pipenv install
    ```

3. Install frontend dependencies:
    ```sh
    cd chatbot-ui
    npm install
    cd ..
    ```

4. Install Ollama and download the llama2 model:
    ```sh
    # Follow installation instructions at https://ollama.ai
    ollama pull llama2
    ```

## Running the Application

### Step 1: Start the Ollama Server

```sh
ollama serve
```

Leave this terminal running.

### Step 2: Start the Backend (FastAPI)

Open a new terminal and run:

```sh
cd backend
pipenv shell
python main.py
```

The backend API will start on `http://localhost:8000`.

### Step 3: Start the Frontend (React)

Open another terminal and run:

```sh
cd chatbot-ui
npm start
```

The React app will start on `http://localhost:3000` and automatically open in your browser.

## Project Structure

- `backend/` - FastAPI backend server
  - `main.py` - Main backend application
  - `conversations.db` - SQLite database for conversation history

- `chatbot-ui/` - React frontend application
  - Built with Material-UI
  - Features: dark mode, conversation history, auto-scrolling chat

## Features

- Real-time chat with AI powered by Ollama's llama2 model
- Conversation history management (save, load, delete)
- Dark mode toggle
- Responsive Material-UI design
- Context-aware responses

## Environment Variables (Optional)

### Backend
Create a `.env` file in the `backend/` directory if you need custom configuration:
```
PORT=8000
```

### Frontend
Create a `.env` file in the `chatbot-ui/` directory to configure the API URL:
```
REACT_APP_API_URL=http://localhost:8000
```

If not set, the frontend will default to `http://localhost:8000`.

## License

This project is licensed under the MIT License.