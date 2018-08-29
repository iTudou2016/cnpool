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
app.get('/css/style.css', function(req, res) {
res.sendFile(__dirname+'/css/style.css');
});

// POST method route
app.post('/', function (req, res) {

});

var server = app.listen(9000, function () {
var host = server.address().address;
var port = server.address().port;
  console.log('cnPool.vip listening at http://%s:%s', host, port);
});


// Initialize
//setInterval(updatePools, (30*1000));
//updatePools("dd");

function updatePools(res) {
var poolsAll = JSON.parse(fs.readFileSync( "pools.json"));
var poolstats = [];
var pools = [];
poolsAll.forEach(function(item) {
   // 获取已上线矿池信息
   if (item.enable) {
       pools.push(item);
   }
});
// assuming openFiles is an array of file names
async.each(pools, function(pool, callback) {
    // Perform operation on pool here.
    switch(pool.name) 
    {
     //from json file.
     case 'SNOW: Snowblossom':
            var snow = JSON.parse(fs.readFileSync( "/var/snowblossom/report.json"));
            poolstats.push({
                  poolName : pool.name,
                  poolAlgo : pool.algo,
                  poolLink : pool.link,
                  poolMiners : snow.workers || 0,
                  poolBlocks : snow.blockfound.length-1 || 0, 
                  poolHashrate : /\d+.\d+[K|M]?\/s/.exec(snow.poolhash),
                  networkHashrate : snow.networkhash,
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
                    poolstats.push({
                          poolName : pool.name,
                          poolAlgo : pool.algo,
                          poolLink : pool.link,
                          poolHashrate : getReadableHashRate(json.hashrate),
                          poolMiners : json.minersTotal || 0,
                          poolBlocks : json.maturedTotal+json.immatureTotal || 0,
                          networkHashrate : getReadableHashRate(json.nodes[0].difficulty/240),
                    });
                    callback();
                    break;
               //normally, for cryptonight algo.
               default:
                    var cnAlgorithm = json.config.cnAlgorithm || "cryptonight";
                    var cnVariant = json.config.cnVariant || 0;       
                    if (cnAlgorithm == "cryptonight_light") {
                       if (cnVariant === 1) {
                          algorithm = 'Cryptonight Light v7';
                       } else if (cnVariant === 2) {
                          algorithm = 'Cryptonight Light';
                       } else {
                          algorithm = 'Cryptonight Light';
                       }
                     }
                     else if (cnAlgorithm == "cryptonight_heavy") {
                        algorithm = 'Cryptonight Heavy';
                     }
                     else {
                        if (cnVariant === 1) {
                           algorithm = 'Cryptonight v7';
                        } else if (cnVariant === 3) {
                           algorithm = 'Cryptonight v7';
                        } else {
                           algorithm = 'Cryptonight';
                        }
                     }
                    poolstats.push({
                          poolName : pool.name,
                          poolAlgo : algorithm || pool.algo,
                          poolLink : pool.link,
                          poolMiners : json.pool.miners || 0,
                          poolHashrate : getReadableHashRate(json.pool.hashrate),
                          poolBlocks : json.pool.totalBlocks || 0,
                          networkHashrate : getReadableHashRate(json.network.difficulty / json.config.coinDifficultyTarget),
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
      res.render("index", {poolstats: poolstats});
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
