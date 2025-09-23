import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { FileUploadModule } from 'primeng/fileupload';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

interface FileType {
  label: string;
  value: string;
  checked: boolean;
}

@Component({
  selector: 'app-resource-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    FileUploadModule,
  ],
  template: `
    <div class="resource-dialog">
      <div class="grid formgrid p-fluid">
        <div class="field col-12">
          <label for="resourceName" class="text-sm font-medium">Erőforrás megnevezése</label>
          <input 
            id="resourceName" 
            pInputText 
            placeholder="Pl. /shared/drive/projects" 
            maxlength="100"
            [(ngModel)]="name"
            required/>
          <small class="text-xs text-muted">Maximum 100 karakter ({{ name.length }}/100)</small>
        </div>
        
        <div class="field col-12">
          <label class="text-sm font-medium">Fájl típusok kiválasztása</label>
          <div class="file-types-grid">
            @for (fileType of fileTypes; track fileType.value) {
              <div class="file-type-item">
                <p-checkbox 
                  [(ngModel)]="fileType.checked" 
                  [inputId]="fileType.value"
                  [binary]="true">
                </p-checkbox>
                <label [for]="fileType.value" class="ml-2">{{ fileType.label }}</label>
              </div>
            }
          </div>
        </div>

        <div class="field col-12">
          <label class="text-sm font-medium">Fájl feltöltés módja</label>
          <div class="upload-methods">
            <div class="upload-method">
              <h4>1. Húzd ide a fájlokat</h4>
              <div 
                class="drop-zone"
                (dragover)="onDragOver($event)"
                (dragleave)="onDragLeave($event)"
                (drop)="onDrop($event)"
                [class.drag-over]="isDragOver">
                <i class="pi pi-cloud-upload" style="font-size: 2rem; color: var(--accent-2);"></i>
                <p>Húzd ide a fájlokat vagy kattints a tallózás gombra</p>
                <button 
                  pButton 
                  label="Tallózás" 
                  icon="pi pi-folder-open" 
                  class="p-button-outlined p-button-sm"
                  (click)="fileInput.click()">
                </button>
                <input 
                  #fileInput
                  type="file" 
                  multiple 
                  style="display: none"
                  (change)="onFileSelect($event)">
              </div>
            </div>
            
            <div class="upload-method">
              <h4>2. Mappa kiválasztása</h4>
              <div class="folder-select">
                <input 
                  pInputText 
                  placeholder="Válassz mappát..." 
                  [(ngModel)]="selectedFolder"
                  readonly/>
                <button 
                  pButton 
                  icon="pi pi-folder" 
                  class="p-button-outlined p-button-sm"
                  (click)="selectFolder()">
                </button>
              </div>
            </div>
          </div>
        </div>

        @if (selectedFiles.length > 0) {
          <div class="field col-12">
            <label class="text-sm font-medium">Kiválasztott fájlok ({{ selectedFiles.length }})</label>
            <div class="selected-files">
              @for (file of selectedFiles; track file.name) {
                <div class="file-item">
                  <i class="pi pi-file" style="color: var(--accent-2);"></i>
                  <span class="file-name">{{ file.name }}</span>
                  <button 
                    pButton 
                    icon="pi pi-times" 
                    class="p-button-text p-button-sm"
                    (click)="removeFile(file)">
                  </button>
                </div>
              }
            </div>
          </div>
        }
      </div>
      
      <div class="flex justify-content-end gap-2 mt-3">
        <button 
          pButton 
          label="Mégse" 
          icon="pi pi-times" 
          class="p-button-text" 
          (click)="onCancel()">
        </button>
        <button 
          pButton 
          label="Hozzáadás" 
          icon="pi pi-check" 
          class="p-button-success" 
          (click)="onSave()"
          [disabled]="!name.trim() || selectedFiles.length === 0">
        </button>
      </div>
    </div>
  `,
  styles: [`
    .resource-dialog .field label {
      color: var(--text);
      margin-bottom: 8px;
      display: block;
    }
    .resource-dialog .field input {
      background: var(--panel-2);
      border: 1px solid var(--border);
      color: var(--text);
      border-radius: 8px;
      padding: 10px;
    }
    .resource-dialog .field input:focus {
      border-color: var(--accent-2);
      box-shadow: 0 0 0 1px var(--accent-2);
    }
    .resource-dialog .field small {
      display: block;
      margin-top: 4px;
    }
    
    .file-types-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 8px;
      margin-top: 8px;
    }
    
    .file-type-item {
      display: flex;
      align-items: center;
      padding: 8px;
      background: var(--panel-2);
      border-radius: 6px;
      border: 1px solid var(--border);
    }
    
    .upload-methods {
      margin-top: 8px;
    }
    
    .upload-method {
      margin-bottom: 16px;
    }
    
    .upload-method h4 {
      color: var(--text);
      margin: 0 0 8px 0;
      font-size: 14px;
    }
    
    .drop-zone {
      border: 2px dashed var(--border);
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      background: var(--panel-2);
      transition: all 0.2s ease;
      cursor: pointer;
    }
    
    .drop-zone:hover,
    .drop-zone.drag-over {
      border-color: var(--accent-2);
      background: var(--accent-2);
      color: white;
    }
    
    .drop-zone p {
      margin: 8px 0;
      color: var(--muted);
    }
    
    .drop-zone.drag-over p {
      color: white;
    }
    
    .folder-select {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    
    .folder-select input {
      flex: 1;
    }
    
    .selected-files {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px;
      background: var(--panel-2);
    }
    
    .file-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
      border-bottom: 1px solid var(--border);
    }
    
    .file-item:last-child {
      border-bottom: none;
    }
    
    .file-name {
      flex: 1;
      color: var(--text);
    }
  `]
})
export class ResourceDialogComponent {
  name: string = '';
  selectedFolder: string = '';
  selectedFiles: File[] = [];
  isDragOver: boolean = false;

