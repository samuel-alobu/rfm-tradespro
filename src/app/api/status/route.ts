import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/db/connection';
import { SiteSettings } from '@/db/models';

// ============================================
// Public Status API - Check maintenance mode
// ============================================

export async function GET() {
  try {
    await connectToDatabase();

    const settings = await SiteSettings.findOne().select('maintenanceMode maintenanceMessage').lean();
    
    return NextResponse.json({
      success: true,
      maintenance: settings?.maintenanceMode || false,
      message: settings?.maintenanceMessage || 'We are currently performing scheduled maintenance.',
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({
      success: true,
      maintenance: false,
      message: '',
    });
  }
}
