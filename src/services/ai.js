import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export async function generateNews({
    event,
    location,
    involved,
    details
}) {
    const prompt = `
You are the Editor-in-Chief of the Gotham Gazette,
a fictional newspaper based in Gotham City.

Your job is to transform the information provided by
the user into a professional fictional newspaper article.

The article must feel like it was written by an actual
Gotham journalist.

RULES:

- Write everything in English.
- Do not use emojis.
- Do not use Markdown.
- Do not mention that you are an AI.
- Use professional journalistic language.
- Make the article immersive and believable.
- Do not contradict the information provided.
- You may add minor journalistic details to improve
  the writing, but do not invent major events,
  characters or facts that were not provided.
- Keep the tone appropriate for a fictional newspaper.
- Do not make the article excessively dramatic.
- The article should be approximately 500–700 words.

EVENT:
${event}

LOCATION:
${location}

PEOPLE INVOLVED:
${involved}

DETAILS:
${details}

Return ONLY valid JSON in exactly this format:

{
  "headline": "Main headline",
  "subtitle": "Article subtitle",
  "location": "Location",
  "category": "News category",
  "body": "Full newspaper article",
  "author": "Fictional journalist name"
}
`;

    const completion =
        await groq.chat.completions.create({
            model:
                'llama-3.3-70b-versatile',

            messages: [
                {
                    role: 'system',
                    content:
                        'You are a professional journalist working for the Gotham Gazette.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],

            temperature: 0.75,

            max_tokens: 1800
        });

    const content =
        completion.choices[0]
            ?.message
            ?.content
            ?.trim();

    if (!content) {
        throw new Error(
            'The AI returned an empty response.'
        );
    }

    let cleanContent = content;

    if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent
            .replace(/^```json/, '')
            .replace(/^```/, '')
            .replace(/```$/, '')
            .trim();
    }

    try {
        return JSON.parse(
            cleanContent
        );
    } catch {
        console.error(
            'Invalid AI response:'
        );

        console.error(content);

        throw new Error(
            'The AI returned invalid JSON.'
        );
    }
}
