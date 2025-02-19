#!/bin/bash

# Store PIDs file location
PID_FILE="/tmp/aime_pids.txt"

start_servers() {
    echo "Starting AIME..."

    # Start the Flask backend and save its PID
    cd /Users/jaimequezada/Desktop/Coding\ Dojo/Personal-Projects/ollama-test
    python app.py & 
    echo $! > $PID_FILE

    # Wait a few seconds for backend to initialize
    sleep 5

    # Start the React frontend and append its PID
    cd chatbot-ui
    npm start &
    echo $! >> $PID_FILE

    echo "AIME is starting up! The app will open in your browser shortly..."
}

stop_servers() {
    echo "Stopping AIME..."
    
    # Read and kill stored PIDs
    if [ -f $PID_FILE ]; then
        while read pid; do
            kill $pid 2>/dev/null || true
        done < $PID_FILE
        rm $PID_FILE
    fi
    
    # Additional cleanup for any remaining processes
    pkill -f "python app.py" 2>/dev/null || true
    pkill -f "node.*react-scripts start" 2>/dev/null || true
    
    echo "AIME has been stopped."
}

case "$1" in
    start)
        start_servers
        ;;
    stop)
        stop_servers
        ;;
    restart)
        stop_servers
        sleep 2
        start_servers
        ;;
    *)
        echo "Usage: $0 {start|stop|restart}"
        exit 1
        ;;
esac 