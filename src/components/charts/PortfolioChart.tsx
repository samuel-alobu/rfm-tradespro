'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  ColorType, 
  IChartApi, 
  ISeriesApi,
  Time,
  AreaSeries,
  AreaData,
  WhitespaceData
} from 'lightweight-charts';
import { cn } from '@/utils';

// ============================================
// Portfolio Chart Component
// ============================================

interface PortfolioChartProps {
  className?: string;
  height?: number;
  timeframe?: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
}

type AreaDataPoint = AreaData<Time> | WhitespaceData<Time>;

// Generate mock portfolio data
const generatePortfolioData = (timeframe: string): AreaDataPoint[] => {
  const data: AreaDataPoint[] = [];
  const now = new Date();
  let days: number;
  let interval: number; // in hours

  switch (timeframe) {
    case '1D':
      days = 1;
      interval = 1;
      break;
    case '1W':
      days = 7;
      interval = 4;
      break;
    case '1M':
      days = 30;
      interval = 12;
      break;
    case '3M':
      days = 90;
      interval = 24;
      break;
    case '1Y':
      days = 365;
      interval = 72;
      break;
    case 'ALL':
      days = 730;
      interval = 168;
      break;
    default:
      days = 30;
      interval = 12;
  }

  const points = Math.floor((days * 24) / interval);
  let value = 100000 + Math.random() * 20000;

  for (let i = points; i >= 0; i--) {
    const date = new Date(now.getTime() - i * interval * 60 * 60 * 1000);
    const timestamp = Math.floor(date.getTime() / 1000) as Time;
    
    // Random walk with slight upward bias
    const change = (Math.random() - 0.48) * (value * 0.02);
    value = Math.max(50000, value + change);

    data.push({
      time: timestamp,
      value: Math.round(value * 100) / 100,
    });
  }

  return data;
};

export const PortfolioChart: React.FC<PortfolioChartProps> = ({
  className,
  height = 300,
  timeframe = '1M',
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const [isPositive, setIsPositive] = useState(true);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Get CSS custom property values
    const computedStyle = getComputedStyle(document.documentElement);
    const primaryColor = computedStyle.getPropertyValue('--color-primary').trim() || '#10b981';
    const errorColor = computedStyle.getPropertyValue('--color-error').trim() || '#ef4444';
    const textMuted = computedStyle.getPropertyValue('--color-text-muted').trim() || '#6b7280';
    const borderColor = computedStyle.getPropertyValue('--color-border').trim() || '#374151';

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: textMuted,
      },
      grid: {
        vertLines: { color: borderColor, style: 1 },
        horzLines: { color: borderColor, style: 1 },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: textMuted,
          style: 2,
          labelBackgroundColor: primaryColor,
        },
        horzLine: {
          width: 1,
          color: textMuted,
          style: 2,
          labelBackgroundColor: primaryColor,
        },
      },
      rightPriceScale: {
        borderColor: borderColor,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: borderColor,
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: false,
        pressedMouseMove: false,
        horzTouchDrag: false,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: false,
        mouseWheel: false,
        pinch: false,
      },
    });

    chartRef.current = chart;

    // Generate data
    const data = generatePortfolioData(timeframe);
    
    // Determine if positive or negative trend
    const firstData = data[0];
    const lastData = data[data.length - 1];
    const firstValue = firstData && 'value' in firstData ? firstData.value : 0;
    const lastValue = lastData && 'value' in lastData ? lastData.value : 0;
    const positive = lastValue >= firstValue;
    setIsPositive(positive);

    const lineColor = positive ? primaryColor : errorColor;

    // Add area series using new API
    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: lineColor,
      topColor: positive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
      bottomColor: positive ? 'rgba(16, 185, 129, 0.0)' : 'rgba(239, 68, 68, 0.0)',
      lineWidth: 2,
      priceFormat: {
        type: 'custom',
        formatter: (price: number) => '$' + price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      },
    });

    areaSeries.setData(data);
    seriesRef.current = areaSeries;

    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [height, timeframe]);

  return (
    <div className={cn('relative', className)}>
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
};

export default PortfolioChart;
