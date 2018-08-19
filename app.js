var express = require("express");
var bodyParser = require("body-parser");
var http = require("http");
var path = require("path");
var SensorTag = require('sensortag');
var os = require('os');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('public/sensortag.db');

function createTables(db){
    db.serialize(function() {
        db.run("CREATE TABLE IF NOT EXISTS sensortag (id TEXT UNIQUE, createdTimestamp DATETIME DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW', 'localtime')))");
        db.run("CREATE TABLE IF NOT EXISTS irTemp (fk_id TEXT, objectTemp REAL, ambientTemp REAL, createdTimestamp DATETIME DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW', 'localtime')))");
        db.run("CREATE TABLE IF NOT EXISTS accMeter (fk_id TEXT, accX REAL, accY REAL, accZ REAL, createdTimestamp DATETIME DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW', 'localtime')))");
        db.run("CREATE TABLE IF NOT EXISTS gyro (fk_id TEXT, gyroX REAL, gyroY REAL, gyroZ REAL, createdTimestamp DATETIME DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW', 'localtime')))");
        db.run("CREATE TABLE IF NOT EXISTS humidity (fk_id TEXT, humiTemp REAL, humidity REAL, createdTimestamp DATETIME DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW', 'localtime')))");
    });
}
function insertIrTemp(tagId, objectTemp, ambientTemp){
    db.serialize(function() {
        //console.log("INSERT OR REPLACE INTO sensortag (id) VALUES ('"+tagId+"')");
        db.run("INSERT OR REPLACE INTO sensortag (id) VALUES ('"+tagId+"')");
        //console.log("INSERT INTO irTemp (fk_id, objectTemp, ambientTemp) VALUES ('"+tagId+"', "+objectTemp+", "+ambientTemp+")");
        db.run("INSERT INTO irTemp (fk_id, objectTemp, ambientTemp) VALUES ('"+tagId+"', "+objectTemp+", "+ambientTemp+")");
    });
}
function insertHumi(tagId, humiTemp, humidity){
    db.serialize(function() {
        //console.log("INSERT OR REPLACE INTO sensortag (id) VALUES ('"+tagId+"')");
        db.run("INSERT OR REPLACE INTO sensortag (id) VALUES ('"+tagId+"')");
        //console.log("INSERT INTO humidity (fk_id, humiTemp, humidity) VALUES ('"+tagId+"', "+humiTemp+", "+humidity+")");
        db.run("INSERT INTO humidity (fk_id, humiTemp, humidity) VALUES ('"+tagId+"', "+humiTemp+", "+humidity+")");
    });
}
function insertAccMeter(tagId, accX, accY, accZ){
    db.serialize(function() {
        //console.log("INSERT OR REPLACE INTO sensortag (id) VALUES ('"+tagId+"')");
        db.run("INSERT OR REPLACE INTO sensortag (id) VALUES ('"+tagId+"')");
        //console.log("INSERT INTO accMeter (fk_id, accX, accY, accZ) VALUES ('"+tagId+"', "+accX+", "+accY+", "+accZ+")");
        db.run("INSERT INTO accMeter (fk_id, accX, accY, accZ) VALUES ('"+tagId+"', "+accX+", "+accY+", "+accZ+")");
    });
}
function insertGyro(tagId, gyroX, gyroY, gyroZ){
    db.serialize(function() {
        //console.log("INSERT OR REPLACE INTO sensortag (id) VALUES ('"+tagId+"')");
        db.run("INSERT OR REPLACE INTO sensortag (id) VALUES ('"+tagId+"')");
        //console.log("INSERT INTO gyro (fk_id, gyroX, gyroY, gyroZ) VALUES ('"+tagId+"', "+gyroX+", "+gyroY+", "+gyroZ+")");
        db.run("INSERT INTO gyro (fk_id, gyroX, gyroY, gyroZ) VALUES ('"+tagId+"', "+gyroX+", "+gyroY+", "+gyroZ+")");
    });
}
createTables(db);

function getServerIp() {
    var ifaces = os.networkInterfaces();
    var result = '';
    for (var dev in ifaces) {
        var alias = 0;
        ifaces[dev].forEach(function(details) {
            if (details.family == 'IPv4' && details.internal === false) {
                result = details.address;
                ++alias;
            }
        });
    }
  
    return result;
}

var oled = require('oled-ssd1306-i2c');

