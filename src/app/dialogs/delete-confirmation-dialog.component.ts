import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-delete-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
  ],
  template: `
    <div class="delete-confirmation-dialog">
      <div class="icon-container">
        <i class="pi pi-exclamation-triangle" style="font-size: 3rem; color: var(--accent);"></i>
      </div>
      
      <h3 class="title">Instrukció törlése</h3>
      
      <p class="message">
        Biztosan törölni szeretnéd ezt az instrukciót?
      </p>
      
      <div class="instruction-preview">
        <strong>{{ instructionTitle }}</strong>
      </div>
      
      <p class="warning">
        <i class="pi pi-info-circle"></i>
        Ez a művelet nem vonható vissza.
      </p>
      
      <div class="flex justify-content-end gap-2 mt-4">
        <button 
          pButton 
          label="Mégse" 
          icon="pi pi-times" 
          class="p-button-text" 
          (click)="onCancel()">
        </button>
        <button 
          pButton 
          label="Törlés" 
          icon="pi pi-trash" 
          class="p-button-danger" 
          (click)="onConfirm()">
        </button>
      </div>
    </div>
  `,
  styles: [`
    .delete-confirmation-dialog {
      text-align: center;
      padding: 1rem;
    }
    
    .icon-container {
      margin-bottom: 1rem;
    }
    
    .title {
      color: var(--text);
      margin: 0 0 1rem 0;
      font-size: 1.25rem;
      font-weight: 600;
    }
    
    .message {
      color: var(--text);
      margin: 0 0 1rem 0;
      line-height: 1.5;
    }
    
    .instruction-preview {
      background: var(--panel-2);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.75rem;
      margin: 1rem 0;
      color: var(--text);
    }
    
    .warning {
      color: var(--muted);
      font-size: 0.875rem;
      margin: 1rem 0 0 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    
    .warning i {
      color: var(--accent);
    }
  `]
})
export class DeleteConfirmationDialogComponent {
  instructionTitle: string = '';

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {
    this.instructionTitle = this.config.data?.instructionTitle || '';
  }

  onCancel(): void {
    this.ref.close(false);
  }

  onConfirm(): void {
    this.ref.close(true);
  }
}
