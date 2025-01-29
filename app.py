from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate

app = Flask(__name__)
CORS(app, origins="*")

template = """
Answer the question below.
Here is the conversation history: {context}
Question: {question}
Answer: 
"""

model = OllamaLLM(model='llama3.2')
prompt = ChatPromptTemplate.from_template(template)
chain = prompt | model

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    context = data.get('context', '')
    question = data.get('question', '')
    result = chain.invoke({"context": context, "question": question})
    return jsonify({"response": result})

if __name__ == "__main__":
    app.run(port=8000,debug=True)