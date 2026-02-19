import axios from 'axios';
import * as XLSX from 'xlsx';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Agregar token a cada request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export const knowledgeBaseService = {
  /**
   * Convierte archivo Excel a JSON
   */
  excelToJson: (file: File): Promise<Array<Record<string, any>>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          console.log(`Converted Excel to JSON: ${jsonData.length} rows`);
          resolve(jsonData);
        } catch (error) {
          console.error('Error converting Excel to JSON:', error);
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Sube datos a Pinecone
   */
  uploadKnowledgeBase: async (
    companyId: string,
    fileName: string,
    namespace: string,
    data: Array<Record<string, any>>,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<any> => {
    try {
      console.log(`Uploading knowledge base: company=${companyId}, file=${fileName}, namespace=${namespace}, rows=${data.length}`);

      const payload = {
        companyId,
        fileName,
        namespace,
        data,
      };

      const response = await apiClient.post('/knowledge-base/upload', payload, {
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded / progressEvent.total) * 100),
            });
          }
        },
      });

      console.log('Upload successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error uploading knowledge base:', error);
      throw error;
    }
  },

  /**
   * Flujo completo: Excel → JSON → Pinecone
   */
  uploadExcelToPinecone: async (
    companyId: string,
    file: File,
    namespace: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<any> => {
    try {
      // Convertir Excel a JSON
      const jsonData = await knowledgeBaseService.excelToJson(file);

      if (jsonData.length === 0) {
        throw new Error('Excel file is empty');
      }

      // Subir a Pinecone
      const result = await knowledgeBaseService.uploadKnowledgeBase(
        companyId,
        file.name,
        namespace,
        jsonData,
        onProgress
      );

      return result;
    } catch (error) {
      console.error('Error in uploadExcelToPinecone:', error);
      throw error;
    }
  },
};
