from typing import List, Union
from sentence_transformers import SentenceTransformer
import numpy as np
import logging
import os

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
_embedder_instance = None


class SentenceTransformerEmbedder:
    def __init__(self, model_name: str = None):
        try:
            self.model_name = model_name or os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")

            logger.info(f"Loading embedding model: {model_name}")
            self.model = SentenceTransformer(model_name)
            logger.info("Embedding model loaded successfully")
        except Exception as e:
            logger.exception(f"Error during embedding model initialization: {e}")
            raise

    def embed(self, texts: Union[str, List[str]]) -> Union[np.ndarray, List[np.ndarray]]:
        if isinstance(texts, str):
            texts = [texts]
            single_input = True
        else:
            single_input = False

        try:
            logger.debug("Embeddings generation --- ")
            embeddings = self.model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
            return embeddings[0] if single_input else embeddings
        except Exception as e:
            logger.exception(f"Error during generation: {e}")
            raise

def get_embedder() -> SentenceTransformerEmbedder:
    global _embedder_instance
    if _embedder_instance is None:
        _embedder_instance = SentenceTransformerEmbedder()
    return _embedder_instance