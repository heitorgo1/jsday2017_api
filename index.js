var restify = require('restify');
var server = restify.createServer();
var fb = require("firebase-admin");
var uuid = require('node-uuid');
var morgan = require('morgan');
// Load the SDK 
var AWS = require('aws-sdk');
var fs = require('fs');

AWS.config.update({region:'us-east-1'});

// Create an Rekognition client
var rekog = new AWS.Rekognition();

var serviceAccount = require("./jsday2017-firebase-adminsdk-tajsg-55a30643f2.json");

fb.initializeApp({
  credential: fb.credential.cert(serviceAccount),
  databaseURL: "https://jsday2017.firebaseio.com",
  storageBucket: "gs://jsday2017.appspot.com/"
});
const db = fb.database();

const ref = db.ref('/');

const petsRef = ref.child('pets');
const rankRef = ref.child('rank');

const threshold = 90;

let getTags = (labels) => {
  return labels
    .filter((value) => {
      return value.Confidence >= threshold;
    })
    .map((value) => {
      return value.Name;
    })
}


fs.readFile('cats.jpg', (err, cats) => {
  if (err) throw err;
  fs.readFile('dogs.jpg', (err, dogs) => {
    if (err) throw err;
    var paramsCats = {
      Image: { /* required */
        Bytes: cats || 'STRING_VALUE'
      }
    }
    var paramsDogs = {
      Image: { /* required */
        Bytes: dogs || 'STRING_VALUE'
      }
    }
    const idCats = uuid.v4();
    const idDogs = uuid.v4();

    rekog.detectLabels(paramsCats, (err, catsData) => {
      if (err) throw err;
      rekog.detectLabels(paramsDogs, (err, dogsData) => {
        if (err) throw err;
        ref.once('value').then(function (ds) {
          if (!ds.hasChild('rank')) {
            rankRef.push({
              imageUrl: 'https://randomuser.me/api/portraits/women/82.jpg',
              points: 100,
              name: 'Joana'
            })
            rankRef.push({
              imageUrl: 'https://randomuser.me/api/portraits/men/57.jpg',
              points: 50,
              name: 'João'
            })

          }

          if (!ds.hasChild('pets')) {
            petsRef.push({
              tags: getTags(catsData.Labels),
              image: new Buffer(cats, 'binary').toString('base64'), 
              lastSeen: new Date().toString(),
              location: {
                latitude: "-12.2601802",
                longitude: "-38.9511515"
              }
            });

            petsRef.push({
              tags: getTags(dogsData.Labels),
              image: new Buffer(dogs, 'binary').toString('base64'), 
              lastSeen: new Date().toString(),
              location: {
                latitude: "-12.26018",
                longitude: "-38.9511515"
              } 
            });
          }

        });
        
      });
    });

    
  });
});


server.use(restify.plugins.bodyParser());
server.use(restify.plugins.urlEncodedBodyParser());
server.use(morgan())
/*
fs.readFile('cats.jpg', function(err, data) {
    if (err) throw err; // Fail if the file can't be read.
    var params = {
    Image: {  required 
        Bytes: data || 'STRING_VALUE',
    },
    //MaxLabels: 0,
    MinConfidence: 0.0
    };
   

});
*/

const animals = ['dog', 'dogs', 'cat', 'cats'];

server.get('/rank', (req, res, next) => {
  rankRef.orderByKey().once('value', (snap) => {
    const arr = []
    Object.keys(snap.val()).forEach((val) => {
      arr.push(snap.val()[val]);
    })
    return res.send(200, arr);
  })
})

server.get('/pets', (req, res, next) => {

  petsRef.orderByKey().once('value', (snap) => {
    const arr = []
    Object.keys(snap.val()).forEach((val) => {
      arr.push(snap.val()[val]);
    })

    return res.send(200, arr);
  })
})

server.post('/detect', (req, res, next) => {
  const image = new Buffer(req.body.image, 'base64');
  const lastSeen = new Date(req.body.lastSeen);

  const params = {
    Image: {
      Bytes: image || "STRING_VALUE"
    }
  }

  rekog.detectLabels(params, (err, data) => {
    if (err) return res.send(500, { error: err.message });

    const tags = getTags(data.Labels);

    const found = tags.reduce((acc, value) => {
      return acc | (animals.includes(value.toLowerCase()));
    }, false)

    if (!found)
      return res.send(200, { isPet: false })

    petsRef.push({
      tags: tags,
      image: new Buffer(image, 'binary').toString('base64'),
      lastSeen: lastSeen,
    })

    return res.send(200, { isPet: true });
  })

  return next();
});

server.listen(3003, function() {
  console.log('hello');
});