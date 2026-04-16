const { GoogleGenAI } = require('@google/genai');

const initAI = () => {
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

const _generateContentFallback = async (prompt) => {
    try {
        const ai = initAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text;
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new Error('AI Generation Failed');
    }
}

const generateFirstQuestion = async (resumeText) => {
    const prompt = `You are a technical interviewer.

Candidate Resume:
${resumeText.substring(0, 5000)} // Limiting to avoid massive tokens

Task:
Ask ONE interview question based on the resume. 

Rules:
- Ask only one question
- Do not greet
- Do not explain
- Focus on a core skill from the resume`;

    return await _generateContentFallback(prompt);
};

const generateNextQuestion = async (resumeText, previousQA) => {
    // previousQA is an array of last 2-3 { question, answer }
    let qaHistoryString = previousQA.map((qa, index) => `Q${index + 1}: ${qa.question}\nA${index + 1}: ${qa.answer}`).join('\n\n');

    const prompt = `You are a technical interviewer.

Candidate Resume Summary (Context):
${resumeText.substring(0, 2000)}

Previous Q&A:
${qaHistoryString}

Task:
Ask the next interview question. It can be a follow-up to the last answer or a new topic based on the resume.

Rules:
- Ask only one question
- Do not greet
- Do not explain
- Do not repeat previous questions`;

    return await _generateContentFallback(prompt);
};

const generateFinalReport = async (fullQA) => {
    let qaHistoryString = fullQA.map((qa, index) => `Q${index + 1}: ${qa.question}\nA${index + 1}: ${qa.answer}`).join('\n\n');

    const prompt = `You are an expert technical interviewer evaluating a candidate based on the following interview transcript.

Interview Data:
${qaHistoryString}

Evaluate the candidate based on:
- Technical knowledge
- Communication
- Confidence

You must return ONLY a JSON response in the exact following format, without any markdown formatting or \`\`\`json block:
{
  "score": (a number out of 10),
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "suggestions": ["...", "..."]
}`;

    const textResult = await _generateContentFallback(prompt);
    
    // Parse JSON
    try {
        // Strip markdown backticks if AI accidentally includes them
        const cleanedText = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedText);
    } catch (e) {
        console.error('Failed to parse AI JSON report', textResult);
        return {
            score: 0,
            strengths: ["Evaluation parsing failed"],
            weaknesses: [""],
            suggestions: [""]
        };
    }
};

module.exports = {
    generateFirstQuestion,
    generateNextQuestion,
    generateFinalReport
};
