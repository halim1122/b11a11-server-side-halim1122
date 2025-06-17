const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
require('dotenv').config();

const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

const router = express.Router();

router.get('/', (req, res) => {
     res.send('✅ BrainBand server is running');
});

const uri = `mongodb+srv://${process.env.VITE_NAME}:${process.env.VITE_PASS}@abdulhalim.7yzjk6t.mongodb.net/?retryWrites=true&w=majority&appName=AbdulHalim`;

const client = new MongoClient(uri, {
     serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
     }
});

async function connectDB() {
     try {
          await client.connect();
          const AssignmentsCollection = client.db('AssignmentsBD').collection('Assignments');

          router.get('/assignments', async (req, res) => {
               const result = await AssignmentsCollection.find().toArray();
               res.send(result);
          });

          router.post('/assignments', async (req, res) => {
               const newAssignment = req.body;
               const result = await AssignmentsCollection.insertOne(newAssignment);
               res.send(result);
          });

     } catch (err) {
          console.error('MongoDB connection error:', err);
     }
}
connectDB();

app.use('/api', router);

// 🔁 Export handler for Vercel
module.exports.handler = serverless(app);
