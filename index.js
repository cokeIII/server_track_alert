var mysql      = require('mysql');
var express    = require("express");
var express = require('express');
var bodyParser = require('body-parser');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'track_alert'
});
var app = express();
app.use(bodyParser.json());
connection.connect(function(err){
if(!err) {
    console.log("Database is connected ... nn");    
} else {
    console.log("Error connecting database ... nn");    
}
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
app.get("/",function(req,res){
  connection.query('SELECT * from maps', function(err, rows, fields) {
    if (!err){
      var data = {
        Value:"Qmav3u1WBShGemucCZP8C9PiLzaZTGZJ7byJrLDDZnkpzz"
      }
      //console.log('The solution is: ', rows);
      res.json(data);
    }
    else
      console.log('Error while performing Query.');
    });
});
  
app.post("/getCountUser",function(req,res){
  console.log(req.body)
  connection.query('SELECT  user_log.*,count(user_log.log_id) as countUser ,users.device_id,users.name as userName,maps.uuid,maps.name from user_log,users,maps where date(date_time) = CURRENT_DATE and status = "traveling" and maps.route = "'+req.body.route+'" and users.device_id = user_log.device_id and maps.uuid = user_log.uuid', function(err, rows, fields) {
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
  connection.query('SELECT * from users where device_id = "'+req.body.deviceId+'"', function(err, rows, fields) {
    if (!err){
      console.log(rows)
      if(rows.length == 0){
        connection.query('insert into users (user_id,name,phone_number,device_id) values("'+req.body.idCard+'","'+req.body.userName+'","'+req.body.phoneNumber+'","'+req.body.deviceId+'")', function(err, result) {
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
        connection.query('update users set user_id = "'+req.body.idCard+'", name = "'+req.body.userName+'", phone_number = "'+req.body.phoneNumber+'" where device_id = "'+req.body.deviceId+'"', function(err, result) {
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
    connection.query('update users set user_id = "'+req.body.idCard+'", name = "'+req.body.userName+'", phone_number = "'+req.body.phoneNumber+'" where device_id = "'+req.body.deviceId+'"', function(err, result) {
      if (!err){
        if(result.affectedRows){
          console.log("update Success")
          res.json({statuss: "Success"})
        }
      }
      else{
        console.log(err)
        res.json({status: "Fail"})
      }
    });
});

app.post("/updateUserLog",function(req,res){

  connection.query('SELECT * from user_log where device_id = "'+req.body.deviceId+'"', function(err, rows, fields) {
    if (!err){
      console.log(rows)
      if(rows.length == 0){
        console.log("insert")
        connection.query('insert into user_log (device_id,uuid,status) values("'+req.body.deviceId+'","'+req.body.uuid+'","traveling")', function(err, result) {
          if (!err){
            if(result.affectedRows){
              console.log("insert log Success")
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
connection.on('error', function(err) {
  console.log("[mysql error]",err);
});      

app.listen(3001);
// connection.end();