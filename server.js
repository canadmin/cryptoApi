let express = require('express');
let app = express();
const schedule = require('node-schedule');
const axios = require('axios').default;
const redis = require('redis');
const cron = require('node-cron');

let fs = require('fs');
const Path = require("path");

const PORT = process.env.PORT || 4000;


const client = redis.createClient({url: 'redis://127.0.0.1:6379'});
client.connect();



const createAssetParam = (begin,end) => {
    let params = coins.slice(begin,end).join(",");
    return params;
}

//crypto compare atacağım request için semboller çekceğim yer
let coins = fs.readFileSync('symbol.txt').toString().split(",");
cron.schedule('*/5 * * * *', async () => {
    const cronRedisClient = redis.createClient({
        url: 'redis://127.0.0.1:6379'
    });
    cronRedisClient.on('error', (err) => console.log('Redis Client Error', err));
    cronRedisClient.connect();

    for (let i = 0; i < 9; i++) {
        let start = i * 60;
        let end = i * 60 + 59;
        console.log("-------------")
        let a = await axios.get('https://min-api.cryptocompare.com/data/pricemulti', {
                params: {
                    "fsyms": createAssetParam(start,end),
                    "tsyms": "USD"
                },
                headers: {'authorization': 'Apikey fb038205cb6d80e18ac6478c3674937f528382d8030e7aea6bca3edb9282a68a'}
            },
        ).then(success => {
            let result = Object.keys(success.data).map((key) =>  ({ symbol: key, price: success.data[key]["USD"]}));

            console.log(result)

            result.forEach(item => {
               cronRedisClient.set(item.symbol ,JSON.stringify(item.price));
            })
            // cronRedisClient.set("test" ,JSON.stringify(success.data));
        })
    }
    cronRedisClient.quit();
});

// coinmarketcaptan çekilen verilerin
schedule.scheduleJob('0 */4 * * *', () => {
    const cronRedisClient = redis.createClient({
        url: 'redis://127.0.0.1:6379'
    });
    cronRedisClient.on('error', (err) => console.log('Redis Client Error', err));
    cronRedisClient.connect();

    let a = axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
            params: {
                limit: 5000
            },
            headers: {'X-CMC_PRO_API_KEY': '317a57dd-d611-4a27-999a-21863c41e420'}
        },
    ).then(suc => {
        let data = suc.data.data;
        console.log(data)
        data.forEach(item => {
            let key = item.symbol + '/cmc';
            cronRedisClient.set(key,JSON.stringify(item));
        })
        res.send(data)
    }).catch(err => {
        console.log(err)
    });
})



const getCurrenciesData = (req, res, next) => {
    const {limitname} = req.params;
    client.get(limitname.toString, (err, data) => {
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
