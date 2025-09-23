import { Injectable } from '@angular/core';
import { delay, of } from 'rxjs';
import { Agent, Chat } from '../stores/agents.store';

@Injectable({
  providedIn: 'root'
})
export class AgentsApiService {
  
  // Mock data
  private mockAgents: Agent[] = [
    {
      id: 'root',
      name: 'SimplyFire főmunkatárs',
      role: 'Admin agent',
      desc: 'Nem törölhető, rendszerszintű jogosultságokkal.',
      fixed: true,
      settings: {
        instructions: [
          { title: 'Üzleti hangnem' },
          { title: 'Rövid, tömör válaszok' },
          { title: 'Források hivatkozása' },
        ],
        apps: [
          { title: 'Outlook Connector (e-mail küldés/fogadás)' },
          { title: 'SQL driver' },
          { title: 'LibreOffice Writer/Calc' },
          { title: 'PDF motor' },
          { title: 'Kép (png/jpeg) ingest' },
        ],
        resources: [
          { title: '/shared/drive/projects' },
          { title: 'Azure Blob: sf-prod-01' },
          { title: 'Local: /data/vectors' },
          { title: 'Secrets: managed vault' },
        ],
      },
    },
    {
      id: 'a_demo_1',
      name: 'Pénzügyi Elemző',
      role: 'Elemző',
      desc: 'Cashflow előrejelzés, SQL olvasás.',
      settings: {
        instructions: [
          { title: 'Elemző hangnem' },
          { title: 'Számok indoklása' }
        ],
        apps: [
          { title: 'SQL read-only' },
          { title: 'PDF export' }
        ],
        resources: [
          { title: 'DB: sales-read' },
          { title: '/reports/finance' }
        ],
      },
    },
  ];

  private mockChats: Chat[] = [
    {
      id: 'c1',
      title: 'Konnektor hozzáadása – OneDrive',
      ts: '2025-09-02 10:05',
      agentId: 'root',
      preview: 'Kérem a OneDrive konnektor telepítését…',
      messages: [
        { from: 'agent', text: 'Üdv! Milyen tárhelyhez kell jogosultság?' },
        { from: 'user', text: 'OneDrive Business, csak olvasás.' },
      ],
    },
    {
      id: 'c2',
      title: 'Munka ütemezése – heti PDF riport',
      ts: '2025-09-08 09:12',
      agentId: 'root',
      preview: 'Pénteken 16:00-kor heti riport PDF-be…',
      messages: [
        { from: 'user', text: 'Pénteken 16:00-kor kérek heti riportot.' },
        { from: 'agent', text: 'Beállítva. Emailben küldöm a PDF-et.' },
      ],
    },
  ];

  async getAgents(): Promise<Agent[]> {
    // Simulate API call with delay
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...this.mockAgents]);
      }, 500);
    });
  }

  async getChats(): Promise<Chat[]> {
    // Simulate API call with delay
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...this.mockChats]);
      }, 300);
    });
  }

  async createAgent(agent: Omit<Agent, 'id'>): Promise<Agent> {
    // Simulate API call with delay
    return new Promise((resolve) => {
      setTimeout(() => {
        const newAgent: Agent = {
          ...agent,
          id: 'agent_' + Date.now()
        };
        this.mockAgents.push(newAgent);
        resolve(newAgent);
      }, 800);
    });
  }

  async updateAgent(id: string, agent: Partial<Agent>): Promise<Agent> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = this.mockAgents.findIndex(a => a.id === id);
        if (index !== -1) {
          this.mockAgents[index] = { ...this.mockAgents[index], ...agent };
          resolve(this.mockAgents[index]);
        } else {
          throw new Error('Agent not found');
        }
      }, 600);
    });
  }

  async deleteAgent(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = this.mockAgents.findIndex(a => a.id === id);
        if (index !== -1) {
          this.mockAgents.splice(index, 1);
          resolve();
        } else {
          reject(new Error('Agent not found'));
        }
      }, 400);
    });
  }
}
