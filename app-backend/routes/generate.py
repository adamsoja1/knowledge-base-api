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
    conversation_id: str

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
    logger.debug(f"Received request: prompt='{request.prompt}'")
    try:
        if not request.prompt.strip():
            raise ValueError("User's prompt is empty")

        if request:
            return StreamingResponse(
                preamble_and_stream_generator(request.prompt, 1000, request.conversation_id),
                media_type="application/json"
            )
    except Exception as e:
        logger.exception("Error occurred during inference")
        raise HTTPException(status_code=500, detail=str(e))



def preamble_and_stream_generator(
        prompt: str, max_tokens: int, 
        conversation_id: str
    ) -> Generator[str, None, None]:
    
    yield json.dumps({"info": "Start of response generaton"}) + "\n"
    yield from stream_response_generator(prompt=prompt, max_tokens=1000)
    yield json.dumps({"info": "End"}) + "\n"
