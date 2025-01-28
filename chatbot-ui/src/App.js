import React, { useState } from 'react';
import './App.css';

function App() {
  const [context, setContext] = useState('');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ context, question }),
      });
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await res.json();
      setMessages((prev) => [...prev, { sender: 'User', text: question }, { sender: 'AI', text: data.response }]);
      setContext((prev) => `${prev}\nUser: ${question}\nAI: ${data.response}`);
      setQuestion('');
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Chatbot</h1>
        <div className="chat-window">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender.toLowerCase()}`}>
              <strong>{msg.sender}:</strong> {msg.text}
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question"
          />
          <button type="submit">Send</button>
        </form>
      </header>
    </div>
  );
}

export default App;