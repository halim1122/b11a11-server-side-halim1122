const express = require('express');
const cors = require('cors');
var cookieParser = require('cookie-parser')
var jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middleware
app.use(cors({
     origin: ['http://localhost:5173'],
     credentials: true
}));
app.use(express.json())
app.use(cookieParser())

const logger = (req, res, next) => {
     console.log("inside the logger")
     next()
}

const verifyToken = (req, res, next) =>{
     const token = req?.cookies?.token;
     if(!token){
          return res.status(401).send({message: 'unauthorized access'})
     }
     jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
          if(err){
               return res.status(401).send({message: 'unauthorized access'})
          }
          req.decoded = decoded;
          next();
     })
}

app.get('/', (req, res) => {
     res.send('server is runing')
})

const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@abdulhalim.7yzjk6t.mongodb.net/?retryWrites=true&w=majority&appName=AbdulHalim`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
     serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
     }
});

async function run() {
     try {
          // Connect the client to the server	(optional starting in v4.7)
          // await client.connect();

          const AssignmentsCollection = client.db('AssignmentsBD').collection('Assignments')
          const SubmissionsCollection = client.db('AssignmentsBD').collection('Submissions')

          app.get('/assignments',verifyToken, async (req, res) => {
               const result = await AssignmentsCollection.find().toArray();
               res.send(result);
          })

          app.get('/assignment/:id', async (req, res) => {
               const id = req.params.id;
               const query = { _id: new ObjectId(id) };
               const result = await AssignmentsCollection.findOne(query);
               res.send(result)
          })

          app.get("/submissions", async (req, res) => {
               try {
                    const { status, submittedBy } = req.query;
                    const query = {};

                    if (status) query.status = status;
                    if (submittedBy) query.submittedBy = submittedBy;

                    const result = await SubmissionsCollection.find(query).toArray();
                    res.json(result);
               } catch (error) {
                    res.status(500).json({ error: "Failed to fetch submissions" });
               }
          });

          app.post('/jwt', async (req, res) => {
               const userInfo = req.body;

               const token = jwt.sign(userInfo, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' })

               res.cookie('token', token, {
                    httpOnly: true,
                    secure: false
               })

               res.send({ success: true })

          })

          app.post('/assignments', async (req, res) => {
               const newAssignment = req.body
               const result = await AssignmentsCollection.insertOne(newAssignment);
               res.send(result);
          })

          app.post("/submissions", async (req, res) => {
               const submission = req.body;
               const result = await SubmissionsCollection.insertOne(submission);
               res.send(result);
          });

          app.put('/assignment/:id', async (req, res) => {
               const id = req.params.id;
               const query = { _id: new ObjectId(id) };
               const Update = req.body;
               const options = { upsert: true };
               const UpdateDoc = {
                    $set: Update
               }
               const result = await AssignmentsCollection.updateOne(query, UpdateDoc, options);
               res.send(result);
          })

          app.patch("/submissions/:id", async (req, res) => {
               const id = req.params.id;
               const query = { _id: new ObjectId(id) };
               const updateDoc = {
                    $set: req.body
               };
               const result = await SubmissionsCollection.updateOne(query, updateDoc);
               res.send(result);
          });

          app.delete('/assignment/:id', async (req, res) => {
               const id = req.params.id;
               const query = { _id: new ObjectId(id) };
               const result = await AssignmentsCollection.deleteOne(query);
               res.send(result)
          })

          // await client.db("admin").command({ ping: 1 });
          // console.log("Pinged your deployment. You successfully connected to MongoDB!");
     } finally {
          // Ensures that the client will close when you finish/error
          //     await client.close();
     }
}
run().catch(console.dir);



app.listen(port, () => {
     console.log(`Example app listening on port ${port}`)
})


// c2qaVTEwH4afu0Ma
// Create-Ass-BD