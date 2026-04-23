import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { WorkspaceStore } from '../../../core/services/workspace.store';
import { DataImportApiService } from '../../../infrastructure/http/data-import-api.service';
import { UploadDatasetRequest } from '../../../shared/models/dataset.model';
import { ErrorMessageComponent } from '../../../shared/ui/error-message/error-message.component';
import { LoadingIndicatorComponent } from '../../../shared/ui/loading-indicator/loading-indicator.component';
import { DatasetPreviewComponent } from '../components/dataset-preview.component';
import { ExcelSheetSelectorComponent } from '../components/excel-sheet-selector.component';
import { ImportHistoryComponent } from '../components/import-history.component';

@Component({
  selector: 'app-data-upload-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ExcelSheetSelectorComponent,
    DatasetPreviewComponent,
    ImportHistoryComponent,
    LoadingIndicatorComponent,
    ErrorMessageComponent
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <h2>1. Carga e Importación de Datos</h2>
        <p>Soporte para Excel (.xlsx, .xls), CSV y TXT con preview e importación al workspace.</p>
      </header>

      <div class="page-grid">
        <article class="card span-5">
          <h3>DataUploadPage</h3>
          <form class="form-grid" [formGroup]="form" (ngSubmit)="onUpload()">
            <label>
              <span>Archivo</span>
              <input type="file" accept=".xlsx,.xls,.csv,.txt" (change)="onFileSelected($event)" />
            </label>

            <app-excel-sheet-selector
              *ngIf="isExcelFile()"
              [sheets]="availableSheets()"
              [selected]="form.controls.sheetName.value"
              (selectedChange)="form.controls.sheetName.setValue($event)"
            />

            <div class="form-grid cols-2">
              <label>
                <span>Rango (ej: 1:150)</span>
                <input formControlName="rowRange" placeholder="1:200" />
              </label>
              <label>
                <span>Columnas (csv)</span>
                <input formControlName="selectedColumns" placeholder="temperature,pressure,defects" />
              </label>
            </div>

            <label>
              <span>Delimitador</span>
              <select formControlName="delimiter">
                <option value=",">Coma (,)</option>
                <option value=";">Punto y coma (;)</option>
                <option value="\t">Tab (\t)</option>
                <option value="|">Pipe (|)</option>
              </select>
            </label>

            <button class="primary" type="submit" [disabled]="form.invalid || !selectedFile() || uploading()">
              Subir y previsualizar
            </button>
          </form>

          <app-loading-indicator [show]="uploading()" [label]="'Cargando archivo...'" />
          <div *ngIf="uploading()" class="progress">
            <div class="bar" [style.width.%]="progress()"></div>
          </div>
          <app-error-message [message]="error()" />
        </article>

        <div class="span-7">
          <app-dataset-preview
            [preview]="store.preview()"
            (importClicked)="importToWorkspace()"
          />
        </div>

        <div class="span-12">
          <app-import-history [jobs]="store.importHistory()" />
        </div>
      </div>
    </section>
  `,
  styles: [`
    h3 {
      margin: 0 0 10px;
    }
    .progress {
      margin-top: 12px;
      width: 100%;
      height: 10px;
      border-radius: 999px;
      background: #e1edf1;
      overflow: hidden;
    }
    .bar {
      height: 100%;
      background: linear-gradient(120deg, #0f6f89, #2b8f71);
      transition: width 0.18s ease;
    }
  `]
})
export class DataUploadPageComponent {
  private readonly dataImportApi = inject(DataImportApiService);
  readonly store = inject(WorkspaceStore);
  private readonly router = inject(Router);

  readonly selectedFile = signal<File | null>(null);
  readonly fileContent = signal<string | undefined>(undefined);
  readonly availableSheets = signal<string[]>(['Sheet1', 'Process', 'Quality']);
  readonly uploading = signal(false);
  readonly progress = signal(0);
  readonly error = signal<string | null>(null);
  readonly latestImportId = signal<string | null>(null);

  readonly isExcelFile = computed(() => {
    const file = this.selectedFile();
    if (!file) {
      return false;
    }
    return /\.(xlsx|xls)$/i.test(file.name);
  });

  readonly form = new FormGroup({
    sheetName: new FormControl('Sheet1', { nonNullable: true }),
    rowRange: new FormControl('1:100'),
    selectedColumns: new FormControl(''),
    delimiter: new FormControl(',' as ',' | ';' | '\t' | '|', { nonNullable: true }),
    acceptedTerms: new FormControl(true, { validators: Validators.requiredTrue, nonNullable: true })
  });

  constructor() {
    this.dataImportApi.getImportHistory().subscribe({
      next: (jobs) => this.store.setImportHistory(jobs),
      error: (error: Error) => this.error.set(error.message)
    });
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.item(0);
    if (!file) {
      return;
    }

    this.error.set(null);
    this.selectedFile.set(file);
    this.fileContent.set(undefined);
    this.availableSheets.set(['Sheet1']);
    this.form.controls.sheetName.setValue('Sheet1');

    if (/\.(csv|txt)$/i.test(file.name)) {
      this.readFileAsText(file).then((text) => this.fileContent.set(text));
    }
  }

  onUpload(): void {
    const file = this.selectedFile();
    if (!file) {
      this.error.set('Selecciona un archivo antes de continuar.');
      return;
    }

    this.uploading.set(true);
    this.progress.set(10);
    this.error.set(null);

    const timer = setInterval(() => {
      this.progress.update((value) => (value >= 90 ? value : value + 8));
    }, 120);

    const selectedColumns = this.form.controls.selectedColumns.value
      ?.split(',')
      .map((column) => column.trim())
      .filter((column) => column.length > 0);

    const payload: UploadDatasetRequest = {
      file,
      fileName: file.name,
      fileType: this.extractFileType(file.name),
      sheetName: this.isExcelFile() ? this.form.controls.sheetName.value : undefined,
      rowRange: this.form.controls.rowRange.value ?? undefined,
      selectedColumns,
      delimiter: this.form.controls.delimiter.value,
      content: this.fileContent()
    };

    this.dataImportApi.uploadDataset(payload)
      .pipe(finalize(() => {
        clearInterval(timer);
        this.progress.set(100);
        setTimeout(() => {
          this.uploading.set(false);
          this.progress.set(0);
        }, 200);
      }))
      .subscribe({
        next: (job) => {
          this.latestImportId.set(job.id);
          this.store.addImportJob(job);
          this.store.setPreview(job.preview ?? null);
          if (job.availableSheets && job.availableSheets.length > 0) {
            this.availableSheets.set(job.availableSheets);
            this.form.controls.sheetName.setValue(job.sheetName ?? job.availableSheets[0] ?? 'Sheet1');
          }
        },
        error: (error: Error) => this.error.set(error.message)
      });
  }

  importToWorkspace(): void {
    const importId = this.latestImportId() ?? this.store.importHistory()[0]?.id;
    if (!importId) {
      this.error.set('Primero debes subir y previsualizar un archivo.');
      return;
    }

    this.uploading.set(true);
    this.dataImportApi.importToWorkspace(importId)
      .pipe(finalize(() => this.uploading.set(false)))
      .subscribe({
        next: (dataset) => {
          this.store.setDataset(dataset);
          this.router.navigateByUrl('/workspace');
        },
        error: (error: Error) => this.error.set(error.message)
      });
  }

  private async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'));
      reader.readAsText(file);
    });
  }

  private extractFileType(fileName: string): 'xlsx' | 'xls' | 'csv' | 'txt' {
    const match = fileName.toLowerCase().match(/\.(xlsx|xls|csv|txt)$/);
    const extension = match?.[1];
    if (extension === 'xls' || extension === 'xlsx' || extension === 'txt') {
      return extension;
    }
    return 'csv';
  }
}
