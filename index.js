const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ibcbb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const equipmentCollection = client.db('gymWarehouse').collection('equipment');
        app.get('/equipment', async (req, res) => {
            const query = {};
            const cursor = equipmentCollection.find(query);
            const equipments = await cursor.toArray();
            res.send(equipments);
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