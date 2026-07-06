require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('../models/User')

const run = async () => {
  const email = (process.env.ADMIN_EMAIL || 'admin@yoonwi.sn').trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD || 'Admin12345!'
  const phone = process.env.ADMIN_PHONE || '+221771234567'

  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is missing')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })

  const existingUser = await User.findOne({ email })
  const hashedPassword = await bcrypt.hash(password, 10)

  if (existingUser) {
    existingUser.firstName = 'Admin'
    existingUser.lastName = 'YOONWI'
    existingUser.name = 'Admin YOONWI'
    existingUser.email = email
    existingUser.phone = phone
    existingUser.role = 'admin'
    existingUser.status = 'verified'
    existingUser.password = hashedPassword
    await existingUser.save()
    console.log(JSON.stringify({ action: 'updated', email, role: existingUser.role, status: existingUser.status }, null, 2))
  } else {
    const created = await User.create({
      firstName: 'Admin',
      lastName: 'YOONWI',
      name: 'Admin YOONWI',
      email,
      password: hashedPassword,
      phone,
      role: 'admin',
      status: 'verified'
    })
    console.log(JSON.stringify({ action: 'created', email, role: created.role, status: created.status }, null, 2))
  }

  await mongoose.disconnect()
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
