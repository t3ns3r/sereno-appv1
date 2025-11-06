import React, { useState, useEffect } from 'react';
import { EducationalContent, educationalContentService } from '../services/educationalContentService';
import { useAuth } from '../hooks/useAuth';
import useSerenito from '../hooks/useSerenito';
import ContentCard from '../components/Educational/ContentCard';
import ContentViewer from '../components/Educational/ContentViewer';

const EducationalContentPage: React.FC = () => {
  const [content, setContent] = useState<EducationalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<EducationalContent | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const { user } = useAuth();
  const { interact } = useSerenito();

  const mentalHealthConditions = [
    { value: '', label: 'Todas las condiciones' },
    { value: 'ansiedad', label: 'Ansiedad' },
    { value: 'depresion', label: 'Depresión' },
    { value: 'bipolaridad', label: 'Bipolaridad' },
    { value: 'mindfulness', label: 'Mindfulness' },
    { value: 'estres', label: 'Estrés' },
    { value: 'autoestima', label: 'Autoestima' }
  ];

  const categories = [
    { value: '', label: 'Todas las categorías' },
    { value: 'ARTICLE', label: 'Artículos' },
    { value: 'EXERCISE', label: 'Ejercicios' },
    { value: 'VIDEO', label: 'Videos' },
    { value: 'AUDIO', label: 'Audio' },
    { value: 'INTERACTIVE', label: 'Interactivo' },
    { value: 'WORKSHEET', label: 'Hojas de trabajo' }
  ];

  useEffect(() => {
    loadContent();
  }, [selectedCondition, selectedCategory]);

  useEffect(() => {
    // Show SERENITO welcome message
    interact('welcome');
  }, [interact]);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: any = {};
      if (selectedCondition) filters.condition = selectedCondition;
      if (selectedCategory) filters.category = selectedCategory;
      
      const contentData = await educationalContentService.getAllContent(filters);
      setContent(contentData);
    } catch (err) {
      setError('Error al cargar el contenido educativo');
      console.error('Error loading educational content:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleContentClick = (content: EducationalContent) => {
    setSelectedContent(content);
  };

  const handleCloseViewer = () => {
    setSelectedContent(null);
    // Refresh content to get updated progress
    loadContent();
  };

  const handleProgressUpdate = (progress: number, timeSpent: number) => {
    // Update the content in the list with new progress
    if (selectedContent) {
      const updatedContent = content.map(item => {
        if (item.id === selectedContent.id) {
          return {
            ...item,
            progress: [{
              id: item.progress?.[0]?.id || '',
              userId: user?.id || '',
              contentId: item.id,
              completed: progress >= 1.0,
              progress,
              timeSpent,
              createdAt: item.progress?.[0]?.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }]
          };
        }
        return item;
      });
      setContent(updatedContent);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 animate-gentle-entrance">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Contenido Educativo</h1>
          <p className="text-gray-600">Aprende sobre salud mental</p>
        </div>
        
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 animate-gentle-entrance">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Contenido Educativo</h1>
          <p className="text-gray-600">Aprende sobre salud mental</p>
        </div>
        
        <div className="card-senior text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadContent}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8 animate-gentle-entrance">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Contenido Educativo</h1>
        <p className="text-gray-600">Aprende sobre salud mental y bienestar</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 animate-gentle-entrance" style={{ animationDelay: '200ms' }}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Condición de salud mental
          </label>
          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
          >
            {mentalHealthConditions.map((condition) => (
              <option key={condition.value} value={condition.value}>
                {condition.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de contenido
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Grid */}
      {content.length === 0 ? (
        <div className="card-senior text-center animate-gentle-entrance" style={{ animationDelay: '400ms' }}>
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-xl">📚</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            No hay contenido disponible
          </h2>
          <p className="text-gray-600">
            No se encontró contenido educativo con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {content.map((item, index) => (
            <div
              key={item.id}
              className="animate-gentle-entrance"
              style={{ animationDelay: `${400 + index * 100}ms` }}
            >
              <ContentCard
                content={item}
                onContentClick={handleContentClick}
              />
            </div>
          ))}
        </div>
      )}

      {/* Content Viewer Modal */}
      {selectedContent && (
        <ContentViewer
          content={selectedContent}
          onClose={handleCloseViewer}
          onProgressUpdate={handleProgressUpdate}
        />
      )}
    </div>
  );
};

export default EducationalContentPage;