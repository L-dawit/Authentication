
const session = require('express-session');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const dotenv = require('dotenv').config();
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;



const app = express()
app.use(express.static('public'));

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
// setting the options using express-session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // rolling: true,
    // cookie: { mazAge: 30000 }
}))
app.use(passport.initialize());
app.use(passport.session());

// creating the mongoose schema and passing the passport-local-mongoose as the plugin
mongoose.connect('mongodb://localhost:27017/usersDB');
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String
})
userSchema.plugin(passportLocalMongoose);


const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    console.log('ser...')
    done(null, user.id);
  });
  
passport.deserializeUser(function(id, done) {
    console.log('deser...')
    User.findById(id).then(function(user) {
        done(null, user);
      });
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  function(accessToken, refreshToken, profile, cb) {
    const id = profile.id;
    User.findOne({googleId: id }).then(foundUser => {
        if (!foundUser) {
            const newUser = new User({
                username: id,
                googleId: id
            })
            newUser.save().then(savedUser => {
                console.log('savedUser: ' + savedUser);
                return cb(null, savedUser);
            })
        } else {
            console.log('foundUser: ' + foundUser);
            return cb(null, foundUser);
        }
    })
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    const id = profile.id;
    User.findOne({facebookIds: id }).then(foundUser => {
        if (!foundUser) {
            const newUser = new User({
                username: id,
                facebookId: id
            })
            newUser.save().then(savedUser => {
                console.log('savedUser: ' + savedUser);
                return cb(null, savedUser);
            })
        } else {
            console.log('foundUser: ' + foundUser);
            return cb(null, foundUser);
        }
    })
  }
));
app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

// handling the request from the sign in with google request

app.get('/auth/google', 
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


app.get('/', (req, res) => {
    res.render('home');
})

app.route('/register')
    .get((req, res) => {
        res.render('register');
    })
    .post((req, res) => {
        User.register({username: req.body.username}, req.body.password, (err, user) => {
            if(err) {
                console.log(err);
                res.redirect('/register');
            } else {
                passport.authenticate('local')(req, res, () => {
                    res.redirect('/secrets');
                })
            }
            
        });
    })
app.route('/login')
    .get((req, res) => {
        res.render('login');
    })
    .post((req, res) => {
        const user = User({
            username: req.body.username,
            password: req.body.password
        })
        req.login(user, (err) => {
            if (err) { 
                console.log(err);
                res.redirect('/login');
            } else {
                passport.authenticate('local')(req, res, () => {
                    res.redirect('/secrets');
                })
            }
          });
    });

app.get('/secrets', (req, res) => {
    if(req.isAuthenticated()) {
        res.render('secrets');
    }
    else {
        res.redirect('/login');
    }
})

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) { 
            console.log(err); 
        } 
        res.redirect('/');
      });
})



const port = process.env.PORT || 3000
app.listen(port, () => console.log('Listening on port : ' + port));