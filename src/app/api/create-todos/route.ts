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

    const { todos } = await request.json();

    if (!Array.isArray(todos) || todos.length === 0) {
      return NextResponse.json({ error: 'Invalid todos array' }, { status: 400 });
    }

    // Validate each todo
    const validTodos = todos.filter(todo =>
      todo.title &&
      typeof todo.title === 'string' &&
      todo.title.trim().length > 0
    ).map(todo => ({
      title: todo.title.trim(),
      description: todo.description?.trim() || null,
      priority: ['High', 'Medium', 'Low'].includes(todo.priority) ? todo.priority : 'Medium',
      due_date: todo.due_date || null,
      source: todo.source || 'auto_detected',
      source_id: todo.source_id || null,
      source_type: todo.source_type || null,
      user_id: user.id,
    }));

    if (validTodos.length === 0) {
      return NextResponse.json({ error: 'No valid todos to create' }, { status: 400 });
    }

    // Insert todos into database
    const { data: createdTodos, error } = await supabase
      .from('todos')
      .insert(validTodos)
      .select();

    if (error) {
      console.error('Database error creating todos:', error);
      return NextResponse.json(
        { error: 'Failed to create todos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Todos created successfully',
      todos: createdTodos,
      count: createdTodos.length
    });

  } catch (error) {
    console.error('Create todos error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}