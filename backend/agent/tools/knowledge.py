"""Knowledge lookup tool using LangChain and ChromaDB for RAG."""

import os
from langchain_core.tools import tool
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
import chromadb


def get_chroma_client():
    """Get the appropriate ChromaDB client (Cloud or Local)."""
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.getenv("CHROMA_API_KEY")
    tenant = os.getenv("CHROMA_TENANT")
    database = os.getenv("CHROMA_DATABASE")
    
    if api_key and tenant and database:
        return chromadb.CloudClient(
            api_key=api_key,
            tenant=tenant,
            database=database,
        )
    else:
        persist_dir = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
        return chromadb.PersistentClient(path=persist_dir)


@tool
def knowledge_lookup(query: str) -> list[str]:
    """Look up astrological concepts, definitions, and interpretation guidelines.
    
    Use this tool when the user asks general questions about astrology (e.g. 
    "what does a retrograde planet mean?", "tell me about the 7th house", 
    "what is a grand trine?").
    
    Args:
        query: The search query string.
        
    Returns:
        A list of relevant knowledge chunks.
    """
    embedding_function = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    client = get_chroma_client()
    
    vector_store = Chroma(
        client=client,
        collection_name="astrology_notes",
        embedding_function=embedding_function,
    )
    
    # Retrieve top 3 relevant chunks
    docs = vector_store.similarity_search(query, k=3)
    return [doc.page_content for doc in docs]
