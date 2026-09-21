const { asBoolean } = require('./courseValidation');
const { toNumber } = require('./duration');

const QUESTION_TYPES = ['textOptions', 'imageOptions'];

const toInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeOptions = (options) => {
  if (!Array.isArray(options)) {
    return [];
  }

  return options.map((option) => {
    if (option && typeof option === 'object') {
      return {
        text: option.text == null ? '' : String(option.text).trim(),
        imageUrl: option.imageUrl == null ? '' : String(option.imageUrl).trim(),
      };
    }

    return {
      text: String(option || '').trim(),
      imageUrl: '',
    };
  });
};

const validateQuizSettings = (body, { isCreate } = {}) => {
  if (isCreate || body.title !== undefined) {
    if (!body.title || !String(body.title).trim()) {
      return 'Title is required';
    }
  }

  if (body.passingPercentage !== undefined) {
    const value = toInteger(body.passingPercentage, NaN);
    if (!Number.isInteger(value) || value < 0 || value > 100) {
      return 'passingPercentage must be an integer from 0 to 100';
    }
  }

  if (isCreate || body.timeLimit !== undefined) {
    const value = toInteger(body.timeLimit, NaN);
    if (!Number.isInteger(value) || value <= 0) {
      return 'timeLimit must be an integer greater than 0';
    }
  }

  if (body.maxAttempts !== undefined) {
    const value = toInteger(body.maxAttempts, NaN);
    if (!Number.isInteger(value) || value < 0) {
      return 'maxAttempts must be an integer of 0 or greater';
    }
  }

  return null;
};

const pickQuizSettings = (body, existing) => {
  const isCreate = !existing;
  const payload = {
    title: isCreate
      ? String(body.title || '').trim()
      : body.title === undefined
        ? existing.title
        : String(body.title || '').trim(),
    description: isCreate
      ? body.description == null
        ? ''
        : String(body.description).trim()
      : body.description === undefined
        ? existing.description
        : String(body.description || '').trim(),
    passingPercentage: isCreate
      ? toInteger(body.passingPercentage, 70)
      : body.passingPercentage === undefined
        ? existing.passingPercentage
        : toInteger(body.passingPercentage, existing.passingPercentage),
    timeLimit: isCreate
      ? toInteger(body.timeLimit, 0)
      : body.timeLimit === undefined
        ? existing.timeLimit
        : toInteger(body.timeLimit, existing.timeLimit),
    maxAttempts: isCreate
      ? toInteger(body.maxAttempts, 0)
      : body.maxAttempts === undefined
        ? existing.maxAttempts
        : toInteger(body.maxAttempts, existing.maxAttempts),
    isPublished: isCreate
      ? asBoolean(body.isPublished, false)
      : body.isPublished === undefined
        ? existing.isPublished
        : asBoolean(body.isPublished, existing.isPublished),
    isEnabled: isCreate
      ? asBoolean(body.isEnabled, true)
      : body.isEnabled === undefined
        ? existing.isEnabled
        : asBoolean(body.isEnabled, existing.isEnabled),
  };

  return payload;
};

const validateQuestionPayload = (body, { isCreate } = {}) => {
  if (isCreate || body.question !== undefined) {
    if (!body.question || !String(body.question).trim()) {
      return 'Question is required';
    }
  }

  if (body.questionType !== undefined && !QUESTION_TYPES.includes(body.questionType)) {
    return 'questionType must be textOptions or imageOptions';
  }

  const options =
    body.options === undefined && !isCreate ? null : normalizeOptions(body.options);

  if (options) {
    if (options.length < 2 || options.length > 4) {
      return 'Provide between 2 and 4 options';
    }

    const type =
      body.questionType ||
      (isCreate ? 'textOptions' : null);

    if (type === 'textOptions') {
      const filled = options.filter((option) => option.text).length;
      if (filled < 2) {
        return 'textOptions requires at least 2 options with text';
      }
    }

    if (type === 'imageOptions') {
      const filled = options.filter((option) => option.imageUrl).length;
      if (filled < 2) {
        return 'imageOptions requires at least 2 options with imageUrl';
      }
    }
  }

  if (isCreate || body.correctAnswer !== undefined) {
    const index = toInteger(body.correctAnswer, NaN);
    const optionCount = options ? options.length : null;

    if (!Number.isInteger(index) || index < 0) {
      return 'correctAnswer must be a valid option index';
    }

    if (optionCount != null && index >= optionCount) {
      return 'correctAnswer must be a valid option index';
    }
  }

  if (body.marks !== undefined) {
    const marks = toNumber(body.marks, NaN);
    if (!Number.isFinite(marks) || marks < 1) {
      return 'marks must be 1 or greater';
    }
  }

  return null;
};

