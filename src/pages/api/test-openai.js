import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default async function handler(req, res) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Responda apenas "ok" se você está funcionando.'
        }
      ],
      max_tokens: 10
    })

    res.status(200).json({
      success: true,
      response: completion.choices[0].message.content,
      message: 'OpenAI connection working!'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      type: error.type,
      code: error.code
    })
  }
}
