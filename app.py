from flask import Flask, request, jsonify, send_file
from flask_cors import CORS, cross_origin
from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
import pandas as pd
import io
import re

app = Flask(__name__)
CORS(app, origins="*")

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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
