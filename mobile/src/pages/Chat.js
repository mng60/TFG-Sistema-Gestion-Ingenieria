import React from 'react';
import MobileLayout from '../components/layout/MobileLayout';
import ChatLayout from '../components/chat/ChatLayout';

function Chat() {
  return (
    <MobileLayout noPadding>
      <ChatLayout />
    </MobileLayout>
  );
}

export default Chat;
