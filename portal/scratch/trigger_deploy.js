const https = require('https');

const url = 'https://api.vercel.com/v1/integrations/deploy/prj_r8wZQg9etgKZuuhAjRjyUoqzyeQy/DDTn4p8rkR';

https.request(url, { method: 'POST' }, (res) => {
  console.log('Status Code:', res.statusCode);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
}).on('error', (e) => {
  console.error(e);
}).end();