const pickQuestionFields = (body, existing) => {
  const isCreate = !existing;
  const payload = {};

  if (isCreate || body.question !== undefined) {
    payload.question = String(body.question || '').trim();
  }

  if (isCreate || body.imageUrl !== undefined) {
    payload.imageUrl = body.imageUrl == null ? '' : String(body.imageUrl).trim();
  }

  if (isCreate || body.questionType !== undefined) {
    payload.questionType = QUESTION_TYPES.includes(body.questionType)
      ? body.questionType
      : existing
        ? existing.questionType
        : 'textOptions';
  }

  if (isCreate || body.options !== undefined) {
    payload.options = normalizeOptions(body.options);
  }

  if (isCreate || body.correctAnswer !== undefined) {
    payload.correctAnswer = toInteger(body.correctAnswer, 0);
  }

  if (isCreate || body.explanation !== undefined) {
    payload.explanation = body.explanation == null ? '' : String(body.explanation).trim();
  }

  if (isCreate || body.marks !== undefined) {
    payload.marks = Math.max(1, toNumber(body.marks, existing ? existing.marks : 1));
  }

  if (isCreate || body.order !== undefined) {
    payload.order = Math.max(0, toInteger(body.order, existing ? existing.order : 0));
  }

  if (isCreate || body.isPublished !== undefined) {
    payload.isPublished = asBoolean(
      body.isPublished,
      existing ? existing.isPublished : true
    );
  }

  return payload;
};

const toAdminQuestion = (question) => {
  const value = question.toObject ? question.toObject() : { ...question };

  return {
    _id: value._id,
    quizId: value.quizId,
    question: value.question,
    imageUrl: value.imageUrl || '',
    questionType: value.questionType,
    options: value.options || [],
    correctAnswer: value.correctAnswer,
    explanation: value.explanation || '',
    marks: value.marks,
    order: value.order,
    isPublished: Boolean(value.isPublished),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
};

const toPublicQuestion = (question) => {
  const value = toAdminQuestion(question);
  delete value.correctAnswer;
  delete value.explanation;
  delete value.isPublished;
  delete value.quizId;
  delete value.createdAt;
  delete value.updatedAt;
  return value;
};

const quizTotals = (questions) => ({
  totalQuestions: questions.length,
  totalMarks: questions.reduce((sum, question) => sum + (question.marks || 0), 0),
});

const toAdminQuiz = (quiz, questions = []) => {
  const value = quiz.toObject ? quiz.toObject() : { ...quiz };
  const totals = quizTotals(questions);

  return {
    _id: value._id,
    courseId: value.courseId,
    title: value.title,
    description: value.description || '',
    passingPercentage: value.passingPercentage,
    timeLimit: value.timeLimit,
    maxAttempts: value.maxAttempts,
    isPublished: Boolean(value.isPublished),
    isEnabled: value.isEnabled !== false,
    totalQuestions: totals.totalQuestions,
    totalMarks: totals.totalMarks,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
};

module.exports = {
  validateQuizSettings,
  pickQuizSettings,
  validateQuestionPayload,
  pickQuestionFields,
  toAdminQuestion,
  toPublicQuestion,
  toAdminQuiz,
  quizTotals,
  toInteger,
};
