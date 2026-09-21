const Course = require('../../models/Course');
const Quiz = require('../../models/Quiz');
const Question = require('../../models/Question');
const QuizAttempt = require('../../models/QuizAttempt');
const User = require('../../models/User');
const { isValidId, invalidIdResponse } = require('../../utils/ids');
const { sendHttpError } = require('../../utils/httpError');
const { getPagination, paginationMeta } = require('../../utils/pagination');
const {
  validateQuizSettings,
  pickQuizSettings,
  validateQuestionPayload,
  pickQuestionFields,
  toAdminQuestion,
  toAdminQuiz,
} = require('../../utils/quizValidation');
const {
  toAdminAttempt,
  toUserQuizAttemptsAdmin,
  resultsFromAttempt,
} = require('../../utils/quizScoring');

const loadCourseOr404 = async (res, courseId) => {
  if (!isValidId(courseId)) {
    invalidIdResponse(res, 'course ID');
    return null;
  }

  const course = await Course.findById(courseId);

  if (!course) {
    res.status(404).json({
      success: false,
      code: 'NOT_FOUND',
      message: 'Course not found',
    });
    return null;
  }

  return course;
};

const loadQuizOr404 = async (res, quizId) => {
  if (!isValidId(quizId)) {
    invalidIdResponse(res, 'quiz ID');
    return null;
  }

  const quiz = await Quiz.findById(quizId);

  if (!quiz) {
    res.status(404).json({
      success: false,
      code: 'NOT_FOUND',
      message: 'Quiz not found',
    });
    return null;
  }

  return quiz;
};

const listQuestions = (quizId) => Question.find({ quizId }).sort({ order: 1, createdAt: 1 });

const syncQuizAvailable = async (courseId, quiz) => {
  await Course.updateOne(
    { _id: courseId },
    { quizAvailable: Boolean(quiz && quiz.isPublished && quiz.isEnabled) }
  );
};

const getQuiz = async (req, res) => {
  try {
    const course = await loadCourseOr404(res, req.params.courseId);

    if (!course) {
      return;
    }

    const quiz = await Quiz.findOne({ courseId: course._id });

    if (!quiz) {
      return res.json({
        success: true,
        message: 'Quiz fetched',
        quiz: null,
        questions: [],
      });
    }

    const questions = await listQuestions(quiz._id);

    res.json({
      success: true,
      message: 'Quiz fetched',
      quiz: toAdminQuiz(quiz, questions),
      questions: questions.map(toAdminQuestion),
    });
  } catch (error) {
    sendHttpError(res, error, 'Server error while fetching quiz');
  }
};

const upsertQuiz = async (req, res) => {
  try {
    const course = await loadCourseOr404(res, req.params.courseId);

    if (!course) {
      return;
    }

    const existing = await Quiz.findOne({ courseId: course._id });
    const isCreate = !existing;
    const validationError = validateQuizSettings(req.body || {}, { isCreate });

    if (validationError) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION',
        message: validationError,
      });
    }

    const payload = pickQuizSettings(req.body || {}, existing);
    let quiz;

    if (isCreate) {
      quiz = await Quiz.create({
        courseId: course._id,
        ...payload,
      });
    } else {
      Object.assign(existing, payload);
      quiz = await existing.save();
    }

    await syncQuizAvailable(course._id, quiz);
    const questions = await listQuestions(quiz._id);

    res.json({
      success: true,
      message: isCreate ? 'Quiz created' : 'Quiz updated',
      quiz: toAdminQuiz(quiz, questions),
    });
  } catch (error) {
    sendHttpError(res, error, 'Server error while saving quiz');
  }
};

const createQuestion = async (req, res) => {
  try {
    const quiz = await loadQuizOr404(res, req.params.quizId);

    if (!quiz) {
      return;
    }

    const validationError = validateQuestionPayload(req.body || {}, { isCreate: true });

    if (validationError) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION',
        message: validationError,
      });
    }

    const payload = pickQuestionFields(req.body || {});
    const last = await Question.findOne({ quizId: quiz._id }).sort({ order: -1 }).select('order');

    if (req.body.order === undefined) {
      payload.order = last ? last.order + 1 : 0;
    }

    const question = await Question.create({
      quizId: quiz._id,
      ...payload,
    });

    res.status(201).json({
      success: true,
      message: 'Question created',
      question: toAdminQuestion(question),
    });
  } catch (error) {
    sendHttpError(res, error, 'Server error while creating question');
  }
};

const updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    if (!isValidId(questionId)) {
      return invalidIdResponse(res, 'question ID');
    }

    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Question not found',
      });
    }

    const merged = {
      question: req.body.question === undefined ? question.question : req.body.question,
      imageUrl: req.body.imageUrl === undefined ? question.imageUrl : req.body.imageUrl,
      questionType:
        req.body.questionType === undefined ? question.questionType : req.body.questionType,
      options: req.body.options === undefined ? question.options : req.body.options,
      correctAnswer:
        req.body.correctAnswer === undefined ? question.correctAnswer : req.body.correctAnswer,
      explanation:
        req.body.explanation === undefined ? question.explanation : req.body.explanation,
      marks: req.body.marks === undefined ? question.marks : req.body.marks,
      order: req.body.order === undefined ? question.order : req.body.order,
      isPublished:
        req.body.isPublished === undefined ? question.isPublished : req.body.isPublished,
    };

    const validationError = validateQuestionPayload(merged, { isCreate: true });

    if (validationError) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION',
        message: validationError,
      });
    }

    Object.assign(question, pickQuestionFields(req.body || {}, question));
    await question.save();

    res.json({
      success: true,
      message: 'Question updated',
      question: toAdminQuestion(question),
    });
  } catch (error) {
    sendHttpError(res, error, 'Server error while updating question');
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    if (!isValidId(questionId)) {
      return invalidIdResponse(res, 'question ID');
    }

    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Question not found',
      });
    }

    await Question.deleteOne({ _id: questionId });

    res.json({
      success: true,
      message: 'Question deleted',
    });
  } catch (error) {
    sendHttpError(res, error, 'Server error while deleting question');
  }
};

