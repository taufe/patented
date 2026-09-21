const Course = require('../../models/Course');
const Quiz = require('../../models/Quiz');
const Question = require('../../models/Question');
const QuizAttempt = require('../../models/QuizAttempt');
const { isValidId, invalidIdResponse } = require('../../utils/ids');
const { hasCourseAccess, sendCourseLocked } = require('../../utils/subscription');
const { sendHttpError } = require('../../utils/httpError');
const { toPublicQuestion } = require('../../utils/quizValidation');
const {
  scoreAttempt,
  toUserAttemptSummary,
  toSubmitAttempt,
  toPublicQuiz,
} = require('../../utils/quizScoring');

const loadPublishedCourse = async (res, courseId) => {
  if (!isValidId(courseId)) {
    invalidIdResponse(res, 'course ID');
    return null;
  }

  const course = await Course.findOne({ _id: courseId, status: 'Published' });

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

const loadLiveQuiz = async (courseId) => {
  const quiz = await Quiz.findOne({ courseId });

  if (!quiz || !quiz.isPublished || quiz.isEnabled === false) {
    return null;
  }

  return quiz;
};

const getQuiz = async (req, res) => {
  try {
    const course = await loadPublishedCourse(res, req.params.courseId);

    if (!course) {
      return;
    }

    if (!hasCourseAccess(req.user, course._id)) {
      return res.json({
        success: true,
        message: 'Course locked',
        isLocked: true,
        quiz: null,
        questions: [],
      });
    }

    const quiz = await loadLiveQuiz(course._id);

    if (!quiz) {
      return res.json({
        success: true,
        message: 'Quiz fetched',
        isLocked: false,
        quiz: null,
        questions: [],
      });
    }

    const questions = await Question.find({ quizId: quiz._id, isPublished: true })
      .select('-correctAnswer -explanation')
      .sort({
        order: 1,
        createdAt: 1,
      });
    const attemptsUsed = await QuizAttempt.countDocuments({
      userId: req.user._id,
      quizId: quiz._id,
    });

    res.json({
      success: true,
      message: 'Quiz fetched',
      isLocked: false,
      quiz: toPublicQuiz(quiz, questions, attemptsUsed),
      questions: questions.map(toPublicQuestion),
    });
  } catch (error) {
    sendHttpError(res, error, 'Server error while fetching quiz');
  }
};

const submitQuiz = async (req, res) => {
  try {
    const course = await loadPublishedCourse(res, req.params.courseId);

    if (!course) {
      return;
    }

    if (!hasCourseAccess(req.user, course._id)) {
      return sendCourseLocked(res);
    }

    const quiz = await loadLiveQuiz(course._id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Quiz not found',
      });
    }

    const questions = await Question.find({ quizId: quiz._id, isPublished: true }).sort({
      order: 1,
      createdAt: 1,
    });
    const attemptsUsed = await QuizAttempt.countDocuments({
      userId: req.user._id,
      quizId: quiz._id,
    });

    if (quiz.maxAttempts > 0 && attemptsUsed >= quiz.maxAttempts) {
      return res.status(400).json({
        success: false,
        code: 'MAX_ATTEMPTS',
        message: 'No attempts remaining',
      });
    }

    const scored = scoreAttempt(questions, req.body ? req.body.answers : undefined);
    const passed = scored.percentage >= quiz.passingPercentage;
    const attempt = await QuizAttempt.create({
      userId: req.user._id,
      quizId: quiz._id,
      courseId: course._id,
      answers: scored.answers,
      score: scored.score,
      earnedMarks: scored.earnedMarks,
      totalQuestions: scored.totalQuestions,
      totalMarks: scored.totalMarks,
      percentage: scored.percentage,
      passed,
      attemptNumber: attemptsUsed + 1,
      submittedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Quiz submitted',
      attempt: toSubmitAttempt(attempt, scored.results),
    });
  } catch (error) {
    sendHttpError(res, error, 'Server error while submitting quiz');
  }
};

const listAttempts = async (req, res) => {
  try {
    const course = await loadPublishedCourse(res, req.params.courseId);

    if (!course) {
      return;
    }

    if (!hasCourseAccess(req.user, course._id)) {
      return sendCourseLocked(res);
    }

    const quiz = await Quiz.findOne({ courseId: course._id });

    if (!quiz) {
      return res.json({
        success: true,
        message: 'Quiz attempts fetched',
        attempts: [],
      });
    }

    const attempts = await QuizAttempt.find({
      userId: req.user._id,
      quizId: quiz._id,
    }).sort({ submittedAt: -1 });

    res.json({
      success: true,
      message: 'Quiz attempts fetched',
      attempts: attempts.map(toUserAttemptSummary),
    });
  } catch (error) {
    sendHttpError(res, error, 'Server error while fetching quiz attempts');
  }
};

module.exports = {
  getQuiz,
  submitQuiz,
  listAttempts,
};
