from app import app, db, Conversation, Message
from datetime import datetime

def test_database():
    with app.app_context():
        # Check if there are any conversations
        conversations = Conversation.query.all()
        print(f"Number of conversations: {len(conversations)}")
        
        # Print details of each conversation
        for conv in conversations:
            print(f"\nConversation ID: {conv.id}")
            print(f"Created at: {conv.created_at}")
            print("Messages:")
            for msg in conv.messages:
                print(f"- {msg.sender}: {msg.text}")

if __name__ == "__main__":
    test_database() 