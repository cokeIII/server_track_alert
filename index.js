var mysql      = require('mysql');
var express    = require("express");
var express = require('express');
var bodyParser = require('body-parser');
var multer  = require('multer')

var fs = require("fs");
if (!fs.existsSync("pic_cards")){
  fs.mkdir("pic_cards",(r)=>{console.log(r)})
} else {
  console.log("path duplicate")
}
// var connection = mysql.createConnection({
//     host: 'localhost',
//     user: 'offtduac_root',
//     password: 'Bh?aC78X',
//     database: 'offtduac_trackalert'
// });
var db_config = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'offtduac_trackalert'
};

var connection;

function handleDisconnect() {
  connection = mysql.createConnection(db_config); // Recreate the connection, since
                                                  // the old one cannot be reused.

  connection.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }                                     // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
  connection.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}

handleDisconnect();

var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);
http.listen(7778, function(){
      console.log('listening on *:7778');
});

io.on('connection',function(client){
    console.log('Client connected..');
    client.on('join',function(data){
        console.log(data);  
    });
    io.sockets.emit('join',{name:"server"});
    // setInterval(function() {
    //   var currentDate = new Date();
    //   io.sockets.emit('clock',{currentDate:currentDate});
    // },1000);
});

app.use(bodyParser.json());
// connection.connect(function(err){
// if(!err) {
//     console.log("Database is connected ... nn");    
// } else {
//     console.log("Error connecting database ... nn");    
// }
// });

var Storage = multer.diskStorage({
  destination: function(req, file, callback) {
      callback(null, "pic_cards");
  },
  filename: function(req, file, callback) {
      callback(null, req.body.phoneNumber + '.jpg');
  }
});
var upload = multer({
  storage: Storage
}).fields([{ name: 'phoneNumber', maxCount: 1 }, { name: 'photo', maxCount: 1 }])

app.post("/cards", function(req, res) {
  upload(req, res, function(err) {
    console.log(req.body)
    if (err) {
        return res.end("Something went wrong!");
    }
    connection.query('SELECT * from users where device_id = "'+req.body.deviceId+'"', function(err, rows, fields) {
      if (!err){
        console.log(rows)
        if(rows.length == 0){
          connection.query('insert into users (user_id,name,phone_number,pic_card,device_id,ble_id) values("","","'+req.body.phoneNumber+'","'+req.body.phoneNumber+'.jpg","'+req.body.deviceId+'","'+req.body.bleId+'")', function(err, result) {
            if (!err){
              if(result.affectedRows){
                res.json({status: "Success"})
              }
            }
            else {
              res.json({status: "Fail"})
            }
          });  
        } else {
          // res.json({status:"DuplicateUser"})
          console.log("DuplicateUser")
          connection.query('update users set user_id = "", name = "",phone_number = "'+req.body.phoneNumber+'", pic_card= "'+req.body.phoneNumber+'.jpg" where device_id = "'+req.body.deviceId+'"', function(err, result) {
            if (!err){
              if(result.affectedRows){
                res.json({status: "Success"})
              }
            }
            else{
              res.json({status: "Fail"})
            }
          });      
        }
      }
      else{
        console.log('Error while performing Query.')
      }
    });
  });
});

app.get("/maps",function(req,res){
connection.query('SELECT * from maps', function(err, rows, fields) {
  if (!err){
    var data = {
      maps:rows
    }
    //console.log('The solution is: ', rows);
    res.json(data);
  }
  else
    console.log('Error while performing Query.');
  });
});
app.post("/",function(req,res){
    console.log("READY")
    io.sockets.emit('/',{name:"test emit"});
});
  
app.post("/getCountUser",function(req,res){
  console.log(req.body)
  connection.query('SELECT  user_log.*,users.phone_number,users.device_id,users.name as userName,maps.uuid,maps.name from user_log,users,maps where date(date_time) = CURRENT_DATE and status = "traveling" and maps.route = "'+req.body.route+'" and users.device_id = user_log.device_id and maps.uuid = user_log.uuid', function(err, rows, fields) {
    if (!err){
      var data = {
        userData:rows
      }
      //console.log('The solution is: ', rows);
      res.json(data);
    }
    else{
      console.log('Error while performing Query.');
    }
  });
});
  
app.post("/insertUser",function(req,res){
  console.log(req.body)
  connection.query('SELECT * from users where device_id = "'+req.body.deviceId+'"', function(err, rows, fields) {
    if (!err){
      console.log(rows)
      if(rows.length == 0){
        connection.query('insert into users (user_id,name,phone_number,pic_card,device_id,ble_id) values("'+req.body.idCard+'","'+req.body.userName+'","'+req.body.phoneNumber+'","","'+req.body.deviceId+'","'+req.body.bleId+'")', function(err, result) {
          if (!err){
            if(result.affectedRows){
              res.json({status: "Success"})
            }
          }
          else {
            res.json({status: "Fail"})
          }
        });  
      } else {
        // res.json({status:"DuplicateUser"})
        console.log("DuplicateUser")
        connection.query('update users set user_id = "'+req.body.idCard+'", name = "'+req.body.userName+'", phone_number = "'+req.body.phoneNumber+'", pic_card= "" where device_id = "'+req.body.deviceId+'"', function(err, result) {
          if (!err){
            if(result.affectedRows){
              res.json({status: "Success"})
            }
          }
          else{
            res.json({status: "Fail"})
          }
        });      
      }
    }
    else{
      console.log('Error while performing Query.')
    }
  });

});

