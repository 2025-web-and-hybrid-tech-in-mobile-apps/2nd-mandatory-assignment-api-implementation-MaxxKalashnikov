const express = require("express");
const jwt = require('jsonwebtoken')
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy
const extractJwt = require('passport-jwt').ExtractJwt
const app = express();
const port = process.env.PORT || 3000;
const SECRET_JWT_KEY = process.env.SECRET_JWT_KEY || "mySecretKey"

app.use(express.json()); // for parsing application/json

// ------ WRITE YOUR SOLUTION HERE BELOW ------//

let userObject = {}
let scoresArrayOfObjects = []

function generateToken(userHandle){
  return jwt.sign({userHandle: userHandle}, SECRET_JWT_KEY)
}

const optionsForJwtValidation = {
  jwtFromRequest: extractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: SECRET_JWT_KEY
}

passport.use(new JwtStrategy(optionsForJwtValidation, (payload, done) => {
  //i can do anything with the payload here
  done(null, true)
}))

function validateJWTToken(req, res, next){
  if(req.headers.authorization){
    const token = req.headers.authorization.split(" ")[1]
    if(token != "" || token != undefined){
        jwt.verify(token, SECRET_JWT_KEY, (err, decoded) => {
          if (err) return res.status(401).json({ error: "Unauthorized, JWT token is missing or invalid" });
          next();
      });
    } 
  }else{
    res.status(401).json({ error: "Unauthorized, JWT token is missing or invalid" });
  }
}

function requestValidationForLoginAndSignup(req, res, next){
  const {userHandle, password} = req.body

  if(userHandle && password && //checking uname and pass fields 
    userHandle.length >= 6 && password.length >= 6 &&  // checking their length 
    Object.keys(req.body).length == 2 && //making sure that there are no extra fields in the req.body object 
    typeof(userHandle) == "string" && typeof(password) == "string") { //checking dt for usename and password
    next()
  }else{
    res.status(400).json("Invalid request body")
  }
}

function requestValidationForHighScotes(req, res, next){
  const {level, userHandle, score, timestamp} = req.body

  if(level && userHandle && score && timestamp) {//checking do fields exist
    next()
  }else{
    res.status(400).json("Invalid request body")
  }
}

app.post('/signup', requestValidationForLoginAndSignup, (req, res) => {
  userObject = {...req.body}
  res.status(201).json("User registered successfully")
})

app.post('/login', requestValidationForLoginAndSignup, (req, res) => {
  const {userHandle, password} = req.body

  if(userHandle === userObject.userHandle && password === userObject.password){
    const token = generateToken(userHandle)
    res.status(200).json({jsonWebToken: token})
  }else{
    res.status(401).json("Unauthorized, incorrect username or password")
  }
})

app.post('/high-scores', passport.authenticate('jwt', { session: false }), requestValidationForHighScotes, (req, res) => {
  scoresArrayOfObjects.push(req.body)
  scoresArrayOfObjects = scoresArrayOfObjects.sort((a, b) => b.score - a.score)
  res.status(201).json("High score posted successfully")
})

app.get('/high-scores', (req, res) => {
  const level = req.query.level
  let scoreseForLevel = scoresArrayOfObjects.filter(rec => rec.level === level)
  if(req.query.page){
    const lowerBorder = ((req.query.page - 1) * 20) - 1
    const higherBorder = req.query.page * 20

    let scoresForCertainPage = 
    scoreseForLevel.filter((_, index) => index > lowerBorder && index < higherBorder)
    
    res.status(200).json(scoresForCertainPage)
  }else{
    let scoresIfNoPage = scoreseForLevel.filter((_, index) => index < 20)
    res.status(200).json(scoresIfNoPage)
  }
})

//------ WRITE YOUR SOLUTION ABOVE THIS LINE ------//

let serverInstance = null;
module.exports = {
  start: function () {
    serverInstance = app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  },
  close: function () {
    serverInstance.close();
  },
};
