var express = require('express');
var app = express();
const schedule = require('node-schedule');
const axios = require('axios').default;
const FormData = require('form-data');
 
const form = new FormData();
form.append('X-CMC_PRO_API_KEY', '317a57dd-d611-4a27-999a-21863c41e420');


const getCurrenciesDataFromApi = schedule.scheduleJob('0 * * ? * *', () => {
    console.log("asdasdas");
    let a = axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest',{
        params: {
            limit:1
        },
        headers: { 'X-CMC_PRO_API_KEY': '317a57dd-d611-4a27-999a-21863c41e420' }
    },
    ).then(suc => {
        console.log(suc.data)
    }).catch(err => {
        console.log("failed")
    });
})

var server = app.listen(8080, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
 })