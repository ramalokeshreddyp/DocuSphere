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

async function initDatabase () {
  await sequelize.authenticate();
  await sequelize.sync();
}

export { sequelize, NotificationTemplate, NotificationLog, initDatabase };
