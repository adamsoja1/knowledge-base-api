from fastapi import APIRouter, HTTPException, status, Depends 
from fastapi.responses import StreamingResponse

import json

from .schemas import BaseModelRequest

from .agent_settings import settings

from core.models.llm_wrapper import BaseLLMClient

response_router = APIRouter(prefix="/llm", tags=["llm"])
llm = BaseLLMClient()

@response_router.post('/response')
async def get_response(data: BaseModelRequest):
    async def event_generator():
        for chunk in llm.stream_generate(model=settings['model'], prompt=data.prompt):
            yield json.dumps(chunk) + "\n"
    
    return StreamingResponse(event_generator(), media_type="application/json")


    
