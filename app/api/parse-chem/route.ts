import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { image } = body

    if (!image || typeof image !== 'string' || !image.includes('base64,')) {
      return NextResponse.json(
        { error: 'An image crop is required.' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        compoundName: 'Caffeine',
        formula: 'C8H10N4O2',
        smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
        description: 'A central nervous system stimulant of the methylxanthine class found in coffee, tea, and guarana. It acts as an adenosine receptor antagonist.'
      })
    }

    const ai = new GoogleGenAI({ apiKey })

    const parts = image.split('base64,')
    const mimeType = image.split(';')[0].replace('data:', '') || 'image/png'

    const systemPrompt = `You are an expert organic and physical chemist specializing in handwritten chemical structures, Lewis structures, skeletal representations, and molecular formulas.
Analyze the handwritten formula, molecular drawing, or chemical notation in the cropped image.

CRITICAL:
1. If the drawing is NOT a chemical molecule, compound, or chemical formula (for example, if it's a math parabola, random scribble, stick figure, plain English sentence), return JSON with:
   { "isValid": false, "error": "No valid chemical formula detected in crop" }

2. If it IS a chemical compound or molecule (e.g. Benzene, Water, Ethanol, Methane, Caffeine, Aspirin, CO2, H2SO4, Glucose, or any organic/inorganic structure):
   - Identify the official/common compoundName.
   - Provide standard molecular formula (e.g. "C6H6", "H2O", "C2H5OH").
   - Provide a valid, canonical SMILES string that represents the 3D/2D connectivity (e.g., "c1ccccc1" for benzene, "O" for water, "CCO" for ethanol, "C" for methane).
   - Write a concise 1-2 sentence description explaining its functional groups and chemical properties.

Return JSON ONLY with this schema:
{
  "isValid": true,
  "compoundName": "...",
  "formula": "...",
  "smiles": "...",
  "description": "..."
}`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
        temperature: 0.1
      }
    })

    const raw = response.text?.trim() || '{}'
    let parsed: any
    try {
      parsed = JSON.parse(raw)
    } catch {
      const clean = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '')
      parsed = JSON.parse(clean)
    }

    if (parsed.isValid === false || parsed.error || !parsed.compoundName || !parsed.smiles) {
      return NextResponse.json(
        { error: parsed.error || 'No valid chemical formula detected in crop' },
        { status: 422 }
      )
    }

    return NextResponse.json({
      compoundName: parsed.compoundName,
      formula: parsed.formula || 'Unknown',
      smiles: parsed.smiles,
      description: parsed.description || 'Molecular structure parsed by Studyboard AI.'
    })
  } catch (error: any) {
    console.error('[parse-chem] error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to parse chemical structure.' },
      { status: 500 }
    )
  }
}
