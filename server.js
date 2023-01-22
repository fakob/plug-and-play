const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const querystring = require('node:querystring');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const SESSION_SECRET = process.env.SESSION_SECRET;
const SESSION_COOKIE_NAME = 'pp-session-id';

const buildInfo = {
  buildVersion: process.env.HEROKU_RELEASE_VERSION,
  buildTime: process.env.HEROKU_RELEASE_CREATED_AT,
};

const app = express();

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.json()); // needs to be after bodyParser

app.use(cookieParser());

app.use(cors());

app.use(
  session({
    cookie: {
      maxAge: 86400000,
      // secure: true // will be uncommented before pushing to prod
    },
    name: SESSION_COOKIE_NAME,
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: false,
    secret: SESSION_SECRET,
  })
);

app.use(express.static(path.join(__dirname, 'dist')));

app.set('port', process.env.PORT || 8080);

app.get('/buildInfo', function (req, res) {
  res.send(buildInfo);
});

app.get('/oauth/redirect', async function (req, res) {
  const code = req.query?.code;

  if (!code) {
    throw new Error('No code!');
  }

  const gitHubUser = await getGitHubUser({ req, code });

  res.redirect(`/`);
});

app.get('/api/me', (req, res) => {
  if (!req.session.access_token) {
    return sessionExpired(res);
  }
  return res.send({ sessionExpired: false });
});

app.post('/create-gist', (req, res) => {
  const { description, fileName, fileContent, isPublic } = req.body;
  const data = {
    description: description,
    public: isPublic,
    files: {
      [fileName]: {
        content: fileContent,
      },
    },
  };

  if (!req.session.access_token) {
    return sessionExpired(res);
  }
  const accessToken = req.session.access_token;

  axios
    .post('https://api.github.com/gists', data, {
      headers: {
        Authorization: `token ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    .then((response) => {
      res.json(response.data);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send({ error });
    });
});

app.patch('/update-gist', (req, res) => {
  const { gistId, description, fileName, fileContent } = req.body;
  const data = {
    gist_id: gistId,
    description: description,
    files: fileName
      ? {
          [fileName]: {
            content: fileContent,
          },
        }
      : undefined,
  };

  if (!req.session.access_token) {
    return sessionExpired(res);
  }
  const accessToken = req.session.access_token;

  axios
    .patch(`https://api.github.com/gists/${gistId}`, data, {
      headers: {
        Authorization: `token ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    .then((response) => {
      res.json(response.data);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send({ error: 'A 500 error occurred' });
    });
});

app.get('/logout', (req, res) => {
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });

  const redirectUrl = req.query.redirectUrl ?? '/';
  console.log(redirectUrl);
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect(redirectUrl);
    }
  });
});

const server = app.listen(app.get('port'), function () {
  console.log('listening on port ', server.address().port);
  console.log(buildInfo);
});

async function getGitHubUser({ req, code }) {
  const githubToken = await axios
    .post(
      `https://github.com/login/oauth/access_token?client_id=${GITHUB_CLIENT_ID}&client_secret=${GITHUB_CLIENT_SECRET}&code=${code}`
    )
    .then((res) => res.data)

    .catch((error) => {
      throw error;
    });

  const decoded = querystring.parse(githubToken);

  const accessToken = decoded.access_token;
  req.session.access_token = accessToken;

  return axios
    .get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .then((res) => res.data)
    .catch((error) => {
      console.error(`Error getting user from GitHub`);
      throw error;
    });
}

function sessionExpired(res) {
  // the session or its access token has probably expired
  return res.status(401).send({
    error: 'Session expired: Please log in again',
    sessionExpired: true,
  });
}
