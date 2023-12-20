const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const database = client.db('Dines-Junction-Client');
    const allFoodCollection = database.collection('all food');


    // get all food in the all food routes
    app.get('/api/v1/route/getallfood', async(req, res) => {
      const options = {
        sort: {price: 1},
        projection : {_id: 1, foodCategory: 1, foodImage: 1, foodName: 1, price: 1, quantity: 1}
      }
      const cursor = allFoodCollection.find({}, options);
      const result =await cursor.toArray();
      res.send(result);
    })

  // get a single food item from the allfood page
  app.get('/api/v1/route/getallfood/singlefood/:id', async(req, res) => {
    const foodId = req.params.id;
    const query = {_id: new ObjectId(foodId)};
    const result = await allFoodCollection.findOne(query);
    res.send(result)
  })






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