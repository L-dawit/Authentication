//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
mongoose.connect('mongodb://localhost:27017/usersDB');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        index: true,
        unique: true
    },
    password: String
});

userSchema.path('email').validate(async (value) => {
    const emailCount = await mongoose.models.User.countDocuments({email: value });
    return !emailCount;
  }, 'Email already exists');

let encKey = process.env.SOME_32BYTE_BASE64_STRING;
let sigKey = process.env.SOME_64BYTE_BASE64_STRING;
userSchema.plugin(encrypt, { encryptionKey: encKey, signingKey: sigKey, encryptedFields: ['password'] })



const User = mongoose.model('User', userSchema);



const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded( {extended: true} ));


app.get('/', (req, res) => {
    res.render('home');
})
app.route('/register')
    .get((req, res) => {
        res.render('register');
    })
    .post((req, res) => {
        const newUser = new User({
            email: req.body.username,
            password: req.body.password
        });
        newUser.save()
            .then(() => {res.render('secrets');
        })
        .catch(err => res.send(err));
        
    });
app.route('/login')
    .get((req, res) => {
        res.render('login');
    })
    .post((req, res) => {
        const username = req.body.username;
        const password = req.body.password;
        User.findOne({email: username})
            .then(user => {
                if(user) {
                    if(user.password === password){
                        res.render('secrets');
                    }
                }
            })
    })

app.listen(3000, () => console.log('Server is running on port 3000'));