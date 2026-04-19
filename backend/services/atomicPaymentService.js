/**
 * Atomic Payment Service with MongoDB Transactions
 * Prevents double-charging and race conditions
 */

const mongoose = require('mongoose')
const { Wallet, Transaction } = require('../models/Wallet')
const User = require('../models/User')
const Ride = require('../models/Ride')

class AtomicPaymentService {
  /**
   * Atomic wallet debit - prevents double charge
   * @param {string} userId - User ID
   * @param {number} amount - Amount to debit
   * @param {object} metadata - Transaction metadata
   * @returns {object} Result
   */
  async atomicDebit(userId, amount, metadata = {}) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      if (amount <= 0 || !Number.isFinite(amount)) {
        throw new Error('Amount must be positive number')
      }

      // Lock and fetch wallet
      const wallet = await Wallet.findOne({ userId }).session(session)
      if (!wallet) {
        throw new Error('Wallet not found')
      }

      // Check balance (within transaction)
      if (wallet.balance < amount) {
        await session.abortTransaction()
        return {
          success: false,
          message: 'Insufficient balance',
          currentBalance: wallet.balance,
          requiredAmount: amount
        }
      }

      // Debit wallet
      wallet.balance -= amount
      wallet.statistics.totalDebited += amount
      wallet.statistics.lastTransactionAt = new Date()
      await wallet.save({ session })

      // Create transaction record
      const transaction = new Transaction({
        userId,
        type: 'debit',
        amount,
        status: 'completed',
        description: metadata.description || 'Debit',
        reference: metadata.reference || '',
        referenceType: metadata.referenceType || 'manual',
        paymentMethod: metadata.paymentMethod || 'wallet',
        metadata
      })
      await transaction.save({ session })

      await session.commitTransaction()

