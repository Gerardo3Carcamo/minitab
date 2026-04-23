export interface ReportSection {
  id: string;
  title: string;
  enabled: boolean;
}

export interface ReportRequest {
  datasetId: string;
  format: 'pdf' | 'xlsx';
  title: string;
  sections: ReportSection[];
}

export interface ReportArtifact {
  id: string;
  format: 'pdf' | 'xlsx';
  fileName: string;
  createdAt: string;
  downloadUrl: string;
}
