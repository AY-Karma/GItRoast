"use client";
import React, { useEffect, useState } from "react";
import Button from "@/ui/button";

export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = (typeof window !== 'undefined') ? localStorage.getItem('theme') : null;
    if (saved === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      // default to dark if nothing saved
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggle = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  const emoji = isDark ? '🌞' : '🌙';

  return (
    <Button onClick={toggle} aria-label={label} title={label} className="h-9 w-9" style={{ padding: 0 }}>
      <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        {emoji}
      </span>
    </Button>
  );
};

export default ThemeToggle;
