var spotifyAuth = require("express").Router();
var stringify = require("querystring").stringify;
var axios = require("axios").default;

const dotenv = require("dotenv");
dotenv.config();

const CLIENT_ID = "f04e4f0caee14520b4e74c9e82b710f4";
const REDIRECT_URI = "http://localhost:8888/auth/spotify/callback/";
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

spotifyAuth.get("/login", (req, res) => {
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

spotifyAuth.get("/callback", (req, res) => {
  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[STATE_KEY] : null;

  if (state === null || state !== storedState) {
    res.redirect(
      "/#" +
        stringify({
          error: "state_mismatch",
        })
    );
  } else {
    res.clearCookie(STATE_KEY);
    var auth_form = stringify({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: REDIRECT_URI,
    });

    var auth_config = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          new Buffer.from(
            CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
          ).toString("base64"),
      },
    };

    axios
      .post("https://accounts.spotify.com/api/token", auth_form, auth_config)
      .then((response) => {
        if (response.data) {
          // !error
          var access_token = response.data.access_token,
            refresh_token = response.data.refresh_token;
          axios
            .get("https://api.spotify.com/v1/me", {
              headers: { Authorization: "Bearer " + access_token },
            })
            .then((response) => {
              console.log("User authentication successful.");
              res.send(response.data);
            })
            .catch((err) => res.send(err));
        } else {
          res.redirect("/#" + stringify({ error: "invalid_token" }));
        }
      })
      .catch((err) => res.send(err));
  }
});

spotifyAuth.get("/refresh-token", (req, res) => {
  var refresh_token = req.query.refresh_token;
  axios
    .post(
      "https://accounts.spotify.com/api/token",
      { grant_type: "refresh_token", refresh_token: refresh_token },
      {
        headers: {
          Authorization:
            "Basic " +
            new Buffer.from(
              client_id + ":" + process.env.SPOTIFY_CLIENT_SECRET
            ).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    )
    .then((response) => {
      if (response.data) {
        var access_token = response.data.access_token;
        res.send({
          access_token: access_token,
        });
      }
    })
    .catch((err) => console.log(err));
});

module.exports = spotifyAuth;
