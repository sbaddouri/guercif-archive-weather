"use client";

import { getWeatherIcon } from "@/lib/weather-colors";

interface WeatherIconProps {
  weatherCode: number;
  time?: string;
  sunrise?: string | null;
  sunset?: string | null;
  className?: string;
  alt?: string;
  title?: string;
}

export function WeatherIcon({ weatherCode, time, sunrise, sunset, className = "h-5 w-5", alt = "", title = "" }: WeatherIconProps) {
  const { icon, imagePath, description } = getWeatherIcon(weatherCode, time, sunrise, sunset);

  if (imagePath) {
    return (
      <img
        src={imagePath}
        alt={alt || description}
        title={title || description}
        className={className}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = "none";
          const parent = e.currentTarget.parentElement;
          if (parent) {
            const fallback = document.createElement("span");
            fallback.textContent = icon;
            fallback.title = description;
            parent.appendChild(fallback);
          }
        }}
      />
    );
  }

  return <span className={className} title={title || description}>{icon}</span>;
}

interface DailyWeatherIconProps {
  weatherCode: number;
  className?: string;
  alt?: string;
  title?: string;
}

export function DailyWeatherIcon({ weatherCode, className = "h-8 w-8", alt = "", title = "" }: DailyWeatherIconProps) {
  const { icon, imagePath, description } = getWeatherIcon(weatherCode);

  if (imagePath) {
    return (
      <img
        src={imagePath}
        alt={alt || description}
        title={title || description}
        className={className}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = "none";
          const parent = e.currentTarget.parentElement;
          if (parent) {
            const fallback = document.createElement("span");
            fallback.textContent = icon;
            fallback.title = description;
            parent.appendChild(fallback);
          }
        }}
      />
    );
  }

  return <span className={className} title={title || description}>{icon}</span>;
}