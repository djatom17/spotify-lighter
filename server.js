var express = require("express");
var createError = require("http-errors");
var cors = require("cors");
var stringify = require("querystring").stringify;
var cookieParser = require("cookie-parser");
var axios = require("axios").default;

const dotenv = require("dotenv");
dotenv.config();

const CLIENT_ID = "f04e4f0caee14520b4e74c9e82b710f4";
const REDIRECT_URI = "http://localhost:8888/callback/";
const STATE_KEY = "spotify_auth_state";

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = (length) => {
  var text = "";
  var allowed =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    text += allowed.charAt(Math.floor(Math.random() * allowed.length));
  }
  return text;
};

var app = express();

app
  .use(cors())
  .use(cookieParser())
  .use(express.static(__dirname + "/public"));

app.get("/login", (req, res) => {
  var state = generateRandomString(16);
  res.cookie(STATE_KEY, state);
  var scope = "user-read-private user-read-email";
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      stringify({
        client_id: CLIENT_ID,
        response_type: "code",
        redirect_uri: REDIRECT_URI,
        state: state,
        scope: encodeURIComponent(scope),
      })
  );
});

// Handle 404 errors
app.use((_0, _1, next) => {
  return next(createError(404, "URL not found on this server."));
});

// Listen for requests
var listener = app.listen(8888, () => {
  console.log(
    "Spotify Lighter is listening on port " + listener.address().port
  );
});

module.exports = app;
