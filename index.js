const express = require("express")
const cors = require("cors")
const { application } = require("express")
require("dotenv").config()
const jwt = require("jsonwebtoken")
const port = process.env.PORT || 5000
const app = express()


app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.trq2z.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const run = async()=> {
    try {
       await client.connect()
       console.log("Database connected");

    //    COLLECTIONS.................................
    const userCollection = client.db("falcon-electronics").collection("users")

    // all routes,,,,,,,,,,,,,,,,,,,,,,,,,
    

    app.get("/users",verify,async(req,res)=> {
        const data = await userCollection.find().toArray()
        res.send(data)
    })
    app.get("/users/:email",verify,async(req,res)=> {
        const email = req.params.email
        const query = {email:email}
        const data = await userCollection.findOne(query)
        const isAdmin = data.role === "admin"
        res.send({admin:isAdmin,data:data})
    })


    const verifyAdmin = async(req,res,next)=> {
        const requester = req.decoded.email
        const requesterData = await userCollection.findOne({email:requester})
        if(requesterData.role === "admin"){
        next()
        }else{
          res.status(403).send("unAuthorize access")
        }
  
      }
        
    } finally{

    }

}
run().catch(console.dir)

app.get("/",(req,res)=> {
    res.send("hello from home")
})


app.listen(port,()=> {
    console.log("server is running on port no 5000");
})



function verify(req,res,next){
    const header = req.headers.authorization
   

    if(!header){
       return res.send({message:"unauthorize access"})
    }
    const token = header.split(" ")[1]
    jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
        if(err){
            return res.status(403).send({message:"forbidded access"})
        }
        req.decoded = decoded
        next()
      });
    
   
     
   
   }


