const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const querystring = require('node:querystring');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const compression = require('compression');

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_REDIRECT_URL = process.env.GITHUB_REDIRECT_URL;
const SESSION_SECRET = process.env.SESSION_SECRET;
const SESSION_COOKIE_NAME = 'pp-session-id';

const buildInfo = {
  buildVersion: process.env.HEROKU_RELEASE_VERSION,
  buildTime: process.env.HEROKU_RELEASE_CREATED_AT,
};

const app = express();
app.disable("x-powered-by");


app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression({ filter: shouldCompress }));

function shouldCompress(req, res) {
  if (req.headers['x-no-compression']) {
    // don't compress responses with this request header
    return false;
  }

  // fallback to standard filter function
  return compression.filter(req, res);
}

app.use(express.json()); // needs to be after bodyParser

app.use(cookieParser());

// see if disabling this causes any issues
//app.use(cors());

app.use(
  session({
    cookie: {
      maxAge: 172_800_000, // 48h
    },
    name: SESSION_COOKIE_NAME,
    store: new MemoryStore({
      checkPeriod: 172_800_000, // prune expired entries every 48h
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

app.get('/listExamples', (req, res) => {
  const assetsFolderPath = path.join(__dirname, 'dist', 'assets', 'examples');
  fs.readdir(assetsFolderPath, { withFileTypes: false }, (err, files) => {
    res.header('Content-Type', 'application/json');
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ error: 'An error occurred while listing files.' });
    }
    res.json({ files });
  });
});

app.get('/auth-with-github', async function (req, res) {
  res.redirect(
    `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${GITHUB_REDIRECT_URL}&scope=gist`
  );
});

app.get('/oauth/redirect', async function (req, res) {
  const code = req.query?.code;

  if (!code) {
    return res.status(400).json({ error: 'No code provided in the request.' });
  }

  try {
    await getGitHubUser({ req, code });
    res.redirect(`/`);
  } catch (error) {
    console.error('Failed to get GitHub user:', error);
    res.status(500).send({ error: 'Failed to authenticate with GitHub.' });
  }
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
  const shareableLinkBase = 'https://plugandplayground.dev/?loadURL=';

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
      if (response.data.error) {
        if (data.sessionExpired) {
          props.setIsLoggedIn(false);
        }
        throw new Error(data.error);
      }
      const shareableLink =
        shareableLinkBase + response.data.files[fileName].raw_url;
      const newDescription = `${description} | load playground: ${shareableLink}`;
      const updateData = {
        gist_id: response.data.id,
        description: newDescription,
      };

      return axios.patch(
        `https://api.github.com/gists/${response.data.id}`,
        updateData,
        {
          headers: {
            Authorization: `token ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    })
    .then((response) => {
      const shareableLink =
        shareableLinkBase + response.data.files[fileName].raw_url;
      const dataBack = {
        shareableLink,
        htmlUrl: response.data.html_url,
      };
      res.json(dataBack);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send({ error });
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
