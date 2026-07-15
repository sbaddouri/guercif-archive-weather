
import { getWeatherIcon } from "@/lib/weather-colors";

const ALL_WEATHER_CODES = [
  0, 1, 2, 3,
  45, 48,
  51, 53, 55, 56, 57,
  61, 63, 65, 66, 67,
  71, 73, 75, 77,
  80, 81, 82, 85, 86,
  95, 96, 99,
];

const TEST_SUNRISE = "2026-07-07T06:08";
const TEST_SUNSET = "2026-07-07T20:28";
const DAY_TIME = "2026-07-07T12:00";
const NIGHT_TIME = "2026-07-07T00:00";

export default function WeatherIconsDemo() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Démonstration des icônes météo</h1>
      
      <div className="grid gap-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Icônes de jour</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ALL_WEATHER_CODES.map((code) => {
              const { icon, description } = getWeatherIcon(
                code,
                DAY_TIME,
                TEST_SUNRISE,
                TEST_SUNSET
              );
              return (
                <div
                  key={`day-${code}`}
                  className="border rounded p-4 flex flex-col items-center gap-2"
                >
                  <span className="text-4xl">{icon}</span>
                  <code className="text-sm">{code}</code>
                  <p className="text-sm text-center">{description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Icônes de nuit</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ALL_WEATHER_CODES.map((code) => {
              const { icon, description } = getWeatherIcon(
                code,
                NIGHT_TIME,
                TEST_SUNRISE,
                TEST_SUNSET
              );
              return (
                <div
                  key={`night-${code}`}
                  className="border rounded p-4 flex flex-col items-center gap-2"
                >
                  <span className="text-4xl">{icon}</span>
                  <code className="text-sm">{code}</code>
                  <p className="text-sm text-center">{description}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
