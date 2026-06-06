import { prisma } from '@collabdoc/database';
import { withPermission } from '@/lib/permissions';

export const POST = withPermission('VIEWER', async (request, { params }) => {
  try {
    const { message, context, title: clientTitle } = await request.json();

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    const document = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    const title = clientTitle || document.title || 'Untitled Document';
    const isTitleQuery = message.toLowerCase().includes('title');

    let systemPrompt = `You are a writing assistant for the document: "${title}". 
Help the user improve their writing, suggest edits, summarize sections, answer questions about the content, or rewrite text.
Provide concise, helpful responses. If suggesting concrete text replacements, format them clearly.
Current document content:
"""
${context || '[Empty Document]'}
"""`;

    if (isTitleQuery) {
      systemPrompt = `You are a writing assistant for the document: "${title}". 
The user is specifically asking you to check, review, or suggest a title.
Focus strictly on reviewing and suggesting changes/improvements to the document title: "${title}". 
Analyze the title name for spelling, grammar, tone, clarity, and style.
Do not recommend edits to the canvas content itself, but use the provided canvas content as context to understand the theme and topic of the document.
Return your suggestions or recommended title(s) clearly. If suggesting a specific title, output it in a clear format so the user can easily copy or apply it.
Current document content for context:
"""
${context || '[Empty Document]'}
"""`;
    }

    // Fallback if ANTHROPIC_API_KEY is not defined
    if (!process.env.ANTHROPIC_API_KEY) {
      // Mock AI response for local development / testing
      let reply = '';
      const lowerMsg = message.toLowerCase();

      if (lowerMsg.includes('summarize')) {
        reply = `Here is a summary of "${title}":\n\n- The document is currently ${context ? context.split(/\s+/).length : 0} words long.\n- It discusses the main topic introduced in the text.\n- Key takeaway: Collaborate in real-time with your team.`;
      } else if (lowerMsg.includes('grammar') || lowerMsg.includes('spelling')) {
        reply = `I have reviewed the text of "${title}".\n\nNo grammar or spelling errors were detected. Your text looks clear and professional!`;
      } else if (lowerMsg.includes('concise')) {
        reply = `Here is a more concise version of your text:\n\n"${context ? context.substring(0, 200) + '...' : 'Collaborative editing made simple.'}"`;
      } else if (lowerMsg.includes('title')) {
        reply = `Here are some better title suggestions for "${title}":\n\n1. Collaborative Real-time Hub\n2. Real-time Document Platform\n3. Workspace: ${title}`;
      } else {
        reply = `Hello! I am your AI Assistant for "${title}".\n\nI received your query: "${message}".\n\nTo enable live Claude 3.5 Sonnet responses, please configure the ANTHROPIC_API_KEY environment variable.`;
      }

      return Response.json({ text: reply });
    }

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error response:', errorText);
      return Response.json(
        { error: 'Failed to communicate with AI provider' },
        { status: response.status },
      );
    }

    const result = await response.json();
    const replyText = result.content?.[0]?.text || 'No response generated.';

    return Response.json({ text: replyText });
  } catch (error) {
    console.error('AI route error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
