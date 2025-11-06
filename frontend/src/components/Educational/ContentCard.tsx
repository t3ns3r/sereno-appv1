import React from 'react';
import { EducationalContent, educationalContentService } from '../../services/educationalContentService';

interface ContentCardProps {
  content: EducationalContent;
  onContentClick: (content: EducationalContent) => void;
}

const ContentCard: React.FC<ContentCardProps> = ({ content, onContentClick }) => {
  const userProgress = content.progress?.[0];
  const progressPercentage = userProgress ? Math.round(userProgress.progress * 100) : 0;

  return (
    <div 
      className="card-senior cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-105"
      onClick={() => onContentClick(content)}
    >
      <div className="flex items-start space-x-4">
        {/* Category Icon */}
        <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">
            {educationalContentService.getCategoryIcon(content.category)}
          </span>
        </div>

        {/* Content Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">
              {content.title}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${
              educationalContentService.getDifficultyColor(content.difficulty)
            }`}>
              {content.difficulty}
            </span>
          </div>

          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {content.description}
          </p>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <span>{educationalContentService.formatDuration(content.duration)}</span>
            <span>Por {content.author.profile?.firstName || content.author.username}</span>
          </div>

          {/* Tags */}
          {content.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {content.tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
              {content.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  +{content.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {userProgress && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Progreso</span>
                <span>{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-secondary-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              {userProgress.completed && (
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <span className="mr-1">✓</span>
                  Completado
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentCard;