import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    const { content, sourceId, sourceType } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Use OpenAI to extract todos from the content
    const prompt = `
Analyze the following text and extract actionable todo items. Focus on:
- Action items mentioned explicitly
- Follow-up tasks
- Deadlines and commitments
- Next steps
- Assigned responsibilities

For each todo item, provide:
- A clear, actionable title (max 100 characters)
- A brief description if context is available
- Priority level (High, Medium, Low) based on urgency/importance indicators
- Due date if mentioned (return as YYYY-MM-DD or null)

Return the result as a JSON array of objects with this structure:
{
  "title": "string",
  "description": "string",
  "priority": "High|Medium|Low",
  "due_date": "YYYY-MM-DD|null"
}

Text to analyze:
${content}

Important: Only return valid, actionable todos. Skip general statements or completed actions. Return an empty array if no todos are found.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting actionable todo items from meeting summaries, documents, and notes. Always return valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    let detectedTodos = [];
    try {
      const content = response.choices[0]?.message?.content;
      if (content) {
        detectedTodos = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Validate and clean up the detected todos
    const validTodos = detectedTodos.filter((todo: { title?: string; description?: string; priority?: string; due_date?: string }) =>
      todo.title &&
      typeof todo.title === 'string' &&
      todo.title.trim().length > 0 &&
      todo.title.length <= 100
    ).map((todo: { title: string; description?: string; priority?: string; due_date?: string }) => ({
      title: todo.title.trim(),
      description: todo.description?.trim() || null,
      priority: ['High', 'Medium', 'Low'].includes(todo.priority) ? todo.priority : 'Medium',
      due_date: todo.due_date && /^\d{4}-\d{2}-\d{2}$/.test(todo.due_date) ? todo.due_date : null,
      source: 'auto_detected',
      source_id: sourceId || null,
      source_type: sourceType || null,
    }));

    return NextResponse.json({
      todos: validTodos,
      count: validTodos.length
    });

  } catch (error) {
    console.error('Todo detection error:', error);
    return NextResponse.json(
      { error: 'Failed to detect todos' },
      { status: 500 }
    );
  }
}