var opts = {
    width: 128, // screen width
    height: 64, // screen height
    address: 0x3C, // Pass I2C address of screen if it is not the default of 0x3C
    device: '/dev/i2c-1', // Pass your i2c device here if it is not /dev/i2c-1
    microview: false, // set to true if you have a microview display
  };
 
var oled = new oled(opts);

var font = require('oled-font-5x7');
oled.clearDisplay();
oled.update();

// sets cursor to x = 1, y = 1
oled.setCursor(1, 1);
oled.writeString(font, 1, 'Connect to http://'+getServerIp()+':8088/', 1, true);

oled.drawRect(0, 32, 31, 31, 1);
oled.drawRect(32, 32, 31, 31, 1);
oled.drawRect(64, 32, 31, 31, 1);
oled.drawRect(96, 32, 31, 31, 1);

function drawTags(num){
    oled.drawRect(0, 32, 31, 31, 1);
    oled.drawRect(32, 32, 31, 31, 1);
    oled.drawRect(64, 32, 31, 31, 1);
    oled.drawRect(96, 32, 31, 31, 1);
    for(var i=0; i < num; i++){
        oled.setCursor(8+32*i, 40);
        oled.writeString(font, 2, (i+1).toString(), false, false);
    }
}
/*
oled.drawRect(0, 32, 31, 31, 1);
oled.drawRect(32, 32, 31, 31, 1);
oled.drawRect(64, 32, 31, 31, 1);
oled.drawRect(96, 32, 31, 31, 1);

oled.setCursor(8, 40);
oled.writeString(font, 2, '1', false, false);

oled.setCursor(40, 40);
oled.writeString(font, 2, '2', false, false);

oled.setCursor(72, 40);
oled.writeString(font, 2, '3', false, false);

oled.setCursor(104, 40);
oled.writeString(font, 2, '4', false, false);
*/
var app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

var httpServer = http.createServer(app).listen(8088, function(req, res){
	console.log('Connect to http://'+getServerIp()+":8088/");
});
var tags = new Array;

