import os
from django.conf import settings
from .models import File, Project

# --- Modern v0.3+ Imports ---
from langchain_google_genai import ChatGoogleGenerativeAI
# Use HuggingFace for embeddings (Free, Local, No Quota limits)
from langchain_community.embeddings import HuggingFaceEmbeddings 
from langchain_community.vectorstores import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

# Configuration
PERSIST_DIRECTORY = os.path.join(settings.BASE_DIR, 'chroma_db')

def get_embeddings():
    # Use a high-quality, small local model (free, no API key needed)
    return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def get_vectorstore():
    """
    Initializes or loads the Chroma Vector Store.
    """
    embeddings = get_embeddings()
    return Chroma(
        persist_directory=PERSIST_DIRECTORY, 
        embedding_function=embeddings
    )

def index_project(project_id):
    """
    1. Fetches all files for a given project.
    2. Splits code into chunks.
    3. Stores them in the Vector DB with metadata.
    """
    print(f"RAG: Starting indexing for Project {project_id}...")
    
    try:
        # 1. Fetch Files from Django DB
        try:
            project = Project.objects.get(id=project_id)
            files = File.objects.filter(project=project)
        except Project.DoesNotExist:
            return False, "Project not found."

        if not files.exists():
            return True, "No files to index."

        # 2. Convert Django Models to LangChain Documents
        documents = []
        for file in files:
            if not file.content.strip():
                continue 
            
            # Basic language detection
            ext = file.name.split('.')[-1] if '.' in file.name else "text"
            
            doc = Document(
                page_content=file.content,
                metadata={
                    "project_id": str(project_id),
                    "file_id": str(file.id),
                    "file_name": file.name,
                    "language": ext
                }
            )
            documents.append(doc)

        if not documents:
            return True, "No content to index."

        # 3. Split Text (Code Optimized)
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", " ", ""]
        )
        splits = text_splitter.split_documents(documents)

        # 4. Store in ChromaDB
        vectorstore = get_vectorstore()
        vectorstore.add_documents(documents=splits)
        
        # Persist if needed (older versions of Chroma)
        try:
            vectorstore.persist() 
        except AttributeError:
            pass 
        
        print(f"RAG: Successfully indexed {len(splits)} chunks for Project {project_id}.")
        return True, f"Indexed {len(files)} files."
        
    except Exception as e:
        print(f"RAG Indexing Error: {str(e)}")
        return False, str(e)

def format_docs(docs):
    """Helper to join retrieved documents into a single string with filenames"""
    formatted_docs = []
    for doc in docs:
        # Extract filename from metadata
        filename = doc.metadata.get("file_name", "Unknown File")
        # Format clearly so the AI knows which file is which
        entry = f"File: {filename}\nCode Content:\n{doc.page_content}\n------------------------"
        formatted_docs.append(entry)
    return "\n\n".join(formatted_docs)

def chat_with_project(project_id, user_query):
    try:
        vectorstore = get_vectorstore()
        
        # 1. Retrieve File Structure Context
        try:
            project = Project.objects.get(id=project_id)
            files = File.objects.filter(project=project)
            file_list = ", ".join([f.name for f in files])
            project_context = f"Project Name: {project.name}\nFiles in Project: {file_list}"
        except Project.DoesNotExist:
            project_context = "Project structure unknown."

        # 2. Define Retriever (standard logic)
        retriever = vectorstore.as_retriever(
            search_kwargs={
                "k": 5, 
                "filter": {"project_id": str(project_id)} 
            }
        )

        # 3. Setup LLM
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-lite", 
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0.3
        )

        # 4. Updated Prompt Template
        template = """You are an expert AI coding assistant named CodeLive AI.
        
        Project Overview:
        {project_context}
        
        Use the retrieved code snippets below to answer specific questions about implementation.
        If the answer is not in the context, say you don't know.
        
        Code Context:
        {context}
        
        Question: {question}
        
        Answer:"""
        
        prompt = ChatPromptTemplate.from_template(template)

        # 5. Build Chain
        # We need to inject 'project_context' manually
        rag_chain = (
            {
                "context": retriever | format_docs, 
                "question": RunnablePassthrough(),
                "project_context": lambda x: project_context 
            }
            | prompt
            | llm
            | StrOutputParser()
        )

        answer = rag_chain.invoke(user_query)
        return answer

    except Exception as e:
        print(f"AI Error: {str(e)}")
        return f"I apologize, but I am having trouble connecting to the AI model right now. (Error: {str(e)})"