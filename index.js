const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const admin = require("firebase-admin");
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf-8')
const serviceAccount = JSON.parse(decoded);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const verifyFireBaseToken = async (req, res, next) => {
  const authToken = req?.headers.authorization;
  if (!authToken || !authToken.startsWith('Bearer ')) {
    return res.status(401).send({ message: 'unauthorized access' })
  }
  const token = authToken.split(' ')[1]
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.decoded = decoded;
    next();
  } catch (error) {
    return res.status(401).send({ message: 'unauthorized access' })
  }
};

// Root route
app.get('/', (req, res) => {
  res.send('Server is running');
});

// MongoDB setup
const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@abdulhalim.7yzjk6t.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
});

async function run() {
  try {
    const AssignmentsCollection = client.db('AssignmentsBD').collection('Assignments');
    const SubmissionsCollection = client.db('AssignmentsBD').collection('Submissions');

    // ✅ Get Assignments with Pagination, Search, and Filter
    app.get("/assignments", async (req, res) => {
      try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { level, search } = req.query;
        const query = {};

        if (level) {
          query.level = level;
        }

        if (search) {
          query.title = { $regex: search, $options: "i" }; // case-insensitive search
        }

        const total = await AssignmentsCollection.countDocuments(query);
        const assignments = await AssignmentsCollection
          .find(query)
          .skip(skip)
          .limit(limit)
          .toArray();

        res.send({
          data: assignments,
          pagination: {
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
          }
        });
      } catch (error) {
        console.error("Error fetching assignments:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    // ✅ Get Single Assignment
    app.get('/assignment/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await AssignmentsCollection.findOne(query);
      res.send(result);
    });

    // ✅ Get Submissions
    app.get('/submissions', async (req, res) => {
      try {
        const { status, submittedBy } = req.query;
        const query = {};

        if (submittedBy) {
          return verifyFireBaseToken(req, res, async () => {
            if (req.decoded.email !== submittedBy) {
              return res.status(403).send({ message: "forbidden access" });
            }
            if (status) query.status = status;
            query.submittedBy = submittedBy;
            const result = await SubmissionsCollection.find(query).toArray();
            return res.json(result);
          });
        }

        if (status) query.status = status;
        const result = await SubmissionsCollection.find(query).toArray();
        res.json(result);
      } catch (error) {
        console.error("Error fetching submissions:", error);
        res.status(500).json({ error: "Failed to fetch submissions" });
      }
    });

    // ✅ Add Assignment
    app.post('/assignments', async (req, res) => {
      const newAssignment = req.body;
      const result = await AssignmentsCollection.insertOne(newAssignment);
      res.send(result);
    });

    // ✅ Submit Assignment
    app.post('/submissions', async (req, res) => {
      const submission = req.body;
      const result = await SubmissionsCollection.insertOne(submission);
      res.send(result);
    });

    // ✅ Update Assignment
    app.put('/assignment/:id', async (req, res) => {
      const id = req.params.id;
      const update = req.body;
      const result = await AssignmentsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: update },
        { upsert: true }
      );
      res.send(result);
    });

    // ✅ Update Submission Status
    app.patch('/submissions/:id', async (req, res) => {
      const id = req.params.id;
      const result = await SubmissionsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: req.body }
      );
      res.send(result);
    });

    // ✅ Delete Assignment
    app.delete('/assignment/:id', async (req, res) => {
      const id = req.params.id;
      const result = await AssignmentsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

  } finally {}
}
run().catch(console.dir);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
