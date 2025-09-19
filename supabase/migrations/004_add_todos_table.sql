-- Create custom types for todos
CREATE TYPE todo_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE todo_source AS ENUM ('manual', 'meeting_summary', 'document', 'note', 'auto_detected');

-- Create todos table
CREATE TABLE public.todos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status todo_status DEFAULT 'pending' NOT NULL,
    priority priority_type DEFAULT 'Medium' NOT NULL,
    due_date DATE,
    source todo_source DEFAULT 'manual' NOT NULL,
    source_id UUID, -- ID of the source document, note, or other entity
    source_type TEXT, -- Type of source (document, note, meeting, etc.)
    tags TEXT[] DEFAULT '{}',
    folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_todos_user_id ON public.todos(user_id);
CREATE INDEX idx_todos_folder_id ON public.todos(folder_id);
CREATE INDEX idx_todos_status ON public.todos(status);
CREATE INDEX idx_todos_priority ON public.todos(priority);
CREATE INDEX idx_todos_due_date ON public.todos(due_date);
CREATE INDEX idx_todos_source ON public.todos(source);
CREATE INDEX idx_todos_source_id ON public.todos(source_id);
CREATE INDEX idx_todos_tags ON public.todos USING GIN(tags);

-- Full-text search indexes
CREATE INDEX idx_todos_title_fts ON public.todos USING GIN(to_tsvector('english', title));
CREATE INDEX idx_todos_description_fts ON public.todos USING GIN(to_tsvector('english', description));

-- RLS (Row Level Security)
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Todos policies
CREATE POLICY "Users can view own todos" ON public.todos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own todos" ON public.todos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own todos" ON public.todos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own todos" ON public.todos FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Function to automatically set completed_at when status changes to completed
CREATE OR REPLACE FUNCTION public.handle_todo_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Set completed_at when status changes to completed
    IF NEW.status = 'completed' AND (OLD.status != 'completed' OR OLD.completed_at IS NULL) THEN
        NEW.completed_at = NOW();
    -- Clear completed_at when status changes from completed to something else
    ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
        NEW.completed_at = NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for todo completion
CREATE TRIGGER handle_todo_completion BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE PROCEDURE public.handle_todo_completion();