let express = require('express');
let app = express();
const schedule = require('node-schedule');
const axios = require('axios').default;
const redis = require('redis');
const cron = require('node-cron');

let fs = require('fs');
const Path = require("path");
let  coins = fs.readFileSync('symbol.txt').toString().split(",");
const PORT = process.env.PORT || 4000;
const json = require("./ff.json");

console.log(Object.values(json.data)[0][0].logo)
let coinAsset = Object.values(json.data);
console.log(coinAsset.length)
const createAssetParam = (begin,end) => {
    console.log(begin,end)
    let params = coins.slice(begin,end).join(",");
    return params;
}

const downloadImage = async (url,name) => {
    const path = Path.resolve(__dirname,'logos',name+'.png');
    const response = await axios({
        method:'GET',
        url:url,
        responseType: 'stream'
    })
    response.data.pipe(fs.createWriteStream(path));
}


const getCoinMarketCapAsset = async () => {
    for(let i = 0; i < 30; i++){
        let start = i*100; //0
        let end = i*100+99; // 100
        console.log(createAssetParam(start,end).toString());
        console.log("-------------")
    }
}

for (let i = 0; i <coinAsset.length ; i++) {
    downloadImage(coinAsset[i][0].logo,coinAsset[i][0].symbol)
}
//getCoinMarketCapAsset()

// const ccxws =  require("ccxws");
// const binance = new ccxws.BinanceClient();
//
// const market = {
//     id: "BTCUSDT", // remote_id used by the exchange
//     base: "BTC", // standardized base symbol for Bitcoin
//     quote: "USDT", // standardized quote symbol for Tether
// };
//
// // handle trade events
// binance.on("trade", trade => console.log(trade));
//
// // handle level2 orderbook snapshots
// binance.on("l2snapshot", snapshot => console.log(snapshot));
//
// // subscribe to trades
// binance.subscribeTrades(market);
//const REDIS_PORT = process.env.PORT || 6379;
// let WebSocket = require("ws");
// let wss = new WebSocket('wss://ws-feed.pro.coinbase.com')
//
// let msg = {
//     type: "subscribe",
//     product_ids: ["BTC-USD"],
//     channels: ["matches"]
// };
// let jsonMsg = JSON.stringify(msg);
// wss.onopen = () => {
//     console.log('Subscribing: VET-USD');
//     wss.send(JSON.stringify(
//         msg
//     ));
// }
// wss.onmessage = (msg) => {
//     if(msg.data.type === "error" && msg.data.type === "subscriptions"){
//         let currentCurrency = "shib";
//         console.log("unsss")
//         console.log("unsss")
//         //let wss2 = new WebSocket('wss://stream.binance.com:9443/ws/' + currentCurrency +'usd@trade')
//         wss.send(JSON.stringify(
//             {
//                 type: "unsubscribe",
//                 product_ids: ["VET-USD"],
//                 channels: ["matches"]
//             }
//         ))
//     }
//     console.log(msg.data)
// }


const client = redis.createClient({url: 'redis://127.0.0.1:6379'});
client.connect();

// cron.schedule('* * * * *', async () => {
//     const cronRedisClient = redis.createClient({
//         url: 'redis://127.0.0.1:6379'
//     });
//     cronRedisClient.on('error', (err) => console.log('Redis Client Error', err));
//     cronRedisClient.connect();
//     console.log("calisti")
//
//     let a = await axios.get('https://min-api.cryptocompare.com/data/pricemulti', {
//             params: {
//                 "fsyms": "PIT",
//                 "tsyms": "USD"
//             },
//             headers: {'authorization': 'Apikey fb038205cb6d80e18ac6478c3674937f528382d8030e7aea6bca3edb9282a68a'}
//         },
//     ).then(success => {
//         console.log(success.data);
//     })
// });


// const getDailyDataFromCoinMarketCap = schedule.scheduleJob('0 * * ? * *', () => {
//     let a = axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest',{
//             params: {
//                 limit:3000
//             },
//             headers: { 'X-CMC_PRO_API_KEY': '317a57dd-d611-4a27-999a-21863c41e420' }
//         },
//     ).then(suc => {
//         console.log(JSON.stringify(suc.data))
//     }).catch(err => {
//         console.log("failed")
//     });
// })


const getCurrenciesData = (req, res, next) => {
    const {limitname} = req.params;
    client.get("top100", (err, data) => {
        if (err) throw err;
        data = JSON.parse(data);
        console.log(data)
        if (data !== null) {
            res.send(data);
        } else {
            next();
        }
    })
    res.send(limitname)
}

app.get('/currencies/:limitname', getCurrenciesData)


let server = app.listen(PORT, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
})
