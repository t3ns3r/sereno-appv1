import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import NavigationCard from '../UI/NavigationCard';
import {
  FaceSmileIcon,
  HeartIcon,
  CalendarDaysIcon,
  BookOpenIcon,
  UsersIcon,
  ChartBarIcon,
  HomeIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

interface NavigationItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  badge?: string | number;
  featured?: boolean;
}

interface MainNavigationProps {
  layout?: 'grid' | 'list';
  showHome?: boolean;
  onNavigate?: (path: string) => void;
}

const MainNavigation: React.FC<MainNavigationProps> = ({
  layout = 'grid',
  showHome = true,
  onNavigate
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems: NavigationItem[] = [
    ...(showHome ? [{
      id: 'home',
      title: 'Inicio',
      subtitle: 'Principal',
      icon: <HomeIcon className="w-8 h-8" />,
      path: '/',
      color: 'bg-gray-600 hover:bg-gray-700',
    }] : []),
    {
      id: 'mood',
      title: 'Estado de Ánimo',
      subtitle: 'Evaluar',
      icon: <FaceSmileIcon className="w-8 h-8" />,
      path: '/mood-assessment',
      color: 'bg-primary-500 hover:bg-primary-600',
      featured: true,
    },
    {
      id: 'breathing',
      title: 'Respiración',
      subtitle: 'Ejercicios',
      icon: <HeartIcon className="w-8 h-8" />,
      path: '/breathing-exercise',
      color: 'bg-secondary-400 hover:bg-secondary-500',
      featured: true,
    },
    {
      id: 'tracking',
      title: 'Seguimiento',
      subtitle: 'Diario',
      icon: <ChartBarIcon className="w-8 h-8" />,
      path: '/daily-tracking',
      color: 'bg-accent-400 hover:bg-accent-500',
    },
    {
      id: 'education',
      title: 'Educación',
      subtitle: 'Contenido',
      icon: <BookOpenIcon className="w-8 h-8" />,
      path: '/education',
      color: 'bg-primary-600 hover:bg-primary-700',
    },
    {
      id: 'activities',
      title: 'Actividades',
      subtitle: 'Comunidad',
      icon: <UsersIcon className="w-8 h-8" />,
      path: '/activities',
      color: 'bg-secondary-500 hover:bg-secondary-600',
      badge: '3', // Example: 3 new activities
    },
    {
      id: 'profile',
      title: 'Mi Perfil',
      subtitle: 'Configurar',
      icon: <UserCircleIcon className="w-8 h-8" />,
      path: '/profile',
      color: 'bg-accent-500 hover:bg-accent-600',
    },
  ];

  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  const isCurrentPage = (path: string) => {
    return location.pathname === path;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (layout === 'list') {
    return (
      <motion.div
        className="space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {navigationItems.map((item) => (
          <motion.div
            key={item.id}
            variants={itemVariants}
          >
            <NavigationCard
              title={item.title}
              subtitle={item.subtitle}
              icon={item.icon}
              color={item.color}
              onClick={() => handleNavigation(item.path)}
              badge={item.badge}
              disabled={isCurrentPage(item.path)}
              className={isCurrentPage(item.path) ? 'opacity-50' : ''}
            />
          </motion.div>
        ))}
      </motion.div>
    );
  }

  // Grid layout (default)
  return (
    <motion.div
      className="grid grid-cols-2 lg:grid-cols-3 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {navigationItems.map((item, index) => (
        <motion.div
          key={item.id}
          variants={itemVariants}
          className={`
            ${item.featured ? 'lg:col-span-1' : ''}
            ${index === 0 && showHome ? 'col-span-2 lg:col-span-1' : ''}
          `}
        >
          <NavigationCard
            title={item.title}
            subtitle={item.subtitle}
            icon={item.icon}
            color={item.color}
            onClick={() => handleNavigation(item.path)}
            badge={item.badge}
            disabled={isCurrentPage(item.path)}
            className={`
              ${isCurrentPage(item.path) ? 'opacity-50' : ''}
              ${item.featured ? 'ring-2 ring-primary-200' : ''}
            `}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default MainNavigation;