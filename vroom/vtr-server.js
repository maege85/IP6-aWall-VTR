/**
Server Script for Virtual Team Room (VTR) to provide a Socket Server for the Widget in aWall.

Authors: Alain Horst & Marc Kaufmann
Date: 01.08.2016
**/

var express = require('express'),
	app = express(),
	server = require('http').createServer(app);

/** deploypath is set in web.config, may be used if additional html files should be served. Currently not used **/
/**
var deployPath = process.env.deployPath || "";
console.log('deploy path is set to ' + deployPath);
app.use(deployPath + 'conference',function(req, res,next) {
		res.sendFile(__dirname + '/conference.html'); 
});
app.use(deployPath  + 'css' , express.static(__dirname + '/css')); 
**/

/** Array with the current conference-rooms per project  **/
var rooms = {};

/** Configure Socket.IO **/
var io = require('socket.io').listen(server, { path : '/vroom/socket.io' })

	io.sockets.on('connection', function (socket) {
		
		socket.on('getMembers', function (data) {
			log(socket,'get connected users of room:' + data.room);
			socket.emit("roomInfos", rooms[data.room])		
        });
		
        socket.on('create_join', function (data) {
			log(socket,'room:' + data.room);
			addUserRoomIfNotFull(socket, data);			
        });
		
        socket.on('message', function (data) {
            socket.broadcast.to(data.room).emit('message', data.message);
        });
		  socket.on('hangup', function (room) {
            delete rooms[room];
			io.sockets.in(room).emit('message', "bye");
			socket.leave(room);
        });
	
		
    });

/** process.env.port ist set by NodeISS **/
server.listen(process.env.PORT, function () { console.log('Listening on ' + process.env.PORT)});


/********************* Functions ***********************************************/
function addUserRoomIfNotFull(socket, data){
				if(rooms.hasOwnProperty(data.room) == false){
					rooms[data.room] = {connectedCount:1};
					socket.join(data.room);
					socket.emit('created', data);
				}
				else if (rooms[data.room].connectedCount == 1) {
					rooms[data.room] = {connectedCount:2};
					socket.broadcast.to(data.room).emit('join', data.room);
					socket.join(data.room);
					socket.emit('joined', data.room);
				}
				else if(rooms[data.room].connectedCount >= 2 ){
					log(socket,"room is full! Nr. of members: " + rooms[data.room].connectedCount + ". Kick everybody out of room!");
					io.sockets.in(data.room).emit("message", "bye");
					delete rooms[data.room];
				}
				else{
					log(socket,'rooms:' + rooms[data.room]);
					for(var propName in rooms[data.room]) {
						propValue = rooms[data.room][propName]
						log(socket,propName + ":" + propValue);
					}	
				}
				
}

		function log(socket, message){
			socket.emit('log', ">>> Message from server: " + message);
		}
