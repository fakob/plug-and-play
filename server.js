const path = require('path');
const express = require('express');

const buildInfo = {
  buildVersion: process.env.HEROKU_RELEASE_VERSION,
  buildTime: process.env.HEROKU_RELEASE_CREATED_AT,
};

const app = express();

app.use(express.static(path.join(__dirname, 'dist')));
app.set('port', process.env.PORT || 8080);

app.get('/buildInfo', function (req, res) {
  res.send(buildInfo);
});

const server = app.listen(app.get('port'), function () {
  console.log('listening on port ', server.address().port);
  console.log(buildInfo);
});
