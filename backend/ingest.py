"""Standalone RAG ingestion script.

Run this once before starting the API to ingest astrology knowledge into ChromaDB.
Usage: python ingest.py
"""

import os
import glob
from pathlib import Path

from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
import chromadb

load_dotenv()

DATA_DIR = Path(__file__).parent / "data" / "astrology_notes"
FLAG_FILE = Path(__file__).parent / "chroma_initialized.flag"
COLLECTION_NAME = "astrology_notes"
CHUNK_SIZE = 800
CHUNK_OVERLAP = 100


def get_chroma_client():
    """Get the appropriate ChromaDB client (Cloud or Local)."""
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


def ingest():
    """Read all .txt files from data/astrology_notes/ and ingest into ChromaDB."""
    if FLAG_FILE.exists():
        print("✓ ChromaDB already initialized (flag file exists). Skipping ingestion.")
        print("  To re-ingest, delete 'chroma_initialized.flag' and run again.")
        return

    txt_files = sorted(glob.glob(str(DATA_DIR / "*.txt")))
    if not txt_files:
        print(f"✗ No .txt files found in {DATA_DIR}")
        return

    print(f"Found {len(txt_files)} knowledge files to ingest:")
    for f in txt_files:
        print(f"  • {os.path.basename(f)}")

    # Read and split texts
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " "],
    )

    all_texts = []
    all_metadatas = []

    for filepath in txt_files:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        chunks = splitter.split_text(content)
        source = os.path.basename(filepath)

        for i, chunk in enumerate(chunks):
            all_texts.append(chunk)
            all_metadatas.append({"source": source, "chunk_index": i})

    print(f"\nSplit into {len(all_texts)} chunks total.")

    # Create embeddings and store
    print("Creating embeddings and storing in ChromaDB...")
    embedding_function = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    client = get_chroma_client()

    vector_store = Chroma(
        client=client,
        collection_name=COLLECTION_NAME,
        embedding_function=embedding_function,
    )

    vector_store.add_texts(texts=all_texts, metadatas=all_metadatas)

    # Write flag file
    FLAG_FILE.write_text(f"Ingested {len(all_texts)} chunks from {len(txt_files)} files.\n")
    print(f"✓ Successfully ingested {len(all_texts)} chunks into ChromaDB.")
    print(f"  Flag file created: {FLAG_FILE}")


if __name__ == "__main__":
    ingest()
