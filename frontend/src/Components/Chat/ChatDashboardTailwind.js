// Example: Chat Dashboard with Tailwind CSS (NO custom CSS needed!)

import React from 'react';

function ChatDashboardTailwind() {
  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen bg-gray-50">
      
      {/* Stats Cards */}
      <div className="flex flex-wrap gap-3 md:gap-5 mb-6 md:mb-8">
        <div className="flex-1 min-w-[150px] bg-white p-4 md:p-6 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-indigo-500 mb-2">24</h3>
          <p className="text-sm text-gray-600 font-medium">Active Chats</p>
        </div>
        
        <div className="flex-1 min-w-[150px] bg-white p-4 md:p-6 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-green-500 mb-2">12</h3>
          <p className="text-sm text-gray-600 font-medium">Resolved</p>
        </div>
        
        <div className="flex-1 min-w-[150px] bg-white p-4 md:p-6 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">5</h3>
          <p className="text-sm text-gray-600 font-medium">Pending</p>
        </div>
      </div>

      {/* Chat Container */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] xl:grid-cols-[380px_1fr] gap-3 md:gap-5 h-[calc(100vh-250px)] min-h-[500px]">
        
        {/* Chat List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gradient-to-r from-indigo-500 to-purple-600">
            <h2 className="text-lg font-semibold text-white">Conversations</h2>
          </div>
          
          <div className="overflow-y-auto h-full">
            {/* Chat Item */}
            <div className="p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold">
                  JD
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">John Doe</h4>
                  <p className="text-xs text-gray-500 truncate">Last message preview...</p>
                </div>
                <span className="text-xs text-gray-400">2m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <div className="bg-white rounded-xl shadow-sm flex flex-col">
          <div className="p-4 border-b bg-gradient-to-r from-indigo-500 to-purple-600">
            <h3 className="font-semibold text-white">John Doe</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Messages */}
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2 max-w-[75%]">
                <p className="text-sm">Hello! I need help with my order.</p>
                <span className="text-xs text-gray-500">10:30 AM</span>
              </div>
            </div>
            
            <div className="flex justify-end">
              <div className="bg-indigo-500 text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-[75%]">
                <p className="text-sm">Sure! I'd be happy to help. What's your order number?</p>
                <span className="text-xs text-indigo-200">10:31 AM</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Type a message..." 
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatDashboardTailwind;
