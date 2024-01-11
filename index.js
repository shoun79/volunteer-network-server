const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');

//middleware
app.use(cors())

app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cg7riyw.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

//verifyJWT
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).send({
            error: true,
            message: 'Unauthorized access'
        })
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({
                error: true,
                message: 'Unauthorized access'
            })
        }
        req.decoded = decoded;
        next();
    });
}

async function dbConnect() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        //await client.connect();

        const volunteerCollection = client.db('volunteersDB').collection('volunteers')
        const eventCollection = client.db('volunteersDB').collection('events');
        const bookingCollection = client.db('volunteersDB').collection('bookings');

        //JWT
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

            res.send({ token });
        })


        //routes
        app.get('/volunteers', verifyJWT, async (req, res) => {
            const result = await volunteerCollection.find().toArray();
            res.send({
                status: 'success',
                data: result
            })
        })

        app.get('/events', async (req, res) => {

            const currentPage = parseInt(req.query.currentPage) || 0;
            const itemsPerPage = parseInt(req.query.itemsPerPage) || 5;
            const skip = (currentPage * itemsPerPage);
            const result = await eventCollection.find().skip(skip).limit(itemsPerPage).toArray();
            res.send({
                status: 'success',
                data: result
            })
        })
        app.get('/totalEvents', async (req, res) => {
            const result = await eventCollection.estimatedDocumentCount();
            res.send({
                status: 'success',
                totalEvents: result
            })
        })

        app.get('/events/:id', async (req, res) => {
            const { id } = req.params;
            const result = await eventCollection.findOne({ _id: new ObjectId(id) });
            res.send({
                status: 'success',
                message: 'Event Added Successfully',
                data: result
            })
        })

        app.get('/bookings', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            if (decoded.email !== req.query.email) {
                return res.status(403).send({
                    error: true,
                    message: 'Forbidden access'
                })
            }
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await bookingCollection.find(query).toArray();
            res.send({
                status: 'success',
                data: result
            })
        })

        /* email params diye kora

        app.get('/bookings/:email', async (req, res) => {
            const { email } = req.params;
            console.log(email);
            const result = await bookingCollection.find({ email }).toArray();
            res.send({
                status: 'success',
                data: result
            })
        })
        */

        app.post('/volunteers', async (req, res) => {
            const result = await volunteerCollection.insertOne(req.body);
            res.send({
                status: 'success',
                message: 'Volunteer Register Complete'
            })
        })

        app.post('/events', async (req, res) => {
            const result = await eventCollection.insertOne(req.body);
            res.send({
                status: 'success',
                message: 'Event added'
            })
        })

        app.post('/bookings', async (req, res) => {
            const result = await bookingCollection.insertOne(req.body);
            res.send({
                status: 'success',
                message: 'Booking added'
            })
        })

        app.delete('/volunteers/:id', async (req, res) => {
            const { id } = req.params;
            const result = await volunteerCollection.deleteOne({ _id: new ObjectId(id) });
            res.send({
                status: 'success',
                message: 'Volunteer Deleted Successfully'
            })
        })

        app.delete('/bookings/:id', async (req, res) => {
            const { id } = req.params;
            const result = await bookingCollection.deleteOne({ _id: new ObjectId(id) });
            res.send({
                status: 'success',
                message: 'Booking Deleted Successfully'
            })
        })





        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        //await client.close();
    }
}
dbConnect().catch(console.dir);





app.get('/', (req, res) => {
    res.send('Server running.....!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})