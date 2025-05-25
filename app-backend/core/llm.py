from huggingface_hub import InferenceClient
import os
import logging

HUGGINGFACE_TOKEN = os.getenv("HUGGINGFACE_TOKEN")
MODEL_ID = "google/gemma-3-27b-it"


client = InferenceClient(model=MODEL_ID, token=HUGGINGFACE_TOKEN)

