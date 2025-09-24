import { Injectable, computed, signal, effect, inject } from '@angular/core';
import { AgentsApiService } from '../services/agents-api.service';
import { RequestStateStore } from './request-state.store';

export interface Message {
  from: 'user' | 'agent';
  text: string;
}

export interface Chat {
  id: string;
  title: string;
  ts: string;
  taskId: string;
  preview?: string;
  messages: Message[];
}

export interface AgentSettings {
  instructions: { title: string; note?: string; config?: string; isNew?: boolean }[];
  apps: { title: string; note?: string; config?: string; isNew?: boolean }[];
  resources: { title: string; note?: string; config?: string; isNew?: boolean }[];
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  desc?: string;
  fixed?: boolean;
  settings?: AgentSettings;
  taskId?: string;
  status?: 'pending' | 'in-progress' | 'completed';
  assignedTask?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  userMessage: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
  updatedAt: string;
  mainAgentId?: string;
  agents: Agent[];
  isActive?: boolean;
}

export interface AgentsState {
  tasks: Task[];
  agents: Agent[];
  activeTaskId: string | null;
  activeAgentId: string | null;
  activeChatByTask: Record<string, string | null>;
  chats: Chat[];
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AgentsStore {
  // Private signals
  private readonly _tasks = signal<Task[]>([]);
  private readonly _agents = signal<Agent[]>([]);
  private readonly _activeTaskId = signal<string | null>(null);
  private readonly _activeAgentId = signal<string | null>(null);
  private readonly _activeChatByTask = signal<Record<string, string | null>>({});
  private readonly _chats = signal<Chat[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // Public computed signals
  readonly tasks = this._tasks.asReadonly();
  readonly agents = this._agents.asReadonly();
  readonly activeTaskId = this._activeTaskId.asReadonly();
  readonly activeAgentId = this._activeAgentId.asReadonly();
  readonly activeChatByTask = this._activeChatByTask.asReadonly();
  readonly chats = this._chats.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed properties
  readonly currentTask = computed(() => 
    this._tasks().find(t => t.id === this._activeTaskId()) ?? null
  );

  readonly currentAgent = computed(() => 
    this._activeAgentId() ? this._agents().find(a => a.id === this._activeAgentId()) ?? null : null
  );
  
  readonly taskChats = computed(() => 
    this._activeTaskId() ? this._chats().filter(c => c.taskId === this._activeTaskId()) : []
  );
  
  readonly activeChat = computed(() => {
    const activeTaskId = this._activeTaskId();
    if (!activeTaskId) return null;
    const map = this._activeChatByTask();
    return this._chats().find(c => c.id === map[activeTaskId]) ?? null;
  });

  readonly tasksWithAgents = computed(() => {
    return this._tasks().map(task => ({
      ...task,
      isActive: task.id === this._activeTaskId()
    }));
  });

  private readonly requestStateStore = inject(RequestStateStore);

  constructor(private agentsApi: AgentsApiService) {
    // Load initial data
    this.loadAgents();
  }

  // Actions
  async loadAgents(): Promise<void> {
    await this.requestStateStore.executeAgentsRequest(async () => {
      this._loading.set(true);
      this._error.set(null);
      
      try {
        const agents = await this.agentsApi.getAgents();
        this._agents.set(agents);
        this.requestStateStore.setAgentsData(agents);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load agents';
        this._error.set(errorMessage);
        this.requestStateStore.setAgentsError(errorMessage);
      } finally {
        this._loading.set(false);
      }
    });
  }

  async loadChats(): Promise<void> {
    await this.requestStateStore.executeChatsRequest(async () => {
      try {
        const chats = await this.agentsApi.getChats();
        this._chats.set(chats);
        this.requestStateStore.setChatsData(chats);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load chats';
        this._error.set(errorMessage);
        this.requestStateStore.setChatsError(errorMessage);
      }
    });
  }

  setActiveTask(taskId: string): void {
    this._activeTaskId.set(taskId);
    // Clear active agent when switching tasks
    this._activeAgentId.set(null);
  }

  setActiveAgent(agentId: string): void {
    this._activeAgentId.set(agentId);
  }

  setActiveChatForTask(taskId: string, chatId: string | null): void {
    const copy = { ...this._activeChatByTask() };
    copy[taskId] = chatId;
    this._activeChatByTask.set(copy);
  }

  async sendMessage(text: string): Promise<void> {
    if (!text.trim()) return;
    
    await this.requestStateStore.executeSendMessageRequest(async () => {
      // If no active task, create a new task with agents
      if (!this._activeTaskId()) {
        await this.createTaskWithAgents(text);
        return;
      }

      // If we have an active task but no active agent, use the main agent
      const currentAgent = this.currentAgent();
      if (!currentAgent) {
        const currentTask = this.currentTask();
        if (currentTask && currentTask.agents.length > 0) {
          // Set the first agent as active (main coordinator)
          this.setActiveAgent(currentTask.agents[0].id);
        }
      }

      const taskId = this._activeTaskId()!;
      let chat = this.activeChat();
      
      if (!chat) {
        const agent = this.currentAgent();
        if (!agent) return; // Safety check
        
        const id = 'c' + Date.now();
        chat = {
          id,
          title: `Új beszélgetés – ${agent.name}`,
          ts: new Date().toISOString().slice(0, 16).replace('T', ' '),
          taskId,
          preview: text.slice(0, 80) + '…',
          messages: []
        };
        this._chats.update(list => [chat!, ...list]);
        this.setActiveChatForTask(taskId, chat.id);
      }

      // Add user message
      this._chats.update(list => 
        list.map(c => c.id === chat!.id 
          ? { ...c, messages: [...c.messages, { from: 'user', text }] }
          : c
        )
      );

      // Simulate agent response
      setTimeout(() => {
        this._chats.update(list => 
          list.map(c => c.id === chat!.id 
            ? { ...c, messages: [...c.messages, { from: 'agent', text: '👍 Megkaptam. (Demo válasz)' }] }
            : c
          )
        );
      }, 300);
    });
  }

  private async createTaskWithAgents(userMessage: string): Promise<void> {
    const timestamp = Date.now();
    
    // Create task
    const taskId = `task-${timestamp}`;
    const task: Task = {
      id: taskId,
      title: `Új feladat - ${new Date().toLocaleDateString()}`,
      description: userMessage.slice(0, 100) + '...',
      userMessage,
      status: 'in-progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      agents: []
    };

    // Create main agent
    const mainAgentId = `main-${timestamp}`;
    const mainAgent: Agent = {
      id: mainAgentId,
      name: 'Fő Koordinátor',
      role: 'Koordinátor',
      desc: 'Feladat koordinálása és sub agent-ek kezelése',
      taskId,
      status: 'in-progress',
      assignedTask: userMessage,
      settings: {
        instructions: [
          { title: 'Feladat elemzése', note: 'A felhasználó kérésének megértése és lebontása' },
          { title: 'Sub agent koordinálás', note: 'Megfelelő szakértő agent-ek kiválasztása' }
        ],
        apps: [],
        resources: []
      }
    };

    // Create sub agents based on the task
    const subAgents = this.generateSubAgents(userMessage, taskId);
    
    // Update task with agents
    task.agents = [mainAgent, ...subAgents];
    task.mainAgentId = mainAgentId;
    
    // Add task and agents
    this._tasks.update(list => [task, ...list]);
    this._agents.update(list => [mainAgent, ...list]);
    
    // Set as active
    this.setActiveTask(taskId);
    this.setActiveAgent(mainAgentId);

    // Create chat for task
    const chatId = 'c' + timestamp;
    const chat: Chat = {
      id: chatId,
      title: `Új feladat – ${task.title}`,
      ts: new Date().toISOString().slice(0, 16).replace('T', ' '),
      taskId,
      preview: userMessage.slice(0, 80) + '…',
      messages: [
        { from: 'user', text: userMessage },
        { 
          from: 'agent', 
          text: `✅ Feladat megkaptam! Létrehoztam ${subAgents.length} szakértő agent-et a feladat végrehajtásához:\n\n${subAgents.map(sa => `• ${sa.name} - ${sa.desc}`).join('\n')}\n\nKattints a feladatra, majd az agent-ekre a részletek megtekintéséhez!` 
        }
      ]
    };

    this._chats.update(list => [chat, ...list]);
    this.setActiveChatForTask(taskId, chatId);

    // Add sub agents after a short delay
    setTimeout(() => {
      this._agents.update(list => [...list, ...subAgents]);
    }, 500);
  }

  private generateSubAgents(userMessage: string, taskId: string): Agent[] {
    const subAgents: Agent[] = [];
    
    // Analyze the message to determine what kind of sub agents are needed
    const message = userMessage.toLowerCase();
    
    // Research agent
    if (message.includes('kutatás') || message.includes('információ') || message.includes('elemzés')) {
      subAgents.push({
        id: `research-${Date.now()}`,
        name: 'Kutatási Szakértő',
        role: 'Kutató',
        desc: 'Információgyűjtés és elemzés',
        taskId,
        assignedTask: 'Adatok gyűjtése és elemzése',
        status: 'pending',
        settings: {
          instructions: [
            { title: 'Információgyűjtés', note: 'Megbízható forrásokból történő adatgyűjtés' },
            { title: 'Adatelemzés', note: 'Gyűjtött információk strukturálása és értékelése' }
          ],
          apps: [
            { title: 'Web Search', note: 'Online keresés és adatgyűjtés' },
            { title: 'Database Access', note: 'Adatbázisok elérése és lekérdezése' }
          ],
          resources: [
            { title: 'Research Guidelines', note: 'Kutatási protokollok és irányelvek' }
          ]
        }
      });
    }

    // Writing agent
    if (message.includes('írás') || message.includes('dokumentum') || message.includes('jelentés')) {
      subAgents.push({
        id: `writer-${Date.now()}`,
        name: 'Író és Dokumentáló',
        role: 'Író',
        desc: 'Szövegek írása és dokumentálása',
        taskId,
        assignedTask: 'Szövegek és dokumentumok létrehozása',
        status: 'pending',
        settings: {
          instructions: [
            { title: 'Szövegszerkesztés', note: 'Egyértelmű és jól strukturált szövegek írása' },
            { title: 'Dokumentálás', note: 'Részletes dokumentáció készítése' }
          ],
          apps: [
            { title: 'Word Processor', note: 'Szövegszerkesztő alkalmazás' },
            { title: 'Markdown Editor', note: 'Markdown formátum szerkesztése' }
          ],
          resources: [
            { title: 'Style Guide', note: 'Írási stílus és formázási irányelvek' }
          ]
        }
      });
    }

    // Technical agent
    if (message.includes('technika') || message.includes('kód') || message.includes('programozás')) {
      subAgents.push({
        id: `tech-${Date.now()}`,
        name: 'Technikai Szakértő',
        role: 'Fejlesztő',
        desc: 'Technikai megoldások és implementáció',
        taskId,
        assignedTask: 'Technikai feladatok megoldása',
        status: 'pending',
        settings: {
          instructions: [
            { title: 'Kódfejlesztés', note: 'Tiszta és hatékony kód írása' },
            { title: 'Technikai elemzés', note: 'Technikai problémák megoldása' }
          ],
          apps: [
            { title: 'Code Editor', note: 'Kódszerkesztő és IDE' },
            { title: 'Version Control', note: 'Git és verziókezelés' }
          ],
          resources: [
            { title: 'Coding Standards', note: 'Kódolási szabványok és best practice-k' }
          ]
        }
      });
    }

    // Creative agent
    if (message.includes('kreatív') || message.includes('tervezés') || message.includes('design')) {
      subAgents.push({
        id: `creative-${Date.now()}`,
        name: 'Kreatív Tervező',
        role: 'Designer',
        desc: 'Kreatív megoldások és tervezés',
        taskId,
        assignedTask: 'Kreatív elemek és tervek készítése',
        status: 'pending',
        settings: {
          instructions: [
            { title: 'Kreatív tervezés', note: 'Innovatív és vizuálisan vonzó megoldások' },
            { title: 'Branding', note: 'Márkaidentitás és stílus kialakítása' }
          ],
          apps: [
            { title: 'Design Tools', note: 'Grafikai tervező eszközök' },
            { title: 'Image Editor', note: 'Kép szerkesztő alkalmazás' }
          ],
          resources: [
            { title: 'Design Guidelines', note: 'Tervezési irányelvek és szabványok' }
          ]
        }
      });
    }

    // Default agent if no specific type detected
    if (subAgents.length === 0) {
      subAgents.push({
        id: `general-${Date.now()}`,
        name: 'Általános Asszisztens',
        role: 'Asszisztens',
        desc: 'Általános feladatok végrehajtása',
        taskId,
        assignedTask: 'Feladat végrehajtása',
        status: 'pending',
        settings: {
          instructions: [
            { title: 'Feladat végrehajtás', note: 'A megadott feladat hatékony elvégzése' },
            { title: 'Koordináció', note: 'Egyéb agent-ekkel való együttműködés' }
          ],
          apps: [
            { title: 'Task Manager', note: 'Feladatkezelő alkalmazás' },
            { title: 'Communication', note: 'Kommunikációs eszközök' }
          ],
          resources: [
            { title: 'General Guidelines', note: 'Általános munkafolyamat irányelvek' }
          ]
        }
      });
    }

    return subAgents;
  }

  async createAgent(agent: Omit<Agent, 'id'>): Promise<void> {
    await this.requestStateStore.executeAgentsRequest(async () => {
      this._loading.set(true);
      this._error.set(null);
      
      try {
        const newAgent = await this.agentsApi.createAgent(agent);
        this._agents.update(list => [...list, newAgent]);
        this.requestStateStore.setAgentsData(this._agents());
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create agent';
        this._error.set(errorMessage);
        this.requestStateStore.setAgentsError(errorMessage);
      } finally {
        this._loading.set(false);
      }
    });
  }

  addInstruction(instruction: { title: string; description: string }): void {
    const currentAgent = this.currentAgent();
    if (!currentAgent || !currentAgent.settings) return;

    const updatedAgent = {
      ...currentAgent,
      settings: {
        ...currentAgent.settings,
        instructions: [
          ...currentAgent.settings.instructions,
          { 
            title: instruction.title, 
            note: instruction.description,
            isNew: true // Flag for animation
          }
        ]
      }
    };

    this._agents.update(agents => 
      agents.map(agent => agent.id === currentAgent.id ? updatedAgent : agent)
    );

    // Remove the new flag after animation completes
    setTimeout(() => {
      this._agents.update(agents => 
        agents.map(agent => {
          if (agent.id === currentAgent.id && agent.settings) {
            return {
              ...agent,
              settings: {
                ...agent.settings,
                instructions: agent.settings.instructions.map(inst => ({
                  ...inst,
                  isNew: false
                }))
              }
            };
          }
          return agent;
        })
      );
    }, 600); // Match animation duration
  }

  deleteInstruction(instructionTitle: string): void {
    const currentAgent = this.currentAgent();
    if (!currentAgent || !currentAgent.settings) return;

    const updatedAgent = {
      ...currentAgent,
      settings: {
        ...currentAgent.settings,
        instructions: currentAgent.settings.instructions.filter(
          inst => inst.title !== instructionTitle
        )
      }
    };

    this._agents.update(agents => 
      agents.map(agent => agent.id === currentAgent.id ? updatedAgent : agent)
    );
  }

  deleteApp(appTitle: string): void {
    const currentAgent = this.currentAgent();
    if (!currentAgent || !currentAgent.settings) return;

    const updatedAgent = {
      ...currentAgent,
      settings: {
        ...currentAgent.settings,
        apps: currentAgent.settings.apps.filter(
          app => app.title !== appTitle
        )
      }
    };

    this._agents.update(agents => 
      agents.map(agent => agent.id === currentAgent.id ? updatedAgent : agent)
    );
  }

  deleteResource(resourceTitle: string): void {
    const currentAgent = this.currentAgent();
    if (!currentAgent || !currentAgent.settings) return;

    const updatedAgent = {
      ...currentAgent,
      settings: {
        ...currentAgent.settings,
        resources: currentAgent.settings.resources.filter(
          resource => resource.title !== resourceTitle
        )
      }
    };

    this._agents.update(agents => 
      agents.map(agent => agent.id === currentAgent.id ? updatedAgent : agent)
    );
  }

  addApp(app: { title: string; connectorType: string; config: any }): void {
    const currentAgent = this.currentAgent();
    if (!currentAgent || !currentAgent.settings) return;

    const updatedAgent = {
      ...currentAgent,
      settings: {
        ...currentAgent.settings,
        apps: [
          ...currentAgent.settings.apps,
          { 
            title: app.title, 
            note: `${app.connectorType} konnektor`,
            config: JSON.stringify(app.config),
            isNew: true
          }
        ]
      }
    };

    this._agents.update(agents => 
      agents.map(agent => agent.id === currentAgent.id ? updatedAgent : agent)
    );

    // Remove the new flag after animation completes
    setTimeout(() => {
      this._agents.update(agents => 
        agents.map(agent => {
          if (agent.id === currentAgent.id && agent.settings) {
            return {
              ...agent,
              settings: {
                ...agent.settings,
                apps: agent.settings.apps.map(app => ({
                  ...app,
                  isNew: false
                }))
              }
            };
          }
          return agent;
        })
      );
    }, 600);
  }

  addResource(resource: { name: string; folder: string; files: string[]; fileContents?: { name: string; content: string; size: number }[]; fileTypes: string[] }): void {
    const currentAgent = this.currentAgent();
    if (!currentAgent || !currentAgent.settings) return;

    const updatedAgent = {
      ...currentAgent,
      settings: {
        ...currentAgent.settings,
        resources: [
          ...currentAgent.settings.resources,
          { 
            title: resource.name, 
            note: `${resource.files.length} fájl, ${resource.fileTypes.join(', ')}`,
            config: JSON.stringify({ 
              folder: resource.folder, 
              files: resource.files,
              fileContents: resource.fileContents || []
            }),
            isNew: true
          }
        ]
      }
    };

    this._agents.update(agents => 
      agents.map(agent => agent.id === currentAgent.id ? updatedAgent : agent)
    );

    // Remove the new flag after animation completes
    setTimeout(() => {
      this._agents.update(agents => 
        agents.map(agent => {
          if (agent.id === currentAgent.id && agent.settings) {
            return {
              ...agent,
              settings: {
                ...agent.settings,
                resources: agent.settings.resources.map(resource => ({
                  ...resource,
                  isNew: false
                }))
              }
            };
          }
          return agent;
        })
      );
    }, 600);
  }

  // Getters for state
  getState(): AgentsState {
    return {
      tasks: this._tasks(),
      agents: this._agents(),
      activeTaskId: this._activeTaskId(),
      activeAgentId: this._activeAgentId(),
      activeChatByTask: this._activeChatByTask(),
      chats: this._chats(),
      loading: this._loading(),
      error: this._error()
    };
  }
}
