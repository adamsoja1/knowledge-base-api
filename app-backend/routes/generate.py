from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
import logging
import json
from typing import Generator

from core.llm import client

generation_router = APIRouter()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

class ChatRequest(BaseModel):
    prompt: str
    max_tokens: int = 100
    stream: bool = False

def stream_response_generator(prompt: str, max_tokens: int) -> Generator[str, None, None]:
    try:
        response_stream = client.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
            stream=True
        )
        for chunk in response_stream:
            content = chunk.get('choices', [{}])[0].get('delta', {}).get('content')
            if content:
                yield json.dumps({"text_token": content}) + "\n"

    except Exception as e:
        logger.exception("Error during streaming inference")
        yield json.dumps({"error": str(e)}) + "\n"

@generation_router.post("/generate")
async def generate_chat_response(request: ChatRequest):
    logger.debug(f"Received request: prompt='{request.prompt}', stream={request.stream}")
    try:
        if not request.prompt.strip():
            raise ValueError("Prompt użytkownika jest pusty")

        if request.stream:
            return StreamingResponse(
                preamble_and_stream_generator(request.prompt, request.max_tokens),
                media_type="application/json"
            )
        else:
            response = client.chat_completion(
                messages=[{"role": "user", "content": request.prompt}],
                max_tokens=request.max_tokens,
                stream=False
            )
            return JSONResponse(content={"response": response})

    except Exception as e:
        logger.exception("Error occurred during inference")
        raise HTTPException(status_code=500, detail=str(e))


def preamble_and_stream_generator(prompt: str, max_tokens: int) -> Generator[str, None, None]:
    # 1. Najpierw wyślij "preambułę" - wstępne dane
    yield json.dumps({"info": "Rozpoczynam generowanie odpowiedzi"}) + "\n"

    # 2. Następnie wywołaj oryginalny generator odpowiedzi
    yield from stream_response_generator(prompt, max_tokens)

    # 3. Opcjonalnie na końcu wyślij komunikat o zakończeniu
    yield json.dumps({"info": "Koniec odpowiedzi"}) + "\n"
