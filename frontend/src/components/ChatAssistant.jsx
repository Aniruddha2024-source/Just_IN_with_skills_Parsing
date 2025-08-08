/*import { useState } from 'react';
import axios from 'axios';

function ChatAssistant() {
  const [show, setShow] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { from: 'user', text: input }];
    setMessages(newMessages);
    setInput('');
    try {
      const res = await axios.post('/api/chat', { message: input });
      setMessages([...newMessages, { from: 'bot', text: res.data.reply }]);
    } catch (err) {
      setMessages([...newMessages, { from: 'bot', text: "Something went wrong. Please try again." }]);
    }
  };

  return (
    <>
      <button
        onClick={() => setShow(!show)}
        className="fixed bottom-5 right-5 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg z-50"
      >
        {show ? "Close Chat" : "Ask AI"}
      </button>

      {show && (
        <div className="fixed bottom-20 right-5 w-80 bg-black border rounded-lg shadow-lg p-3 z-50">
          <div className="h-64 overflow-y-auto mb-2">
            {messages.map((msg, i) => (
              <div key={i} className={`my-1 ${msg.from === 'user' ? 'text-right' : 'text-left'}`}>
                <span className={`inline-block px-3 py-1 rounded ${msg.from === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  {msg.text}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1 border px-2 py-1 rounded"
              placeholder="Ask anything..."
            />
            <button
              onClick={sendMessage}
              className="bg-blue-500 text-white px-3 py-1 rounded"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatAssistant;*/

import { useState } from 'react';
import axios from 'axios';

function ChatAssistant() {
  const [show, setShow] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { from: 'user', text: input }];
    setMessages(newMessages);
    setInput('');
    try {
      const res = await axios.post('/api/chat', { message: input });
      setMessages([...newMessages, { from: 'bot', text: res.data.reply }]);
    } catch (err) {
      setMessages([...newMessages, { from: 'bot', text: "Something went wrong. Please try again." }]);
    }
  };

  return (
    <>
      <button
        onClick={() => setShow(!show)}
        className="fixed bottom-5 right-5 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg z-50"
      >
        {show ? "Close Chat" : "Ask AI"}
      </button>

      {show && (
        <div className="fixed bottom-20 right-5 w-80 bg-black border border-gray-700 rounded-lg shadow-lg p-3 z-50 text-white">
          <div className="h-64 overflow-y-auto mb-2 bg-gray-900 rounded p-2">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-300">
                Ask me about your query
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`my-1 ${msg.from === 'user' ? 'text-right' : 'text-left'}`}>
                  <span
                    className={`inline-block px-3 py-1 rounded max-w-[70%] break-words ${
                      msg.from === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'
                    }`}
                  >
                    {msg.text}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1 border border-gray-600 bg-gray-800 text-white px-2 py-1 rounded"
              placeholder="Ask anything..."
            />
            <button
              onClick={sendMessage}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatAssistant;
