import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateExamFromAI = async (subject, difficulty, counts) => {
  const prompt = `
Generate an exam on the topic: "${subject}" at ${difficulty} level.
Include:
- ${counts.mcq} multiple-choice questions (with 4 options, 1 correct).
- ${counts.trueFalse} true/false questions.
- ${counts.short} short answer questions.
- ${counts.essay} essay questions.

Return **only** valid JSON array without markdown:
[
  {
    "type": "multiple-choice" | "true-false" | "short-answer" | "essay",
    "questionText": "...",
    "options": ["A","B","C","D"], // only for multiple-choice
    "correctAnswer": "A"
  }
]
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    let aiText = response.choices[0].message.content;

    // Remove markdown code blocks if AI added them
    aiText = aiText.replace(/```json|```/g, "").trim();

    return JSON.parse(aiText);
  } catch (err) {
    console.error("❌ Exam generation failed:", err.message);
    throw new Error("Failed to generate exam");
  }
};

export async function checkAnswersWithAI(questions, answers) {
  const results = [];

  for (let q of questions) {
    const userAnswer = (answers[q._id] || "").toString().trim();
    let isCorrect = false;
    let feedback = "";

    switch (q.type) {
      case "multiple-choice":
        // ✅ Compare letters (A/B/C/D)
        isCorrect = userAnswer.toUpperCase() === q.correctAnswer.toUpperCase();
        feedback = isCorrect
          ? "Correct!"
          : `Incorrect! Correct answer: ${q.correctAnswer}`;
        break;

      case "true-false":
        isCorrect = userAnswer.toLowerCase() === q.correctAnswer.toLowerCase();
        feedback = isCorrect
          ? "Correct!"
          : `Incorrect! Correct answer: ${q.correctAnswer}`;
        break;

      case "short-answer":
        // normalize numbers/strings
        isCorrect = userAnswer.toLowerCase() === q.correctAnswer.toLowerCase();
        feedback = isCorrect
          ? "Correct!"
          : `Incorrect! Correct answer: ${q.correctAnswer}`;
        break;

      case "essay":
        // Use AI to evaluate
        const prompt = `
Question: ${q.questionText}
Correct Answer: ${q.correctAnswer || "N/A"}
User Answer: ${userAnswer}
Evaluate the answer's correctness and provide feedback.
Respond in JSON: { "isCorrect": true/false, "feedback": "..." }
`;
        try {
          const response = await client.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [{ role: "user", content: prompt }],
          });
          const text = response.choices[0].message.content;
          const json = JSON.parse(text);
          isCorrect = json.isCorrect;
          feedback = json.feedback;
        } catch (err) {
          console.error("AI grading failed:", err);
          isCorrect = false;
          feedback = "Could not evaluate essay answer.";
        }
        break;
    }

    results.push({
      questionId: q._id,
      correctAnswer: q.correctAnswer,
      userAnswer,
      isCorrect,
      feedback,
    });
  }

  return results;
}
