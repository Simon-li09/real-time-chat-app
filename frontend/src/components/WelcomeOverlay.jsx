import { useEffect, useState } from "react";

const WelcomeOverlay = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHidden(true);
      // Wait for the transition to finish before unmounting (optional)
      // Transition is 0.8s ease with 1.2s delay, total 2s
      // So at 3.8s it should be safe to say it's hidden
    }, 3800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div id="welcome-screen" className={`welcome ${isHidden ? "hidden" : ""}`}>
      <div className="welcome-content">
        <h1 className="animated-title">
          <span>W</span><span>e</span><span>l</span><span>c</span><span>o</span><span>m</span><span>e</span>
          <span>&nbsp;</span>
          <span>t</span><span>o</span>
          <span>&nbsp;</span>
          <span className="highlight">Lee</span> <span className="highlight">Chat</span>
        </h1>
        <p className="tagline">Connect • Chat • Real-time</p>
        <div className="loading-dots">
          <span>.</span><span>.</span><span>.</span>
        </div>
      </div>
    </div>
  );
};

export default WelcomeOverlay;
