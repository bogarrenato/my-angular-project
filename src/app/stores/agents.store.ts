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
  agentId: string;
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
}

export interface AgentsState {
  agents: Agent[];
  activeAgentId: string;
  activeChatByAgent: Record<string, string | null>;
  chats: Chat[];
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AgentsStore {
  // Private signals
  private readonly _agents = signal<Agent[]>([]);
  private readonly _activeAgentId = signal<string>('root');
  private readonly _activeChatByAgent = signal<Record<string, string | null>>({});
  private readonly _chats = signal<Chat[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // Public computed signals
  readonly agents = this._agents.asReadonly();
  readonly activeAgentId = this._activeAgentId.asReadonly();
  readonly activeChatByAgent = this._activeChatByAgent.asReadonly();
  readonly chats = this._chats.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed properties
  readonly currentAgent = computed(() => 
    this._agents().find(a => a.id === this._activeAgentId())!
  );
  
  readonly agentChats = computed(() => 
    this._chats().filter(c => c.agentId === this._activeAgentId())
  );
  
  readonly activeChat = computed(() => {
    const map = this._activeChatByAgent();
    return this._chats().find(c => c.id === map[this._activeAgentId()]) ?? null;
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

  setActiveAgent(id: string): void {
    this._activeAgentId.set(id);
  }

  setActiveChatForAgent(agentId: string, chatId: string | null): void {
    const copy = { ...this._activeChatByAgent() };
    copy[agentId] = chatId;
    this._activeChatByAgent.set(copy);
  }

  async sendMessage(text: string): Promise<void> {
    if (!text.trim()) return;
    
    await this.requestStateStore.executeSendMessageRequest(async () => {
      const agentId = this._activeAgentId();
      let chat = this.activeChat();
      
      if (!chat) {
        const agent = this.currentAgent();
        if (!agent) return; // Safety check
        
        const id = 'c' + Date.now();
        chat = {
          id,
          title: `Új beszélgetés – ${agent.name}`,
          ts: new Date().toISOString().slice(0, 16).replace('T', ' '),
          agentId,
          preview: text.slice(0, 80) + '…',
          messages: []
        };
        this._chats.update(list => [chat!, ...list]);
        this.setActiveChatForAgent(agentId, chat.id);
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

  addResource(resource: { name: string; folder: string; files: string[]; fileTypes: string[] }): void {
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
            config: JSON.stringify({ folder: resource.folder, files: resource.files }),
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
      agents: this._agents(),
      activeAgentId: this._activeAgentId(),
      activeChatByAgent: this._activeChatByAgent(),
      chats: this._chats(),
      loading: this._loading(),
      error: this._error()
    };
  }
}
