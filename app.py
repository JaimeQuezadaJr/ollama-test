from flask import Flask, request, jsonify, render_template
from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate

app = Flask(__name__)

template = """
Answer the question below.
Here is the conversation history: {context}
Question: {question}
Answer: 
"""

model = OllamaLLM(model='llama2')
prompt = ChatPromptTemplate.from_template(template)
chain = prompt | model

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    context = data.get('context', '')
    question = data.get('question', '')
    result = chain.invoke({"context": context, "question": question})
    return jsonify({"response": result})

if __name__ == "__main__":
    app.run(debug=True)