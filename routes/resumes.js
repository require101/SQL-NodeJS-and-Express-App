var express = require('express');
var router = express.Router();
var Bookshelf = require('../Database').__bookshelf;
var fs = require('fs');
var formidable = require('formidable');
var jwt = require('jsonwebtoken');
var cookie = require('cookie');

//Verify the login token
router.use(function(req, res, next){
  let cookies = cookie.parse(req.headers.cookie || '');
  var token = req.body.token || req.query.token || req.headers['x-access-token'] || req.cookies.token;

  if(token){
    jwt.verify(token, 'yes', function(err, decoded){
      if(err){
       res.render('error', {
          pageTitle: 'Error',
          error: 'Token not valid'
        });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    res.render('error', {
          pageTitle: 'Error',
          error: 'Token not found'
    });
  }
});

//get the route for displaying the resumes
router.get('/resumes/:accID', function(req, res, next) {

  var ident = req.params.accID;

  var rawSQL = "SELECT COUNT(Resume) as records_count FROM resumes WHERE ID = :ident";
  // Get the number of resumes for this account ID
  Bookshelf.knex.raw(rawSQL, {ident}).then(function(collection){

    var num = collection[0].records_count;
    
    //render the page that displays the resumes
    res.render('resumeList', {
      pageTitle: 'Resumes',
      accountID: ident,
      numResumes: num 
    });

  });

});

router.get('/resumes/:accID/:resID', function(req,res,next){
// display the pdf resume
    var resume = req.params.resID;
    var account = req.params.accID;

    //gets the binary for the resume where ID = account and resumeID = resume
    var rawMSSQL = 'SELECT Resume as records_count FROM resumes WHERE ID = :account AND resumeID = :resume';
    Bookshelf.knex.raw(rawMSSQL, {account, resume}).then(function(collection){

          console.log(collection[0].records_count);

          //stores the data in a temp location using a write stream
          var wstream = fs.createWriteStream('temp/tempResume.pdf');
          wstream.on('finish', function(){
            console.log('Finished');
          });
          wstream.write(collection[0].records_count, 'binary');
          wstream.end();

          // reads the file at the temporary location
          fs.readFile('temp/tempResume.pdf', function(err, file){
            res.writeHead(200, {"Content-Type" : "application/pdf" });
            res.write(file, "binary");
            res.end();
          });
        
    });

});

router.post("/resumes/upload", function(req, res, next){
  // create a form to handle document
  var form = new formidable.IncomingForm();
  
  //seperate into fields and files
  form.parse(req, function(err, fields, files){

    // find the account id
    var ident = fields['user'];
    console.log(ident);

    //change the path to C:/TEMP/tempUpload.pdf
    var oldpath= files.fileupload.path;
    var newpath = 'C:/TEMP/tempUpload.pdf';
    fs.rename(oldpath, newpath, function(err){
      if(err) throw(err);

      //find all resumes for the given account ID
      var rawSQL = "SELECT COUNT(resumeID) as records_count FROM resumes WHERE ID = :ident";
      Bookshelf.knex.raw(rawSQL, {ident}).then(function(col){
        var number = 1 + col[0].records_count;
        var name = 'Resume ' + number;
        console.log(number);
        console.log(name);

        //insert the file at the C:/TEMP/tempUpload.pdf locaton
        var newSQL = "INSERT INTO resumes(ID, Name, Resume, resumeID) VALUES (:ident, :name, (SELECT * FROM OPENROWSET(BULK N'C:/TEMP/tempUpload.pdf', SINGLE_BLOB) AS CategoryImage), :number)";
        Bookshelf.knex.raw(newSQL, {ident, name, number}).then(function(resp){
          console.log('Uploaded!');
          //reload the page
          res.redirect('/resumes/' + ident);
        });
      });
    });

  });

});

module.exports = router;