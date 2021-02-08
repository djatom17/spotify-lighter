var express = require("express");
var createError = require("http-errors");
var cors = require("cors");
var cookieParser = require("cookie-parser");

var app = express();

app
  .use(cors())
  .use(cookieParser())
  .use(express.static(__dirname + "/public"));

app.use("/auth/spotify", require("./api/auth/spotify"));

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
