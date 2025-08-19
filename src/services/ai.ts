export class AIImageError extends Error {
  status: number
  statusText: string
  body: string
  constructor(message: string, status: number, statusText: string, body: string) {
    super(message)
    this.name = 'AIImageError'
    this.status = status
    this.statusText = statusText
    this.body = body
  }
}

export class AIService {
  private apiKey: string
  private model: string
  private temperature: number

  constructor(apiKey: string, model: string = 'gpt-4o-mini', temperature: number = 0.3) {
    this.apiKey = apiKey
    this.model = model
    this.temperature = temperature
  }

  async transformFile(instruction: string, currentContent: string): Promise<string> {
    const systemPrompt = `You rewrite the whole file based on the instruction. Return ONLY the full updated file with no explanations. Support Chinese text properly and preserve Chinese characters, formatting, and encoding.`
    
    const userPrompt = `Instruction: ${instruction}

Current file content:
---START FILE---
${currentContent}
---END FILE---

Note: If working with Chinese text, preserve proper character encoding and formatting. Handle both Traditional Chinese (繁體中文) and Simplified Chinese (简体中文) correctly.`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          ...(this.model === 'gpt-5' ? {
            max_completion_tokens: 4000,
            // GPT-5 only supports default temperature (1.0)
          } : {
            temperature: this.temperature,
            max_tokens: 4000,
          }),
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from AI')
      }

      let content = data.choices[0].message.content.trim()
      
      // Clean up common AI response artifacts
      if (content.startsWith('---START FILE---')) {
        content = content.replace(/^---START FILE---\s*/, '')
      }
      if (content.endsWith('---END FILE---')) {
        content = content.replace(/\s*---END FILE---$/, '')
      }
      
      return content
    } catch (error) {
      throw new Error(`Failed to transform file: ${error}`)
    }
  }

  async estimateTokens(text: string): Promise<number> {
    return Math.ceil(text.length / 4)
  }

  async generateImage(prompt: string, size: '256x256' | '512x512' | '1024x1024' = '1024x1024'): Promise<string> {
    if (!prompt.trim()) throw new Error('Image prompt is empty')
    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt,
          size,
          n: 1,
          response_format: 'b64_json'
        })
      })
      const text = await response.text()
      if (!response.ok) {
        // Try to extract error details from JSON if present
        let msg = text
        try {
          const err = JSON.parse(text)
          msg = err?.error?.message || err?.message || text
        } catch {}
        throw new AIImageError(
          `OpenAI Image API error: ${response.status} ${response.statusText} - ${msg}`,
          response.status,
          response.statusText,
          text
        )
      }
      const data = JSON.parse(text)
      const b64 = data?.data?.[0]?.b64_json
      if (!b64) throw new Error('No image returned from AI')
      return b64
    } catch (e) {
      throw new Error(`Failed to generate image: ${e}`)
    }
  }
}
