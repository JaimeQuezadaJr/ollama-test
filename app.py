from flask import Flask, request, jsonify, send_file
from flask_cors import CORS, cross_origin
from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
import pandas as pd
import io
import re
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
CORS(app, origins="*")
app.config["SQLALCHEMY_DATABASE_URI"] = (
    "sqlite:///conversations.db"  # or use PostgreSQL/MySQL
)
db = SQLAlchemy(app)


class Conversation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), default="New Conversation")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    messages = db.relationship("Message", backref="conversation", lazy=True)


class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender = db.Column(db.String(10))  # 'User' or 'AI'
    text = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    conversation_id = db.Column(db.Integer, db.ForeignKey("conversation.id"))


template = """
Answer the question below.
Here is the conversation history: {context}
Question: {question}
Answer: 
"""

model = OllamaLLM(model="llama3.2")
prompt = ChatPromptTemplate.from_template(template)
chain = prompt | model


def extract_table_from_text(text):
    """Extract table data from text and convert to DataFrame"""
    lines = text.strip().split("\n")
    # Find table lines (containing '|')
    table_lines = [line.strip() for line in lines if "|" in line]
    if not table_lines:
        return None

    # Split by '|' and clean up cells
    headers = [cell.strip() for cell in table_lines[0].split("|") if cell.strip()]
    # Skip separator line if it exists (contains '-')
    data_start = 2 if "-" in table_lines[1] else 1
    data = []
    for line in table_lines[data_start:]:
        row = [cell.strip() for cell in line.split("|") if cell.strip()]
        if row:  # Only add non-empty rows
            data.append(row)

    return pd.DataFrame(data, columns=headers)


@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    context = data.get("context", "")
    question = data.get("question", "")

    # Check if this is a CSV conversion request
    if "convert" in question.lower() and "csv" in question.lower():
        # Get the last AI response from context
        last_response = context.split("AI:")[-1].strip() if context else ""
        df = extract_table_from_text(last_response)

        if df is not None:
            # Convert DataFrame to CSV
            csv_buffer = io.StringIO()
            df.to_csv(csv_buffer, index=False)
            csv_content = csv_buffer.getvalue()

            return jsonify(
                {
                    "response": "I've converted the table to CSV format. Click the download button to save the file.",
                    "isCSV": True,
                    "csvData": csv_content,
                    "fileName": "table_data.csv",
                }
            )
        else:
            return jsonify(
                {
                    "response": "I couldn't find a valid table to convert to CSV in our conversation.",
                    "isCSV": False,
                }
            )

    # Regular chat response
    result = chain.invoke({"context": context, "question": question})
    return jsonify({"response": result, "isCSV": False})


@app.route("/conversations", methods=["GET"])
def get_conversations():
    conversations = Conversation.query.order_by(Conversation.created_at.desc()).all()
    return jsonify(
        [
            {
                "id": c.id,
                "title": c.title,
                "created_at": c.created_at,
                "messages": [
                    {"sender": m.sender, "text": m.text, "created_at": m.created_at}
                    for m in c.messages
                ],
            }
            for c in conversations
        ]
    )


@app.route("/conversations", methods=["POST"])
def save_conversation():
    data = request.json
    conversation = Conversation(title=data.get("title", "New Conversation"))
    db.session.add(conversation)

    for msg in data["messages"]:
        message = Message(
            sender=msg["sender"], text=msg["text"], conversation=conversation
        )
        db.session.add(message)

    db.session.commit()
    return jsonify({"id": conversation.id})


@app.route("/conversations/<int:conversation_id>", methods=["GET"])
def get_conversation(conversation_id):
    conversation = Conversation.query.get_or_404(conversation_id)
    return jsonify(
        {
            "id": conversation.id,
            "title": conversation.title,
            "created_at": conversation.created_at,
            "messages": [
                {"sender": msg.sender, "text": msg.text, "created_at": msg.created_at}
                for msg in conversation.messages
            ],
        }
    )


@app.route("/conversations/<int:conversation_id>", methods=["DELETE"])
def delete_conversation(conversation_id):
    conversation = Conversation.query.get_or_404(conversation_id)
    db.session.delete(conversation)
    db.session.commit()
    return jsonify({"message": "Conversation deleted successfully"})


@app.route("/conversations/<int:conversation_id>/title", methods=["PUT"])
def update_conversation_title(conversation_id):
    conversation = Conversation.query.get_or_404(conversation_id)
    data = request.json
    conversation.title = data.get("title", "New Conversation")
    db.session.commit()
    return jsonify({"message": "Title updated successfully"})


# Add this after creating the app and before running it
with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
