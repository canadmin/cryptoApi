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

//crypto compare atacağım request için semboller çekceğim yer 5 dk bir 500 tane için
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
        })
    }
    cronRedisClient.quit();
});

// coinmarketcaptan çekilen verilerin 4 saatte bir
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
        cronRedisClient.set('top10',JSON.stringify(data.slice(0,10)));
        cronRedisClient.set('top5',JSON.stringify(data.slice(0,5)))
        cronRedisClient.set('top100',JSON.stringify(data.slice(0,100)));
        cronRedisClient.set('all',JSON.stringify(data));
        console.log(data)
        data.forEach(item => {
            let key = item.symbol + '-cmc';
            cronRedisClient.set(key,JSON.stringify(item));
        })
    }).then(() => {
        cronRedisClient.quit();
    }).catch((err) => {
        console.log(err.toString());
    })
})


const getCurrenciesDataFromCryptoCompare = async (req, res, next) => {
    try{
        const symbol= req.query.symbol;
        const value = await client.get(symbol)
        res.send(JSON.parse(value));
    }catch (e){
        console.log(e)
        res.send(JSON.parse(e));
    }

}
const getCryptoCurrencyInfo = async (req, res, next) => {
    try{
        const symbol = req.query.symbol;
        console.log(symbol)
        const value = await client.get(symbol+'-cmc')
        res.send(JSON.parse(value));
    }catch (e){
        console.log(e)
        res.send(JSON.parse(e));
    }

}

const getCurrencies = async (req,res,params) => {
     try{
         const listType = req.query.listType;
         console.log(req.query)
         const value = await client.get(listType)
         res.send(JSON.parse(value));
     }catch (e){
         console.log(e)
         res.send(JSON.parse(e));

     }

}


app.get('/currency',getCurrenciesDataFromCryptoCompare);
app.get('/cryptoInfo',getCryptoCurrencyInfo);
app.get('/currencies',getCurrencies);



let server = app.listen(PORT, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
})
