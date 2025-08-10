import React, { useState, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  BellIcon,
  QuestionMarkCircleIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock notifications data
  const notifications = [
    {
      id: 1,
      title: 'New Risk Assessment Complete',
      description: 'Entity ABC-123 assessment finished with high risk score',
      time: '2 minutes ago',
      unread: true,
      type: 'assessment',
    },
    {
      id: 2,
      title: 'Compliance Deadline Approaching',
      description: 'GDPR audit due in 3 days for Company XYZ',
      time: '1 hour ago',
      unread: true,
      type: 'compliance',
    },
    {
      id: 3,
      title: 'User Permission Updated',
      description: 'John Doe permissions have been modified',
      time: '3 hours ago',
      unread: false,
      type: 'user',
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center space-x-4">
            {/* Menu toggle button */}
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-3 text-decoration-none">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">I</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-primary-600">IRPA</h1>
                <p className="text-xs text-gray-500 -mt-1">Risk Assessment Platform</p>
              </div>
            </Link>
          </div>

          {/* Center section - Search */}
          <div className="flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Search companies, entities, assessments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-3">
            {/* Help button */}
            <button
              type="button"
              className="p-2 text-gray-500 rounded-lg hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Help & Support"
            >
              <QuestionMarkCircleIcon className="h-6 w-6" />
            </button>

            {/* Notifications */}
            <Menu as="div" className="relative">
              <Menu.Button className="p-2 text-gray-500 rounded-lg hover:text-gray-700 hover:bg-gray-100 transition-colors relative">
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-96 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                  </div>
                  <div className="py-1">
                    {notifications.map((notification) => (
                      <Menu.Item key={notification.id}>
                        {({ active }) => (
                          <div
                            className={`px-4 py-3 cursor-pointer ${
                              active ? 'bg-gray-50' : ''
                            } ${notification.unread ? 'bg-blue-50' : ''}`}
                          >
                            <div className="flex">
                              <div className="flex-shrink-0">
                                {notification.unread && (
                                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                                )}
                              </div>
                              <div className={`${notification.unread ? 'ml-3' : 'ml-5'} flex-1`}>
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-500">{notification.description}</p>
                                <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                  <div className="p-3 border-t border-gray-200 text-center">
                    <button className="text-sm text-primary-600 hover:text-primary-500 font-medium">
                      View All Notifications
                    </button>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>

            {/* Profile dropdown */}
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center space-x-3 p-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-56 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleNavigate('/profile')}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } group flex items-center px-4 py-2 text-sm text-gray-700 w-full text-left`}
                        >
                          <UserCircleIcon className="mr-3 h-5 w-5 text-gray-400" />
                          Profile
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleNavigate('/settings')}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } group flex items-center px-4 py-2 text-sm text-gray-700 w-full text-left`}
                        >
                          <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-400" />
                          Settings
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                  <div className="py-1 border-t border-gray-200">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } group flex items-center px-4 py-2 text-sm text-red-600 w-full text-left`}
                        >
                          <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-red-500" />
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
