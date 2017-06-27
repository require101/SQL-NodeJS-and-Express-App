var express = require('express');
var router = express.Router();
var Bookshelf = require('../Database').__bookshelf;
var jwt = require('jsonwebtoken');
var cookie = require('cookie');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    pageTitle: 'Main Page',
    pageID: 'login'
    });
});

router.post('/login', function(req, res, next){
  var uid = req.body.username;
  var pid = req.body.password;
  console.log(uid);

  console.log('Made POST');

  var rawSQL = 'SELECT COUNT(usernames) as records_count FROM accounts WHERE usernames = :uid AND passwords = :pid';
  
  Bookshelf.knex.raw(rawSQL, {uid, pid}).then(function (collection){

    //if no account throw error
    if (collection[0].records_count == 0){
      res.render('error', {
          pageTitle: 'Error', 
          error: 'Account not found'
      });
    }
    else{
      var newsql = 'SELECT ID as records_num FROM accounts WHERE usernames = :uid AND passwords = :pid';
      Bookshelf.knex.raw(newsql, {uid, pid}).then(function (collection){
        
        // Go to the url where ID is the Account number
        var ident = collection[0].records_num;

        //set a token for authentication
        var token = jwt.sign({username : uid, password : pid}, 'yes', {
          expiresIn: 1440 // expires in 24 hours
        });

        var url = '/resumes/' + ident;
        console.log(url);
        
        //store the token as a cookie
        res.cookie('token', token, {maxAge: 90000, httpOnly: true});

        //redirect to the resumes page
        res.redirect(url);
        
      });
      
      
    }

  });
});

//log out the user by deleting the token cookie
router.post('/logout', function(req, res, next){

  //set the expiration date to now
  res.cookie("token", "", {expires: new Date(0)});
  console.log('Logged out');

  var url = "http://localhost:3000/";
  res.redirect(url);

});

module.exports = router;