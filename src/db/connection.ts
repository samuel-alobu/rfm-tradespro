import mongoose from 'mongoose';

// ============================================
// MongoDB Connection Configuration
// Optimized for Next.js serverless environment
// ============================================

const isServer = typeof window === 'undefined';

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global cache to maintain connection across hot reloads
 * and serverless function invocations
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  isConnecting: boolean;
  handlersSet: boolean;
}

const globalWithMongoose = globalThis as typeof globalThis & {
  mongoose?: MongooseCache;
};

// Initialize cache
if (isServer && !globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = { 
    conn: null, 
    promise: null,
    isConnecting: false,
    handlersSet: false,
  };
}

const cached: MongooseCache = globalWithMongoose.mongoose || { 
  conn: null, 
  promise: null,
  isConnecting: false,
  handlersSet: false,
};

/**
 * Connect to MongoDB with optimized settings
 * Uses singleton pattern to reuse connections
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  if (!isServer) {
    throw new Error('connectToDatabase can only be called on the server');
  }

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  // Return existing connection if healthy
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If already connecting, wait for existing promise
  if (cached.promise && cached.isConnecting) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (error) {
      // Connection failed, will retry below
      cached.promise = null;
      cached.isConnecting = false;
    }
  }

  // Clear stale connection
  if (cached.conn && mongoose.connection.readyState !== 1) {
    cached.conn = null;
    cached.promise = null;
    cached.isConnecting = false;
  }

  // Create new connection
  if (!cached.promise) {
    cached.isConnecting = true;

    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      // Smaller pool for serverless - prevents connection exhaustion
      maxPoolSize: 3,
      minPoolSize: 1,
      // Shorter timeouts for faster failure detection
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 30000, // 30 seconds
      connectTimeoutMS: 10000, // 10 seconds
      // Keep alive
      heartbeatFrequencyMS: 30000,
      // Retry on transient errors
      retryWrites: true,
      retryReads: true,
      // Wait queue timeout
      waitQueueTimeoutMS: 10000,
    };

    console.log('🔌 Connecting to MongoDB...');
    
    cached.promise = mongoose.connect(MONGODB_URI!, opts)
      .then((mongooseInstance) => {
        console.log('✅ MongoDB connected');
        cached.isConnecting = false;
        
        // Set up event handlers only once
        if (!cached.handlersSet) {
          mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB error:', err.message);
            cached.conn = null;
            cached.promise = null;
            cached.isConnecting = false;
          });

          mongoose.connection.on('disconnected', () => {
            console.log('🔌 MongoDB disconnected');
            cached.conn = null;
            cached.promise = null;
            cached.isConnecting = false;
          });
          
          cached.handlersSet = true;
        }

        return mongooseInstance;
      })
      .catch((error) => {
        cached.promise = null;
        cached.isConnecting = false;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    cached.isConnecting = false;
    console.error('❌ MongoDB connection failed:', (error as Error).message);
    throw error;
  }

  return cached.conn;
}

/**
 * Check if connected to MongoDB
 */
export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Get connection state
 */
export function getConnectionState(): string {
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'unknown';
}

export { mongoose };
