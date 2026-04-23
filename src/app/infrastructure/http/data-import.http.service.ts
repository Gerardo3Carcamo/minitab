import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  BackendDatasetListResponse,
  BackendDatasetPreviewResponse,
  BackendDatasetResponse,
  BackendFileListResponse,
  BackendUploadedFile
} from './backend-mappers';

export interface BackendPreviewRequest {
  file_id: string;
  sheet_name?: string;
  rows: number;
  delimiter?: string;
  has_header: boolean;
}

export interface BackendImportRequest {
  file_id: string;
  dataset_name?: string;
  sheet_name?: string;
  delimiter?: string;
  has_header: boolean;
}

@Injectable({ providedIn: 'root' })
export class DataImportHttpService {
  constructor(private readonly http: HttpClient) {}

  uploadFile(file: File): Observable<BackendUploadedFile> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<BackendUploadedFile>('/datasets/upload', formData);
  }

  getSheets(fileId: string): Observable<{ file_id: string; sheets: string[] }> {
    return this.http.get<{ file_id: string; sheets: string[] }>(`/datasets/${fileId}/sheets`);
  }

  previewFile(payload: BackendPreviewRequest): Observable<BackendDatasetPreviewResponse> {
    return this.http.post<BackendDatasetPreviewResponse>('/datasets/preview', payload);
  }

  importDataset(payload: BackendImportRequest): Observable<BackendDatasetResponse> {
    return this.http.post<BackendDatasetResponse>('/datasets/import', payload);
  }

  getFiles(): Observable<BackendFileListResponse> {
    return this.http.get<BackendFileListResponse>('/datasets/files');
  }

  getDataset(datasetId: string): Observable<BackendDatasetResponse> {
    return this.http.get<BackendDatasetResponse>(`/datasets/${datasetId}`);
  }

  getDatasets(): Observable<BackendDatasetListResponse> {
    return this.http.get<BackendDatasetListResponse>('/datasets');
  }

  getDatasetPreview(datasetId: string, rows: number): Observable<BackendDatasetPreviewResponse> {
    return this.http.get<BackendDatasetPreviewResponse>(`/datasets/${datasetId}/preview`, {
      params: {
        rows: String(rows)
      }
    });
  }
}