function oD(tag)  {  
    console.log(tag._peripheral.id);
    io.sockets.emit("connecttt", tag._peripheral.id);
    // when you disconnect from a tag, exit the program:
    tag.on('disconnect', function() {
        console.log(tags)
        tags = tags.filter(function(el){
            return el._peripheral.id !== tag._peripheral.id
        });
        io.sockets.emit("disconnect", tag._peripheral.id);
    });

    function connectAndSetUpMe() {          // attempt to connect to the tag
        console.log('connectAndSetUp');
        tag.connectAndSetUp(enableIrTempMe);        // when you connect, call enableIrTempMe\
    }

    function enableIrTempMe() {        // attempt to enable the IR Temperature sensor
        console.log('enableIRTemperatureSensor');
        // when you enable the IR Temperature sensor, start notifications:
        tag.enableIrTemperature(notifyMeTemp);
        tag.enableAccelerometer(notifyMeAcc);
        tag.enableHumidity(notifyMeHumi);
        tag.enableGyroscope(notifyMeGyro);
        tag.setAccelerometerPeriod(100, function(error){
            if(error){
                console.log(error);
                exit;
            }
        });
        tag.setGyroscopePeriod(100, function(error){
            if(error){
                console.log(error);
                exit;
            }
        });
    }

    function notifyMeAcc() {
        tag.notifyAccelerometer(listenForAcc);      // start the accelerometer listener
        tag.notifySimpleKey(listenForButton);       // start the button listener
    }

    function notifyMeGyro() {
        tag.notifyGyroscope(listenForGyro);      // start the accelerometer listener
        tag.notifySimpleKey(listenForButton);       // start the button listener
    }

    function listenForAcc() {
        tag.on('accelerometerChange', function(x, y, z) {
         console.log('\tx = %d G', x.toFixed(1));
         console.log('\ty = %d G', y.toFixed(1));
         console.log('\tz = %d G', z.toFixed(1));
         io.sockets.emit("data", {
            id: tag.id,
            type: "accMeter",
            value: "x:"+x.toFixed(1)+"G,"+"y:"+y.toFixed(1)+"G, " +"z:"+z.toFixed(1)+"G"
        });
        insertAccMeter(tag.id, x, y, z);
       });
    }
    function listenForGyro() {
        tag.on('gyroscopeChange', function(x, y, z) {
         //console.log('\tx = %d deg', x.toFixed(1));
         //console.log('\ty = %d deg', y.toFixed(1));
         //console.log('\tz = %d deg', z.toFixed(1));
         io.sockets.emit("data", {
            id: tag.id,
            type: "gyro",
            value: "x:"+x.toFixed(1)+"G,"+"y:"+y.toFixed(1)+"G, " +"z:"+z.toFixed(1)+"G"
        });
        insertGyro(tag.id, x, y, z);
       });
    }

    function notifyMeTemp() {
        tag.notifyIrTemperature(listenForTempReading);      // start the accelerometer listener
        tag.notifySimpleKey(listenForButton);       // start the button listener
    }

    function notifyMeHumi() {
        tag.notifyHumidity(listenForHumiReading);      // start the accelerometer listener
        tag.notifySimpleKey(listenForButton);       // start the button listener
    }

    // When you get an accelermeter change, print it out:
    function listenForTempReading() {
        tag.on('irTemperatureChange', function(objectTemp, ambientTemp) {
        //console.log(tag.id);
        //console.log('\tObject Temp = %d deg. C', objectTemp.toFixed(1));
        //console.log('\tAmbient Temp = %d deg. C', ambientTemp.toFixed(1));
        io.sockets.emit("data", {
            id: tag.id,
            type: "objTemp",
            value: objectTemp.toFixed(1)+"deg. C"
        });
        io.sockets.emit("data", {
            id: tag.id,
            type: "ambiTemp",
            value: ambientTemp.toFixed(1)+"deg. C"
        });
        insertIrTemp(tag.id, objectTemp, ambientTemp)
       });
    }
    function listenForHumiReading() {
        tag.on('humidityChange', function(humiTemp, humidity) {
        //console.log(tag.id);
        //console.log('\tHumidity Temp = %d deg. C', humiTemp.toFixed(1));
        //console.log('\ttHumidity = %d %', humidity.toFixed(1));
        io.sockets.emit("data", {
            id: tag.id,
            type: "humiTemp",
            value: humiTemp.toFixed(1)+"deg. C"
        });
        io.sockets.emit("data", {
            id: tag.id,
            type: "humidity",
            value: humidity.toFixed(1)+"%"
        });
        insertHumi(tag.id, humiTemp, humidity);
       });
    }

    // when you get a button change, print it out:
    function listenForButton() {
        tag.on('simpleKeyChange', function(left, right) {
            if (left) {
                console.log('left: ' + left);
                tag.readBatteryLevel(function(error, batteryLevel){
                    if(error){
                        console.log(error);
                        exit;
                    }
                    console.log(tag.id+" battery level is "+batteryLevel+"%")
                    io.sockets.emit("data", {
                        id: tag.id,
                        type: "battLevel",
                        value: batteryLevel+"%"
                    });
                });
            }
            if (right) {
                console.log('right: ' + right);
            }
            // if both buttons are pressed, disconnect:
            if (left && right) {
                tag.disconnect();
            }
       });
    }

    // Now that you've defined all the functions, start the process:
    connectAndSetUpMe();
}
function addAndConnect(sensorTag){
    tags.push(sensorTag);
    console.log(sensorTag);
    io.sockets.emit("tags", sensorTag._peripheral.id);
}

function onDiscover(sensorTag) {
    addAndConnect(sensorTag);
    oled.clearDisplay();
    oled.setCursor(1, 1);
    oled.writeString(font, 1, 'discovery...', 1, true);
}
var io = require("socket.io").listen(httpServer);


io.sockets.on('connection', function(socket){
    console.log("connected!");
    socket.emit("connected", { msg: "connected!"});
    var tagList = {
        tags:[]
    };
    for(var i=0; i<tags.length; i++){
        tagList.tags.push({id:tags[i]._peripheral.id});
    }
    socket.emit("tagList", tagList);
    console.log(tagList);
	socket.on('forceDisconnect', function() {
		socket.disconnect();
	});

	socket.on('disconnect', function() {
		console.log('user disconnected: ' + socket.name);
	});
	socket.on('control', function(data){
		console.log(data);
    })
    socket.on('discovery',function(data){
        SensorTag.discoverAll(onDiscover);
        console.log(data.msg);
    })
    socket.on('stopDiscovery',function(data){
        SensorTag.stopDiscoverAll(onDiscover);
        //console.log(tags[0]._peripheral.id);
        drawTags(tags.length);
    })
    socket.on('connectSensortag',function(data){
        console.log("connecting to:"+data)
        SensorTag.discoverById(data, oD);
        drawTags(tags.length);
    })
    
});
