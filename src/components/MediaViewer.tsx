import React, { useState, useEffect } from 'react';
import { conversationService } from '../services/conversationService';

interface MediaViewerProps {
  s3Key: string;
  mediaType: string;
  mediaFileName?: string;
  direction: 'inbound' | 'outbound';
}

const MediaViewer: React.FC<MediaViewerProps> = ({ s3Key, mediaType, mediaFileName, direction }) => {
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const loadPresignedUrl = async () => {
    if (presignedUrl) return; // Ya cargada
    
    setLoading(true);
    setError(null);
    
    try {
      const url = await conversationService.getMediaPresignedUrl(s3Key, 3600); // 1 hora
      setPresignedUrl(url);
    } catch (err) {
      console.error('Error loading media:', err);
      setError('Error al cargar el archivo');
    } finally {
      setLoading(false);
    }
  };

  // Cargar automáticamente para imágenes pequeñas
  useEffect(() => {
    if (mediaType === 'image' || mediaType === 'sticker') {
      loadPresignedUrl();
    }
  }, [s3Key, mediaType]);

  const handleView = () => {
    if (!presignedUrl) {
      loadPresignedUrl();
    }
    setShowModal(true);
  };

  const handleDownload = async () => {
    if (!presignedUrl) {
      await loadPresignedUrl();
    }
    if (presignedUrl) {
      window.open(presignedUrl, '_blank');
    }
  };

  // Renderizar según el tipo de archivo
  if (mediaType === 'image') {
    return (
      <>
        <div className="mb-2">
          {loading && (
            <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center">
              <span className="text-gray-500">Cargando...</span>
            </div>
          )}
          {error && (
            <div className="w-full p-4 bg-red-100 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
          {presignedUrl && !loading && (
            <img 
              src={presignedUrl} 
              alt="Imagen" 
              className="max-w-full rounded cursor-pointer hover:opacity-90"
              onClick={handleView}
            />
          )}
        </div>

        {/* Modal para ver imagen en grande */}
        {showModal && presignedUrl && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70"
              >
                ✕
              </button>
              <img 
                src={presignedUrl} 
                alt="Imagen" 
                className="max-w-full max-h-screen rounded"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  if (mediaType === 'video') {
    return (
      <div className="mb-2">
        {!presignedUrl && !loading && (
          <button
            onClick={loadPresignedUrl}
            className="w-full p-4 bg-gray-100 rounded hover:bg-gray-200 transition flex items-center justify-center gap-2"
          >
            <span className="text-2xl">🎥</span>
            <span className="text-sm font-medium">Clic para cargar video</span>
          </button>
        )}
        {loading && (
          <div className="w-full p-4 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-gray-500">Cargando video...</span>
          </div>
        )}
        {presignedUrl && !loading && (
          <video 
            src={presignedUrl} 
            controls 
            className="max-w-full rounded"
          />
        )}
      </div>
    );
  }

  if (mediaType === 'audio' || mediaType === 'voice') {
    return (
      <div className="mb-2">
        {!presignedUrl && !loading && (
          <button
            onClick={loadPresignedUrl}
            className="flex items-center gap-2 bg-gray-100 p-2 rounded hover:bg-gray-200 transition w-full"
          >
            <span className="text-2xl">{mediaType === 'voice' ? '🎤' : '🎵'}</span>
            <span className="text-sm font-medium">Clic para cargar audio</span>
          </button>
        )}
        {loading && (
          <div className="flex items-center gap-2 bg-gray-100 p-2 rounded">
            <span className="text-gray-500">Cargando...</span>
          </div>
        )}
        {presignedUrl && !loading && (
          <div className="flex items-center gap-2 bg-gray-100 p-2 rounded">
            <span className="text-2xl">{mediaType === 'voice' ? '🎤' : '🎵'}</span>
            <audio 
              src={presignedUrl} 
              controls 
              className="flex-1"
            />
          </div>
        )}
      </div>
    );
  }

  if (mediaType === 'document') {
    return (
      <div className="mb-2">
        <button
          onClick={handleDownload}
          disabled={loading}
          className="flex items-center gap-2 bg-gray-100 p-2 rounded hover:bg-gray-200 transition w-full disabled:opacity-50"
        >
          <span className="text-2xl">📄</span>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium truncate">{mediaFileName || 'Documento'}</p>
            <p className="text-xs text-gray-500">
              {loading ? 'Cargando...' : 'Clic para descargar'}
            </p>
          </div>
        </button>
      </div>
    );
  }

  if (mediaType === 'sticker') {
    return (
      <div className="mb-2">
        {loading && (
          <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-gray-500">...</span>
          </div>
        )}
        {presignedUrl && !loading && (
          <img 
            src={presignedUrl} 
            alt="Sticker" 
            className="w-32 h-32 object-contain"
          />
        )}
      </div>
    );
  }

  return null;
};

export default MediaViewer;
