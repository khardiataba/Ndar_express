const mongoose = require("mongoose")

const ServiceSchema = new mongoose.Schema({

title:String,

category:String,

description:String,

price:Number,

provider:String,

image:String,

createdAt: {
  type: Date,
  default: Date.now
}

})

module.exports = mongoose.model("Service",ServiceSchema)