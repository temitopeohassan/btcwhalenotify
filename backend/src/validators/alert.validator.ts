import { body, param, query } from 'express-validator';

export const createAlertValidator = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('threshold_btc')
    .isFloat({ min: 0.1 })
    .withMessage('Threshold must be at least 0.1 BTC'),
  body('addresses')
    .optional()
    .isArray()
    .withMessage('Addresses must be an array'),
  body('addresses.*')
    .optional()
    .isString()
    .matches(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/)
    .withMessage('Invalid Bitcoin address format'),
  body('notification_channels')
    .isArray({ min: 1 })
    .withMessage('At least one notification channel is required'),
  body('notification_channels.*')
    .isIn(['email', 'telegram'])
    .withMessage('Invalid notification channel'),
  body('include_metadata')
    .optional()
    .isBoolean()
    .withMessage('include_metadata must be a boolean'),
];

export const updateAlertValidator = [
  param('id')
    .isString()
    .notEmpty()
    .withMessage('Alert ID is required'),
  body('threshold_btc')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Threshold must be at least 0.1 BTC'),
  body('addresses')
    .optional()
    .isArray()
    .withMessage('Addresses must be an array'),
  body('addresses.*')
    .optional()
    .isString()
    .matches(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/)
    .withMessage('Invalid Bitcoin address format'),
  body('notification_channels')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one notification channel is required'),
  body('notification_channels.*')
    .optional()
    .isIn(['email', 'telegram'])
    .withMessage('Invalid notification channel'),
  body('paused')
    .optional()
    .isBoolean()
    .withMessage('paused must be a boolean'),
];

export const getAlertHistoryValidator = [
  param('id')
    .isString()
    .notEmpty()
    .withMessage('Alert ID is required'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
];
