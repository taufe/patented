const { isValidId } = require('./ids');
const { toInteger } = require('./quizValidation');

const roundPercentage = (earnedMarks, totalMarks) => {
  if (!totalMarks) {
    return 0;
  }

  return Math.round((earnedMarks / totalMarks) * 10000) / 100;
};

const publishedQuestions = (questions) =>
  (questions || []).filter((question) => question.isPublished !== false);

const parseAnswers = (rawAnswers, questions) => {
  const ordered = publishedQuestions(questions).sort(
    (left, right) => (left.order || 0) - (right.order || 0)
  );
  const selectedByQuestion = new Map();

  if (rawAnswers == null) {
    const error = new Error('answers is required');
    error.statusCode = 400;
    error.code = 'VALIDATION';
    throw error;
  }

  if (!Array.isArray(rawAnswers)) {
    const error = new Error('answers must be an array');
    error.statusCode = 400;
    error.code = 'VALIDATION';
    throw error;
  }

  const isIndexArray =
    rawAnswers.length === 0 || rawAnswers.every((item) => typeof item === 'number');

  if (isIndexArray) {
    ordered.forEach((question, index) => {
      const selected = rawAnswers[index];
      selectedByQuestion.set(
        String(question._id),
        selected === undefined || selected === null ? -1 : toInteger(selected, -1)
      );
    });
  } else {
    rawAnswers.forEach((item) => {
      if (!item || typeof item !== 'object' || !isValidId(item.questionId)) {
        return;
      }

      const selected =
        item.selectedIndex === undefined || item.selectedIndex === null
          ? -1
          : toInteger(item.selectedIndex, -1);
      selectedByQuestion.set(String(item.questionId), selected);
    });
  }

  return { ordered, selectedByQuestion };
};

const scoreAttempt = (questions, rawAnswers) => {
  const { ordered, selectedByQuestion } = parseAnswers(rawAnswers, questions);
  let score = 0;
  let earnedMarks = 0;
  const totalQuestions = ordered.length;
  const totalMarks = ordered.reduce((sum, question) => sum + (question.marks || 0), 0);
  const answers = [];
  const results = [];

  ordered.forEach((question) => {
    const selectedIndex = selectedByQuestion.has(String(question._id))
      ? selectedByQuestion.get(String(question._id))
      : -1;
    const correct = selectedIndex === question.correctAnswer;
    const questionMarks = question.marks || 0;
    const earned = correct ? questionMarks : 0;

    if (correct) {
      score += 1;
      earnedMarks += questionMarks;
    }

    answers.push({
      questionId: question._id,
      selectedIndex,
    });

    results.push({
      questionId: question._id,
      selectedIndex,
      correctAnswer: question.correctAnswer,
      correct,
      explanation: question.explanation || '',
      marks: questionMarks,
      earnedMarks: earned,
    });
  });

  const percentage = roundPercentage(earnedMarks, totalMarks);

  return {
    answers,
    results,
    score,
    earnedMarks,
    totalQuestions,
    totalMarks,
    percentage,
  };
};

const toUserAttemptSummary = (attempt) => ({
  _id: attempt._id,
  score: attempt.score,
  percentage: attempt.percentage,
  passed: Boolean(attempt.passed),
  attemptNumber: attempt.attemptNumber,
  submittedAt: attempt.submittedAt,
});

const toSubmitAttempt = (attempt, results) => ({
  _id: attempt._id,
  quizId: attempt.quizId,
  courseId: attempt.courseId,
  score: attempt.score,
  earnedMarks: attempt.earnedMarks,
  totalQuestions: attempt.totalQuestions,
  totalMarks: attempt.totalMarks,
  percentage: attempt.percentage,
  passed: Boolean(attempt.passed),
  attemptNumber: attempt.attemptNumber,
  submittedAt: attempt.submittedAt,
  results,
});

const toAdminAttempt = (attempt) => {
  const user = attempt.userId && attempt.userId._id ? attempt.userId : null;

  return {
    _id: attempt._id,
    user: user
      ? {
          _id: user._id,
          name: user.name,
          email: user.email,
        }
      : {
          _id: attempt.userId,
          name: '',
          email: '',
        },
    score: attempt.score,
    earnedMarks: attempt.earnedMarks,
    totalQuestions: attempt.totalQuestions,
    totalMarks: attempt.totalMarks,
    percentage: attempt.percentage,
    passed: Boolean(attempt.passed),
    attemptNumber: attempt.attemptNumber,
    submittedAt: attempt.submittedAt,
  };
};

const toUserQuizAttemptsAdmin = (attempt) => {
  const course = attempt.courseId && attempt.courseId._id ? attempt.courseId : null;
  const quiz = attempt.quizId && attempt.quizId._id ? attempt.quizId : null;

  return {
    _id: attempt._id,
    courseId: course ? course._id : attempt.courseId,
    courseTitle: course ? course.title : '',
    quizId: quiz ? quiz._id : attempt.quizId,
    quizTitle: quiz ? quiz.title : '',
    score: attempt.score,
    percentage: attempt.percentage,
    passed: Boolean(attempt.passed),
    attemptNumber: attempt.attemptNumber,
    submittedAt: attempt.submittedAt,
  };
};

const remainingAttempts = (quiz, attemptsUsed) => {
  if (!quiz.maxAttempts) {
    return null;
  }

  return Math.max(0, quiz.maxAttempts - attemptsUsed);
};

const toPublicQuiz = (quiz, questions, attemptsUsed) => {
  const published = publishedQuestions(questions);
  const totalMarks = published.reduce((sum, question) => sum + (question.marks || 0), 0);

  return {
    _id: quiz._id,
    courseId: quiz.courseId,
    title: quiz.title,
    description: quiz.description || '',
    passingPercentage: quiz.passingPercentage,
    timeLimit: quiz.timeLimit,
    maxAttempts: quiz.maxAttempts,
    totalQuestions: published.length,
    totalMarks,
    attemptsUsed,
    attemptsRemaining: remainingAttempts(quiz, attemptsUsed),
  };
};

const resultsFromAttempt = (attempt, questions) => {
  const byId = new Map((questions || []).map((question) => [String(question._id), question]));

  return (attempt.answers || []).map((answer) => {
    const question = byId.get(String(answer.questionId));
    const selectedIndex = answer.selectedIndex;
    const correctAnswer = question ? question.correctAnswer : null;
    const correct = question ? selectedIndex === question.correctAnswer : false;
    const marks = question ? question.marks || 0 : 0;

    return {
      questionId: answer.questionId,
      selectedIndex,
      correctAnswer,
      correct,
      explanation: question ? question.explanation || '' : '',
      marks,
      earnedMarks: correct ? marks : 0,
    };
  });
};

module.exports = {
  roundPercentage,
  publishedQuestions,
  parseAnswers,
  scoreAttempt,
  toUserAttemptSummary,
  toSubmitAttempt,
  toAdminAttempt,
  toUserQuizAttemptsAdmin,
  remainingAttempts,
  toPublicQuiz,
  resultsFromAttempt,
};
