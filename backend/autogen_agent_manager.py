# import autogen  # Temporarily disabled
import json
import asyncio
from typing import List, Dict, Any, Optional, AsyncGenerator
from datetime import datetime
import uuid
import httpx

class AutogenAgentManager:
    def __init__(self):
        self.tasks: Dict[str, Dict[str, Any]] = {}
        self.agents: Dict[str, Dict[str, Any]] = {}
        self.chats: Dict[str, List[Dict[str, Any]]] = {}
        
        # Initialize AutoGen configuration
        self.config_list = [
            {
                "model": "ollama/llama3.1:8b",
                "api_base": "http://localhost:11434/v1",
                "api_key": "ollama",  # Ollama doesn't require real API key
            }
        ]
        
        self.llm_config = {
            "config_list": self.config_list,
            "temperature": 0.7,
            "timeout": 120,
        }
    
    async def create_task_with_agents(self, title: str, description: str, user_message: str) -> Dict[str, Any]:
        """Create a new task with main agent and sub-agents"""
        task_id = f"task_{uuid.uuid4().hex[:8]}"
        timestamp = datetime.now().isoformat()
        
        # Generate meaningful task title using LLM
        task_title = await self._generate_task_title(user_message)
        
        # Create main coordinator agent
        main_agent_id = f"main_{uuid.uuid4().hex[:8]}"
        main_agent = {
            "id": main_agent_id,
            "name": "Fő Koordinátor",
            "role": "Koordinátor",
            "description": "Feladat koordinálása és sub agent-ek kezelése",
            "task_id": task_id,
            "status": "active",
            "type": "main",
            "autogen_config": {
                "system_message": f"""Te vagy a fő koordinátor agent. 
                A feladatod: {task_title}
                Leírás: {description}
                Felhasználó üzenete: {user_message}
                
                Koordináld a sub agent-eket és biztosítsd, hogy a feladat sikeresen el legyen végezve.""",
                "human_input_mode": "NEVER",
                "max_consecutive_auto_reply": 3,
            }
        }
        
        # Create sub-agents based on task analysis
        sub_agents = await self._create_sub_agents(task_id, user_message)
        
        # Create task
        task = {
            "id": task_id,
            "title": task_title,  # Use LLM-generated title
            "description": description,
            "user_message": user_message,
            "status": "in_progress",
            "created_at": timestamp,
            "updated_at": timestamp,
            "main_agent_id": main_agent_id,
            "agents": [main_agent] + sub_agents,
            "chat_history": []
        }
        
        # Store task and agents
        self.tasks[task_id] = task
        self.agents[main_agent_id] = main_agent
        
        for agent in sub_agents:
            self.agents[agent["id"]] = agent
        
        # Initialize chat for task
        self.chats[task_id] = []
        
        return task
    
    async def _create_sub_agents(self, task_id: str, user_message: str) -> List[Dict[str, Any]]:
        """Create sub-agents based on task analysis"""
        sub_agents = []
        
        # Analyze user message to determine needed agent types
        agent_types = self._analyze_task_requirements(user_message)
        
        for agent_type in agent_types:
            agent_id = f"sub_{uuid.uuid4().hex[:8]}"
            agent_config = self._get_agent_config(agent_type, task_id, user_message)
            
            agent = {
                "id": agent_id,
                "name": agent_config["name"],
                "role": agent_config["role"],
                "description": agent_config["description"],
                "task_id": task_id,
                "status": "active",
                "type": "sub",
                "assigned_task": user_message,
                "autogen_config": agent_config["autogen_config"]
            }
            
            sub_agents.append(agent)
        
        return sub_agents
    
    def _analyze_task_requirements(self, user_message: str) -> List[str]:
        """Analyze user message to determine required agent types"""
        message_lower = user_message.lower()
        
        # Simple questions that don't need agents
        simple_questions = [
            "névnap", "napon", "mi a mai", "mi van ma", "hány óra", "időjárás",
            "milyen idő van", "hány fok", "mi a dátum", "milyen nap"
        ]
        
        # If it's a simple question, return empty list (no agents needed)
        if any(keyword in message_lower for keyword in simple_questions):
            return []
        
        agent_types = []
        
        # Research keywords
        if any(keyword in message_lower for keyword in ["kutatás", "információ", "adatok", "elemzés", "research", "data", "analysis"]):
            agent_types.append("research")
        
        # Writing keywords
        if any(keyword in message_lower for keyword in ["írás", "dokumentum", "jelentés", "cikk", "write", "document", "report", "article"]):
            agent_types.append("writer")
        
        # Technical keywords
        if any(keyword in message_lower for keyword in ["kód", "programozás", "fejlesztés", "technikai", "code", "programming", "development", "technical", "weboldal", "weboldalt", "react", "angular", "vue", "html", "css", "javascript"]):
            agent_types.append("technical")
        
        # Creative keywords
        if any(keyword in message_lower for keyword in ["kreatív", "design", "grafikai", "szép", "creative", "design", "graphic", "beautiful"]):
            agent_types.append("creative")
        
        # Default to general if no specific requirements detected
        if not agent_types:
            agent_types = ["general"]
        
        return agent_types
    
    def _get_agent_config(self, agent_type: str, task_id: str, user_message: str) -> Dict[str, Any]:
        """Get configuration for specific agent type"""
        configs = {
            "research": {
                "name": "Kutatási Szakértő",
                "role": "Kutatás",
                "description": "Információgyűjtés és elemzés",
                "autogen_config": {
                    "system_message": f"""Te vagy a kutatási szakértő agent. 
                    Feladatod: {user_message}
                    
                    Segíts információkat gyűjteni, elemzéseket készíteni és adatokat rendszerezni a feladat teljesítéséhez.""",
                    "human_input_mode": "NEVER",
                    "max_consecutive_auto_reply": 5,
                }
            },
            "writer": {
                "name": "Író Szakértő",
                "role": "Írás",
                "description": "Szövegek és dokumentumok készítése",
                "autogen_config": {
                    "system_message": f"""Te vagy az író szakértő agent.
                    Feladatod: {user_message}
                    
                    Segíts szövegeket, dokumentumokat és jelentéseket készíteni professzionális minőségben.""",
                    "human_input_mode": "NEVER",
                    "max_consecutive_auto_reply": 5,
                }
            },
            "technical": {
                "name": "Technikai Szakértő",
                "role": "Technikai",
                "description": "Kódolás és technikai megoldások",
                "autogen_config": {
                    "system_message": f"""Te vagy a technikai szakértő agent.
                    Feladatod: {user_message}
                    
                    Segíts kódolással, technikai megoldásokkal és fejlesztési feladatokkal.""",
                    "human_input_mode": "NEVER",
                    "max_consecutive_auto_reply": 5,
                }
            },
            "creative": {
                "name": "Kreatív Szakértő",
                "role": "Kreatív",
                "description": "Kreatív megoldások és design",
                "autogen_config": {
                    "system_message": f"""Te vagy a kreatív szakértő agent.
                    Feladatod: {user_message}
                    
                    Segíts kreatív megoldásokkal, design-nal és vizuális elemekkel.""",
                    "human_input_mode": "NEVER",
                    "max_consecutive_auto_reply": 5,
                }
            },
            "general": {
                "name": "Általános Szakértő",
                "role": "Általános",
                "description": "Általános feladatok kezelése",
                "autogen_config": {
                    "system_message": f"""Te vagy az általános szakértő agent.
                    Feladatod: {user_message}
                    
                    Segíts általános feladatokkal és problémamegoldással.""",
                    "human_input_mode": "NEVER",
                    "max_consecutive_auto_reply": 5,
                }
            }
        }
        
        return configs.get(agent_type, configs["general"])
    
    async def stream_chat_response(self, task_id: str, message: str) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream chat response from agents"""
        try:
            # Add user message to chat history
            if task_id not in self.chats:
                self.chats[task_id] = []
            
            user_message_entry = {
                "from": "user",
                "text": message,
                "timestamp": datetime.now().isoformat()
            }
            self.chats[task_id].append(user_message_entry)
            
            # Get task and main agent
            task = self.tasks.get(task_id)
            if not task:
                yield {"type": "error", "data": {"message": "Task not found"}}
                return
            
            main_agent_id = task["main_agent_id"]
            main_agent = self.agents.get(main_agent_id)
            
            if not main_agent:
                yield {"type": "error", "data": {"message": "Main agent not found"}}
                return
            
            # Check if this is a simple question that doesn't need agents
            sub_agents = [agent for agent in task["agents"] if agent["type"] == "sub"]
            
            if not sub_agents:  # No sub-agents created (simple question)
                # Generate direct response without agent creation meta-text
                response_text = await self._generate_direct_response(message)
            else:
                # Generate streaming response from main agent using Ollama
                response_text = await self._generate_main_agent_response(task, message)
            
            # Stream the response word by word
            words = response_text.split()
            current_response = ""
            
            for i, word in enumerate(words):
                current_response += word + " "
                
                # Yield chunk every few words
                if i % 3 == 0 or i == len(words) - 1:
                    yield {
                        "type": "chunk",
                        "data": {
                            "task_id": task_id,
                            "agent_id": main_agent_id,
                            "text": current_response.strip(),
                            "is_complete": i == len(words) - 1
                        }
                    }
                    await asyncio.sleep(0.05)  # Faster streaming for better UX
            
            # Add final response to chat history
            agent_message_entry = {
                "from": "agent",
                "text": response_text,
                "timestamp": datetime.now().isoformat()
            }
            self.chats[task_id].append(agent_message_entry)
            
            yield {
                "type": "task_completed",
                "data": {
                    "task_id": task_id,
                    "response": response_text,
                    "chat_history": self.chats[task_id]
                }
            }
            
        except Exception as e:
            yield {"type": "error", "data": {"message": str(e)}}
    
    async def _generate_main_agent_response(self, task: Dict[str, Any], user_message: str) -> str:
        """Generate response from main agent using Ollama"""
        sub_agents = [agent for agent in task["agents"] if agent["type"] == "sub"]
        
        # Generate task title using Ollama
        task_title = await self._generate_task_title(user_message)
        
        # Generate detailed response using Ollama
        response = await self._generate_ollama_response(task, user_message, sub_agents)
        
        # Update task title
        task["title"] = task_title
        
        return response
    
    async def _generate_task_title(self, user_message: str) -> str:
        """Generate a meaningful task title using Ollama"""
        try:
            prompt = f"""Készíts egy rövid címet: "{user_message}"

