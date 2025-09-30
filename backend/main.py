from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
import json
import os
import tempfile
from datetime import datetime
from autogen_agent_manager import AutogenAgentManager
import uvicorn

app = FastAPI(title="AI Agent Hub API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # Angular dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agent manager
agent_manager = AutogenAgentManager()

# Pydantic models
class TaskCreate(BaseModel):
    title: str
    description: str
    user_message: str

class AgentCreate(BaseModel):
    name: str
    role: str
    description: str
    task_id: str

class ChatMessage(BaseModel):
    from_user: str  # 'user' or 'agent'
    text: str
    timestamp: str

class ChatCreate(BaseModel):
    title: str
    task_id: str
    messages: List[ChatMessage]

class StreamResponse(BaseModel):
    type: str  # 'chunk', 'agent_created', 'task_completed', 'error'
    data: Dict[str, Any]

@app.get("/")
async def root():
    return {"message": "AI Agent Hub API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/tasks")
async def create_task_with_agents(task: TaskCreate):
    """Create a new task with main agent and sub-agents"""
    try:
        result = await agent_manager.create_task_with_agents(
            title=task.title,
            description=task.description,
            user_message=task.user_message
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/stream-chat")
async def stream_chat_message(task_id: str, message: str):
    """Stream chat response from agents"""
    try:
        async def generate_response():
            async for chunk in agent_manager.stream_chat_response(task_id, message):
                yield f"data: {json.dumps(chunk)}\n\n"
        
        from fastapi.responses import StreamingResponse
        return StreamingResponse(
            generate_response(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tasks/{task_id}")
async def get_task(task_id: str):
    """Get task details with agents"""
    try:
        task = await agent_manager.get_task(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tasks")
async def list_tasks():
    """List all tasks"""
    try:
        tasks = await agent_manager.list_tasks()
        return {"tasks": tasks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tasks/{task_id}/agents")
async def get_task_agents(task_id: str):
    """Get agents for a specific task"""
    try:
        agents = await agent_manager.get_task_agents(task_id)
        return {"agents": agents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agents/{agent_id}/chat")
async def chat_with_agent(agent_id: str, message: str):
    """Chat with a specific agent"""
    try:
        response = await agent_manager.chat_with_agent(agent_id, message)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tasks-with-file")
async def create_task_with_file(
    title: str = Form(...),
    description: str = Form(...),
    user_message: str = Form(...),
    file: UploadFile = File(...)
):
    """Create a new task with agents and process uploaded file"""
    try:
        # Validate file type
        if not file.filename.endswith('.txt'):
            raise HTTPException(status_code=400, detail="Only .txt files are allowed")
        
        # Read file content
        file_content = await file.read()
        file_text = file_content.decode('utf-8')
        
        # Create task with file content
        task = await agent_manager.create_task_with_agents(
            title=title,
            description=description,
            user_message=user_message,
            file_content=file_text
        )
        
        return task
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/stream-chat-with-file")
async def stream_chat_with_file(
    task_id: str = Form(...),
    message: str = Form(...),
    file: UploadFile = File(...)
):
    """Stream chat response with file processing"""
    try:
        # Validate file type
        if not file.filename.endswith('.txt'):
            raise HTTPException(status_code=400, detail="Only .txt files are allowed")
        
        # Read file content
        file_content = await file.read()
        file_text = file_content.decode('utf-8')
        
        async def generate_response():
            async for chunk in agent_manager.stream_chat_response_with_file(task_id, message, file_text):
                yield f"data: {json.dumps(chunk)}\n\n"
        
        return StreamingResponse(
            generate_response(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/download-processed-file/{task_id}")
async def download_processed_file(task_id: str):
    """Download the processed file for a task"""
    try:
        processed_file_path = await agent_manager.get_processed_file_path(task_id)
        if not processed_file_path or not os.path.exists(processed_file_path):
            raise HTTPException(status_code=404, detail="Processed file not found")
        
        return FileResponse(
            processed_file_path,
            media_type='text/plain',
            filename=f"processed_{task_id}.txt"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
