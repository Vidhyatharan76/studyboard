import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-flash-latest']

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const image = typeof body.image === 'string' ? body.image : ''

    if (!image || !image.includes('base64,')) {
      return NextResponse.json({ error: 'A valid image crop is required.' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        parsedEquation: 'General Canvas Content / Topic',
        contentType: 'general_knowledge',
        steps: [
          'Preview mode: Configure your GEMINI_API_KEY in Settings to enable live general-purpose AI whiteboard assistance.',
          'Understands people, concepts, notes, questions, diagrams, and ideas.',
          'Provides rich context, key insights, answers, and actionable takeaways.'
        ],
        coreConcept: 'Versatile general-purpose AI assistant for everything on your whiteboard.'
      })
    }

    const ai = new GoogleGenAI({ apiKey })
    const parts = image.split('base64,')
    const mimeType = image.split(';')[0].replace('data:', '') || 'image/png'

    const systemPrompt = `You are a versatile, highly intelligent general-purpose AI Whiteboard Assistant.
Analyze the handwritten or drawn content, text, notes, diagrams, wireframes, formulas, or questions in the cropped canvas image.
The user may write or draw anything:
- Celebrities, public figures, historical figures, or people (for example 'Amita bachan' refers to Amitabh Bachchan, legendary Indian cinema icon): Identify who they are, their significance, background, major achievements, cultural impact, or notable works.
- General topics, concepts, terms, or trivia across all domains: Provide rich, informative, engaging explanations with key facts, history, or context.
- Brainstorming, lists, plans, meeting notes, or ideas: Organize, enrich, structure, provide constructive feedback, and outline actionable next steps.
- Questions, queries, or prompts: Answer comprehensively, directly, and thoroughly.
- Technical diagrams, wireframes, flowcharts, or system designs: Describe the architecture, flow, components, and provide insightful analysis.
- Math equations, science formulas, or logical problems: Solve step-by-step with clear derivation and explain the underlying principles.
- Code or algorithms: Explain functionality, point out improvements or bugs, and provide clean suggestions.

CRITICAL INSTRUCTIONS:
1. NEVER do an OCR character-by-character or spelling breakdown (e.g. NEVER output 'The first word is identified as... with capital A...'). Instead, understand the semantic meaning, entity, question, or concept.
2. If the user writes a name or phrase with casual spelling, phonetics, or minor typos (e.g. 'Amita bachan'), identify the true subject ('Amitabh Bachchan') and provide rich, useful real-world knowledge about that subject.
3. Provide 3 to 5 substantive, insightful points (or derivation steps if a problem).
4. Provide a clear, meaningful takeaway or summary.

Return JSON ONLY with this exact schema:
{
  "parsedEquation": "<Accurate name, title, question, or expression, e.g. 'Amitabh Bachchan (Legendary Indian Film Actor)' or 'Quadratic Formula Derivation'>",
  "contentType": "<'entity' | 'general_knowledge' | 'question' | 'brainstorm' | 'problem' | 'diagram' | 'code'>",
  "steps": [
    "<Substantive point / detail / fact / step 1>",
    "<Substantive point / detail / fact / step 2>",
    "<Substantive point / detail / fact / step 3>",
    "<Substantive point / detail / fact / step 4 (optional)>"
  ],
  "coreConcept": "<1-2 sentence core takeaway, cultural/practical significance, or summary>"
}`

    let response: any = null
    let lastError: any = null

    for (let i = 0; i < CANDIDATE_MODELS.length; i++) {
      const modelName = CANDIDATE_MODELS[i]
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              inlineData: {
                mimeType,
                data: parts[1]
              }
            },
            { text: systemPrompt }
          ],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        })

        if (response?.text) {
          break
        }
      } catch (err: any) {
        lastError = err
        const errMsg = String(err?.message || err || '')
        const isTransient = errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('high demand') ||
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('overloaded')

        if (isTransient && i < CANDIDATE_MODELS.length - 1) {
          await new Promise(r => setTimeout(r, 500 * (i + 1)))
          continue
        }
      }
    }

    if (!response && lastError) {
      throw lastError
    }

    const raw = response?.text?.trim() || '{}'
    let parsed: any
    try {
      parsed = JSON.parse(raw)
    } catch {
      const clean = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '')
      parsed = JSON.parse(clean)
    }

    if (!parsed.parsedEquation || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
      return NextResponse.json({
        parsedEquation: 'Canvas Selection',
        contentType: 'general_knowledge',
        steps: ['Selection analyzed by AI Assistant.', 'Explore concepts, key insights, and relevant details.'],
        coreConcept: 'General insights and explanation generated by AI Assistant.'
      })
    }

    return NextResponse.json({
      parsedEquation: parsed.parsedEquation,
      contentType: parsed.contentType || 'general_knowledge',
      steps: parsed.steps,
      coreConcept: parsed.coreConcept || 'Key takeaway and summary generated by AI Assistant.'
    })
  } catch (error: any) {
    console.error('[AI Assistant] error:', error)
    const rawMsg = String(error?.message || '')
    const isTransient = rawMsg.includes('503') || rawMsg.includes('high demand') || rawMsg.includes('UNAVAILABLE')
    const userMessage = isTransient
      ? 'The AI model is temporarily experiencing high demand. Please tap "Try Again" to retry.'
      : (error?.message || 'Unable to analyze selection.')
    return NextResponse.json({ error: userMessage, isRetryable: isTransient }, { status: isTransient ? 503 : 500 })
  }
}
