const express = require('express')
const bodyParser = require('body-parser');
const cors = require("cors");
const MongoClient = require('mongodb').MongoClient;
const admin = require('firebase-admin')

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ja8rs.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const port = 5000

const app = express();
app.use(cors());
app.use(bodyParser.json());



var serviceAccount = require("./configs/burj-al-arab-ef1d1-firebase-adminsdk-1xzwm-d2fb068351.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DB_FIRE
});


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookings = client.db("burjAlArab").collection("booking");

  app.post('/addBooking', (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking)
      .then(result => {
        res.send(result.insertedCount > 0)
        console.log(result)
      })
  })

  app.get('/bookings', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      console.log({ idToken })
      admin.auth().verifyIdToken(idToken)
        .then(function (decodedToken){
          let uidToken = decodedToken.uid
          console.log({uidToken});
          const emailToken = decodedToken.email;
          const queryEmail = req.query.email;
          console.log(emailToken, queryEmail);
          if(emailToken == queryEmail){
            bookings.find({ email: queryEmail })
            .toArray( (err, documents) =>{
              res.status(200).send(documents);
            })
          }
          else{
            res.status(401).send('Un-authorize Access')
          }

        }).catch(function (error) {
          // Handle error
        });
    } else{
      res.status(401).send('Un-authorize Access')
    }
  })
});



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port)