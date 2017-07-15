// Load the SDK and UUID
var AWS = require('aws-sdk');
var fs = require('fs');

AWS.config.update({region:'us-east-1'});

// Create an S3 client
var rekog = new AWS.Rekognition();

// Create a bucket and upload something into it
/*
var bucketName = 'node-sdk-sample-' + uuid.v4();
var keyName = 'hello_world.txt';
*/

fs.readFile('cats.jpg', function(err, data) {
    if (err) throw err; // Fail if the file can't be read.
    var params = {
    Image: { /* required */
        Bytes: data || 'STRING_VALUE',
    },
    //MaxLabels: 0,
    MinConfidence: 0.0
    };
    rekog.detectLabels(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
    });

});

/*
s3.createBucket({Bucket: bucketName}, function() {
  var params = {Bucket: bucketName, Key: keyName, Body: 'Hello World!'};
  s3.putObject(params, function(err, data) {
    if (err)
      console.log(err)
    else
      console.log("Successfully uploaded data to " + bucketName + "/" + keyName);
  });
});
*/