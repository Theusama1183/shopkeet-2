"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  title: string;
  targetDate: string;
  bgColor: string;
  textColor: string;
  showDays: boolean;
  showHours: boolean;
  showMinutes: boolean;
  showSeconds: boolean;
}

export function CountdownTimer({
  title,
  targetDate,
  bgColor,
  textColor,
  showDays,
  showHours,
  showMinutes,
  showSeconds,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Parse target date
    const target = new Date(targetDate).getTime();
    
    // Check if valid date
    if (isNaN(target)) {
      console.error("[CountdownTimer] Invalid target date:", targetDate);
      setIsExpired(true);
      return;
    }

    const tick = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };

    // Initial tick
    tick();

    // Update every second
    const intervalId = setInterval(tick, 1000);

    return () => clearInterval(intervalId);
  }, [targetDate]);

  // Build time units array based on show flags
  const timeUnits = [
    { value: String(timeLeft.days).padStart(2, "0"), label: "Days", show: showDays },
    { value: String(timeLeft.hours).padStart(2, "0"), label: "Hours", show: showHours },
    { value: String(timeLeft.minutes).padStart(2, "0"), label: "Minutes", show: showMinutes },
    { value: String(timeLeft.seconds).padStart(2, "0"), label: "Seconds", show: showSeconds },
  ].filter((unit) => unit.show);

  return (
    <div className="py-16 px-6" style={{ backgroundColor: bgColor }}>
      <div className="max-w-4xl mx-auto text-center">
        {title && (
          <h2
            className="text-3xl font-heading font-bold mb-8"
            style={{ color: textColor }}
          >
            {title}
          </h2>
        )}
        {isExpired ? (
          <p
            className="text-xl font-semibold opacity-80"
            style={{ color: textColor }}
          >
            This offer has ended
          </p>
        ) : (
          <div className="flex justify-center gap-4 md:gap-8">
            {timeUnits.map((unit, i) => (
              <div key={i} className="text-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 md:p-6 min-w-20 md:min-w-25">
                  <div
                    className="text-3xl md:text-5xl font-bold font-mono"
                    style={{ color: textColor }}
                  >
                    {unit.value}
                  </div>
                </div>
                <p
                  className="text-sm md:text-base mt-2 opacity-80"
                  style={{ color: textColor }}
                >
                  {unit.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
