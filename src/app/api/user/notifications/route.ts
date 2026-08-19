import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User } from '@/db/models';

// GET - Fetch user notifications
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const user = await User.findById(userId).select('notifications').lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const notifications = (user.notifications || []).map((n: any, index: number) => ({
      id: `${userId}-${index}`,
      ...n,
    }));

    const unreadCount = notifications.filter((n: any) => !n.read).length;

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Notifications error:', (error as Error).message);
    // Graceful degradation
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}

// PATCH - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { markAll, notificationIndex } = body;

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (markAll) {
      // Mark all as read
      if (user.notifications) {
        user.notifications = user.notifications.map((n: any) => ({
          ...n,
          read: true,
        }));
      }
    } else if (notificationIndex !== undefined && user.notifications?.[notificationIndex]) {
      // Mark specific notification as read
      user.notifications[notificationIndex].read = true;
    }

    await user.save();

    return NextResponse.json({ message: 'Notifications updated' });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Clear all notifications
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);
    await User.findByIdAndUpdate(userId, { $set: { notifications: [] } });

    return NextResponse.json({ message: 'Notifications cleared' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
