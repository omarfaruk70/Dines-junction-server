const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// built in middlewares
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vs2xadg.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const database = client.db("Dines-Junction");
    const allFoodCollection = database.collection("all food");
    const purchaseFoodCollection = database.collection("purchased foods");


      // jwt middleware -----> if token is exist then enter or logout
      const logger = (req, res, next) => {
        const token = req.cookies.access_token;
        if (!token) {
          return res.status(401).send({ message: "UnAuthorized Access" });
        }
        jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decode) => {
          if (err) {
            return res.status(403).send({ message: "Forbidden Access" });
          }
          req.user = decode;
          next();
        });
      };

    // // Create a json web token and send it to the client side
    app.post("/api/v1/user/auth/jwt/access_token", async (req, res) => {
      const user = req.body;
      const jwtToken = jwt.sign(user, process.env.JWT_SECRET_KEY, {
        expiresIn: "1d",
      });
      res
        .cookie("access_token", jwtToken, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

  

    // get all food in the all food routes
    // 1. ----> sortbyquery(origin/country)
    // demo link: http://localhost:5000/api/v1/route/getallfood?origin='Bangladesh' eivabe request korle specific origin er data dibe
    // ar na hole sob dibe.. eita ekta object er maddhome pathate hoy.
    // 2. ---> sort by accending / or decending
    // demo link: http://localhost:5000/api/v1/route/getallfood/?origin=Bangladesh&sortField=price&sortOrder=asc
    // -----------> pagination fomate
    // demo link: http://localhost:5000/api/v1/route/getallfood/?origin=Bangladesh&sortField=price&sortOrder=asc&page=1&limit=10

    // get the total number of the foods
    app.get("/getallfood", async (req, res) => {
      const allfoodCount = await allFoodCollection.estimatedDocumentCount();
      res.send({ allfoodCount });
    });
    app.get("/api/v1/route/getallfood",  async (req, res) => {
      let queryObj = {}; // filter by country(bangladesh, india, china, america)
      const sortObj = {};

      const origin = req.query.origin;
      const sortField = req.query.sortField;
      const sortOrder = req.query.sortOrder;
      // pagination
      const page = Number(req.query.page);
      const limit = Number(req.query.limit);
      const skip = (page - 1) * limit;

      const options = {
        projection: {
          _id: 1,
          foodCategory: 1,
          foodImage: 1,
          foodName: 1,
          price: 1,
          origin: 1,
          quantity: 1,
        },
      };

      if (origin) {
        queryObj.origin = origin;
      }
      if (sortField && sortOrder) {
        sortObj[sortField] = sortOrder;
      }
      const cursor = allFoodCollection
        .find(queryObj, options)
        .sort(sortObj)
        .skip(skip)
        .limit(limit);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get a single food item from the allfood page
    app.get("/api/v1/route/getallfood/singlefood/:id", async (req, res) => {
      const foodId = req.params.id;
      const query = { _id: new ObjectId(foodId) };
      const result = await allFoodCollection.findOne(query);
      res.send(result);
    });

    // get a single food item for loading the order/purchase page
    app.get("/api/v1/route/getallfood/fooditem/:id", async (req, res) => {
      const foodId = req.params.id;
      const query = { _id: new ObjectId(foodId) };
      const options = {
        sort: { price: 1 },
        projection: {
          foodName: 1,
          price: 1,
          quantity: 1,
          madeBy: 1,
          foodImage: 1,
        },
      };
      const result = await allFoodCollection.findOne(query, options);
      res.send(result);
    });

    // get all orderd food item based on email
    app.get("/api/v1/route/getorderdfood", logger, async (req, res) => {
    const queryEmail = req.query.email;
    const tokenEmail = req.user.email;
    if(queryEmail.toLowerCase() !== tokenEmail.toLowerCase()){
      return res.status(401).send({message: 'UnAuthorized Access'});
    }
    let query = {};
    if(queryEmail){
      query.buyerEmail = queryEmail ; // alternative query["buyerEmail"] = queryEmail;
    }
    const result = await purchaseFoodCollection.find(query).toArray();
    res.send(result);
    });

    // get my added food based on user login email / jwt token email
    app.get('/api/v1/route/myaddedfood',logger, async(req, res) => {
      const queryEmail = req.query.email;
      const tokenEmail = req.user.email;
      if( !queryEmail || (queryEmail !== tokenEmail)){
       return res.status(401).send({message: 'UnAuthorized Access'})
      }
      else{
        let query = {};
        if(queryEmail){
          query.email = queryEmail;
        }
        const cursor = allFoodCollection.find(query);
        const result = await cursor.toArray() ;
        res.send(result);
      }
    })

    // get a single food of myaddedfood for update specific food information
    app.get('/api/v1/route/myaddedfood/:id', async(req, res) => {
      const foodId = req.params.id;
      const query = {_id: new ObjectId(foodId)};
      const result = await allFoodCollection.findOne(query);
      res.send(result);
    })
    // post user purchase informations at a collection
    app.post("/api/v1/user/purchasefood", logger, async (req, res) => {
      const specificFood = req.body;
      const result = await purchaseFoodCollection.insertOne(specificFood);
      res.send(result);
    });

    // post new add food on the allfoodCollection with AddBy(logged in userName and Email);
    app.post('/api/v1/user/addfood', logger, async(req, res)=> {
      const thisFood = req.body;
      const result = await allFoodCollection.insertOne(thisFood);
      res.send(result);
    })

    // Put or update a addedfood information
    app.put('/api/v1/user/updatefoodinfo/:id', async(req, res) => {
      const specificFoodId = req.params.id;
      const specificFood = req.body;
      const filter = {_id: new ObjectId(specificFoodId)}
      const updatedInfo = {
        $set: {
          foodName: specificFood.foodName,
          foodImage: specificFood.foodImage,
          foodCategory:specificFood.foodCategory,
          origin: specificFood.origin,
          price: specificFood.price,
          ingredients: specificFood.ingredients,
          quantity: specificFood.quantity
        }
      }
      const result = await allFoodCollection.updateOne(filter, updatedInfo);
      res.send(result);
      console.log(result);

    })
    // delete a specific orderd food
    app.delete('/api/v1/user/deletefood/:id', logger, async(req, res) => {
      const foodId = req.params.id;
      const query = {_id: new ObjectId(foodId)};
      const result = await purchaseFoodCollection.deleteOne(query);
      res.send(result);
    })
    // delete a specific added food item
    app.delete('/api/v1/route/myaddedfood/:id', async(req, res) => {
      const foodId = req.params.id;
      const query = {_id: new ObjectId(foodId)};
      const result = await allFoodCollection.deleteOne(query);
      res.send(result);
    })

    await client.db("admin").command({ ping: 1 });
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
  res.send("Dines junction server is running");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
