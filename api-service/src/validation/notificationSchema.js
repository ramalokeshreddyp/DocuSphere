import Joi from 'joi';

const notificationSchema = Joi.object({
  userId: Joi.string().min(1).required(),
  type: Joi.string().valid('email', 'sms', 'push').required(),
  recipient: Joi.string().min(3).required(),
  message: Joi.string().min(1).required(),
  subject: Joi.string().allow('', null).optional(),
  template_id: Joi.number().integer().positive().optional()
});

export { notificationSchema };
