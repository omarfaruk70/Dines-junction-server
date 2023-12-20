const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000

app.use(express.json());
app.use(cors());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vs2xadg.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
   
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Dines junction server is running')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})