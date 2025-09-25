import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject } from 'rxjs';

export interface StreamChunk {
  type: 'chunk' | 'agent_created' | 'task_completed' | 'error';
  data: any;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  user_message: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
  main_agent_id: string;
  agents: Agent[];
  chat_history: ChatMessage[];
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  task_id: string;
  status: 'active' | 'inactive';
  type: 'main' | 'sub';
  assigned_task?: string;
  autogen_config?: any;
}

export interface ChatMessage {
  from: 'user' | 'agent';
  text: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class StreamingApiService {
  private readonly baseUrl = 'http://localhost:8000/api';
  
  // Streaming state
  private readonly _isStreaming = signal(false);
  private readonly _currentStreamTaskId = signal<string | null>(null);
  private readonly _streamingResponse = signal('');
  private readonly _streamingError = signal<string | null>(null);
  
  // Tasks and agents state
  private readonly _tasks = signal<Task[]>([]);
  private readonly _activeTaskId = signal<string | null>(null);
  private readonly _activeAgentId = signal<string | null>(null);
  
  // Computed properties
  readonly isStreaming = this._isStreaming.asReadonly();
  readonly currentStreamTaskId = this._currentStreamTaskId.asReadonly();
  readonly streamingResponse = this._streamingResponse.asReadonly();
  readonly streamingError = this._streamingError.asReadonly();
  readonly tasks = this._tasks.asReadonly();
  readonly activeTaskId = this._activeTaskId.asReadonly();
  readonly activeAgentId = this._activeAgentId.asReadonly();
  
  readonly currentTask = computed(() => {
    const taskId = this._activeTaskId();
    return this._tasks().find(t => t.id === taskId) || null;
  });
  
  readonly currentAgent = computed(() => {
    const agentId = this._activeAgentId();
    const currentTask = this.currentTask();
    return currentTask?.agents.find(a => a.id === agentId) || null;
  });
  
  readonly activeChat = computed(() => {
    const currentTask = this.currentTask();
    return currentTask?.chat_history || [];
  });
  
  // Stream subjects for real-time updates
  private streamSubject = new Subject<StreamChunk>();
  public stream$ = this.streamSubject.asObservable();

  constructor(private http: HttpClient) {}

  async createTaskWithAgents(title: string, description: string, userMessage: string): Promise<Task> {
    try {
      const response = await this.http.post<Task>(`${this.baseUrl}/tasks`, {
        title,
        description,
        user_message: userMessage
      }).toPromise();
      
      if (response) {
        this._tasks.update(tasks => [response, ...tasks]);
        this._activeTaskId.set(response.id);
        this._activeAgentId.set(response.main_agent_id);
        return response;
      }
      
      throw new Error('Failed to create task');
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async streamChatMessage(taskId: string, message: string): Promise<void> {
    this._isStreaming.set(true);
    this._currentStreamTaskId.set(taskId);
    this._streamingResponse.set('');
    this._streamingError.set(null);
    
    try {
      // Add user message to current task's chat history
      this._addMessageToTask(taskId, {
        from: 'user',
        text: message,
        timestamp: new Date().toISOString()
      });

      const response = await fetch(`${this.baseUrl}/stream-chat?task_id=${taskId}&message=${encodeURIComponent(message)}`, {
        method: 'POST',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              this._handleStreamChunk(data);
            } catch (parseError) {
              console.error('Error parsing stream data:', parseError);
            }
          }
        }
      }

    } catch (error) {
      console.error('Streaming error:', error);
      this._streamingError.set(error instanceof Error ? error.message : 'Unknown streaming error');
    } finally {
      this._isStreaming.set(false);
      this._currentStreamTaskId.set(null);
    }
  }

  private _handleStreamChunk(chunk: StreamChunk): void {
    this.streamSubject.next(chunk);

    switch (chunk.type) {
      case 'chunk':
        this._streamingResponse.set(chunk.data.text);
        break;
      
      case 'task_completed':
        // Add the final streaming response to chat history before clearing it
        const finalResponse = this._streamingResponse();
        if (finalResponse && chunk.data.task_id) {
          this._addMessageToTask(chunk.data.task_id, {
            from: 'agent',
            text: finalResponse,
            timestamp: new Date().toISOString()
          });
        }
        
        if (chunk.data.chat_history) {
          this._updateTaskChatHistory(chunk.data.task_id, chunk.data.chat_history);
        }
        this._streamingResponse.set('');
        break;
      
      case 'error':
        this._streamingError.set(chunk.data.message);
        break;
    }
  }

  private _addMessageToTask(taskId: string, message: ChatMessage): void {
    this._tasks.update(tasks => 
      tasks.map(task => 
        task.id === taskId 
          ? { ...task, chat_history: [...task.chat_history, message] }
          : task
      )
    );
  }

  private _updateTaskChatHistory(taskId: string, chatHistory: ChatMessage[]): void {
    this._tasks.update(tasks => 
      tasks.map(task => 
        task.id === taskId 
          ? { ...task, chat_history: chatHistory }
          : task
      )
    );
  }

  setActiveTask(taskId: string): void {
    this._activeTaskId.set(taskId);
    this._activeAgentId.set(null); // Clear active agent when switching tasks
  }

  setActiveAgent(agentId: string): void {
    this._activeAgentId.set(agentId);
  }

  async getTask(taskId: string): Promise<Task | null> {
    try {
      const response = await this.http.get<Task>(`${this.baseUrl}/tasks/${taskId}`).toPromise();
      return response || null;
    } catch (error) {
      console.error('Error fetching task:', error);
      return null;
    }
  }

  async listTasks(): Promise<Task[]> {
    try {
      const response = await this.http.get<{ tasks: Task[] }>(`${this.baseUrl}/tasks`).toPromise();
      const tasks = response?.tasks || [];
      this._tasks.set(tasks);
      return tasks;
    } catch (error) {
      console.error('Error listing tasks:', error);
      return [];
    }
  }

  async chatWithAgent(agentId: string, message: string): Promise<string> {
    try {
      const response = await this.http.post<{ response: string }>(`${this.baseUrl}/agents/${agentId}/chat`, {
        message
      }).toPromise();
      
      return response?.response || 'No response received';
    } catch (error) {
      console.error('Error chatting with agent:', error);
      return 'Error communicating with agent';
    }
  }

  // Clear streaming state
  clearStreamingState(): void {
    this._isStreaming.set(false);
    this._currentStreamTaskId.set(null);
    this._streamingResponse.set('');
    this._streamingError.set(null);
  }
}
