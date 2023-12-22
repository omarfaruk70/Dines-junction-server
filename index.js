const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true 
}));
app.use(express.json());



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
    const database = client.db('Dines-Junction');
    const allFoodCollection = database.collection('all food');
    const purchaseFoodCollection = database.collection('purchased foods');


    // get all food in the all food routes
    // 1. ----> sortbyquery(origin/country)
    // demo link: http://localhost:5000/api/v1/route/getallfood?origin='Bangladesh' eivabe request korle specific origin er data dibe
    // ar na hole sob dibe.. eita ekta object er maddhome pathate hoy.
    // 2. ---> sort by accending / or decending
    app.get('/api/v1/route/getallfood', async(req, res) => {

      let queryObj = {};  // filter by country(bangladesh, india, china, america)
      const sortObj = {};


      const origin = req.query.origin;
      const sortField = req.query.sortField;
      const sortOrder = req.query.sortOrder;

      const options = {
        projection : {_id: 1, foodCategory: 1, foodImage: 1, foodName: 1, price: 1, origin: 1, quantity: 1}
      }

      if(origin){
        queryObj.origin = origin;
      }
      if(sortField && sortOrder){
        sortObj[sortField] = sortOrder;
      }
      const cursor = allFoodCollection.find({}, options, queryObj).sort(sortObj);
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

   // get a single food item for loading the order/purchase page
   app.get('/api/v1/route/getallfood/fooditem/:id', async(req, res) => {
    const foodId = req.params.id;
    const query = {_id: new ObjectId(foodId)};
    const options = {
      sort: {price: 1},
      projection : {foodName: 1, price: 1, quantity: 1}
    }
    const result = await allFoodCollection.findOne(query, options);
    res.send(result)
  })

  // post user purchase informations at a collection
  app.post('/api/v1/user/purchasefood', async(req, res) => {
    const specificFood = req.body;
    const result = await purchaseFoodCollection.insertOne(specificFood);
    // console.log(result);
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