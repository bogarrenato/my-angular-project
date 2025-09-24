import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { ChipModule } from 'primeng/chip';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DividerModule } from 'primeng/divider';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { PanelModule } from 'primeng/panel';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ThemeStore } from '../stores/theme.store';
import { AgentsStore } from '../stores/agents.store';
import { RequestStateStore } from '../stores/request-state.store';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InstructionDialogComponent } from '../dialogs/instruction-dialog.component';
import { DeleteConfirmationDialogComponent } from '../dialogs/delete-confirmation-dialog.component';
import { AppDialogComponent } from '../dialogs/app-dialog.component';
import { ResourceDialogComponent } from '../dialogs/resource-dialog.component';
import { take } from 'rxjs';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    AvatarModule,
    ChipModule,
    InputTextModule,
    TextareaModule,
    DividerModule,
    ScrollPanelModule,
    TagModule,
    DialogModule,
    PanelModule,
    CardModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  // Inject stores
  private readonly themeStore = inject(ThemeStore);
  private readonly agentsStore = inject(AgentsStore);
  private readonly requestStateStore = inject(RequestStateStore);
  private readonly dialogService = inject(DialogService);

  // Theme state from store
  readonly isDark = this.themeStore.isDark;
  readonly themeIcon = this.themeStore.themeIcon;
  readonly themeLabel = this.themeStore.themeLabel;

  // Agents state from store
  readonly tasks = this.agentsStore.tasks;
  readonly tasksWithAgents = this.agentsStore.tasksWithAgents;
  readonly currentTask = this.agentsStore.currentTask;
  readonly activeTaskId = this.agentsStore.activeTaskId;
  readonly activeAgentId = this.agentsStore.activeAgentId;
  readonly taskChats = this.agentsStore.taskChats;
  readonly chats = this.agentsStore.chats;
  readonly loading = this.agentsStore.loading;
  readonly error = this.agentsStore.error;

  // Request states
  readonly isLoadingAgents = this.requestStateStore.isLoadingAgents;
  readonly isLoadingChats = this.requestStateStore.isLoadingChats;
  readonly isLoadingSendMessage = this.requestStateStore.isLoadingSendMessage;
  readonly agentsError = this.requestStateStore.agentsError;
  readonly chatsError = this.requestStateStore.chatsError;
  readonly sendMessageError = this.requestStateStore.sendMessageError;

  // Computed properties from store with safety checks
  readonly currentAgent = this.agentsStore.currentAgent;
  readonly activeChat = this.agentsStore.activeChat;

  // Modal state
  readonly showAgentModal = signal(false);
  readonly showItemModal = signal(false);
  addItemTarget: 'instruction' | 'app' | 'resource' = 'instruction';
  
  // Right aside toggle state
  readonly isRightAsideOpen = signal(false);
  
  // Drag and drop state
  readonly isDragOver = signal(false);
  readonly dragOverSection = signal<string | null>(null);

  constructor() {
    // Load initial data
    this.agentsStore.loadChats();
  }

  addInstruction(): void {
    const ref: DynamicDialogRef = this.dialogService.open(
      InstructionDialogComponent,
      {
        header: 'Új instrukció hozzáadása',
        width: '600px',
        modal: true,
        closable: true,
        draggable: false,
        resizable: false,
        styleClass: 'instruction-dialog modern-modal',
        data: {},
        transitionOptions: '300ms cubic-bezier(0.25, 0.8, 0.25, 1)',
        dismissableMask: true,
        focusOnShow: true,
        keepInViewport: true,
        maximizable: false,
        baseZIndex: 10000,
        autoZIndex: true
      }
    );

    ref.onClose.pipe(take(1)).subscribe((result) => {
      if (result) {
        this.agentsStore.addInstruction(result);
      }
    });
  }

  deleteInstruction(instructionTitle: string): void {
    const ref: DynamicDialogRef = this.dialogService.open(
      DeleteConfirmationDialogComponent,
      {
        header: 'Instrukció törlése',
        width: '400px',
        modal: true,
        closable: true,
        draggable: false,
        resizable: false,
        styleClass: 'delete-confirmation-dialog modern-modal',
        data: { instructionTitle },
        transitionOptions: '300ms cubic-bezier(0.25, 0.8, 0.25, 1)',
        dismissableMask: true,
        focusOnShow: true,
        keepInViewport: true,
        maximizable: false,
        baseZIndex: 10000,
        autoZIndex: true
      }
    );

    ref.onClose.pipe(take(1)).subscribe((confirmed) => {
      if (confirmed) {
        this.agentsStore.deleteInstruction(instructionTitle);
      }
    });
  }

  deleteApp(appTitle: string): void {
    const ref: DynamicDialogRef = this.dialogService.open(
      DeleteConfirmationDialogComponent,
      {
        header: 'Alkalmazás törlése',
        width: '400px',
        modal: true,
        closable: true,
        draggable: false,
        resizable: false,
        styleClass: 'delete-confirmation-dialog modern-modal',
        data: { instructionTitle: appTitle },
        transitionOptions: '300ms cubic-bezier(0.25, 0.8, 0.25, 1)',
        dismissableMask: true,
        focusOnShow: true,
        keepInViewport: true,
        maximizable: false,
        baseZIndex: 10000,
        autoZIndex: true
      }
    );

    ref.onClose.pipe(take(1)).subscribe((confirmed) => {
      if (confirmed) {
        this.agentsStore.deleteApp(appTitle);
      }
    });
  }

  deleteResource(resourceTitle: string): void {
    const ref: DynamicDialogRef = this.dialogService.open(
      DeleteConfirmationDialogComponent,
      {
        header: 'Erőforrás törlése',
        width: '400px',
        modal: true,
        closable: true,
        draggable: false,
        resizable: false,
        styleClass: 'delete-confirmation-dialog modern-modal',
        data: { instructionTitle: resourceTitle },
        transitionOptions: '500ms cubic-bezier(0.25, 0.8, 0.25, 1)',
        dismissableMask: true,
        focusOnShow: true,
        keepInViewport: true,
        maximizable: false,
        baseZIndex: 10000,
        autoZIndex: true
      }
    );

    ref.onClose.pipe(take(1)).subscribe((confirmed) => {
      if (confirmed) {
        this.agentsStore.deleteResource(resourceTitle);
      }
    });
  }

  addApp(): void {
    const ref: DynamicDialogRef = this.dialogService.open(
      AppDialogComponent,
      {
        header: 'Új alkalmazás hozzáadása',
        width: '700px',
        modal: true,
        closable: true,
        draggable: false,
        resizable: false,
        styleClass: 'app-dialog modern-modal',
        data: {},
        transitionOptions: '300ms cubic-bezier(0.25, 0.8, 0.25, 1)',
        dismissableMask: true,
        focusOnShow: true,
        keepInViewport: true,
        maximizable: false,
        baseZIndex: 10000,
        autoZIndex: true
      }
    );

    ref.onClose.pipe(take(1)).subscribe((result) => {
      if (result) {
        this.agentsStore.addApp(result);
      }
    });
  }

  addResource(): void {
    const ref: DynamicDialogRef = this.dialogService.open(
      ResourceDialogComponent,
      {
        header: 'Új erőforrás hozzáadása',
        width: '800px',
        modal: true,
        closable: true,
        draggable: false,
        resizable: false,
        styleClass: 'resource-dialog modern-modal',
        data: {},
        transitionOptions: '300ms cubic-bezier(0.25, 0.8, 0.25, 1)',
        dismissableMask: true,
        focusOnShow: true,
        keepInViewport: true,
        maximizable: false,
        baseZIndex: 10000,
        autoZIndex: true
      }
    );

    ref.onClose.pipe(take(1)).subscribe((result) => {
      if (result) {
        this.agentsStore.addResource(result);
      }
    });
  }

  toggleTheme() {
    this.themeStore.toggleTheme();
  }

  toggleRightAside() {
    this.isRightAsideOpen.update(open => !open);
  }

  setActiveTask(taskId: string) {
    this.agentsStore.setActiveTask(taskId);
  }

  setActiveAgent(agentId: string) {
    this.agentsStore.setActiveAgent(agentId);
  }

  setActiveChatForTask(taskId: string, chatId: string | null) {
    this.agentsStore.setActiveChatForTask(taskId, chatId);
  }

  async sendMessage(textarea: HTMLTextAreaElement) {
    const txt = textarea.value.trim();
    if (!txt) return;

    await this.agentsStore.sendMessage(txt);
    textarea.value = '';
  }

  // Drag and drop methods
  onDragOver(event: DragEvent, section: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
    this.dragOverSection.set(section);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    this.dragOverSection.set(null);
  }

  async onDrop(event: DragEvent, section: string): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    this.dragOverSection.set(null);

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;

    // Only handle drops in the resources section
    if (section === 'resources') {
      await this.handleFileDrop(Array.from(files));
    }
  }

  private async handleFileDrop(files: File[]): Promise<void> {
    // Filter txt files with 5MB limit
    const validFiles = files.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      return extension === 'txt' && file.size <= 5 * 1024 * 1024;
    });

    if (validFiles.length === 0) {
      console.warn('No valid txt files found (max 5MB)');
      return;
    }

    // Read file contents
    const fileContents: { name: string; content: string; size: number }[] = [];
    
    for (const file of validFiles) {
      try {
        const content = await this.readFileAsText(file);
        fileContents.push({
          name: file.name,
          content: content,
          size: file.size
        });
      } catch (error) {
        console.error(`Error reading file ${file.name}:`, error);
      }
    }

    // Create resource with file contents
    const resourceName = `Feltöltött fájlok (${fileContents.length})`;
    const resource = {
      name: resourceName,
      folder: '/uploaded',
      files: fileContents.map(fc => fc.name),
      fileContents: fileContents,
      fileTypes: ['text']
    };

    this.agentsStore.addResource(resource);
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = (e) => reject(e);
      reader.readAsText(file, 'UTF-8');
    });
  }
}