A cím legyen 2-4 szóból, egyszerű és tömör. Csak a címet írd le."""
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "http://localhost:11434/v1/chat/completions",
                    json={
                        "model": "llama3.1:8b",
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 50,
                        "temperature": 0.7
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    title = result["choices"][0]["message"]["content"].strip()
                    return title[:100]  # Limit length
                else:
                    return f"Feladat: {user_message[:50]}..."
                    
        except Exception as e:
            print(f"Error generating title: {e}")
            return f"Feladat: {user_message[:50]}..."
    
    async def _generate_ollama_response(self, task: Dict[str, Any], user_message: str, sub_agents: List[Dict[str, Any]]) -> str:
        """Generate detailed response using Ollama"""
        try:
            prompt = f"""A felhasználó ezt kérte: "{user_message}"

Válaszolj közvetlenül és hasznosan a kérdésre. Ne magyarázd el, hogyan dolgozol, csak válaszolj a kérdésre. 

Ha egy egyszerű kérdés (mint "mi a mai névnap"), akkor adj egy konkrét választ.
Ha egy komplex feladat (mint weboldal készítése), akkor adj praktikus tanácsokat és lépéseket.

Válaszolj magyarul, barátságosan és segítőkészen."""
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "http://localhost:11434/v1/chat/completions",
                    json={
                        "model": "llama3.1:8b",
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 2000,
                        "temperature": 0.7
                    },
                    timeout=60.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result["choices"][0]["message"]["content"].strip()
                else:
                    return self._get_fallback_response(task, sub_agents)
                    
        except Exception as e:
            print(f"Error generating Ollama response: {e}")
            return self._get_fallback_response(task, sub_agents)
    
    async def _generate_direct_response(self, user_message: str) -> str:
        """Generate direct response for simple questions"""
        try:
            prompt = f"""Válaszolj közvetlenül és hasznosan erre: "{user_message}"

