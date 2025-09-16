import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ClaudeResponse {
  content: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class SAFeAgent {
  private systemPrompt = `
You are an expert AI assistant specialized in SAFe (Scaled Agile Framework) and Agile methodologies, designed to help Product Owners excel in their role. You have deep knowledge of:

SAFe Framework:
- All roles, events, artifacts, and practices
- Program Increment (PI) Planning and execution
- Value stream management and flow
- Lean portfolio management
- Continuous delivery pipeline

Agile Practices:
- Scrum, Kanban, and Lean methodologies
- User story writing and management
- Backlog prioritization techniques (WSJF, MoSCoW, Kano model)
- Estimation and planning (Planning Poker, Story Points, T-shirt sizing)
- Team dynamics and coaching

Product Owner Responsibilities:
- Stakeholder management and communication
- Requirements gathering and analysis
- Acceptance criteria definition using INVEST criteria
- Release planning and coordination
- Value delivery optimization

When analyzing user documents, notes, or audio transcriptions, provide insights that help with:
1. Improving user story quality and clarity
2. Identifying dependencies and risks
3. Suggesting prioritization approaches
4. Recommending SAFe practices and ceremonies
5. Coaching on product owner best practices

Always provide specific, actionable advice with references to SAFe practices when relevant.
Be concise but thorough in your responses.
`;

  async chat(message: string, context?: string[]): Promise<ClaudeResponse> {
    try {
      const contextString = context?.length
        ? `\n\nContext from documents:\n${context.join('\n\n')}`
        : '';

      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        system: this.systemPrompt,
        messages: [{
          role: 'user',
          content: message + contextString
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return {
          content: content.text,
          usage: {
            input_tokens: response.usage.input_tokens,
            output_tokens: response.usage.output_tokens
          }
        };
      }

      throw new Error('Unexpected response type from Claude');
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error('Failed to get response from Claude AI');
    }
  }

  async analyzeDocument(content: string, documentType: string): Promise<ClaudeResponse> {
    const prompt = `
Analyze this ${documentType} document and provide SAFe/Agile insights:

${content}

Please provide:
1. Document quality assessment
2. Suggestions for improvement
3. Relevant SAFe practices or artifacts
4. Potential risks or dependencies
5. Next steps or actions
`;

    return this.chat(prompt);
  }

  async suggestBacklogImprovements(backlogItems: any[]): Promise<ClaudeResponse> {
    const itemsText = backlogItems.map(item => `
Title: ${item.title}
Type: ${item.artifactType || 'Unknown'}
Priority: ${item.priority || 'Not set'}
Content: ${item.content}
`).join('\n---\n');

    const prompt = `
Review these backlog items and suggest improvements based on SAFe and Agile best practices:

${itemsText}

Please analyze:
1. Story quality (INVEST criteria)
2. Prioritization approach (suggest WSJF if applicable)
3. Missing acceptance criteria
4. Dependencies between items
5. Recommended refinement actions
`;

    return this.chat(prompt);
  }

  async generateAcceptanceCriteria(userStory: string): Promise<ClaudeResponse> {
    const prompt = `
Generate comprehensive acceptance criteria for this user story:

${userStory}

Please provide:
1. Given-When-Then scenarios
2. Definition of Done criteria
3. Edge cases to consider
4. Testing considerations
5. Non-functional requirements if applicable

Format the response clearly with bullet points or numbered lists.
`;

    return this.chat(prompt);
  }

  async analyzeMeetingTranscript(transcript: string, meetingType: string): Promise<ClaudeResponse> {
    const prompt = `
Analyze this ${meetingType} meeting transcript and extract key insights:

${transcript}

Please identify:
1. Key decisions made
2. Action items and owners
3. Risks or impediments discussed
4. Follow-up meetings or ceremonies needed
5. SAFe artifacts that should be updated
6. Summary of outcomes
`;

    return this.chat(prompt);
  }
}

export const safeAgent = new SAFeAgent();