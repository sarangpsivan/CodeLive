import os
import re
from django.conf import settings
from .models import File, Project
from langchain_groq import ChatGroq
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

def get_embeddings():
    # FastEmbed runs locally, no API key needed for embeddings
    # uses "BAAI/bge-small-en-v1.5" by default which is excellent
    return FastEmbedEmbeddings()

def get_vectorstore():
    embeddings = get_embeddings()
    if not embeddings:
        return None
        
    index_name = "code-live-index" # Make sure this matches your Pinecone index
    
    # Check if PINECONE_API_KEY is set
    if not settings.PINECONE_API_KEY:
        print("RAG Error: PINECONE_API_KEY not found.")
        return None

    return PineconeVectorStore(
        index_name=index_name,
        embedding=embeddings
    )

def index_project(project_id):
    print(f"RAG: Starting indexing for Project {project_id}...")
    try:
        project = Project.objects.get(id=project_id)
        files = File.objects.filter(project=project)
        
        if not files.exists():
            return True, "No files to index."

        documents = []
        for file in files:
            content = file.content
            if not content:
                continue

            # Ensure content is a string
            if isinstance(content, bytes):
                try:
                    content = content.decode('utf-8')
                except UnicodeDecodeError:
                    continue  # Skip binary files

            if not content.strip():
                continue
            
            ext = file.name.split('.')[-1] if '.' in file.name else "text"
            doc = Document(
                page_content=content,
                metadata={
                    "project_id": str(project_id),
                    "file_id": str(file.id),
                    "file_name": file.name,
                    "language": ext
                }
            )
            documents.append(doc)

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=100
        )
        splits = text_splitter.split_documents(documents)

        vectorstore = get_vectorstore()
        if not vectorstore:
             return False, "Vector Store initialization failed (Check API Keys)."

        vectorstore.add_documents(documents=splits)
        
        print(f"RAG: Successfully indexed {len(splits)} chunks.")
        return True, f"Indexed {len(files)} files."
    except Exception as e:
        print(f"RAG Indexing Error: {str(e)}")
        return False, str(e)

def format_docs(docs):
    return "\n\n".join([f"File: {d.metadata.get('file_name', 'unknown')}\nContent: {d.page_content}" for d in docs])


def chat_with_project(project_id, user_query, current_file_context=None):
    try:
        if not settings.GROQ_API_KEY:
             return "Configuration Error: GROQ_API_KEY not found."

        llm = ChatGroq(
            model="llama-3.1-8b-instant", 
            api_key=settings.GROQ_API_KEY,
            temperature=0.3
        )

        # MODE 1: Active File Context
        if current_file_context:
            template = """You are CodeLive AI, a helpful coding assistant.
            You are answering questions about the file the user is currently editing.

            {context}

            Question: {question}
            Answer concisely and directly related to the code provided:"""
            
            prompt = ChatPromptTemplate.from_template(template)
            chain = prompt | llm | StrOutputParser()
            
            return chain.invoke({
                "context": current_file_context,
                "question": user_query
            })

        # MODE 2: RAG (Fallback if no file is open or context not sent)
        vectorstore = get_vectorstore()
        if not vectorstore:
             return "AI Service Unavailable: Vector database check failed."
        
        try:
            project = Project.objects.get(id=project_id)
            file_names = File.objects.filter(project=project).values_list('name', flat=True)[:30]
            project_context = f"Project: {project.name}. Files: {', '.join(file_names)}"
        except Project.DoesNotExist:
            project_context = "Unknown project."

        retriever = vectorstore.as_retriever(
            search_kwargs={
                "k": 2, 
                "filter": {"project_id": str(project_id)} 
            }
        )

        template = """You are CodeLive AI, a concise coding assistant.
        {project_context}

        Retrieved Code:
        {context}

        Question: {question}
        Answer concisely:"""
        
        prompt = ChatPromptTemplate.from_template(template)

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

        return rag_chain.invoke(user_query)

    except Exception as e:
        error_msg = str(e)
        print(f"AI ERROR: {error_msg}")
        
        if "429" in error_msg or "quota" in error_msg.lower():
            return "Total Quota Exceeded: You've hit the daily limit for today. Please wait 24 hours."
        
        return f"Connection issues. (Error: {error_msg[:50]})"
