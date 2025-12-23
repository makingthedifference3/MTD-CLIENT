import { useEffect, useState } from 'react';

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [stage, setStage] = useState<'hidden' | 'reveal-logo1' | 'reveal-logo2' | 'complete'>('hidden');

  useEffect(() => {
    // Stage 1: Start revealing Logo 01 from center
    const timer1 = setTimeout(() => {
      setStage('reveal-logo1');
    }, 100);

    // Stage 2: Logo 01 shifts left, Logo 02 reveals from center to right
    const timer2 = setTimeout(() => {
      setStage('reveal-logo2');
    }, 900);

    // Stage 3: Hold the revealed logo for a moment
    const timer3 = setTimeout(() => {
      setStage('complete');
    }, 3200);

    // Stage 4: Fade out and remove preloader
    const timer4 = setTimeout(() => {
      onComplete();
    }, 3900);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          {/* Logo 01 - Left Half */}
          <div
            className={`transition-all duration-1000 ease-out ${
              stage === 'hidden'
                ? 'opacity-0 scale-50'
                : stage === 'reveal-logo1'
                ? 'opacity-100 scale-100'
                : stage === 'reveal-logo2'
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-100'
            }`}
            style={{
              marginRight: stage === 'reveal-logo2' || stage === 'complete' ? '0px' : undefined,
              transition: 'all 1000ms ease-out'
            }}
          >
            <img
              src="/images/logo 01.png"
              alt="MTD Logo Left"
              className="h-[20vh] w-auto drop-shadow-2xl"
            />
          </div>

          {/* Logo 02 - Right Half */}
          <div
            className={`transition-all duration-1000 ease-out ${
              stage === 'hidden' || stage === 'reveal-logo1'
                ? 'opacity-0 scale-50'
                : stage === 'reveal-logo2'
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-100'
            }`}
            style={{
              maxWidth: stage === 'hidden' || stage === 'reveal-logo1' ? '0px' : '1000px',
              marginLeft: stage === 'reveal-logo2' || stage === 'complete' ? '0px' : undefined,
              transition: 'all 1000ms ease-out'
            }}
          >
            <img
              src="/images/logo 02.png"
              alt="MTD Logo Right"
              className="h-[20vh] w-auto drop-shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