Ne magyarázd el, hogyan dolgozol, csak válaszolj a kérdésre. Ha nem tudod a pontos választ, mond el, hogy nem tudod."""
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "http://localhost:11434/v1/chat/completions",
                    json={
                        "model": "llama3.1:8b",
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 2000,
                        "temperature": 0.7
                    },
                    timeout=60.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result["choices"][0]["message"]["content"].strip()
                else:
                    return "Sajnálom, nem tudom megválaszolni ezt a kérdést."
                    
        except Exception as e:
            print(f"Error generating direct response: {e}")
            return "Sajnálom, nem tudom megválaszolni ezt a kérdést."
    
    def _get_fallback_response(self, task: Dict[str, Any], sub_agents: List[Dict[str, Any]]) -> str:
        """Fallback response if Ollama fails"""
        return f"""✅ Feladat megkaptam! Létrehoztam {len(sub_agents)} szakértő agent-et a feladat végrehajtásához:

{chr(10).join([f"• {agent['name']} - {agent['description']}" for agent in sub_agents])}

A feladat: {task['title']}
Leírás: {task['description']}

Kattints a feladatra, majd az agent-ekre a részletek megtekintéséhez! Minden agent speciális képességekkel rendelkezik a feladat hatékony elvégzéséhez."""
    
    async def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get task details"""
        return self.tasks.get(task_id)
    
    async def list_tasks(self) -> List[Dict[str, Any]]:
        """List all tasks"""
        return list(self.tasks.values())
    
    async def get_task_agents(self, task_id: str) -> List[Dict[str, Any]]:
        """Get agents for a specific task"""
        task = self.tasks.get(task_id)
        if not task:
            return []
        return task.get("agents", [])
    
    async def chat_with_agent(self, agent_id: str, message: str) -> str:
        """Chat with a specific agent"""
        agent = self.agents.get(agent_id)
        if not agent:
            return "Agent not found"
        
        # Simple response simulation
        return f"Agent {agent['name']} válasza: A feladatot értem és dolgozom rajta. ({message[:50]}...)"