app.post("/updateUser",function(req,res){
  console.log("updateUser")
  console.log(req.body)
  connection.query('SELECT * from users where device_id = "'+req.body.deviceId+'"', function(err, rows, fields) {
    if (!err){
      console.log(rows)
      if(rows.length == 0){
        connection.query('insert into users (user_id,name,phone_number,pic_card,device_id,ble_id) values("'+req.body.idCard+'","'+req.body.userName+'","'+req.body.phoneNumber+'","","'+req.body.deviceId+'","'+req.body.bleId+'")', function(err, result) {
          if (!err){
            if(result.affectedRows){
              res.json({status: "Success"})
            }
          }
          else {
            res.json({status: "Fail"})
          }
        });  
      } else {
        if(req.body.picCard == ''){
          connection.query('update users set user_id = "'+req.body.idCard+'", name = "'+req.body.userName+'", phone_number = "'+req.body.phoneNumber+'", pic_card = "'+req.body.picCard+'" where device_id = "'+req.body.deviceId+'"', function(err, result) {
            if (!err){
              if(result.affectedRows){
                console.log("update Success")
                res.json({status: "Success"})
              }
            }
            else{
              console.log(err)
              res.json({status: "Fail"})
            }
          });
        } else {
          upload(req, res, function(err) {
            console.log(req.body)
            connection.query('update users set phone_number = "'+req.body.phoneNumber+'", pic_card = "'+req.body.phoneNumber+'.jpg" where device_id = "'+req.body.deviceId+'"', function(err, result) {
              if (!err){
                if(result.affectedRows){
                  console.log("update Success")
                  res.json({status: "Success"})
                }
              }
              else{
                console.log(err)
                res.json({status: "Fail"})
              }
            });
          })
        }     
      }
    }
    else{
      console.log('Error while performing Query.')
      res.json({status: "Fail"})
    }
  });
});
app.post("/updateUserLog",function(req,res){
  console.log(req.body)
  connection.query('SELECT * from user_log where device_id = "'+req.body.deviceId+'"', function(err, rows, fields) {
    if (!err){
      console.log(rows)
      if(rows.length == 0){
        console.log("insert")
        connection.query('insert into user_log (device_id,uuid,status) values("'+req.body.deviceId+'","'+req.body.uuid+'","traveling")', function(err, result) {
          if (!err){
            if(result.affectedRows){
              console.log("insert log Success")
              io.sockets.emit('updateUserLog',req.body);
              res.json({status: "Success"})
            }
          }
          else{
            console.log("insert log Fail")
            res.json({status: "Fail"})
          }
        });       
      } else {
        // res.json({status:"DuplicateUser"})
        console.log("DuplicateLog")
        connection.query('update user_log set uuid = "'+req.body.uuid+'", date_time = CURRENT_TIMESTAMP, status = "'+req.body.status+'" where log_id = "'+rows[0].log_id+'"', function(err, result) {
          if (!err){
            if(result.affectedRows){
              console.log("update log Success")
              io.sockets.emit('updateUserLog',req.body);
              res.json({status: "Success"})
            }
          }
          else{
            console.log("update log Success")
            res.json({status: "Fail"})
          }
        });      
      }
    }
    else{
      console.log('Error while performing Query.')
    }
  });     
});
app.get("/allBlue",function(req,res){
  console.log(req.body)
  
  res.json({status: "Get Success OK",reqBody:req.body})
})
app.post("/allBlue",async function(req,res){
  console.log(req.body)
  let dataIo = {}
  // for(var index in req.body.message.ipdata) {
  //   var value = req.body.message.ipdata[index].toString()
  //   connection.query('SELECT (select device_id from users where ble_id = "'+value.replace(/:/g,'')+'") as deviceID, (select uuid from maps where uuid = "'+value+'") as uuids', function(err, rows, fields) {
  //     if (!err){
  //       if(rows[0]){
  //         console.log(rows[0])
  //         if(rows[0].deviceID != null) {
  //           dataIo.deviceId = rows[0].deviceID
  //         }
  //         if(rows[0].uuids != null){
  //           dataIo.uuid = rows[0].uuids
  //         }
  //         dataIo.status = "traveling"
  //         console.log(dataIo)
  //         if(dataIo.uuid != null && dataIo.deviceId != null){
  //           connection.query('update user_log set uuid = "'+dataIo.uuid+'", status = "traveling", date_time = CURRENT_TIMESTAMP where device_id = "'+dataIo.deviceId+'"', function(err, result) {
  //             if (!err){
  //               io.sockets.emit('updateUserLog',dataIo)        
  //             }
  //           })
  //         }
  //       }     
  //     } 
  //   })
  // }
  res.json({status: "Post Success OK",reqBody:req.body})
})

connection.on('error', function(err) {
  console.log("[mysql error]",err);
});      

app.listen(7777);

// connection.end();
