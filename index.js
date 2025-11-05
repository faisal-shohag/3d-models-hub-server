const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const admin = require("firebase-admin");
require("dotenv").config()
const serviceAccount = require("./serviceKey.json");
const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());
//model-db:ln8EZw3WjosINW9w

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


const uri =
  `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.fc5kt4o.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).send({
      message: "unauthorized access. Token not found!",
    });
  }

  const token = authorization.split(" ")[1];
  try {
    await admin.auth().verifyIdToken(token);

    next();
  } catch (error) {
    res.status(401).send({
      message: "unauthorized access.",
    });
  }
};

async function run() {
  try {
    // await client.connect();

    const db = client.db("model-db");
    const modelCollection = db.collection("models");
    const downloadCollection = db.collection("downloads");

    // find
    // findOne

    app.get("/models", async (req, res) => {
      const result = await modelCollection.find().toArray();
      res.send(result);
    });

    app.get("/models/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const objectId = new ObjectId(id);

      const result = await modelCollection.findOne({ _id: objectId });

      res.send({
        success: true,
        result,
      });
    });

    // post method
    //  insertOne
    //  insertMany

    app.post("/models",   async (req, res) => {
      const data = req.body;
      // console.log(data)
      const result = await modelCollection.insertOne(data);
      res.send({
        success: true,
        result,
      });
    });

    //PUT
    //updateOne
    //updateMany

    app.put("/models/:id",  async (req, res) => {
      const { id } = req.params;
      const data = req.body;
      // console.log(id)
      // console.log(data)
      const objectId = new ObjectId(id);
      const filter = { _id: objectId };
      const update = {
        $set: data,
      };

      const result = await modelCollection.updateOne(filter, update);

      res.send({
        success: true,
        result,
      });
    });

    // delete
    // deleteOne
    // deleteMany

    app.delete("/models/:id",  async (req, res) => {
      const { id } = req.params;
      //    const objectId = new ObjectId(id)
      // const filter = {_id: objectId}
      const result = await modelCollection.deleteOne({ _id: new ObjectId(id) });

      res.send({
        success: true,
        result,
      });
    });

    //    latest 6 data
    // get
    // find

    app.get("/latest-models", async (req, res) => {
      const result = await modelCollection
        .find()
        .sort({ created_at: "desc" })
        .limit(6)
        .toArray();

      console.log(result);

      res.send(result);
    });


    app.get("/my-models", verifyToken, async(req, res) => {
      const email = req.query.email
      const result = await modelCollection.find({created_by: email}).toArray()
      res.send(result)
    })

    app.post("/downloads/:id", async(req, res) => {
      const data = req.body
      const id = req.params.id
      //downloads collection...
      const result = await downloadCollection.insertOne(data)



      //downloads counted 
      const filter = {_id: new ObjectId(id)}
      const update = {
        $inc: {
          downloads: 1
        }
      }
      const downloadCounted = await modelCollection.updateOne(filter, update)
      res.send({result, downloadCounted})
    })

     app.get("/my-downloads", verifyToken, async(req, res) => {
      const email = req.query.email
      const result = await downloadCollection.find({downloaded_by: email}).toArray()
      res.send(result)
    })

    app.get("/search", async(req, res) => {
      const search_text = req.query.search
      const result = await modelCollection.find({name: {$regex: search_text, $options: "i"}}).toArray()
      res.send(result)
    })




    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running fine!");
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
