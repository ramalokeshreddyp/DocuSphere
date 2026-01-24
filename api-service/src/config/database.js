import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_PORT = 5432,
  DB_USER = 'notification',
  DB_PASSWORD = 'notification',
  DB_NAME = 'notifications',
  DB_DIALECT = 'postgres',
  DB_STORAGE
} = process.env;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: DB_DIALECT,
  storage: DB_STORAGE,
  logging: false
});

const NotificationTemplate = sequelize.define('NotificationTemplate', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  subject_template: { type: DataTypes.STRING, allowNull: false },
  body_template: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.ENUM('email', 'sms', 'push'), allowNull: false }
}, { tableName: 'notification_templates', timestamps: false });

const NotificationLog = sequelize.define('NotificationLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  correlation_id: { type: DataTypes.UUID, allowNull: false, unique: true },
  user_id: { type: DataTypes.STRING, allowNull: false },
  notification_type: { type: DataTypes.ENUM('email', 'sms', 'push'), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  recipient: { type: DataTypes.STRING, allowNull: false },
  status: { 
    type: DataTypes.ENUM('queued', 'sent', 'failed', 'retried', 'rate_limited', 'circuit_open'), 
    allowNull: false, 
    defaultValue: 'queued' 
  },
  sent_at: { type: DataTypes.DATE, allowNull: true },
  error_details: { type: DataTypes.TEXT, allowNull: true }
}, { tableName: 'notification_logs', timestamps: false });

async function seedTemplates () {
  const existing = await NotificationTemplate.count();
  if (existing > 0) return;
  await NotificationTemplate.bulkCreate([
    {
      name: 'welcome',
      subject_template: 'Welcome to our service',
      body_template: 'Hello {{name}}, thanks for joining us.',
      type: 'email'
    },
    {
      name: 'order_confirmation',
      subject_template: 'Your order is confirmed',
      body_template: 'Order {{orderId}} has been confirmed and is on its way.',
      type: 'push'
    },
    {
      name: 'password_reset',
      subject_template: 'Reset your password',
      body_template: 'Use code {{code}} to reset your password.',
      type: 'sms'
    }
  ]);
}

async function initDatabase () {
  await sequelize.authenticate();
  await sequelize.sync();
  await seedTemplates();
}

export { sequelize, NotificationTemplate, NotificationLog, initDatabase };
