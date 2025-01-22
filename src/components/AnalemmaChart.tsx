'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { calculateAnalemmaPoints, calculateSolarPosition } from '@/utils/solarCalculations';

interface AnalemmaChartProps {
  latitude: number;
  longitude: number;
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  isDark?: boolean;
  showTodayPath?: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface HourData {
  points: Point[];
}

export default function AnalemmaChart({ 
  latitude, 
  longitude, 
  selectedTime, 
  onTimeSelect,
  isDark = false,
  showTodayPath = true
}: AnalemmaChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoursDataRef = useRef<Record<string, HourData>>({});

  // Function to update canvas size and redraw
  const updateCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    // Fill with base background color (transparent)
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, width, height);

    const margin = Math.min(width, height) * 0.08;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;

    // Store chart dimensions for calculations
    const chartDimensions = {
      width: chartWidth,
      height: chartHeight,
      margin: margin
    };

    // Move to bottom-left corner of chart area
    ctx.translate(chartDimensions.margin, height - chartDimensions.margin);

    // Calculate max altitude from all points for y-axis scaling
    let maxAltitude = 60; // default minimum
    const hours = Array.from({ length: 24 }, (_, i) => i);
    hours.forEach(hour => {
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      const points = calculateAnalemmaPoints(latitude, longitude, timeStr);
      points.forEach(point => {
        maxAltitude = Math.max(maxAltitude, Math.ceil(point.altitude / 10) * 10);
      });
    });

    // Draw grid
    ctx.strokeStyle = isDark ? '#404040' : '#e5e5e5';
    ctx.lineWidth = 1;
    ctx.beginPath();

    // Draw horizontal grid lines (altitude)
    for (let alt = 0; alt <= maxAltitude; alt += 10) {
      const y = -(alt / maxAltitude) * chartDimensions.height;
      ctx.moveTo(0, y);
      ctx.lineTo(chartDimensions.width, y);
      
      // Add altitude labels
      ctx.save();
      ctx.fillStyle = isDark ? '#a3a3a3' : '#737373';
      ctx.font = `${Math.max(10, Math.min(12, chartDimensions.width / 60))}px Inter`;
      ctx.textAlign = 'right';
      ctx.fillText(`${alt}°`, -5, y + 4);
      ctx.restore();
    }

    // Draw vertical grid lines (azimuth)
    for (let az = 0; az <= 360; az += 30) {
      const x = (az / 360) * chartDimensions.width;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, -chartDimensions.height);
      
