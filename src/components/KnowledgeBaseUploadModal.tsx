import React, { useState } from 'react';
import { knowledgeBaseService } from '../services/knowledgeBaseService';
import './KnowledgeBaseUploadModal.css';

interface KnowledgeBaseUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
}

export const KnowledgeBaseUploadModal: React.FC<KnowledgeBaseUploadModalProps> = ({
  isOpen,
  onClose,
  companyId,
  companyName,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [namespace, setNamespace] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
        setError('Please select a valid Excel file (.xlsx, .xls, or .csv)');
        return;
      }
      setFile(selectedFile);
      setError('');
      // Auto-generate namespace from filename
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      setNamespace(nameWithoutExt);
    }
  };

  const handleUpload = async () => {
    if (!file || !namespace) {
      setError('Please select a file and enter a namespace');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');
      setProgress(0);

      const result = await knowledgeBaseService.uploadExcelToPinecone(
        companyId,
        file,
        namespace,
        (prog) => {
          setProgress(prog.percentage);
        }
      );

      setMessage(`✅ Upload successful! ${result.stats.uploadedVectors} vectors uploaded`);
      setFile(null);
      setNamespace('');
      setProgress(0);

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(`Upload failed: ${err.message || 'Unknown error'}`);
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upload Knowledge Base</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Company</label>
            <input type="text" value={companyName} disabled className="input-disabled" />
          </div>

          <div className="form-group">
            <label>Excel File</label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              disabled={loading}
              className="file-input"
            />
            {file && <p className="file-name">Selected: {file.name}</p>}
          </div>

          <div className="form-group">
            <label>Namespace (for Pinecone)</label>
            <input
              type="text"
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
              placeholder="e.g., products-2024"
              disabled={loading}
              className="text-input"
            />
            <small>This will organize your data in Pinecone</small>
          </div>

          {loading && (
            <div className="progress-container">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="progress-text">Uploading... {progress}%</p>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={loading || !file || !namespace}
          >
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};
