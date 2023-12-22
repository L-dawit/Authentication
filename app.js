//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');


const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded( {extended: true} ));

// setting up the session

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
}))
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect('mongodb://localhost:27017/usersDB');

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

//use passport-local-mongoose as a plugin

userSchema.plugin(passportLocalMongoose);

// userSchema.path('email').validate(async (value) => {
//     const emailCount = await mongoose.models.User.countDocuments({email: value });
//     return !emailCount;
//   }, 'Email already exists');



const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




app.get('/', (req, res) => {
    res.render('home');
})
app.get('/secrets', (req, res) => {
    if(req.isAuthenticated()){
        res.render('secrets');
    } else {
        res.redirect('/login');
    }
})

app.route('/register')
    .get((req, res) => {
        res.render('register');
    })
    .post((req, res) => {
        User.register({username: req.body.username}, req.body.password, function(err, user) {
            if (err) {
                console.log(err);
                res.redirect('/register');
            } else {
                passport.authenticate("local")(req, res, function() {
                    res.redirect('/secrets');
                  });
            }
          });
    });
app.route('/login')
    .get((req, res) => {
        res.render('login');
    })
    .post((req, res) => {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        })
        req.login(user, function(err) {
            if (err) { 
                console.log(err);
                res.redirect('/login');
             } else {
                passport.authenticate("local")(req, res, function() {
                    res.redirect('/secrets');
                  });
             }
          });
        
    })

app.get('/logout', (req, res) => {
    req.logout(function(err) {
        res.redirect('/');
    })
})
app.listen(3000, () => console.log('Server is running on port 3000'));