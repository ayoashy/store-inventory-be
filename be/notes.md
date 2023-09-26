building a web server

create a root folder and add server.js/ts file and then initialize with npm init -y so server.js/ts will be main entry

install key dependencies - express,cors,body-parser,dotenv,mongoose,e.t.c depending on your application preference

in server.js/ts file,import installed dependencies
const express = require('express')
const dotenv = require('dotenv').config()
const bodyParser = require('body-parser') and the rest...

invoke express and store in a variable
const app = express()

make use of middleware
app.use(cors())
app.use(express.json())
app.use(bodyParser.json())

connecting mongoose DB and starting up app server
assuming PORT = 5000
const connectDB = async ()=>{
try{
await mongoose.connect(connectionString)
console.log(connected to db)
app.listen(PORT,()=>console.log(app running on PORT))

}catch(error){
console.log(error)
}
}
connectDB()

Basic fundamentals of server application
MVC
M - Model which defines the data structure in the database
V - View which represents the components that renders data to the user
C - Controller which acts as an intermediary between the Model and the View
