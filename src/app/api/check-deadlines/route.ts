import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user settings for notification preferences
    // Note: User settings are client-side only, using default values for server-side processing
    let deadlineAdvanceHours = 24; // Default: 24 hours before deadline

    // Find todos with approaching deadlines that haven't been notified
    const { data: todos, error: todosError } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['pending', 'in_progress'])
      .not('due_date', 'is', null)
      .eq('deadline_notification_sent', false);

    if (todosError) {
      console.error('Error fetching todos:', todosError);
      return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 });
    }

    const notificationsCreated = [];
    const currentTime = new Date();

    for (const todo of todos || []) {
      if (!todo.due_date) continue;

      const dueDate = new Date(todo.due_date);
      const notificationTime = new Date(dueDate.getTime() - (deadlineAdvanceHours * 60 * 60 * 1000));

      // If it's time to send the notification
      if (currentTime >= notificationTime) {
        const timeUntilDue = Math.ceil((dueDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60));
        let timeText = '';

        if (timeUntilDue <= 0) {
          timeText = 'is overdue';
        } else if (timeUntilDue < 24) {
          timeText = `is due in ${timeUntilDue} hour${timeUntilDue === 1 ? '' : 's'}`;
        } else {
          const days = Math.ceil(timeUntilDue / 24);
          timeText = `is due in ${days} day${days === 1 ? '' : 's'}`;
        }

        // Create notification
        const { data: notification, error: notificationError } = await supabase
          .from('notifications')
          .insert([
            {
              user_id: user.id,
              type: 'todo_deadline',
              title: 'Todo Deadline Reminder',
              message: `Your todo "${todo.title}" ${timeText}`,
              data: {
                todo_id: todo.id,
                due_date: todo.due_date,
                priority: todo.priority
              }
            }
          ])
          .select()
          .single();

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
          continue;
        }

        // Mark todo as notified
        await supabase
          .from('todos')
          .update({ deadline_notification_sent: true })
          .eq('id', todo.id);

        notificationsCreated.push(notification);
      }
    }

    return NextResponse.json({
      message: 'Deadline check completed',
      notificationsCreated: notificationsCreated.length,
      notifications: notificationsCreated
    });

  } catch (error) {
    console.error('Check deadlines error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}