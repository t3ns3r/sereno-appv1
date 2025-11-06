import React, { useState, useEffect } from 'react';
import { EducationalContent, educationalContentService } from '../../services/educationalContentService';
import useSerenito from '../../hooks/useSerenito';

interface ContentViewerProps {
  content: EducationalContent;
  onClose: () => void;
  onProgressUpdate?: (progress: number, timeSpent: number) => void;
}

const ContentViewer: React.FC<ContentViewerProps> = ({ content, onClose, onProgressUpdate }) => {
  const [startTime] = useState(Date.now());
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const { interact } = useSerenito();

  const userProgress = content.progress?.[0];

  useEffect(() => {
    if (userProgress) {
      setProgress(userProgress.progress);
      setIsCompleted(userProgress.completed);
    }
  }, [userProgress]);

  useEffect(() => {
    // Show SERENITO encouragement when starting content
    interact('encourage');
  }, [interact]);

  const handleProgressUpdate = async (newProgress: number) => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const completed = newProgress >= 1.0;

    try {
      await educationalContentService.updateProgress(content.id, {
        progress: newProgress,
        timeSpent: timeSpent + (userProgress?.timeSpent || 0),
        completed
      });

      setProgress(newProgress);
      setIsCompleted(completed);

      if (completed && !isCompleted) {
        // Show completion celebration
        interact('task-complete');
      }

      onProgressUpdate?.(newProgress, timeSpent);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrollPercentage = element.scrollTop / (element.scrollHeight - element.clientHeight);
    const newProgress = Math.max(progress, Math.min(1, scrollPercentage));
    
    if (newProgress > progress) {
      handleProgressUpdate(newProgress);
    }
  };

  const markAsCompleted = () => {
    handleProgressUpdate(1.0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">
                {educationalContentService.getCategoryIcon(content.category)}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{content.title}</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  educationalContentService.getDifficultyColor(content.difficulty)
                }`}>
                  {content.difficulty}
                </span>
                <span>•</span>
                <span>{educationalContentService.formatDuration(content.duration)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-gray-50 border-b">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progreso de lectura</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-secondary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto p-6"
          onScroll={handleScroll}
        >
          <div className="prose max-w-none">
            <div className="mb-6">
              <p className="text-gray-600 text-lg leading-relaxed">
                {content.description}
              </p>
            </div>
            
            <div 
              className="text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: content.content.replace(/\n/g, '<br>') }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Por {content.author.profile?.firstName || content.author.username}</span>
              {content.tags.length > 0 && (
                <div className="flex space-x-1">
                  {content.tags.slice(0, 3).map((tag, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              {!isCompleted && (
                <button
                  onClick={markAsCompleted}
                  className="px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors"
                >
                  Marcar como completado
                </button>
              )}
              {isCompleted && (
                <div className="flex items-center text-green-600 font-medium">
                  <span className="mr-2">✓</span>
                  Completado
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentViewer;