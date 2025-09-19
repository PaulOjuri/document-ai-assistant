-- Add deadline notification functionality to todos table
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS deadline_notification_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS deadline_notification_hours_before INTEGER DEFAULT 24;

-- Create notifications table for tracking all app notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'todo_deadline', 'document_processed', etc.
    title TEXT NOT NULL,
    message TEXT,
    data JSONB, -- Additional data for the notification
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    read_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ -- Optional expiration for auto-cleanup
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON public.notifications(expires_at);

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notification policies
CREATE POLICY "Users can view own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON public.notifications
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
FOR DELETE USING (auth.uid() = user_id);

-- Function to create deadline notifications
CREATE OR REPLACE FUNCTION public.create_deadline_notification(
    p_user_id UUID,
    p_todo_id UUID,
    p_todo_title TEXT,
    p_due_date DATE,
    p_hours_before INTEGER DEFAULT 24
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
    notification_time TIMESTAMPTZ;
BEGIN
    -- Calculate when the notification should be created
    notification_time := p_due_date::TIMESTAMPTZ - (p_hours_before || ' hours')::INTERVAL;

    -- Only create notification if it's in the future
    IF notification_time > NOW() THEN
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            data
        ) VALUES (
            p_user_id,
            'todo_deadline',
            'Todo Deadline Reminder',
            'Your todo "' || p_todo_title || '" is due in ' || p_hours_before || ' hours',
            jsonb_build_object(
                'todo_id', p_todo_id,
                'due_date', p_due_date,
                'hours_before', p_hours_before
            )
        ) RETURNING id INTO notification_id;

        RETURN notification_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to check and create deadline notifications
CREATE OR REPLACE FUNCTION public.check_todo_deadlines()
RETURNS VOID AS $$
DECLARE
    todo_record RECORD;
    notification_time TIMESTAMPTZ;
BEGIN
    -- Find todos with approaching deadlines that haven't been notified
    FOR todo_record IN
        SELECT t.*, u.id as user_id
        FROM public.todos t
        JOIN public.users u ON t.user_id = u.id
        WHERE t.due_date IS NOT NULL
        AND t.status IN ('pending', 'in_progress')
        AND t.deadline_notification_sent = FALSE
    LOOP
        -- Calculate notification time
        notification_time := todo_record.due_date::TIMESTAMPTZ -
                           (COALESCE(todo_record.deadline_notification_hours_before, 24) || ' hours')::INTERVAL;

        -- If it's time to send the notification
        IF notification_time <= NOW() THEN
            -- Create the notification
            PERFORM public.create_deadline_notification(
                todo_record.user_id,
                todo_record.id,
                todo_record.title,
                todo_record.due_date,
                COALESCE(todo_record.deadline_notification_hours_before, 24)
            );

            -- Mark as notified
            UPDATE public.todos
            SET deadline_notification_sent = TRUE
            WHERE id = todo_record.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to reset notification flag when due date changes
CREATE OR REPLACE FUNCTION public.reset_deadline_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- If due_date changed, reset notification flag
    IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
        NEW.deadline_notification_sent = FALSE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for resetting notification flag
DROP TRIGGER IF EXISTS reset_deadline_notification_trigger ON public.todos;
CREATE TRIGGER reset_deadline_notification_trigger
    BEFORE UPDATE ON public.todos
    FOR EACH ROW
    EXECUTE FUNCTION public.reset_deadline_notification();

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION public.cleanup_expired_notifications()
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.notifications
    WHERE expires_at IS NOT NULL
    AND expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;