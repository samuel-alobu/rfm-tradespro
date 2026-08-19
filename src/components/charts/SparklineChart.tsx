'use client';

import React, { useEffect, useRef } from 'react';
import { 
  createChart, 
  ColorType, 
  IChartApi,
  LineSeries,
  Time
} from 'lightweight-charts';
import { cn } from '@/utils';

// ============================================
// Sparkline Chart Component
// ============================================

interface SparklineChartProps {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
  className?: string;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  width = 100,
  height = 40,
  positive = true,
  className,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    const primaryColor = positive ? '#10b981' : '#ef4444';

    const chart = createChart(chartContainerRef.current, {
      width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'transparent',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      rightPriceScale: { visible: false },
      timeScale: { visible: false },
      crosshair: {
        vertLine: { visible: false },
        horzLine: { visible: false },
      },
      handleScroll: false,
      handleScale: false,
    });

    chartRef.current = chart;

    // Convert data to line format
    const now = Date.now();
    const lineData = data.map((value, index) => ({
      time: (Math.floor(now / 1000) - (data.length - index) * 3600) as Time,
      value,
    }));

    // Use new API
    const lineSeries = chart.addSeries(LineSeries, {
      color: primaryColor,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    lineSeries.setData(lineData);
    chart.timeScale().fitContent();

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, width, height, positive]);

  return <div ref={chartContainerRef} className={cn('', className)} />;
};

// ============================================
// Generate mock sparkline data
// ============================================

export const generateSparklineData = (points: number = 24, volatility: number = 0.02): number[] => {
  const data: number[] = [];
  let value = 100;

  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.5) * volatility * value;
    value = Math.max(1, value + change);
    data.push(value);
  }

  return data;
};

export default SparklineChart;
