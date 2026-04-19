/**
 * Message Model
 * Handles in-app communication between clients and providers
 */

const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
      required: true,
      index: true
    },
    
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    senderRole: {
      type: String,
      enum: ['client', 'technician', 'driver', 'vendor', 'admin'],
      required: true
    },
    
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    
    read: {
      type: Boolean,
      default: false
    },
    
    readAt: {
      type: Date,
      default: null
    },
    
    attachments: [{
      type: String,
      url: true
    }]
  },
  { 
    timestamps: true 
  }
)

// Indexes
messageSchema.index({ serviceId: 1, createdAt: -1 })
messageSchema.index({ senderId: 1 })
messageSchema.index({ read: 1 })

module.exports = mongoose.model('Message', messageSchema)
