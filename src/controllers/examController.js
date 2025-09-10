import Exam from "../models/examModel.js";
import {
  checkAnswersWithAI,
  generateExamFromAI,
} from "../utils/openAiClient.js";

// 🔹 Generate Exam with AI
export const generateExam = async (req, res) => {
  try {
    const { subject, difficulty, counts } = req.body;
    const { uid } = req.user;

    if (!subject || !difficulty || !counts) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const questions = await generateExamFromAI(subject, difficulty, counts);
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(500).json({ error: "AI returned no valid questions" });
    }

    const exam = new Exam({
      title: `${subject} Exam`,
      subject,
      difficulty, // ✅ difficulty saved
      questions,
      createdBy: uid || null,
    });

    await exam.save();
    res.status(201).json({ exam });
  } catch (error) {
    console.error("❌ Exam generation failed:", error.message);
    res.status(500).json({ error: error.message || "Exam generation failed" });
  }
};

// POST /exams/:id/questions
export const addQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    const { questions } = req.body;
    const user = req.user;

    const exam = await Exam.findOneAndUpdate(
      { _id: id, createdBy: user.uid },
      { $push: { questions: { $each: questions } } },
      { new: true }
    );

    if (!exam) return res.status(404).json({ error: "Exam not found" });
    res.json({ exam });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add questions" });
  }
};

// 🔹 Get all exams
export const getExams = async (req, res) => {
  try {
    const { difficulty } = req.query;
    const filter = { createdBy: req.user.uid };
    if (difficulty && ["easy", "medium", "hard"].includes(difficulty)) {
      filter.difficulty = difficulty;
    }

    const exams = await Exam.find(filter);
    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch exams" });
  }
};

// 🔹 Get single exam
export const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    res.json(exam);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch exam" });
  }
};

// 🔹 Delete exam
export const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.uid,
    });
    if (!exam)
      return res
        .status(404)
        .json({ error: "Exam not found or not authorized" });
    res.json({ message: "Exam deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete exam" });
  }
};

// 🔹 Update exam (including difficulty)
export const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, questions, difficulty } = req.body;
    const user = req.user;

    const updates = {};
    if (title) updates.title = title;
    if (subject) updates.subject = subject;
    if (questions) updates.questions = questions;
    if (difficulty && ["easy", "medium", "hard"].includes(difficulty)) {
      updates.difficulty = difficulty;
    }

    const exam = await Exam.findOneAndUpdate(
      { _id: id, createdBy: user.uid },
      { $set: updates },
      { new: true }
    );

    if (!exam)
      return res
        .status(404)
        .json({ error: "Exam not found or not authorized" });
    res.json({ exam });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update exam" });
  }
};

export const submitExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body; // { questionId: userAnswer }

    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ error: "Answers are required" });
    }

    const exam = await Exam.findById(id);
    if (!exam) return res.status(404).json({ error: "Exam not found" });

    // 🔹 Compare answers
    const results = await checkAnswersWithAI(exam.questions, answers);

    // results = [{ questionId, correctAnswer, userAnswer, isCorrect, feedback }]
    const score = results.filter((r) => r.isCorrect).length;

    res.json({ score, total: exam.questions.length, results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to submit exam" });
  }
};
