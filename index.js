const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middleware
app.use(cors());
app.use(express.json())

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

          app.get('/assignments', async (req, res) => {
               const result = await AssignmentsCollection.find().toArray();
               res.send(result);
          })

          app.get('/assignment/:id', async (req, res) => {
               const id = req.params.id;
               const query = {_id: new ObjectId(id)};
               const result = await AssignmentsCollection.findOne(query);
               res.send(result)
          })


          app.post('/assignments', async (req, res) => {
               const newAssignment = req.body
               const result = await AssignmentsCollection.insertOne(newAssignment);
               res.send(result);
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