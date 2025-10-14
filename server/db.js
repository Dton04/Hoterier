const mongoose = require("mongoose")

var mongoURL = "mongodb+srv://tandat:0123456Az@cluster0.d2rkr.mongodb.net/mem-rooms"

mongoose.connect(mongoURL, {useUnifiedTopology: true, useNewUrlParser: true})

var connection = mongoose.connection

connection.on('error', () => { 
   console.log('MongoDB Connection Failed!')
})
connection.on('connected', () => { 
   console.log('MongoDB Connection Successful!')
})


module.exports = mongoose