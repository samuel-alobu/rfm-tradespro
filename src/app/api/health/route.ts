import { NextResponse } from 'next/server';
import { connectToDatabase, isConnected } from '@/db/connection';

// ============================================
// Health Check API Endpoint
// ============================================

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: 'connected' | 'disconnected' | 'error';
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

export async function GET(): Promise<NextResponse<HealthStatus>> {
  // Database check
  let dbStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
  try {
    await connectToDatabase();
    dbStatus = isConnected() ? 'connected' : 'disconnected';
  } catch {
    dbStatus = 'error';
  }
  
  // Memory check
  const memoryUsage = process.memoryUsage();
  const totalMemory = memoryUsage.heapTotal;
  const usedMemory = memoryUsage.heapUsed;
  const memoryPercentage = (usedMemory / totalMemory) * 100;
  
  // Determine overall status
  let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
  if (dbStatus === 'error') {
    status = 'unhealthy';
  } else if (dbStatus === 'disconnected' || memoryPercentage > 90) {
    status = 'degraded';
  }
  
  const healthStatus: HealthStatus = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    checks: {
      database: dbStatus,
      memory: {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round(memoryPercentage),
      },
    },
  };
  
  const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
  
  return NextResponse.json(healthStatus, { status: httpStatus });
}
