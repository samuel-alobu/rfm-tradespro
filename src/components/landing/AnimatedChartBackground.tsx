'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/utils';

// ============================================
// Animated Chart Background
// ============================================

interface AnimatedChartBackgroundProps {
  className?: string;
}

export const AnimatedChartBackground: React.FC<AnimatedChartBackgroundProps> = ({
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    const generatePoints = (
      width: number,
      height: number,
      offset: number,
      amplitude: number,
      frequency: number
    ): { x: number; y: number }[] => {
      const points: { x: number; y: number }[] = [];
      const baseY = height * 0.6;

      for (let x = 0; x <= width; x += 4) {
        const y =
          baseY +
          Math.sin((x + offset) * frequency) * amplitude +
          Math.sin((x + offset) * frequency * 2) * (amplitude * 0.5) +
          Math.cos((x + offset) * frequency * 0.5) * (amplitude * 0.3);
        points.push({ x, y });
      }

      return points;
    };

    const drawChart = (
      points: { x: number; y: number }[],
      color: string,
      fillColor: string,
      height: number
    ) => {
      if (points.length === 0) return;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length - 2; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }

      // Last two points
      if (points.length >= 2) {
        ctx.quadraticCurveTo(
          points[points.length - 2].x,
          points[points.length - 2].y,
          points[points.length - 1].x,
          points[points.length - 1].y
        );
      }

      // Draw line
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Fill area
      ctx.lineTo(points[points.length - 1].x, height);
      ctx.lineTo(points[0].x, height);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, fillColor);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fill();
    };

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      // Draw multiple chart lines with different phases
      const charts = [
        {
          offset: time * 0.3,
          amplitude: height * 0.08,
          frequency: 0.008,
          color: 'rgba(34, 197, 94, 0.6)',
          fill: 'rgba(34, 197, 94, 0.1)',
        },
        {
          offset: time * 0.5 + 100,
          amplitude: height * 0.06,
          frequency: 0.01,
          color: 'rgba(34, 197, 94, 0.4)',
          fill: 'rgba(34, 197, 94, 0.05)',
        },
        {
          offset: time * 0.2 + 200,
          amplitude: height * 0.1,
          frequency: 0.006,
          color: 'rgba(34, 197, 94, 0.3)',
          fill: 'rgba(34, 197, 94, 0.03)',
        },
      ];

      charts.forEach((chart) => {
        const points = generatePoints(
          width,
          height,
          chart.offset,
          chart.amplitude,
          chart.frequency
        );
        drawChart(points, chart.color, chart.fill, height);
      });

      // Draw candlesticks
      const candleWidth = 8;
      const candleGap = 20;
      const candleCount = Math.floor(width / (candleWidth + candleGap));

      for (let i = 0; i < candleCount; i++) {
        const x = i * (candleWidth + candleGap) + candleGap;
        const baseY = height * 0.5;
        const open = baseY + Math.sin((i + time * 0.02) * 0.5) * (height * 0.1);
        const close = baseY + Math.cos((i + time * 0.02) * 0.3) * (height * 0.08);
        const high = Math.min(open, close) - Math.abs(Math.sin(i)) * 20;
        const low = Math.max(open, close) + Math.abs(Math.cos(i)) * 20;

        const isUp = close < open;
        const color = isUp
          ? 'rgba(34, 197, 94, 0.15)'
          : 'rgba(239, 68, 68, 0.15)';
        const wickColor = isUp
          ? 'rgba(34, 197, 94, 0.2)'
          : 'rgba(239, 68, 68, 0.2)';

        // Wick
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, high);
        ctx.lineTo(x + candleWidth / 2, low);
        ctx.strokeStyle = wickColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Body
        ctx.fillStyle = color;
        ctx.fillRect(x, Math.min(open, close), candleWidth, Math.abs(close - open));
      }

      time += 1;
      animationFrameId = requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0 w-full h-full', className)}
      style={{ opacity: 0.5 }}
    />
  );
};

export default AnimatedChartBackground;
