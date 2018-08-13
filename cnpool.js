//cnPool.vip Homepage.
//Created by xxcc.

const express = require('express');
const app = express();
const https = require('https');
const fs=require('fs');
const async = require("async");

app.set('views','.');
app.set('view engine', 'pug');

app.get('/', function(req, res) {
updatePools(res);
});
app.get('/css/default.css', function(req, res) {
res.sendFile(__dirname+'/css/default.css');
});

// POST method route
app.post('/', function (req, res) {

});

var server = app.listen(6666, function () {
var host = server.address().address;
var port = server.address().port;
  console.log('cnPool.vip listening at http://%s:%s', host, port);
});


// Initialize
//setInterval(updatePools, (30*1000));
//updatePools("dd");

function updatePools(res) {
var pools = JSON.parse(fs.readFileSync( "pools.json"));
var poolstats = [];
console.log(pools);
// assuming openFiles is an array of file names
async.each(pools, function(pool, callback) {
    // Perform operation on pool here.
    console.log('Processing pool: ' + pool.name);
    switch(pool.name) 
    {
     //file json file.
     case 'SNOW: Snowblossom':
            var snow = JSON.parse(fs.readFileSync( "report.json"));
            console.log(pool.name+ ": " + "");
            poolstats.push({
                  poolName : pool.name,
                  poolAlgo : pool.algo,
                  poolLink : pool.link,
                  poolHashrate : /\d+.\d+[K|M]?\/s/.exec(snow.poolhash),
            }); 
         callback();
         break;
     //from general api.
     default:
        var apiURL = pool.api + '/stats';
        https.get(apiURL, function (res) {
         var json = ' ';
         res.on('data', function (d) {
              json += d;
         });
         res.on('end', function () {
              json = JSON.parse(json);
              switch(pool.name)
              {
               case 'AQUA: aquachain':
                    console.log(pool.name+ ": " + json.hashrate);
                    poolstats.push({
                          poolName : pool.name,
                          poolHashrate : getReadableHashRate(json.hashrate),
                    });
                    callback();
                    break;
               //normally, for cryptonight algo.
               default:
                    console.log(pool.name+ ": " + json.pool.hashrate);
                    poolstats.push({
                          poolName : pool.name,
                          poolHashrate : getReadableHashRate(json.pool.hashrate),
                    });
                    callback();
                    break;
               }
          });
     }).on('error', function (e) {
          console.error(e);
          callback(e);
     }); 
         break;
    }
}, function(err) {
    // if any of the file processing produced an error, err would equal that error
    if( err ) {
      // One of the iterations produced an error.
      // All processing will now stop.
      console.log('A pool failed to process');
    } else {
      console.log('All files have been processed successfully');
      console.log("poolstats: " + poolstats[0].poolHashrate + " " + poolstats[1].poolHashrate + " " + poolstats[2].poolHashrate+ " " + poolstats[3].poolHashrate );
    }
});
}

// Get readable hashrate
function getReadableHashRate(hashrate){
    var i = 0;
    var byteUnits = [' H', ' KH', ' MH', ' GH', ' TH', ' PH' ];
    while (hashrate > 1000){
        hashrate = hashrate / 1000;
        i++;
    }
    return hashrate.toFixed(2) + byteUnits[i] + '/s';
}
