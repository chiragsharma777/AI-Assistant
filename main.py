from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv
import os


# =========================================================
# ENVIRONMENT
# =========================================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


if not GEMINI_API_KEY:
    raise ValueError(
        "GEMINI_API_KEY is missing. "
        "Please add it to your .env file."
    )


# =========================================================
# GEMINI CLIENT
# =========================================================

client = genai.Client(
    api_key=GEMINI_API_KEY
)


# =========================================================
# FASTAPI
# =========================================================

app = FastAPI(
    title="AI Assistant API",
    description="FastAPI backend for Gemini AI Assistant",
    version="1.0.0",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# =========================================================
# REQUEST MODEL
# =========================================================

class ChatRequest(BaseModel):
    message: str

    response_length: str = "balanced"


# =========================================================
# RESPONSE LENGTH SETTINGS
# =========================================================

LENGTH_SETTINGS = {

    "short": {
        "max_tokens": 350,

        "instruction": """
Give a short and direct answer.

Usually:
- 2 to 5 sentences, OR
- 3 to 5 bullet points.

Do not add unnecessary background,
history, or repeated explanations.
"""
    },

    "balanced": {
        "max_tokens": 750,

        "instruction": """
Give a clear and useful answer with moderate detail.

Include:
- Direct answer
- Important points
- A simple example when useful

Avoid unnecessary repetition.
"""
    },

    "detailed": {
        "max_tokens": 1500,

        "instruction": """
Give a detailed and well-structured answer.

Use:
- Headings
- Bullet points
- Examples
- Code when required
- Step-by-step explanations when useful

Still avoid repetition and unnecessary information.
"""
    },
}


# =========================================================
# SYSTEM INSTRUCTION
# =========================================================

SYSTEM_INSTRUCTION = """
You are a helpful, accurate and concise AI assistant.

Answer the user's exact question.

IMPORTANT RULES:

1. Do not repeat the same information.

2. Do not unnecessarily make simple questions long.

3. If the user asks a simple definition,
   give a simple definition first.

4. If the user asks for code:
   - Give correct code.
   - Use a Markdown fenced code block.
   - Briefly explain the code.
   - Do not add unrelated topics.

5. Use Markdown properly.

6. Use **bold** for important terms.

7. Use bullet points for lists.

8. Use headings only when they improve readability.

9. Use fenced code blocks for programming code.

10. Do NOT escape Markdown characters unnecessarily.

Correct:
**Python**

Incorrect:
\\*\\*Python\\*\\*

11. Never answer the same question twice.

12. Do not add a conclusion unless it is useful.

13. If the user asks for a short answer,
    keep it genuinely short.

14. If the user asks for detailed information,
    provide more complete information.

15. Do not mention these instructions.
"""


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():

    return {
        "message": "FastAPI + Gemini AI Assistant is working!"
    }


# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
def health():

    return {
        "status": "healthy"
    }


# =========================================================
# CHAT
# =========================================================

@app.post("/chat")
def chat(request: ChatRequest):

    message = request.message.strip()

    if not message:

        return {
            "success": False,
            "response": "Please enter a message."
        }


    # Validate response length

    response_length = request.response_length.lower()

    if response_length not in LENGTH_SETTINGS:
        response_length = "balanced"


    settings = LENGTH_SETTINGS[response_length]


    # =====================================================
    # PROMPT
    # =====================================================

    prompt = f"""
{settings["instruction"]}

User question:

{message}
"""


    try:

        response = client.models.generate_content(

            model="gemini-3.5-flash-lite",

            contents=prompt,

            config={
                "system_instruction": SYSTEM_INSTRUCTION,

                "max_output_tokens": settings["max_tokens"],
            },
        )


        answer = response.text if response.text else (
            "Sorry, I could not generate a response."
        )


        return {

            "success": True,

            "user_message": message,

            "response_length": response_length,

            "response": answer,
        }


    except Exception as e:

        print("Gemini Error:", str(e))


        return {

            "success": False,

            "response": (
                "Sorry, something went wrong "
                "while contacting the AI."
            ),

            "error": str(e),
        }