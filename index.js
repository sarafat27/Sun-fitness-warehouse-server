const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//middleware
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ meassage: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        console.log('decoded', decoded)
        req.decoded = decoded;
        next();
    })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ibcbb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const equipmentCollection = client.db('gymWarehouse').collection('equipment');
        const addedItemsCollection = client.db('gymWarehouse').collection('addedItems');

        //Auth API
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ accessToken });
        })

        //services API
        //get all data
        app.get('/equipment', async (req, res) => {
            const query = {};
            const cursor = equipmentCollection.find(query);
            const equipments = await cursor.toArray();
            res.send(equipments);
        });


        //post a data to all equipments
        app.post('/equipment', async (req, res) => {
            const newEquipment = req.body;
            const result = await equipmentCollection.insertOne(newEquipment);
            res.send(result);
        });

        //post a data to added Items
        app.post('/addedItems', async (req, res) => {
            const newItem = req.body;
            const result = await addedItemsCollection.insertOne(newItem);
            res.send(result);
        })

        //Get data from addedItems
        app.get('/addedItems', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (decodedEmail === email) {
                const query = { email: email }
                const cursor = addedItemsCollection.find(query);
                const addedItems = await cursor.toArray();
                res.send(addedItems)
            }
            else {
                res.status(403).send({ meassage: 'forbidden access' })
            }
        })


        //get detail
        app.get('/equipment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const detail = await equipmentCollection.findOne(query);
            res.send(detail)
        });

        //update a equipment quantity
        app.put('/equipment/:id', async (req, res) => {
            const id = req.params.id;
            const updatedQuantity = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    quantity: updatedQuantity.quantity
                }
            }
            const result = await equipmentCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });
        //Delete a equipment
        app.delete('/equipment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await equipmentCollection.deleteOne(query)
            res.send(result)
        });

        //Delete an item from added items
        app.delete('/addedItems/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await addedItemsCollection.deleteOne(query)
            res.send(result)
        })
    }
    finally {

    }

}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('server is running now and then')
});

app.listen(port, () => {
    console.log('listening to port', port)
})