      // Add azimuth labels for main compass points
      if (az % 90 === 0) {
        ctx.save();
        ctx.fillStyle = isDark ? '#a3a3a3' : '#737373';
        ctx.font = `${Math.max(10, Math.min(12, chartDimensions.width / 60))}px Inter`;
        ctx.textAlign = 'center';
        const direction = az === 0 || az === 360 ? 'N' : az === 90 ? 'E' : az === 180 ? 'S' : 'W';
        ctx.fillText(direction, x, 15);
        ctx.restore();
      }
    }
    ctx.stroke();

    // Reset hours data
    hoursDataRef.current = {};

    // Draw today's sun path if enabled
    if (showTodayPath) {
      ctx.beginPath();
      ctx.strokeStyle = isDark ? 'rgba(251, 191, 36, 0.4)' : 'rgba(251, 191, 36, 0.6)';
      ctx.lineWidth = 2;

      // Calculate sun positions for today at 15-minute intervals
      const today = new Date();
      const intervals = Array.from({ length: 96 }, (_, i) => i * 15); // 24 hours * 4 (15-min intervals)
      
      intervals.forEach((minutes, index) => {
        const time = new Date(today);
        time.setHours(Math.floor(minutes / 60), minutes % 60);
        const position = calculateSolarPosition(latitude, longitude, time);

        // Only draw points when sun is above horizon
        if (position.altitude > 0) {
          const x = (position.azimuth / 360) * chartDimensions.width;
          const y = -(position.altitude / maxAltitude) * chartDimensions.height;

          if (index === 0 || !intervals.some((_, i) => i < index && calculateSolarPosition(latitude, longitude, new Date(today.setHours(Math.floor(i * 15 / 60), (i * 15) % 60))).altitude > 0)) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
      });

      ctx.stroke();
    }

    // Draw all hours
    hours.forEach(hour => {
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      const points = calculateAnalemmaPoints(latitude, longitude, timeStr);

      if (points.length > 0) {
        // Store points data for click detection
        hoursDataRef.current[timeStr] = {
          points: points.map(point => ({
            x: (point.azimuth / 360) * chartDimensions.width,
            y: -(point.altitude / maxAltitude) * chartDimensions.height
          }))
        };

        // Draw dots for each day's position
        points.forEach(point => {
          // Skip points where sun is below horizon
          if (point.altitude <= 0) return;

          const x = (point.azimuth / 360) * chartDimensions.width;
          const y = -(point.altitude / maxAltitude) * chartDimensions.height;
          
          if (timeStr === selectedTime) {
            // Add glow effect for selected time
            ctx.save();
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 5);
            gradient.addColorStop(0, 'rgba(220, 38, 38, 0.8)');
            gradient.addColorStop(0.5, 'rgba(220, 38, 38, 0.2)');
            gradient.addColorStop(1, 'rgba(220, 38, 38, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
          }
          
          // Draw the actual dot
          ctx.beginPath();
          ctx.fillStyle = timeStr === selectedTime ? '#dc2626' : (isDark ? '#525252' : '#d4d4d4');
          ctx.arc(x, y, 2, 0, 2 * Math.PI);
          ctx.fill();
        });

        // Add today's position with glow
        if (timeStr === selectedTime) {
          const today = new Date();
          const startOfYear = new Date(today.getFullYear(), 0, 0);
          const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
          const todayPoint = points[dayOfYear - 1];
          
          // Only draw today's position if sun is above horizon
          if (todayPoint && todayPoint.altitude > 0) {
            const x = (todayPoint.azimuth / 360) * chartDimensions.width;
            const y = -(todayPoint.altitude / maxAltitude) * chartDimensions.height;
            
            // Outer glow
            ctx.save();
            const outerGlow = ctx.createRadialGradient(x, y, 0, x, y, 10);
            outerGlow.addColorStop(0, 'rgba(251, 191, 36, 0.6)');
            outerGlow.addColorStop(0.5, 'rgba(251, 191, 36, 0.2)');
            outerGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
            
            ctx.fillStyle = outerGlow;
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, 2 * Math.PI);
            ctx.fill();

            // Inner glow
            const innerGlow = ctx.createRadialGradient(x, y, 0, x, y, 5);
            innerGlow.addColorStop(0, 'rgba(251, 191, 36, 1)');
            innerGlow.addColorStop(0.7, 'rgba(251, 191, 36, 0.8)');
            innerGlow.addColorStop(1, 'rgba(251, 191, 36, 0.4)');
            
            ctx.fillStyle = innerGlow;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fill();

            // Center dot
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
          }
        }
      }
    });
  }, [latitude, longitude, selectedTime, isDark, showTodayPath]);

  // Handle canvas click
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !hoursDataRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert click coordinates to chart coordinates
    const margin = Math.min(rect.width, rect.height) * 0.08;
    const chartDimensions = {
      width: rect.width - 2 * margin,
      height: rect.height - 2 * margin,
      margin: margin
    };
    
    const chartX = x - chartDimensions.margin;
    const chartY = (rect.height - chartDimensions.margin - y) - chartDimensions.height;

    // Find the closest analemma to the click
    let closestDistance = Infinity;
    let closestTime = selectedTime;

    Object.entries(hoursDataRef.current).forEach(([time, data]) => {
      data.points.forEach(point => {
        const distance = Math.sqrt(
          Math.pow(chartX - point.x, 2) + 
          Math.pow(chartY - point.y, 2)
        );
        if (distance < closestDistance && distance < Math.min(rect.width, rect.height) * 0.05) {
          closestDistance = distance;
          closestTime = time;
        }
      });
    });

    if (closestTime !== selectedTime) {
      onTimeSelect(closestTime);
    }
  };

  useEffect(() => {
    updateCanvas();
  }, [latitude, longitude, selectedTime, isDark, showTodayPath, updateCanvas]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full w-full relative"
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-pointer"
      />
    </motion.div>
  );
} 