const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

const clipValidation = [
  body('creator')
    .isEthereumAddress()
    .withMessage('Valid Ethereum address required'),
  body('assetCID')
    .isString()
    .notEmpty()
    .withMessage('Asset CID is required'),
  body('price')
    .isString()
    .matches(/^\d+$/)
    .withMessage('Price must be a numeric string in wei'),
  body('durationDays')
    .isInt({ min: 1, max: 365 })
    .withMessage('Duration must be between 1 and 365 days'),
  body('splits')
    .isArray()
    .withMessage('Splits must be an array'),
  body('splits.*.address')
    .isEthereumAddress()
    .withMessage('Each split must have a valid Ethereum address'),
  body('splits.*.bps')
    .isInt({ min: 0, max: 10000 })
    .withMessage('Each split must have BPS between 0 and 10000')
];

const buyValidation = [
  body('clipId')
    .isInt({ min: 0 })
    .withMessage('Valid clip ID required'),
  body('buyer')
    .isEthereumAddress()
    .withMessage('Valid buyer address required'),
  body('price')
    .isString()
    .matches(/^\d+$/)
    .withMessage('Price must be a numeric string in wei'),
  body('nonce')
    .isInt({ min: 0 })
    .withMessage('Valid nonce required'),
  body('deadline')
    .isInt({ min: Math.floor(Date.now() / 1000) })
    .withMessage('Valid deadline required'),
  body('signature')
    .isString()
    .isLength({ min: 132, max: 132 })
    .withMessage('Valid signature required')
];

const authValidation = [
  body('address')
    .isEthereumAddress()
    .withMessage('Valid Ethereum address required'),
  body('signature')
    .isString()
    .isLength({ min: 132, max: 132 })
    .withMessage('Valid signature required'),
  body('message')
    .isString()
    .notEmpty()
    .withMessage('Message is required')
];

module.exports = {
  handleValidationErrors,
  clipValidation,
  buyValidation,
  authValidation
};
