import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-instruction-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
  ],
  template: `
    <div class="formgrid p-fluid">
      <div class="field ">
        <label for="instructionTitle" class="text-sm font-medium"
          >Instrukció megnevezése</label
        >
        <input
          id="instructionTitle"
          pInputText
          placeholder="Pl. Üzleti hangnem"
          maxlength="40"
          [(ngModel)]="title"
          required
        />
        <small class="text-xs text-muted"
          >Maximum 40 karakter ({{ title.length }}/40)</small
        >
      </div>

      <div class="field ">
        <label for="instructionDescription" class="text-sm font-medium"
          >Instrukció leírása</label
        >
        <textarea
          id="instructionDescription"
          pTextarea
          rows="4"
          placeholder="Részletes leírás az instrukcióról..."
          maxlength="1000"
          [(ngModel)]="description"
          required
        ></textarea>
        <small class="text-xs text-muted"
          >Maximum 1000 karakter ({{ description.length }}/1000)</small
        >
      </div>
    </div>

    <div class="flex justify-content-end gap-2 mt-3">
      <button
        pButton
        label="Mégse"
        icon="pi pi-times"
        style="padding: 10px ; border-radius: 8px; "
        class="p-button-text"
        (click)="onCancel()"
      ></button>

      <button
        pButton
        label="Hozzáadás"
        icon="pi pi-check"
        style="padding: 10px ; border-radius: 8px; "
        class="p-button-success"
        (click)="onSave()"
        [disabled]="!title.trim() || !description.trim()"
      ></button>
    </div>
  `,
  styles: [
    `
      .field label {
        color: var(--text);
        margin-bottom: 8px;
        display: block;
      }

      .field input,
      .field textarea {
        background: #0b1020;
        border: 1px solid #22314b;
        color: var(--text);
        border-radius: 8px;
        padding: 10px;
      }

      .field input:focus,
      .field textarea:focus {
        border-color: var(--accent-2);
        box-shadow: 0 0 0 1px var(--accent-2);
      }

      .field small {
        display: block;
        margin-top: 4px;
      }

      .text-muted {
        color: var(--muted);
      }
    `,
  ],
})
export class InstructionDialogComponent {
  title = '';
  description = '';

  private readonly ref = inject(DynamicDialogRef);
  private readonly config = inject(DynamicDialogConfig);
  //constructor(
  //   public readonly ref: DynamicDialogRef,
  //   public readonly config: DynamicDialogConfig
  // ) {}

  onSave() {
    if (this.title.trim() && this.description.trim()) {
      this.ref.close({
        title: this.title.trim(),
        description: this.description.trim(),
      });
    }
  }

  onCancel() {
    this.ref.close();
  }
}
