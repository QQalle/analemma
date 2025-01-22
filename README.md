# Analemma Visualizer

A modern web application that visualizes the sun's position throughout the year using an analemma pattern. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🌍 Interactive map for location selection
- ☀️ Real-time solar position calculations
- 🎨 Beautiful, minimalist design with light/dark mode
- 📱 Fully responsive layout
- 🔍 Expandable mini-map with custom styling
- 🎯 Click or drag to select location
- ⌚ Time-based visualization
- 🌐 Automatic timezone detection

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide Icons
- **Animations**: Framer Motion
- **Map**: Leaflet with custom styling
- **Math**: Custom solar position calculations

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/analemma-visualizer.git
   cd analemma-visualizer
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

- Click anywhere on the map or drag the marker to select a location
- Hover over the mini-map to expand it
- Toggle dark/light mode using the theme button
- Click the info button to learn more about the visualization
- The graph shows the sun's position (altitude and azimuth) throughout the year
- Each line represents a different hour of the day

## Solar Calculations

The analemma pattern is calculated using:
- Solar declination
- Equation of time
- Local solar time
- Observer's latitude and longitude

The calculations take into account:
- Earth's axial tilt
- Orbital eccentricity
- Local time zone based on longitude

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
