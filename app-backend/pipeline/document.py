from typing import List, Union, Optional
import logging
from docling.document_converter import DocumentConverter
from pathlib import Path
import io

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

class DocumentPage:
    """
    Represents a single page within a PDF document.
    Stores the page number and its extracted text.
    """
    def __init__(self, page_number: int, text: str):
        self.page_number = page_number
        self.text = text
    
    def __repr__(self):
        return f"<DocumentPage {self.page_number}: {len(self.text)} chars>"

class DocumentObject:
    """
    Represents a PDF document loaded in memory with access to each page's text and number.
    Uses docling.DocumentConverter to extract textual content from various document formats.
    """
    def __init__(self, pdf_source: Union[str, bytes]):
        self.pages: List[DocumentPage] = []
        try:
            logger.info("Loading document...")
            converter = DocumentConverter()
            
            if isinstance(pdf_source, str):
                # Handle file path
                result = converter.convert(pdf_source)
            elif isinstance(pdf_source, bytes):
                # Handle bytes - save to temporary file or use BytesIO
                # Docling expects file paths or URLs, so we need to handle bytes differently
                import tempfile
                with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                    tmp_file.write(pdf_source)
                    tmp_file_path = tmp_file.name
                
                try:
                    result = converter.convert(tmp_file_path)
                finally:
                    # Clean up temporary file
                    Path(tmp_file_path).unlink(missing_ok=True)
            else:
                raise ValueError("Unsupported PDF source type. Use str (file path) or bytes.")
            

            doc = result.document
            
            logger.info(f"Successfully loaded {len(self.pages)} pages from document.")
            
        except Exception as e:
            logger.exception(f"Failed to load document: {e}")
            raise
    
    def get_page(self, number: int) -> Optional[DocumentPage]:
        for page in self.pages:
            if page.page_number == number:
                return page
        return None
    
    def all_text(self, separator: str = "\n\n") -> str:
        return separator.join(page.text for page in self.pages)
    
    def to_dict(self) -> List[dict]:
        return [{"page_number": p.page_number, "text": p.text} for p in self.pages]
    
    def __iter__(self):
        return iter(self.pages)
    
    def __len__(self):
        return len(self.pages)
