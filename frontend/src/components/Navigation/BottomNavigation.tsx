import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  FaceSmileIcon,
  HeartIcon,
  ChartBarIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  FaceSmileIcon as FaceSmileIconSolid,
  HeartIcon as HeartIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  UserCircleIcon as UserCircleIconSolid,
} from '@heroicons/react/24/solid';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  color: string;
}

const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      id: 'home',
      label: 'Inicio',
      path: '/',
      icon: <HomeIcon className="w-6 h-6" />,
      activeIcon: <HomeIconSolid className="w-6 h-6" />,
      color: 'text-gray-600',
    },
    {
      id: 'mood',
      label: 'Ánimo',
      path: '/mood-assessment',
      icon: <FaceSmileIcon className="w-6 h-6" />,
      activeIcon: <FaceSmileIconSolid className="w-6 h-6" />,
      color: 'text-primary-500',
    },
    {
      id: 'breathing',
      label: 'Respirar',
      path: '/breathing-exercise',
      icon: <HeartIcon className="w-6 h-6" />,
      activeIcon: <HeartIconSolid className="w-6 h-6" />,
      color: 'text-secondary-400',
    },
    {
      id: 'tracking',
      label: 'Progreso',
      path: '/daily-tracking',
      icon: <ChartBarIcon className="w-6 h-6" />,
      activeIcon: <ChartBarIconSolid className="w-6 h-6" />,
      color: 'text-accent-400',
    },
    {
      id: 'profile',
      label: 'Perfil',
      path: '/profile',
      icon: <UserCircleIcon className="w-6 h-6" />,
      activeIcon: <UserCircleIconSolid className="w-6 h-6" />,
      color: 'text-accent-500',
    },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="
      fixed bottom-0 left-0 right-0 z-40
      bg-white border-t border-gray-200
      shadow-lg
      md:hidden
    ">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          
          return (
            <motion.button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`
                flex flex-col items-center justify-center
                py-2 px-3 rounded-lg
                transition-all duration-200
                ${active ? item.color : 'text-gray-400'}
                hover:bg-gray-50
                focus:outline-none focus:ring-2 focus:ring-primary-200
                min-w-[60px]
              `}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{
                  scale: active ? 1.1 : 1,
                  y: active ? -2 : 0
                }}
                transition={{ duration: 0.2 }}
              >
                {active ? item.activeIcon : item.icon}
              </motion.div>
              
              <span className={`
                text-xs font-medium mt-1
                ${active ? 'font-semibold' : 'font-normal'}
              `}>
                {item.label}
              </span>
              
              {/* Active indicator */}
              {active && (
                <motion.div
                  layoutId="activeIndicator"
                  className={`
                    absolute -top-0.5 left-1/2 transform -translate-x-1/2
                    w-1 h-1 rounded-full
                    ${item.color.replace('text-', 'bg-')}
                  `}
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;