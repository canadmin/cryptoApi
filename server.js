let express = require('express');
let app = express();
const schedule = require('node-schedule');
const axios = require('axios').default;
const redis = require('redis');
const cron = require('node-cron');

let fs = require('fs');
let  coins = fs.readFileSync('symbol.txt').toString().split(",");
console.log(coins.slice(0, 10))
const PORT = process.env.PORT || 4000;
//const REDIS_PORT = process.env.PORT || 6379;
let WebSocket = require("ws");
const wss = new WebSocket('wss://ws-feed.pro.coinbase.com')

let msg = {
    type: "subscribe",
    product_ids: ["CAKE-USD"],
    channels: ["matches"]
};
let jsonMsg = JSON.stringify(msg);
wss.onopen = () => {
    console.log('Subscribing: BTCUSD');
    wss.send(JSON.stringify(
        msg
    ));
}
wss.onmessage = (msg) => {
    console.log(msg.data)
}

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


const createFSYMS = () => {
    let currencyParam = "";

    coins.forEach()
}

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
