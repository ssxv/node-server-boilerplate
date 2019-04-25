/// <reference path="node_modules/reflect-metadata/reflect-metadata.d.ts" />
/// <reference path="typings/modules/linq/index.d.ts" />
var schedule = require('node-schedule');
import http = require('http');
var express = require("express");
import { router } from 'nodedata/core/exports';
import { Decorators } from 'nodedata/core/constants/decorators';
import { MetaUtils } from "nodedata/core/metadata/utils";
import * as config from './config';
import * as securityConfig from './securityConfig';
import { config as _config } from "./envConfig/envConfig";
import * as data from 'nodedata/mongoose';
import { Container } from 'nodedata/di';
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
config.passportSet.setPassport(passport);
var Main = require('nodedata/core');
Main(config, securityConfig, __dirname, data.entityServiceInst);
import * as Enumerable from 'linq';
data.connect();
data.generateSchema();


require('reflect-metadata/Reflect');
var bodyParser = require("body-parser");
process.env.APP_ROOT = "hello";

var app = express();
Main.register(app);
var path = require('path');
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

var expressSession = require('express-session');
app.use(expressSession({ secret: 'mySecretKey', resave: false, saveUninitialized: false }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, dd, RequestVerificationToken,UserExecutionContext,suppid");
    res.header("Access-Control-Allow-Credentials", "true");
    res.removeHeader("x-powered-by");
    if ('OPTIONS' === req.method) {
        res.send(200);
    } else {
        next();
    }
});

app.use(passport.initialize());
app.use(passport.session());

app.use("/", router);
app.use("/data", express.static(path.join(__dirname, 'public')));
var server = http.createServer(app);
server.listen(9999);

function executeCron() {
    var services = MetaUtils.getMetaDataForDecorators([Decorators.SERVICE]);
    var service = Enumerable.from(services).where(x => x.metadata[0].params.serviceName == "SubscriptionService").select(x => x.metadata[0]).firstOrDefault();
    var injectedProp = Container.resolve(service.params.target);
    if (injectedProp && injectedProp["processSubscriptions"]) {
        injectedProp["processSubscriptions"].apply(injectedProp);
    }
}

//morning 11 AM
// 5 mins - '00 */5 * * * 0-6'
schedule.scheduleJob('00 00 11 * * 0-6', function () {
    executeCron();
});
