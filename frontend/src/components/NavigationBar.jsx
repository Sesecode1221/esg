import React from 'react';
import { FiBell, FiSearch, FiUser } from 'react-icons/fi';

const NavigationBar = ({ activeTab, setActiveTab }) => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">G</span>
              </div>
              <h1 className="text-xl font-bold text-gray-800">
                Green<span className="text-green-600">BDG</span> Africa
              </h1>
            </div>
            <div className="hidden md:block text-sm text-gray-500">
              AI-Enabled ESG Platform
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-6">
            {['dashboard', 'energy', 'esg', 'waste', 'social', 'reports', 'insights', 'settings'].map((tab) => (
              <button
                key={tab}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <FiSearch className="text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <FiBell className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <FiUser className="text-gray-600" />
              </div>
              <span className="hidden md:block text-sm font-medium">Admin User</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden mt-4 overflow-x-auto">
          <div className="flex space-x-2">
            {['dashboard', 'energy', 'esg', 'waste', 'social'].map((tab) => (
              <button
                key={tab}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-green-600'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default NavigationBar;