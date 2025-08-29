import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';

// Mock localStorage
const mockLocalStorage = (function() {
  let store = {
    'user': JSON.stringify({
      id: 'test-id',
      name: 'Admin User',
      email: 'admin@vithanage.com',
      isAdmin: true
    }),
    'token': 'test-token'
  };
  
  return {
    getItem: function(key) {
      return store[key] || null;
    },
    setItem: function(key, value) {
      store[key] = value.toString();
    },
    removeItem: function(key) {
      delete store[key];
    },
    clear: function() {
      store = {};
    }
  };
})();

// Setup mock
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([
      {
        _id: '1',
        name: 'Test User',
        email: 'test@example.com',
        isAdmin: false,
        createdAt: new Date().toISOString()
      }
    ])
  })
);

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders admin dashboard for admin user', async () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );
    
    // Check for dashboard heading
    expect(await screen.findByText('Dashboard Overview')).toBeInTheDocument();
    
    // Check for sidebar menu items
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Product Management')).toBeInTheDocument();
    expect(screen.getByText('Order & Cart')).toBeInTheDocument();
    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('Financial & Promotions')).toBeInTheDocument();
    expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument();
    expect(screen.getByText('Refund Management')).toBeInTheDocument();
    
    // Check for user info in sidebar
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('admin@vithanage.com')).toBeInTheDocument();
  });
});