const reorderQuestions = async (req, res) => {
  try {
    const quiz = await loadQuizOr404(res, req.params.quizId);

    if (!quiz) {
      return;
    }

    const { questionIds } = req.body || {};

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION',
        message: 'questionIds must be a non-empty array',
      });
    }

    if (questionIds.some((id) => !isValidId(id))) {
      return invalidIdResponse(res, 'question ID');
    }

    const questions = await Question.find({
      _id: { $in: questionIds },
      quizId: quiz._id,
    });

    if (questions.length !== questionIds.length) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION',
        message: 'questionIds must all belong to this quiz',
      });
    }

    await Promise.all(
      questionIds.map((id, index) => Question.findByIdAndUpdate(id, { order: index }))
    );

    const updated = await listQuestions(quiz._id);

    res.json({
      success: true,
      message: 'Questions reordered',
      questions: updated.map(toAdminQuestion),
    });
  } catch (error) {
    sendHttpError(res, error, 'Server error while reordering questions');
  }
};

const getQuizAnalytics = async (req, res) => {
  try {
    const course = await loadCourseOr404(res, req.params.courseId);

    if (!course) {
      return;
    }

    const attempts = await QuizAttempt.find({ courseId: course._id }).sort({
      submittedAt: -1,
    });
    const latestByUser = new Map();

    attempts.forEach((attempt) => {
      const key = String(attempt.userId);
      if (!latestByUser.has(key)) {
        latestByUser.set(key, attempt);
      }
    });

    const latest = [...latestByUser.values()];
    const totalAttempts = attempts.length;
    const averageScore =
      totalAttempts === 0
        ? 0
        : Math.round(
            (attempts.reduce((sum, attempt) => sum + (attempt.percentage || 0), 0) /
              totalAttempts) *
              10
          ) / 10;

    res.json({
      success: true,
      message: 'Quiz analytics fetched',
      analytics: {
        totalAttempts,
        passedStudents: latest.filter((attempt) => attempt.passed).length,
        failedStudents: latest.filter((attempt) => !attempt.passed).length,
        averageScore,
      },
    });
  } catch (error) {
    sendHttpError(res, error, 'Server error while fetching quiz analytics');
  }
};

const listCourseAttempts = async (req, res) => {
  try {
    const course = await loadCourseOr404(res, req.params.courseId);

    if (!course) {
      return;
    }

    const { page, limit, skip } = getPagination(req.query);
    const filter = { courseId: course._id };
    const search = req.query.search ? String(req.query.search).trim() : '';

    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      filter.userId = { $in: users.map((user) => user._id) };
    }

    const [attempts, total] = await Promise.all([
      QuizAttempt.find(filter)
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email'),
      QuizAttempt.countDocuments(filter),
    ]);

    res.json({
      success: true,
      message: 'Quiz attempts fetched',
      attempts: attempts.map(toAdminAttempt),
      pagination: paginationMeta(page, limit, total),
    });
  } catch (error) {
    sendHttpError(res, error, 'Server error while fetching quiz attempts');
  }
};

const listUserAttempts = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidId(userId)) {
      return invalidIdResponse(res, 'user ID');
    }

    const user = await User.findById(userId).select('_id');

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    const attempts = await QuizAttempt.find({ userId: user._id })
      .sort({ submittedAt: -1 })
      .populate('courseId', 'title')
      .populate('quizId', 'title');

    res.json({
      success: true,
      message: 'Quiz attempts fetched',
      attempts: attempts.map(toUserQuizAttemptsAdmin),
    });
  } catch (error) {
    sendHttpError(res, error, 'Server error while fetching user quiz attempts');
  }
};

const getAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;

    if (!isValidId(attemptId)) {
      return invalidIdResponse(res, 'attempt ID');
    }

    const attempt = await QuizAttempt.findById(attemptId).populate('userId', 'name email');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Attempt not found',
      });
    }

    const questions = await Question.find({ quizId: attempt.quizId });

    res.json({
      success: true,
      message: 'Quiz attempt fetched',
      attempt: {
        ...toAdminAttempt(attempt),
        quizId: attempt.quizId,
        courseId: attempt.courseId,
        answers: attempt.answers,
        results: resultsFromAttempt(attempt, questions),
      },
    });
  } catch (error) {
    sendHttpError(res, error, 'Server error while fetching quiz attempt');
  }
};

module.exports = {
  getQuiz,
  upsertQuiz,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  getQuizAnalytics,
  listCourseAttempts,
  listUserAttempts,
  getAttempt,
};
