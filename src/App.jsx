import React, { useState } from 'react';
import PageTransition from './components/shared/PageTransition';

import ScratchCard from './components/ScratchCard/ScratchCard';
import PhotoUpload from './components/PhotoCard/PhotoUpload';
import CardGenerator from './components/PhotoCard/CardGenerator';
import Carousel from './components/GreetingCarousel/Carousel';
import AdminDashboard from './pages/AdminDashboard';

const STAGES = {
  SCRATCH: 'scratch',
  UPLOAD: 'upload',
  PORTFOLIO: 'portfolio',
  CAROUSEL: 'carousel',
};

export default function App() {
  const [stage, setStage] = useState(() => {
    return localStorage.getItem('hasScratched') ? STAGES.UPLOAD : STAGES.SCRATCH;
  });

  const [userData, setUserData] = useState({
    photo: null,
    photoFile: null,
  });

  if (window.location.pathname === '/admin') {
    return <AdminDashboard />;
  }

  // Current view based on state
  const getCurrentView = () => {
    switch (stage) {
      case STAGES.SCRATCH:
        return (
          <ScratchCard
            key="scratch"
            onComplete={() => {
              localStorage.setItem('hasScratched', 'true');
              setStage(STAGES.UPLOAD);
            }}
          />
        );

      case STAGES.UPLOAD:
        return (
          <PhotoUpload
            key="upload"
            userData={userData}
            setUserData={setUserData}
            onNext={() => setStage(STAGES.PORTFOLIO)}
          />
        );

      case STAGES.PORTFOLIO:
        return (
          <CardGenerator
            key="portfolio"
            userData={userData}
            onBrowseCards={() => setStage(STAGES.CAROUSEL)}
            onBack={() => setStage(STAGES.UPLOAD)}
          />
        );

      case STAGES.CAROUSEL:
        return (
          <Carousel
            key="carousel"
            onBack={() => setStage(STAGES.PORTFOLIO)}
          />
        );

      default:
        return (
          <ScratchCard
            key="scratch"
            onComplete={() => {
              localStorage.setItem('hasScratched', 'true');
              setStage(STAGES.UPLOAD);
            }}
          />
        );
    }
  };

  return (
    <PageTransition transitionKey={stage}>
      {getCurrentView()}
    </PageTransition>
  );
}