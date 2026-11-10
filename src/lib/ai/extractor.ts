import { z } from 'zod';
import { ExtractedEntity, ExtractedRelation } from '../graph/types';
import { extractEntitiesAndRelationsHeuristically } from './heuristics';

// Zod Schema for structured LLM response validation
export const ExtractionResultSchema = z.object({
  entities: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string(),
      type: z.enum(['concept', 'service', 'database', 'person', 'api', 'note']),
      description: z.string(),
    })
  ),
  relationships: z.array(
    z.object({
      source: z.string(),
      target: z.string(),
      relation: z.enum([
        'depends_on',
        'communicates_with',
        'implements',
        'subconcept_of',
        'stores_in',
        'relates_to',
      ]),
      explanation: z.string(),
      weight: z.number().optional(),
    })
  ),
});

export type ExtractionResponse = z.infer<typeof ExtractionResultSchema>;

export async function extractKnowledgeGraph(
  title: string,
  content: string,
  existingNodes: string[] = []
): Promise<ExtractionResponse> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  if (geminiKey) {
    try {
      return await extractWithGemini(title, content, existingNodes, geminiKey);
    } catch (err) {
      console.warn('Gemini extraction failed, falling back to heuristics:', err);
    }
  }

  if (openAiKey) {
    try {
      return await extractWithOpenAI(title, content, existingNodes, openAiKey);
    } catch (err) {
      console.warn('OpenAI extraction failed, falling back to heuristics:', err);
    }
  }

  // Built-in intelligent heuristic extractor
  return extractEntitiesAndRelationsHeuristically(title, content, existingNodes);
}

async function extractWithGemini(
  title: string,
  content: string,
  existingNodes: string[],
  apiKey: string
): Promise<ExtractionResponse> {
  const prompt = buildPrompt(title, content, existingNodes);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.statusText}`);
  }

  const json = await res.json();
  const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Empty response from Gemini');

  const parsed = JSON.parse(rawText);
  return ExtractionResultSchema.parse(parsed);
}

async function extractWithOpenAI(
  title: string,
  content: string,
  existingNodes: string[],
  apiKey: string
): Promise<ExtractionResponse> {
  const prompt = buildPrompt(title, content, existingNodes);

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are an expert knowledge graph extraction engine. Extract key entities and semantic relationships in strict JSON format.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.statusText}`);
  }

  const json = await res.json();
  const rawContent = json.choices?.[0]?.message?.content;
  if (!rawContent) throw new Error('Empty response from OpenAI');

  const parsed = JSON.parse(rawContent);
  return ExtractionResultSchema.parse(parsed);
}

function buildPrompt(title: string, content: string, existingNodes: string[]): string {
  return `Analyze the following note content and extract named entities (concepts, services, databases, apis, people) and directed relationships.

Existing canvas nodes to link against if relevant: ${JSON.stringify(existingNodes)}

Note Title: ${title}
Note Content:
${content}

Return ONLY valid JSON matching this structure:
{
  "entities": [
    {
      "id": "unique-slug",
      "name": "Entity Name",
      "type": "concept" | "service" | "database" | "person" | "api" | "note",
      "description": "Short explanation"
    }
  ],
  "relationships": [
    {
      "source": "Source Name or Note Title",
      "target": "Target Name",
      "relation": "depends_on" | "communicates_with" | "implements" | "subconcept_of" | "stores_in" | "relates_to",
      "explanation": "Why they are connected"
    }
  ]
}`;
}
