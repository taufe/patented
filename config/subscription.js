require('./env');

const envNumber = (key, fallback) => {
  const parsed = Number(process.env[key]);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const envText = (key, fallback) => {
  const value = (process.env[key] || '').trim();
  return value || fallback;
};

const PLANS = [
  {
    id: 'weekly',
    name: 'Weekly',
    amount: envNumber('PLAN_WEEKLY_AMOUNT', 700),
    currency: 'PKR',
    durationDays: 7,
    description: 'Access all premium lectures for 7 days',
  },
  {
    id: 'monthly',
    name: 'Monthly',
    amount: envNumber('PLAN_MONTHLY_AMOUNT', 2000),
    currency: 'PKR',
    durationDays: 30,
    description: 'Access all premium lectures for 30 days',
  },
  {
    id: 'yearly',
    name: 'Yearly',
    amount: envNumber('PLAN_YEARLY_AMOUNT', 18000),
    currency: 'PKR',
    durationDays: 365,
    description: 'Access all premium lectures for 12 months',
  },
];

const METHODS = [
  {
    id: 'JazzCash',
    name: 'JazzCash',
    type: 'manual',
    enabled: true,
    accountNumber: envText('JAZZCASH_ACCOUNT', '03001234567'),
    accountTitle: envText('JAZZCASH_TITLE', 'Patented App'),
    instructions:
      'Send the exact plan amount via JazzCash, then enter the transaction ID from your receipt.',
  },
  {
    id: 'EasyPaisa',
    name: 'EasyPaisa',
    type: 'manual',
    enabled: true,
    accountNumber: envText('EASYPAISA_ACCOUNT', '03001234567'),
    accountTitle: envText('EASYPAISA_TITLE', 'Patented App'),
    instructions:
      'Send the exact plan amount via EasyPaisa, then enter the transaction ID from your receipt.',
  },
  {
    id: 'BankTransfer',
    name: 'Bank Transfer',
    type: 'manual',
    enabled: true,
    accountNumber: envText('BANK_ACCOUNT', 'PK00XXXX0000000000'),
    accountTitle: envText('BANK_TITLE', 'Patented App'),
    bankName: envText('BANK_NAME', 'HBL'),
    instructions:
      'Transfer the exact plan amount to the bank account below, then enter the reference / transaction ID.',
  },
  {
    id: 'Card',
    name: 'Card',
    type: 'gateway',
    enabled: false,
    message: 'Card payments are not available yet. Use JazzCash, EasyPaisa, or bank transfer.',
  },
  {
    id: 'GooglePay',
    name: 'Google Pay',
    type: 'gateway',
    enabled: false,
    message: 'Google Pay is not available yet. Use JazzCash, EasyPaisa, or bank transfer.',
  },
  {
    id: 'ApplePay',
    name: 'Apple Pay',
    type: 'gateway',
    enabled: false,
    message: 'Apple Pay is not available yet. Use JazzCash, EasyPaisa, or bank transfer.',
  },
];

const normalizeKey = (value) => String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');

const getPlans = () => PLANS.map((plan) => ({ ...plan }));

const getMethods = () => METHODS.map((method) => ({ ...method }));

const findPlan = (value) => {
  const key = normalizeKey(value);
  return PLANS.find((plan) => normalizeKey(plan.id) === key || normalizeKey(plan.name) === key) || null;
};

const findMethod = (value) => {
  const key = normalizeKey(value);
  return METHODS.find((method) => normalizeKey(method.id) === key || normalizeKey(method.name) === key) || null;
};

const addDays = (from, days) => {
  const date = new Date(from);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
};

module.exports = {
  getPlans,
  getMethods,
  findPlan,
  findMethod,
  addDays,
};
