var express = require('express');
var router = express.Router();
var Bookshelf = require('../Database').__bookshelf;

router.get('/create', function(req, res, next) {

  //render the page for creating a user
  res.render('createuser', {
    pageTitle: 'Create User'
   });
});

router.post('/creating', function(req, res, next){
  //get the content from the user
  newu = req.body.username;
  newp = req.body.password;
  retype = req.body.retype;
  check = req.body.admin;
  console.log(check);

  // See if the passwords match
  if (newp !== retype){
    res.render('error', {
      pageTitle: 'Error',
      error: 'Passwords do not match'
    });
  }
  
  else {
    // See if there is a username already like the one given
    var rawSQL = 'SELECT COUNT(usernames) as records_count FROM accounts WHERE usernames = :newu';
  
    Bookshelf.knex.raw(rawSQL, {newu}).then(function (collection){

    console.log(collection[0].records_count);

    //see if the username is taken
    if (collection[0].records_count !== 0){
      res.render('error', {
          pageTitle: 'Error', 
          error: 'Username has already been taken'
      });
    }
    else{
      var adminID;
      console.log(check);
      if (check === 'on'){
        adminID = 1;
      }
      else{
        adminID = 0;
      }
      var newsql = 'INSERT accounts (usernames, passwords, isAdmin) VALUES (:newu, :newp, :adminID)'

      //if username is unique then insert data
      Bookshelf.knex.raw(newsql, {newu, newp, adminID}).then(function(resp){
        console.log(resp);
        res.send(`
        <p>
         <b> Success! New account had been created </b>
        </p>
          <a href = 'http://localhost:3000'> Go back to login Page </a>
        `)
      });
    }

  });
  
}

});


module.exports = router;