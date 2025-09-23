import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
// import { SelectModule } from 'primeng/select';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

interface ConnectorType {
  label: string;
  value: string;
  fields: string[];
}

@Component({
  selector: 'app-app-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    // SelectModule,
  ],
  template: `
    <form [formGroup]="appForm" (ngSubmit)="onSave()">
      <div class="app-dialog">
        <div class="p-fluid">
          <div class="field">
            <label for="appTitle" class="text-sm font-medium">Alkalmazás megnevezése</label>
            <input 
              id="appTitle" 
              pInputText 
              placeholder="Pl. Outlook Connector" 
              formControlName="title"/>
            <small class="text-xs text-muted">Maximum 50 karakter ({{ appForm.get('title')?.value?.length || 0 }}/50)</small>
          </div>
          
          <div class="field">
            <label for="connectorType" class="text-sm font-medium">Konnektor típusa</label>
            <select 
              id="connectorType"
              class="p-inputtext"
              formControlName="connectorType"
              (change)="onConnectorTypeChange()">
              <option value="" disabled>Válassz konnektor típust</option>
              @for (connector of connectorTypes; track connector.value) {
                <option [value]="connector.value">{{ connector.label }}</option>
              }
            </select>
          </div>

          <!-- Email konnektor mezők -->
          @if (appForm.get('connectorType')?.value === 'email') {
            <div class="field">
              <label for="emailServer" class="text-sm font-medium">Email szerver</label>
              <input 
                id="emailServer" 
                pInputText 
                placeholder="smtp.gmail.com" 
                formControlName="emailServer"/>
            </div>
            <div class="field">
              <label for="emailPort" class="text-sm font-medium">Port</label>
              <input 
                id="emailPort" 
                pInputText 
                placeholder="587" 
                formControlName="emailPort"/>
            </div>
            <div class="field">
              <label for="emailUsername" class="text-sm font-medium">Felhasználónév</label>
              <input 
                id="emailUsername" 
                pInputText 
                placeholder="user@example.com" 
                formControlName="emailUsername"/>
            </div>
            <div class="field">
              <label for="emailPassword" class="text-sm font-medium">Jelszó/API kulcs</label>
              <input 
                id="emailPassword" 
                pInputText 
                type="password"
                placeholder="••••••••" 
                formControlName="emailPassword"/>
            </div>
          }

          <!-- SQL konnektor mezők -->
          @if (appForm.get('connectorType')?.value === 'sql') {
            <div class="field">
              <label for="sqlHost" class="text-sm font-medium">Adatbázis szerver</label>
              <input 
                id="sqlHost" 
                pInputText 
                placeholder="localhost:3306" 
                formControlName="sqlHost"/>
            </div>
            <div class="field">
              <label for="sqlDatabase" class="text-sm font-medium">Adatbázis neve</label>
              <input 
                id="sqlDatabase" 
                pInputText 
                placeholder="my_database" 
                formControlName="sqlDatabase"/>
            </div>
            <div class="field">
              <label for="sqlUsername" class="text-sm font-medium">Felhasználónév</label>
              <input 
                id="sqlUsername" 
                pInputText 
                placeholder="db_user" 
                formControlName="sqlUsername"/>
            </div>
            <div class="field">
              <label for="sqlPassword" class="text-sm font-medium">Jelszó</label>
              <input 
                id="sqlPassword" 
                pInputText 
                type="password"
                placeholder="••••••••" 
                formControlName="sqlPassword"/>
            </div>
          }

          <!-- Excel API konnektor mezők -->
          @if (appForm.get('connectorType')?.value === 'excel') {
            <div class="field">
              <label for="excelApiKey" class="text-sm font-medium">API kulcs</label>
              <input 
                id="excelApiKey" 
                pInputText 
                placeholder="excel_api_key_here" 
                formControlName="excelApiKey"/>
            </div>
            <div class="field">
              <label for="excelClientId" class="text-sm font-medium">Client ID</label>
              <input 
                id="excelClientId" 
                pInputText 
                placeholder="client_id_here" 
                formControlName="excelClientId"/>
            </div>
            <div class="field">
              <label for="excelClientSecret" class="text-sm font-medium">Client Secret</label>
              <input 
                id="excelClientSecret" 
                pInputText 
                type="password"
                placeholder="••••••••" 
                formControlName="excelClientSecret"/>
            </div>
          }
        </div>
        
        <div class="flex justify-content-end gap-2 mt-3">
          <button 
            pButton 
            label="Mégse" 
            icon="pi pi-times" 
            style="padding: 10px ; border-radius: 8px; "
            class="p-button-text" 
            type="button"
            (click)="onCancel()">
          </button>
          <button 
            pButton 
            label="Hozzáadás" 
            icon="pi pi-check" 
            style="padding: 10px ; border-radius: 8px; "
            class="p-button-success" 
            type="submit"
            [disabled]="!appForm.valid">
          </button>
        </div>
      </div>
    </form>
  `,
  styles: [`
    .app-dialog .field label {
      color: var(--text);
      margin-bottom: 8px;
      display: block;
    }
    .app-dialog .field input, .app-dialog .field select {
      background: var(--panel-2);
      border: 1px solid var(--border);
      color: var(--text);
      border-radius: 8px;
      padding: 10px;
    }
    .app-dialog .field input:focus, .app-dialog .field select:focus {
      border-color: var(--accent-2);
      box-shadow: 0 0 0 1px var(--accent-2);
    }
    .app-dialog .field small {
      display: block;
      margin-top: 4px;
    }
  `]
})
export class AppDialogComponent {
  appForm: FormGroup;
  connectorTypes: ConnectorType[] = [
    { label: 'Email konnektor', value: 'email', fields: ['emailServer', 'emailPort', 'emailUsername', 'emailPassword'] },
    { label: 'SQL konnektor', value: 'sql', fields: ['sqlHost', 'sqlDatabase', 'sqlUsername', 'sqlPassword'] },
    { label: 'Excel API konnektor', value: 'excel', fields: ['excelApiKey', 'excelClientId', 'excelClientSecret'] }
  ];

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private fb: FormBuilder
  ) {
    this.appForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(50)]],
      connectorType: ['', Validators.required],
      emailServer: [''],
      emailPort: [''],
      emailUsername: [''],
      emailPassword: [''],
      sqlHost: [''],
      sqlDatabase: [''],
      sqlUsername: [''],
      sqlPassword: [''],
      excelApiKey: [''],
      excelClientId: [''],
      excelClientSecret: ['']
    });
  }

  onConnectorTypeChange(): void {
    // Clear other connector fields when type changes
    const connectorType = this.appForm.get('connectorType')?.value;
    if (connectorType === 'email') {
      this.appForm.patchValue({
        sqlHost: '', sqlDatabase: '', sqlUsername: '', sqlPassword: '',
        excelApiKey: '', excelClientId: '', excelClientSecret: ''
      });
    } else if (connectorType === 'sql') {
      this.appForm.patchValue({
        emailServer: '', emailPort: '', emailUsername: '', emailPassword: '',
        excelApiKey: '', excelClientId: '', excelClientSecret: ''
      });
    } else if (connectorType === 'excel') {
      this.appForm.patchValue({
        emailServer: '', emailPort: '', emailUsername: '', emailPassword: '',
        sqlHost: '', sqlDatabase: '', sqlUsername: '', sqlPassword: ''
      });
    }
  }

  onCancel(): void {
    this.ref.close();
  }

  onSave(): void {
    if (this.appForm.valid) {
      const formValue = this.appForm.value;
      const result = {
        title: formValue.title,
        connectorType: formValue.connectorType,
        config: {
          emailServer: formValue.emailServer,
          emailPort: formValue.emailPort,
          emailUsername: formValue.emailUsername,
          emailPassword: formValue.emailPassword,
          sqlHost: formValue.sqlHost,
          sqlDatabase: formValue.sqlDatabase,
          sqlUsername: formValue.sqlUsername,
          sqlPassword: formValue.sqlPassword,
          excelApiKey: formValue.excelApiKey,
          excelClientId: formValue.excelClientId,
          excelClientSecret: formValue.excelClientSecret
        }
      };
      this.ref.close(result);
    }
  }
}
