/**
 * Stripe Webhook Handler for YOON WI
 * Handles payment events and idempotency
 */

const crypto = require('crypto')
const Wallet = require('../models/Wallet')
const User = require('../models/User')
const atomicPaymentService = require('./atomicPaymentService')

// Webhook event cache to prevent duplicate processing
const processedEvents = new Map()
const EVENT_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

class StripeWebhookHandler {
  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(payload, signature, secret) {
    try {
      const hash = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex')

      return hash === signature
    } catch (error) {
      console.error('Webhook signature verification error:', error)
      return false
    }
  }

  /**
   * Check if event already processed (idempotency)
   */
  static isEventProcessed(eventId) {
    return processedEvents.has(eventId)
  }

  /**
   * Mark event as processed
   */
  static markEventProcessed(eventId) {
    processedEvents.set(eventId, Date.now())

    // Cleanup old events
    for (const [id, timestamp] of processedEvents.entries()) {
      if (Date.now() - timestamp > EVENT_CACHE_TTL) {
        processedEvents.delete(id)
      }
    }
  }

  /**
   * Handle payment_intent.succeeded event
   */
  static async handlePaymentSucceeded(event) {
    try {
      const { id, object } = event.data
      const paymentIntent = object

      if (StripeWebhookHandler.isEventProcessed(id)) {
        console.log(`Event ${id} already processed, skipping`)
        return { success: true, message: 'Event already processed' }
      }

      const { metadata, amount_received, currency } = paymentIntent

      if (!metadata?.userId) {
        throw new Error('No userId in payment metadata')
      }

      // Amount is in cents, convert to XOF
      const amountInXOF = amount_received / 100

      const result = await atomicPaymentService.atomicCredit(metadata.userId, amountInXOF, {
        description: `Stripe payment: ${paymentIntent.id}`,
        reference: paymentIntent.id,
        referenceType: 'stripe_payment',
        paymentMethod: 'stripe',
        metadata: {
          stripePaymentIntentId: paymentIntent.id,
          currency,
          amountInCents: amount_received
        }
      })

      if (result.success) {
        StripeWebhookHandler.markEventProcessed(id)
      }

      return result
    } catch (error) {
      console.error('Handle payment succeeded error:', error)
      return {
        success: false,
        message: error.message || 'Payment processing failed'
      }
    }
  }

  /**
   * Handle payment_intent.payment_failed event
   */
  static async handlePaymentFailed(event) {
    try {
      const { id, object } = event.data
      const paymentIntent = object

      if (StripeWebhookHandler.isEventProcessed(id)) {
        return { success: true, message: 'Event already processed' }
      }

      const { metadata } = paymentIntent

      if (!metadata?.userId) {
        throw new Error('No userId in payment metadata')
      }

      // Notify user of payment failure
      console.log(`Payment failed for user ${metadata.userId}: ${paymentIntent.id}`)
      // In production: send notification/email to user

      StripeWebhookHandler.markEventProcessed(id)

      return {
        success: true,
        message: 'Payment failure recorded'
      }
    } catch (error) {
      console.error('Handle payment failed error:', error)
      return {
        success: false,
        message: error.message
      }
    }
  }

  /**
   * Handle charge.refunded event
   */
  static async handleRefund(event) {
    try {
      const { id, object } = event.data
      const charge = object

      if (StripeWebhookHandler.isEventProcessed(id)) {
        return { success: true, message: 'Event already processed' }
      }

      const { metadata, amount_refunded, currency } = charge

      if (!metadata?.userId) {
        throw new Error('No userId in refund metadata')
      }

      const amountInXOF = amount_refunded / 100

      const result = await atomicPaymentService.atomicRefund(metadata.userId, amountInXOF, {
        description: `Stripe refund: ${charge.id}`,
        reference: charge.id,
        referenceType: 'stripe_payment',
        metadata: {
          stripeChargeId: charge.id,
          originalPaymentIntentId: charge.payment_intent,
          currency,
          amountInCents: amount_refunded
        }
      })

      if (result.success) {
        StripeWebhookHandler.markEventProcessed(id)
      }

      return result
    } catch (error) {
      console.error('Handle refund error:', error)
      return {
        success: false,
        message: error.message
      }
    }
  }

  /**
   * Route webhook events
   */
  static async processWebhookEvent(event) {
    console.log(`Processing webhook event: ${event.type}`)

    switch (event.type) {
      case 'payment_intent.succeeded':
        return await StripeWebhookHandler.handlePaymentSucceeded(event)

      case 'payment_intent.payment_failed':
        return await StripeWebhookHandler.handlePaymentFailed(event)

      case 'charge.refunded':
        return await StripeWebhookHandler.handleRefund(event)

      default:
        console.log(`Unhandled event type: ${event.type}`)
        return { success: true, message: 'Event processed' }
    }
  }
}

module.exports = StripeWebhookHandler
