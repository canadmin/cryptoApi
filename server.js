let express = require('express');
let app = express();
const schedule = require('node-schedule');
const axios = require('axios').default;
const redis = require('redis');
const cron = require('node-cron');

let fs = require('fs');
const Path = require("path");
let coins = fs.readFileSync('symbol.txt').toString().split(",");

const PORT = process.env.PORT || 4000;
const redisUrl = 'redis://clustercryptocache.6v08eh.0001.euc1.cache.amazonaws.com:6379';
const client = redis.createClient({url: 'redis://cryptocache.6v08eh.0001.euc1.cache.amazonaws.com:6379'});
client.connect();

const createAssetParam = (begin, end) => {
    let params = coins.slice(begin, end).join(",");
    return params;
}

//crypto compare atacağım request için semboller çekceğim yer 5 dk bir 500 tane için
cron.schedule('*/10 * * * *', async () => {
    getPriceList();
});

// coinmarketcaptan çekilen verilerin 4 saatte bir
schedule.scheduleJob('0 */4 * * *', () => {
    getCurrencyList();
})

const getCurrencyList = () => {
    const cronRedisClient = redis.createClient({
        url: redisUrl
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
        cronRedisClient.set('top10', JSON.stringify(data.slice(0, 10)));
        cronRedisClient.set('top5', JSON.stringify(data.slice(0, 5)))
        cronRedisClient.set('top100', JSON.stringify(data.slice(0, 100)));
        cronRedisClient.set('all', JSON.stringify(data));
        data.forEach(item => {
            let key = item.symbol + '-cmc';
            cronRedisClient.set(key, JSON.stringify(item));
        })
    }).then(() => {
        cronRedisClient.quit();
    }).catch((err) => {
        console.log(err.toString());
    })
}

const getPriceList = async () => {
    console.log("CurrencyList");
    const cronRedisClient = redis.createClient({
        url: redisUrl
    });
    cronRedisClient.on('error', (err) => console.log('Redis Client Error', err));
    cronRedisClient.connect();

    for (let i = 0; i < 9; i++) {
        let start = i * 60;
        let end = i * 60 + 59;
        let a = await axios.get('https://min-api.cryptocompare.com/data/pricemulti', {
                params: {
                    "fsyms": createAssetParam(start, end),
                    "tsyms": "USD"
                },
                headers: {'authorization': 'Apikey fb038205cb6d80e18ac6478c3674937f528382d8030e7aea6bca3edb9282a68a'}
            },
        ).then(success => {
            let result = Object.keys(success.data).map((key) => ({symbol: key, price: success.data[key]["USD"]}));

            result.forEach(item => {
                cronRedisClient.set(item.symbol, JSON.stringify(item.price));
            })
        })
    }
    cronRedisClient.quit();
}

const getImageToCache = () => {
    const cronRedisClient = redis.createClient({
        url: redisUrl
    });
    cronRedisClient.on('error', (err) => console.log('Redis Client Error', err));
    cronRedisClient.connect();

    let a = axios.get('https://pro-api.coinmarketcap.com/v2/cryptocurrency/info', {
            params: {
                symbol: "BTC,ETH,USDT,BNB,USDC,SOL,XRP,ADA,LUNA,AVAX,DOT,DOGE,BUSD,UST,SHIB,MATIC,WBTC,CRO,DAI,NEAR,LTC,ATOM,LINK,UNI,TRX,BCH,FTT,ALGO,ETC,WAVES,XLM,LEO,VET,MANA,HBAR,ICP,FIL,EGLD,THETA,XMR,FTM,SAND,AXS,RUNE,APE,XTZ,AAVE,KLAY,EOS,HNT,ZEC,CAKE,ZIL,MIOTA,FLOW,GRT,MKR,BTT,ONE,NEO,STX,BSV,XEC,GALA,GMT,QNT,CHZ,KCS,ENJ,CVX,KSM,LRC,HT,CELO,NEXO,TUSD,DASH,BAT,CRV,AR,OKB,MINA,AMP,HOT,KDA,TFUEL,XEM,COMP,USDP,ROSE,IOTX,SKL,DCR,USDN,SCRT,SNX,YFI,QTUM,BORA",
                aux:"logo"
            },
            headers: {'X-CMC_PRO_API_KEY': '317a57dd-d611-4a27-999a-21863c41e420'}
        },
    ).then(suc => {
        let data = suc.data.data;
        let result = Object.keys(data).map((key) => ({symbol: key, logo: data[key][0]["logo"]}));

        result.forEach(item => {
            cronRedisClient.set(item.symbol+'-img', JSON.stringify(item.logo));
        })
        }).then(() => {
        cronRedisClient.quit();
    }).catch((err) => {
        console.log(err.toString());
    })
}

// crypto compare apisinden data getirir
const getCurrencyFromOtherSources = async (req, res, next) => {
    try {
        const symbol = req.query.symbol;
        let value = await client.get(symbol)
        if (value) {
            res.send({symbol, value, statusCode: 200});
        } else {
            res.send({statusCode: 500});
        }
    } catch (e) {
        console.log(e)
        res.send({statusCode: 500});
    }

}


// coinmarketCap'in sunduğu şekilde datayı getirir
const getCryptoCurrencyInfo = async (req, res, next) => {
    let coinsList = [];
    try {
        const symbols = req.query.symbol.toString().split(",");
        await Promise.all(symbols.map(async (item) => {
            if(item !== ''){
                const value = await client.get(item.toUpperCase()+'-cmc');
                coinsList.push(JSON.parse(value));
            }
        }))

        res.send(coinsList)

    } catch (e) {
        console.log(e)
        res.send((e));
    }

}

// top 10 top 100 all şeklinde datayı getirir
const getCurrencies = async (req, res, params) => {
    try {
        const listType = req.query.listType;
        const currencies = await client.get(listType)
        res.send(JSON.parse(currencies));
    } catch (e) {
        console.log(e)
        res.send(JSON.parse(e));
    }
}

const getImageFromCache = async (req, res, params) => {
    try {
        const symbol = req.query.symbol.toUpperCase();
        const image = await client.get(symbol+'-img')
        res.send({img:JSON.parse(image)});
    } catch (e) {
        console.log(e)
        res.send(JSON.parse(e));
    }
}
const initApi = (req,res,params) => {
        getPriceList();
        getCurrencyList();
        res.send("succes")
}
app.get('/initApi',initApi);

app.get('/currency', getCurrencyFromOtherSources); //crypto compare üzerinden getirir
app.get('/cryptoInfo', getCryptoCurrencyInfo); // sadece bir coinin değerini getirir
app.get('/currencies', getCurrencies); // top 10 top 100 şekilde data getirir
app.get('/getImage',getImageFromCache);


let server = app.listen(PORT, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
})
