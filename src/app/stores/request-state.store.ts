import { Injectable, computed, signal } from '@angular/core';

export interface RequestState<T, E = string> {
  isLoading: boolean;
  error: E | null;
  data: T | null;
}

@Injectable({
  providedIn: 'root'
})
export class RequestStateStore {
  // Private signals for different request states
  private readonly _agentsState = signal<RequestState<any[]>>({
    isLoading: false,
    error: null,
    data: null
  });

  private readonly _chatsState = signal<RequestState<any[]>>({
    isLoading: false,
    error: null,
    data: null
  });

  private readonly _sendMessageState = signal<RequestState<boolean>>({
    isLoading: false,
    error: null,
    data: null
  });

  // Public computed signals
  readonly agentsState = this._agentsState.asReadonly();
  readonly chatsState = this._chatsState.asReadonly();
  readonly sendMessageState = this._sendMessageState.asReadonly();

  // Computed properties for agents
  readonly isLoadingAgents = computed(() => this._agentsState().isLoading);
  readonly agentsError = computed(() => this._agentsState().error);
  readonly agentsData = computed(() => this._agentsState().data);

  // Computed properties for chats
  readonly isLoadingChats = computed(() => this._chatsState().isLoading);
  readonly chatsError = computed(() => this._chatsState().error);
  readonly chatsData = computed(() => this._chatsState().data);

  // Computed properties for send message
  readonly isLoadingSendMessage = computed(() => this._sendMessageState().isLoading);
  readonly sendMessageError = computed(() => this._sendMessageState().error);

  // Generic request state management
  private setRequestState<T, E = string>(
    stateSignal: any,
    updates: Partial<RequestState<T, E>>
  ): void {
    stateSignal.update(current => ({ ...current, ...updates }));
  }

  // Generic async wrapper
  async executeRequest<T, E = string>(
    stateSignal: any,
    asyncFn: () => Promise<T>
  ): Promise<T> {
    // Set loading
    this.setRequestState(stateSignal, { isLoading: true, error: null });
    
    try {
      const result = await asyncFn();
      // Set success
      this.setRequestState(stateSignal, { 
        isLoading: false, 
        error: null, 
        data: result 
      });
      return result;
    } catch (error) {
      // Set error
      this.setRequestState(stateSignal, { 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      });
      throw error;
    }
  }

  // Agents specific methods
  async executeAgentsRequest<T>(asyncFn: () => Promise<T>): Promise<T> {
    return this.executeRequest(this._agentsState, asyncFn);
  }

  setAgentsLoading(loading: boolean): void {
    this.setRequestState(this._agentsState, { isLoading: loading });
  }

  setAgentsData(data: any[]): void {
    this.setRequestState(this._agentsState, { data, error: null });
  }

  setAgentsError(error: string | null): void {
    this.setRequestState(this._agentsState, { error, isLoading: false });
  }

  // Chats specific methods
  async executeChatsRequest<T>(asyncFn: () => Promise<T>): Promise<T> {
    return this.executeRequest(this._chatsState, asyncFn);
  }

  setChatsLoading(loading: boolean): void {
    this.setRequestState(this._chatsState, { isLoading: loading });
  }

  setChatsData(data: any[]): void {
    this.setRequestState(this._chatsState, { data, error: null });
  }

  setChatsError(error: string | null): void {
    this.setRequestState(this._chatsState, { error, isLoading: false });
  }

  // Send message specific methods
  async executeSendMessageRequest<T>(asyncFn: () => Promise<T>): Promise<T> {
    return this.executeRequest(this._sendMessageState, asyncFn);
  }

  setSendMessageLoading(loading: boolean): void {
    this.setRequestState(this._sendMessageState, { isLoading: loading });
  }

  setSendMessageError(error: string | null): void {
    this.setRequestState(this._sendMessageState, { error, isLoading: false });
  }

  // Clear all states
  clearAll(): void {
    this._agentsState.set({ isLoading: false, error: null, data: null });
    this._chatsState.set({ isLoading: false, error: null, data: null });
    this._sendMessageState.set({ isLoading: false, error: null, data: null });
  }
}
