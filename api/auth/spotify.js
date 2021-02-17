var spotifyAuth = require("express").Router();
var stringify = require("querystring").stringify;
var axios = require("axios").default;
const { session } = require("electron");

const dotenv = require("dotenv");
dotenv.config();

const CLIENT_ID = "f04e4f0caee14520b4e74c9e82b710f4";
const REDIRECT_URI = "http://localhost:8888/auth/spotify/callback/";
const STATE_KEY = "spotify_auth_state";
const TIME_TO_EXPIRE = 1209600; // 2 weeks

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
    var authForm = stringify({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: REDIRECT_URI,
    });

    var authConfig = {
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
      .post("https://accounts.spotify.com/api/token", authForm, authConfig)
      .then((response) => {
        if (response.data) {
          // !error
          var accessToken = response.data.access_token,
            refreshToken = response.data.refresh_token;
          axios
            .get("https://api.spotify.com/v1/me", {
              headers: { Authorization: "Bearer " + accessToken },
            })
            .then((response) => {
              console.log("User authentication successful.");

              var expiry = Date.now() / 1000 + TIME_TO_EXPIRE;

              const accessCookie = {
                url: "https://www.spotify.com",
                name: "spotifyAccessToken",
                value: accessToken,
                secure: true,
                expirationDate: expiry,
              };

              const refreshCookie = {
                url: "https://www.spotify.com",
                name: "spotifyRefreshToken",
                value: refreshToken,
                secure: true,
                expirationDate: expiry,
              };

              session.defaultSession.cookies.set(accessCookie).then(
                () => {
                  console.log("Saved access token to cookie.");
                },
                (error) => {
                  console.error("Error saving access token to cookie", error);
                }
              );

              session.defaultSession.cookies.set(refreshCookie).then(
                () => {
                  console.log("Saved refresh token to cookie.");
                },
                (error) => {
                  console.error("Error saving refresh token to cookie", error);
                }
              );
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
  // Obtain refresh token from cookies.
  // If it is not found or expired, then redirect user to login.
  session.defaultSession.cookies
    .get({ url: "https://www.spotify.com", name: "spotifyRefreshToken" })
    .then((cookies) => {
      var refreshToken = cookies[0].value;
      axios
        .post(
          "https://accounts.spotify.com/api/token",
          { grant_type: "refresh_token", refresh_token: refreshToken },
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
            var accessToken = response.data.access_token;
            res.send({
              access_token: accessToken,
            });
          }
        })
        .catch((err) => console.log(err));
    })
    .catch((error) => {
      console.error(
        "Sorry, refresh token not found. Please login again.",
        error
      );
      res.redirect("/auth/spotify/login");
    });
});

module.exports = spotifyAuth;
