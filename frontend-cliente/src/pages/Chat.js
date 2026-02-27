import React, { useEffect } from 'react';
import ChatLayout from '../components/chat/ChatLayout';
import '../styles/Chat.css';

function Chat() {
  useEffect(() => {
    document.title = 'Chat - Portal Cliente';
  }, []);

  return <ChatLayout />;
}

export default Chat;
