import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState('enter');
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      setTransitionStage('exit');
      prevPath.current = location.pathname;
    } else {
      setTransitionStage('enter');
    }
  }, [location.pathname]);

  useEffect(() => {
    if (transitionStage === 'exit') {
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionStage('enter');
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [transitionStage, children]);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        transitionStage === 'enter'
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-2'
      }`}
    >
      {displayChildren}
    </div>
  );
}
