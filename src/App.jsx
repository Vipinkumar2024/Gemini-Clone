import React, { useState, useEffect } from 'react';
import './index.css';
import { url } from './assets/constats';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  UserButton,
  useUser
} from '@clerk/clerk-react';

const App = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const { user } = useUser();

  // Load recent from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) setRecentSearches(JSON.parse(stored));
  }, []);

  // Save recent to localStorage when updated
  useEffect(() => {
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  const askQuestion = async () => {
    if (!question.trim()) return;

    setMessages((prev) => [...prev, { type: 'user', text: question }]);

    if (!recentSearches.includes(question)) {
      setRecentSearches((prev) => [question, ...prev.slice(0, 9)]);
    }

    const payload = {
      contents: [
        {
          parts: [{ text: question }],
        },
      ],
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resJson = await response.json();
      const reply = resJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const replyText = reply.split('*').map((str) => str.trim()).join('\n');

      setMessages((prev) => [...prev, { type: 'ai', text: replyText }]);
      setQuestion('');
    } catch (error) {
      console.error('Error fetching answer:', error);
    }
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const handleRecentClick = (text) => {
    setQuestion(text);
    toggleSidebar();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 h-screen min-h-screen text-center relative bg-black">

      {/* Sign In / Sign Out buttons */}
      <div className="absolute top-4 right-4 z-30">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="text-white bg-purple-600 px-4 py-2 rounded-md hover:bg-purple-700">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>

      {/* Toggle Button on Mobile */}
      <button
        className="md:hidden absolute top-4 left-4 z-20 text-white text-3xl"
        onClick={toggleSidebar}
      >
        ☰
      </button>

      {/* Sidebar */}
      <div
        className={`fixed md:static top-0 left-0 h-full w-[60%] md:w-full md:max-w-xs bg-zinc-600 transition-transform duration-300 z-10
          ${showSidebar ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="p-4 text-white text-left h-full flex flex-col justify-between">
          <div>
            <h2 className="text-sm md:text-lg font-semibold mt-10 mb-3">Recent Searches</h2>
            <ul className="space-y-2">
              {recentSearches.length === 0 && (
                <li className="text-sm text-zinc-300">No recent questions</li>
              )}
              {recentSearches.map((item, index) => (
                <li
                  key={index}
                  className="cursor-pointer hover:text-purple-400"
                  onClick={() => handleRecentClick(item)}
                >
                  • {item}
                </li>
              ))}
            </ul>
          </div>
          {recentSearches.length > 0 && (
            <button
              onClick={() => setRecentSearches([])}
              className="text-sm text-red-400 mt-4 hover:underline"
            >
              Clear Recent
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="col-span-1 md:col-span-4 flex flex-col justify-between items-center py-10 px-4">

        {/* Greeting based on auth */}
        <SignedIn>
          <h1 className="text-xl sm:text-2xl mt-4 font-sans text-purple-500 mb-4">
            Welcome, {user?.firstName || 'User'}! Ask me anything.
          </h1>

          {/* Chat messages */}
          <div className="w-full max-w-3xl flex flex-col gap-3 overflow-y-auto mb-6 flex-1 px-2">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`px-4 py-2 rounded-lg max-w-[75%] whitespace-pre-line ${
                  msg.type === 'user'
                    ? 'bg-purple-600 self-end text-right text-white'
                    : 'bg-zinc-700 self-start text-left text-white'
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Input and ask button */}
          <div className="w-full max-w-md flex justify-between items-center bg-zinc-600 rounded-full shadow-lg mt-auto mb-10 p-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              type="text"
              placeholder="Ask me anything"
              className="flex-1 px-4 h-[45px] border-none outline-none text-white bg-zinc-600 placeholder-white"
              onKeyDown={(e) => e.key === 'Enter' && askQuestion()}
            />
            <button
              onClick={askQuestion}
              className="text-white px-4 py-2 hover:text-purple-400"
            >
              Ask
            </button>
          </div>
        </SignedIn>

        <SignedOut>
          <p className="text-white mt-10 text-lg">
            Please sign in to ask questions.
          </p>
        </SignedOut>
      </div>
    </div>
  );
};

export default App;
