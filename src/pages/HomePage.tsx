import React from 'react';
import MainLayout from '../components/MainLayout';
import ChatMessages from '../components/ChatMessages';

const HomePage: React.FC = () => {
  return (
    <MainLayout>
      <ChatMessages />
    </MainLayout>
  );
};

export default HomePage;