  fileTypes: FileType[] = [
    { label: 'Excel fájlok (.xlsx, .xls)', value: 'excel', checked: true },
    { label: 'Word dokumentumok (.docx, .doc)', value: 'word', checked: true },
    { label: 'PDF dokumentumok (.pdf)', value: 'pdf', checked: true },
    { label: 'Képek (.jpg, .png, .gif)', value: 'images', checked: false },
    { label: 'Szöveges fájlok (.txt, .csv)', value: 'text', checked: true },
    { label: 'PowerPoint (.pptx, .ppt)', value: 'powerpoint', checked: false }
  ];

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files) {
      this.addFiles(Array.from(files));
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files));
    }
  }

  addFiles(files: File[]): void {
    const allowedTypes = this.fileTypes
      .filter(ft => ft.checked)
      .map(ft => ft.value);
    
    const filteredFiles = files.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      return allowedTypes.some(type => {
        switch (type) {
          case 'excel': return ['xlsx', 'xls'].includes(extension || '');
          case 'word': return ['docx', 'doc'].includes(extension || '');
          case 'pdf': return extension === 'pdf';
          case 'images': return ['jpg', 'jpeg', 'png', 'gif'].includes(extension || '');
          case 'text': return ['txt', 'csv'].includes(extension || '');
          case 'powerpoint': return ['pptx', 'ppt'].includes(extension || '');
          default: return false;
        }
      });
    });
    
    this.selectedFiles = [...this.selectedFiles, ...filteredFiles];
  }

  removeFile(file: File): void {
    this.selectedFiles = this.selectedFiles.filter(f => f !== file);
  }

  selectFolder(): void {
    // Simulate folder selection
    this.selectedFolder = '/selected/folder/path';
  }

  onCancel(): void {
    this.ref.close();
  }

  onSave(): void {
    const result = {
      name: this.name,
      folder: this.selectedFolder,
      files: this.selectedFiles.map(f => f.name),
      fileTypes: this.fileTypes.filter(ft => ft.checked).map(ft => ft.value)
    };
    this.ref.close(result);
  }
}
