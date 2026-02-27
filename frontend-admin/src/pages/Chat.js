import React from 'react';
import AdminLayout from '../components/Layout/AdminLayout';
import ChatLayout from '../components/chat/ChatLayout';
import '../styles/Chat.css';

function Chat() {
  return (
    <AdminLayout>
      <ChatLayout />
    </AdminLayout>
  );
}

export default Chat;