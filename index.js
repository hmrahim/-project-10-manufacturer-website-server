const express = require("express")
const cors = require("cors")
const { application } = require("express")
require("dotenv").config()
const port = process.env.PORT || 5000
const app = express()


app.use(cors())
app.use(express.json())

app.get("/",(req,res)=> {
    res.send("hello from home")
})


app.listen(port,()=> {
    console.log("server is running on port no 5000");
})