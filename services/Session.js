// /services/Session.js
const SECRET = process.env["secret"] || "the fuzziest of llamas";
const forge = require("forge");
const User = require("../models/User");

const createSignedSessionId = username => {
  return `${username}:${generateSignature(username)}`;
};

const generateSignature = username => {
  let md = forge.md.sha256.create();
  md.update(username + SECRET);
  return md.digest().toHex();
};

const guardian = (req, res, next) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) next();
  else {
    const [username, signature] = sessionId.split(":");

    User.findOne({ username })
      .then(user => {
        if (signature === generateSignature(username)) {
          req.user = user;
          res.locals.currentUser = user;
          next();
        } else res.send("You've tampered with your session!");
      })
      .catch(e => res.status(500).end(e.stack));
  }
};

const loggedInOnly = (req, res, next) => {
  if (req.user) next();
  else res.redirect("login");
};

const loggedOutOnly = (req, res, next) => {
  if (!req.user) next();
  else res.redirect("/");
};

module.exports = {
  createSignedSessionId,
  guardian,
  loggedOutOnly,
  loggedInOnly
};