      return {
        success: true,
        message: 'Debit successful',
        newBalance: wallet.balance,
        transactionId: transaction._id
      }
    } catch (error) {
      await session.abortTransaction()
      console.error('Atomic debit error:', error)
      return {
        success: false,
        message: error.message || 'Debit failed'
      }
    } finally {
      session.endSession()
    }
  }

  /**
   * Atomic wallet credit
   * @param {string} userId - User ID
   * @param {number} amount - Amount to credit
   * @param {object} metadata - Transaction metadata
   * @returns {object} Result
   */
  async atomicCredit(userId, amount, metadata = {}) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      if (amount <= 0 || !Number.isFinite(amount)) {
        throw new Error('Amount must be positive number')
      }

      const wallet = await Wallet.findOne({ userId }).session(session)
      if (!wallet) {
        throw new Error('Wallet not found')
      }

      // Credit wallet
      wallet.balance += amount
      wallet.statistics.totalCredited += amount
      wallet.statistics.lastTransactionAt = new Date()
      await wallet.save({ session })

      // Create transaction record
      const transaction = new Transaction({
        userId,
        type: 'credit',
        amount,
        status: 'completed',
        description: metadata.description || 'Credit',
        reference: metadata.reference || '',
        referenceType: metadata.referenceType || 'manual',
        paymentMethod: metadata.paymentMethod || 'wallet',
        metadata
      })
      await transaction.save({ session })

      await session.commitTransaction()

      return {
        success: true,
        message: 'Credit successful',
        newBalance: wallet.balance,
        transactionId: transaction._id
      }
    } catch (error) {
      await session.abortTransaction()
      console.error('Atomic credit error:', error)
      return {
        success: false,
        message: error.message || 'Credit failed'
      }
    } finally {
      session.endSession()
    }
  }

  /**
   * Atomic transfer between wallets
   * Used for ride payments
   * @param {string} fromUserId - Payer user ID
   * @param {string} toUserId - Receiver user ID
   * @param {number} amount - Amount to transfer
   * @param {object} metadata - Transaction metadata
   * @returns {object} Result with both transaction details
   */
  async atomicTransfer(fromUserId, toUserId, amount, metadata = {}) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      if (amount <= 0 || !Number.isFinite(amount)) {
        throw new Error('Amount must be positive number')
      }

      // Fetch both wallets
      const fromWallet = await Wallet.findOne({ userId: fromUserId }).session(session)
      const toWallet = await Wallet.findOne({ userId: toUserId }).session(session)

      if (!fromWallet || !toWallet) {
        throw new Error('One or both wallets not found')
      }

      // Check source balance
      if (fromWallet.balance < amount) {
        await session.abortTransaction()
        return {
          success: false,
          message: 'Insufficient balance',
          currentBalance: fromWallet.balance,
          requiredAmount: amount
        }
      }

      // Execute transfer
      fromWallet.balance -= amount
      fromWallet.statistics.totalDebited += amount
      fromWallet.statistics.lastTransactionAt = new Date()

      toWallet.balance += amount
      toWallet.statistics.totalCredited += amount
      toWallet.statistics.lastTransactionAt = new Date()

      await fromWallet.save({ session })
      await toWallet.save({ session })

      // Create debit transaction
      const debitTx = new Transaction({
        userId: fromUserId,
        type: 'debit',
        amount,
        status: 'completed',
        description: metadata.description || 'Transfer',
        reference: metadata.reference || '',
        referenceType: metadata.referenceType || 'manual',
        paymentMethod: 'wallet',
        metadata: { ...metadata, transferType: 'send', toUser: toUserId }
      })
      await debitTx.save({ session })

      // Create credit transaction
      const creditTx = new Transaction({
        userId: toUserId,
        type: 'credit',
        amount,
        status: 'completed',
        description: metadata.description || 'Transfer',
        reference: metadata.reference || '',
        referenceType: metadata.referenceType || 'manual',
        paymentMethod: 'wallet',
        metadata: { ...metadata, transferType: 'receive', fromUser: fromUserId }
      })
      await creditTx.save({ session })

      await session.commitTransaction()

      return {
        success: true,
        message: 'Transfer successful',
        fromNewBalance: fromWallet.balance,
        toNewBalance: toWallet.balance,
        debitTransactionId: debitTx._id,
        creditTransactionId: creditTx._id
      }
    } catch (error) {
      await session.abortTransaction()
      console.error('Atomic transfer error:', error)
      return {
        success: false,
        message: error.message || 'Transfer failed'
      }
    } finally {
      session.endSession()
    }
  }

  /**
   * Atomic refund
   * @param {string} userId - User ID to refund
   * @param {number} amount - Amount to refund
   * @param {object} metadata - Refund metadata
   * @returns {object} Result
   */
  async atomicRefund(userId, amount, metadata = {}) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      if (amount <= 0 || !Number.isFinite(amount)) {
        throw new Error('Amount must be positive number')
      }

      const wallet = await Wallet.findOne({ userId }).session(session)
      if (!wallet) {
        throw new Error('Wallet not found')
      }

      wallet.balance += amount
      wallet.statistics.totalCredited += amount
      wallet.statistics.lastTransactionAt = new Date()
      await wallet.save({ session })

      const transaction = new Transaction({
        userId,
        type: 'refund',
        amount,
        status: 'completed',
        description: metadata.description || 'Refund',
        reference: metadata.reference || '',
        referenceType: metadata.referenceType || 'manual',
        paymentMethod: 'wallet',
        metadata
      })
      await transaction.save({ session })

      await session.commitTransaction()

      return {
        success: true,
        message: 'Refund successful',
        newBalance: wallet.balance,
        transactionId: transaction._id
      }
    } catch (error) {
      await session.abortTransaction()
      console.error('Atomic refund error:', error)
      return {
        success: false,
        message: error.message || 'Refund failed'
      }
    } finally {
      session.endSession()
    }
  }
}

module.exports = new AtomicPaymentService()
