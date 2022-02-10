var express = require('express');
var url = require('url');
var fs = require('fs');
var app = express();
var client_id = 'BR9wjsBukM0NVGtNUjSC';
var client_secret = 'I1qzVZcrAP';
var state = Math.round(Math.random()*100000000);
var redirectURI = encodeURI("http://127.0.0.1:3000/callback");
var api_url = "";
var token = "";
var accesstoken = "";
// var header = "Bearer " + token; //왜 header라고 쓰면 오류가 뜨지?? var let 스코프 차이인가???
app.get('/', function (req, res) {
  api_url = 'https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=' + client_id + '&redirect_uri=' + redirectURI + '&state=' + state;
   res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
   res.end("<a href='"+ api_url + "'><img height='50' src='http://static.nid.naver.com/oauth/small_g_in.PNG'/></a>");
 });
 app.get('/callback', function (req, res) {
    code = req.query.code;
    state = req.query.state;
    api_url = 'https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id='
     + client_id + '&client_secret=' + client_secret + '&redirect_uri=' + redirectURI + '&code=' + code + '&state=' + state;
    var request = require('request');
    var options = {
        url: api_url,
        headers: {'X-Naver-Client-Id':client_id, 'X-Naver-Client-Secret': client_secret}
     };
    request.get(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log('-------------------User Login-------------------');
        console.log('-------------------Token Info-------------------');
        token = JSON.parse(body);
        console.log(token);
        accesstoken = JSON.parse(body).access_token;
        // expire_url = `https://nid.naver.com/oauth2.0/token?grant_type=delete&client_id=${client_id}&client_secret=${client_secret}&access_token=${token}&service_provider=NAVER`
        res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
        res.end(`<a href="/expire">로그아웃</a><br><a href="/member">회원정보조회</a>`);
        // res.end(body)  
      } else {
        res.status(response.statusCode).end();
        console.log('error = ' + response.statusCode);
      }
    });
  });
  app.get('/expire', function (req, res) {
    var expire_url = `https://nid.naver.com/oauth2.0/token?grant_type=delete&client_id=${client_id}&client_secret=${client_secret}&access_token=${accesstoken}&service_provider=NAVER`;
    var request = require('request');
    var options = {
        url: expire_url,
        // headers: {'Authorization': "Bearer " + token}
     };
    request.get(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log('-------------------User Logout-------------------')
        res.writeHead(302,{Location : `https://nid.naver.com/oauth2.0/authorize?response_type=code&state=${state}&redirect_uri=${redirectURI}&client_id=${client_id}&oauth_os=&inapp_view=&locale=ko_KR&auth_type=reauthenticate`});
        res.end();
      } else {
        console.log('error');
        if(response != null) {
          res.status(response.statusCode).end();
          console.log('error = ' + response.statusCode);
        }
      }
    });
  });
  app.get('/member', function (req, res) {
    var api_url = 'https://openapi.naver.com/v1/nid/me';
    var request = require('request');
    var options = {
        url: api_url,
        headers: {'Authorization': "Bearer " + accesstoken}
     };
    request.get(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
        res.end(`<a href="/main">메인으로<a>`);
        console.log('-------------------User Info-------------------')
        console.log(JSON.parse(body));
      } else {
        console.log('error');
        if(response != null) {
          res.status(response.statusCode).end();
          console.log('error = ' + response.statusCode);
        }
      }
    });
  });
  app.get('/main',function(req,res){
    res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
    res.end(`<a href="/expire">로그아웃</a><br><a href="/member">회원정보조회</a>`);
    console.log('-------------------Token Info-------------------');
    console.log(token);
  });
 app.listen(3000, function () {
   console.log('http://127.0.0.1:3000/ app listening on port 3000!');
 });