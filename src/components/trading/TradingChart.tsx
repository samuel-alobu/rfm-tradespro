'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  HistogramSeries,
  Time,
  CandlestickData,
  WhitespaceData,
  HistogramData,
} from 'lightweight-charts';
import { cn } from '@/utils';

// ============================================
// Trading Chart Component
// ============================================

interface TradingChartProps {
  symbol?: string;
  interval?: '1m' | '5m' | '15m' | '1h' | '4h' | '1D' | '1W';
  height?: number;
  className?: string;
}

type CandleDataPoint = CandlestickData<Time> | WhitespaceData<Time>;
type VolumeDataPoint = HistogramData<Time> | WhitespaceData<Time>;

// Generate mock OHLCV data
const generateCandlestickData = (
  interval: string,
  count: number = 200
): { candles: CandleDataPoint[]; volumes: VolumeDataPoint[] } => {
  const candles: CandleDataPoint[] = [];
  const volumes: VolumeDataPoint[] = [];
  const now = new Date();
  
  let intervalMs: number;
  switch (interval) {
    case '1m': intervalMs = 60 * 1000; break;
    case '5m': intervalMs = 5 * 60 * 1000; break;
    case '15m': intervalMs = 15 * 60 * 1000; break;
    case '1h': intervalMs = 60 * 60 * 1000; break;
    case '4h': intervalMs = 4 * 60 * 60 * 1000; break;
    case '1D': intervalMs = 24 * 60 * 60 * 1000; break;
    case '1W': intervalMs = 7 * 24 * 60 * 60 * 1000; break;
    default: intervalMs = 60 * 60 * 1000;
  }

  let price = 86000 + Math.random() * 2000;
  
  for (let i = count; i >= 0; i--) {
    const time = Math.floor((now.getTime() - i * intervalMs) / 1000) as Time;
    
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * volatility * price;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * price * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * price * 0.5;
    
    candles.push({
      time,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
    });

    const volume = 100 + Math.random() * 500;
    volumes.push({
      time,
      value: volume,
      color: close >= open ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)',
    });

    price = close;
  }

  return { candles, volumes };
};

export const TradingChart: React.FC<TradingChartProps> = ({
  symbol = 'BTC/USD',
  interval = '1h',
  height = 500,
  className,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const textMuted = '#6b7280';
    const borderColor = '#374151';

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
          labelBackgroundColor: '#10b981',
        },
        horzLine: {
          width: 1,
          color: textMuted,
          style: 2,
          labelBackgroundColor: '#10b981',
        },
      },
      rightPriceScale: {
        borderColor: borderColor,
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: borderColor,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });
    candleSeriesRef.current = candleSeries;

    // Add volume series (histogram)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
    });
    
    // Configure volume scale
    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    
    volumeSeriesRef.current = volumeSeries;

    // Generate and set data
    const { candles, volumes } = generateCandlestickData(interval);
    candleSeries.setData(candles);
    volumeSeries.setData(volumes);

    // Get current price info
    const lastCandle = candles[candles.length - 1];
    const firstCandle = candles[0];
    if (lastCandle && 'close' in lastCandle && firstCandle && 'close' in firstCandle) {
      setCurrentPrice(lastCandle.close);
      const change = ((lastCandle.close - firstCandle.close) / firstCandle.close) * 100;
      setPriceChange(change);
    }

    chart.timeScale().fitContent();

    // Subscribe to crosshair move for price display
    chart.subscribeCrosshairMove((param) => {
      if (param.time) {
        const data = param.seriesData.get(candleSeries);
        if (data && 'close' in data) {
          setCurrentPrice(data.close);
        }
      }
    });

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
  }, [height, interval]);

  return (
    <div className={cn('relative', className)}>
      {/* Price Header */}
      <div className="absolute top-2 left-2 z-10 bg-[var(--color-surface)]/80 backdrop-blur-sm rounded-lg px-3 py-2">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-[var(--color-text-primary)]">
            {symbol}
          </span>
          <span className="text-xl font-bold text-[var(--color-text-primary)]">
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={cn(
            'text-sm font-medium',
            priceChange >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
          )}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
          </span>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
};

export default TradingChart;
