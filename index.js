const express = require("express")
const cors = require("cors")
const { application } = require("express")
require("dotenv").config()
const jwt = require("jsonwebtoken")
const port = process.env.PORT || 5000
const app = express()
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)


app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.trq2z.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const run = async()=> {
    try {
       await client.connect()
       console.log("Database connected");

    //    COLLECTIONS.................................
    const userCollection = client.db("falcon-electronics").collection("users")
    const productCollection = client.db("falcon-electronics").collection("products")
    const orderCollection = client.db("falcon-electronics").collection("orders")
    const paymentCollection = client.db("falcon-electronics").collection("payment");
    const reviewCollection = client.db("falcon-electronics").collection("reviews");
    // all routes,,,,,,,,,,,,,,,,,,,,,,,,,
    const verifyAdmin = async(req,res,next)=> {
        const requester = req.decoded.email
        const requesterData = await userCollection.findOne({email:requester})
        if(requesterData.role === "admin"){
        next()
        }else{
          res.status(403).send("unAuthorize access")
        }
  
      }

      

    app.put("/users/:email",async(req,res)=> {
        const email = req.params.email
        const data= req.body

        const query = {email:email}
        const options = {upsert:true}
        const docs = {
            $set:{
                email:data.email,
                name:data.name,
               
            }
        }

        const result = await userCollection.updateOne(query,docs,options)
        const token = jwt.sign({ email:email }, process.env.JWT_SECRET);
        console.log(result);
        res.send({result,token})
    })

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

    app.patch("/users/:email",verify,verifyAdmin,async(req,res)=> {
        const email = req.params.email
        const data = req.body
        const query = {email:email}
        const docs = {$set:{role:data.role}}
        const result = await userCollection.updateOne(query,docs)

        res.send(result)
        console.log(result);
    })

    app.put("/maketoken/:email",(req,res)=> {
        const token = jwt.sign({ email:email }, process.env.JWT_SECRET);
        res.send({token})

    })
    // =========================products apis======================================
    app.post("/product",async(req,res)=> {
        const obj = req.body
        const result = await productCollection.insertOne(obj)
        console.log(result)
        res.send(result)

    })

    app.get("/product",async(req,res)=> {
        const data =await productCollection.find().toArray()
        res.send(data)
    })
    app.put("/product/:id",async(req,res)=> {
        const id = req.params.id
        const data = req.body
        const query = {_id:ObjectId(id)}
        const options = {upsert:true}
        const docs = {
            $set:{
                title:data.title,
                price:data.price,
                quantity:data.quantity,
                minquantity:data.minquantity,
                categorie:data.categorie,
                desc:data.desc,
                image:data.image
            }

        }
        const result = await productCollection.updateOne(query,docs,options)
        console.log(result);
        res.send(result)
    })


    app.get("/product/:id",async(req,res)=> {
        const id = req.params.id
        const query = {_id:ObjectId(id)}
        const data = await productCollection.findOne(query)
        
        res.send(data)
    })
    app.delete("/product/:id",async(req,res)=> {
        const id = req.params.id
        const query = {_id:ObjectId(id)}
        const data = await productCollection.deleteOne(query)
        
        res.send(data)
    })

   
   
    // ===================product for home page================================


    app.get("/productdetails/:id",async(req,res)=> {
        const id = req.params.id
        const data = await productCollection.findOne({_id:ObjectId(id)})
        res.send(data)

    })

    app.get("/allproducts",async(req,res)=> {
        const data = await productCollection.find().toArray()
        res.send(data)
    })

    app.get("/fetureproduct",async(req,res)=> {
        const data = await productCollection.find().limit(3).toArray()
        res.send(data)
    })
    
    // ====================orders=========================================================
    app.post("/order",verify,async(req,res)=> {
        const data = req.body
       const result = await orderCollection.insertOne(data)
       res.send(result)

    })

    app.get("/order",verify,async(req,res)=> {
        const data = await orderCollection.find().toArray()
        res.send(data)

    })
    app.get("/order/:email",verify,async(req,res)=> {
        const email = req.params.email
        const query = {email:email}
        const data = await orderCollection.find(query).toArray()
        res.send(data)

    })
    app.delete("/order/:id",async(req,res)=> {
        const id = req.params.id
        const result = await orderCollection.deleteOne({_id:ObjectId(id)})
        res.send(result)
    })

    app.patch("/shiptproduct/:id",async(req,res)=> {
        const id = req.params.id
        const query = {_id:ObjectId(id)}
        const docs = {
            $set:{
                status:1
            }
        }

        const result = await orderCollection.updateOne(query,docs)
        res.send(result)

    })




    app.get("/orderpayment/:id",async(req,res)=> {
        const id = req.params.id
        const query = {_id:ObjectId(id)}
        const data = await orderCollection.findOne(query)
        res.send(data)

    })


    app.patch("/order/:id",async(req,res)=>{
        const id = req.params.id
        const query = {_id:ObjectId(id)}
        const body = req.body
        const docs = {
          $set:{
            paid:true,
            transactionId:body.transactionId,
            status:0
          }
        }
  
        const result = await orderCollection.updateOne(query,docs)
        const insertedData = await paymentCollection.insertOne(body)
  
        res.send({result,insertedData})
        console.log(body);
      })
  


     //payment intent..........................



     app.post("/create-payment-intent", verify,async (req, res) => {
        const  price  = req.body.price;
        const newPrice = parseInt(req.body.price)
        const amount = newPrice * 100
      
        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: "usd",
          payment_method_types:["card"]
        });
      
        console.log("price",newPrice);
        res.send({
          clientSecret: paymentIntent.client_secret,
        });
      }); 


    // ======================  update profile=====================================
    app.patch("/updateprofile/:email",verify,async(req,res)=> {
        const email = req.params.email
        const query = {email:email}
        const body = req.body
        const options = {upsert:true}
        const docs = {
            $set:{
                phone:body.phone,
                location:body.location,
                education:body.education,
                facebook:body.facebook,
                instagram:body.instagram,
                linkdin:body.linkdin

            }
        }
        
        const result = await userCollection.updateOne(query,docs)
        res.send(result)
    }) 


    app.get("/getprofile/:email",verify,async(req,res)=> {
        const email = req.params.email
        const data =await userCollection.findOne({email:email})
        res.send(data)

    })

    // ==========================reviews api =========================================
    // app.post("/reviews",async(req,res)=> {
    //     const body = req.body
    //     console.log(body);
    // })

    app.post("/reviews",verify,async(req,res)=> {
        const data = req.body
     
      const result = await reviewCollection.insertOne(data)
      res.send(result)

    })

    app.get("/reviews",async(req,res)=> {
        const data = await reviewCollection.find().toArray()
        res.send(data)
    })
    app.delete("/reviews/:id",verify,async(req,res)=> {
        const id = req.params.id
        const query = {_id:ObjectId(id)}
        const result = await reviewCollection.deleteOne(query)
        res.send(result)
    })

      
        
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


