import os
from openai import OpenAI


class BaseLLMClient:
    """
    LLM wrapper for using LLMs API.
    """
    def __init__(self, api_key: str = None, base_url: str = None, sys_prompt: str = None) -> None:
        """Initialize LLM base client wrapper"""
        self.api_key = api_key or os.getenv("API_KEY")
        self.base_url = base_url or os.getenv('LLM_URL')

        if not self.api_key:
            raise ValueError("API key is required")

        self.client = OpenAI(api_key=self.api_key, base_url=self.base_url)
        self.sys_prompt = sys_prompt
        
    def generate(self, model: str, prompt: str) -> str:
        """
        Standard completion.
        """
        sys = self.sys_prompt or "You are a helpful AI assistant."
        response = self.client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": sys},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content
        
    def stream_generate(self, model: str, prompt: str):
        """
        Streaming completion generator.
        Yields text chunks as they arrive.
        """
        sys = self.sys_prompt or "You are a helpful AI assistant."
        stream = self.client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": sys},
                {"role": "user", "content": prompt}
            ],
            stream=True
        )

        for event in stream:
            for choice in event.choices:
                delta = getattr(choice, "delta", {})
                
                if hasattr(delta, "content") and delta.content:
                    yield {"type": "content", "text": delta.content}

                if hasattr(delta, "reasoning") and delta.reasoning:
                    yield {"type": "think", "text": delta.reasoning}

