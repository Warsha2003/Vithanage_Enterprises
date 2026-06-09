const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorType: {
    type: String,
    enum: ['user', 'admin', 'system'],
    default: 'system'
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'actorModel'
  },
  actorModel: {
    type: String,
    enum: ['User', 'Admin', null],
    default: null
  },
  action: {
    type: String,
    required: true
  },
  entityType: {
    type: String,
    required: true
  },
  entityId: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: ''
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  }
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entityType: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
