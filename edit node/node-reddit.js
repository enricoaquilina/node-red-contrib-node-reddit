module.exports = function(RED) {
    "use strict";

    const snoowrap = require('snoowrap');
	var mustache = require("mustache");
	
	// In order of priority: 1. HTML text OR mustache syntax, 2. msg.msgProp 
    // Credit: John Costello.
	function parseField(msg, nodeProp, msgProp) {
        var field = null;
        var isTemplatedField = (nodeProp||"").indexOf("{{") != -1
        if (isTemplatedField) {
            field = mustache.render(nodeProp,msg);
        }
        else {
            field = nodeProp || msg[msgProp];
        }

        return field;
    }

	//Reddit-credentials node. Credit: John Costello.
    function CreateNodeRedditNode(n) {
        RED.nodes.createNode(this,n);
        this.username = n.username;
        this.user_agent = n.user_agent;
		this.auth_type = n.auth_type;
        this.name = n.name;
    }
    RED.nodes.registerType("reddit-credentials",CreateNodeRedditNode,{
      credentials: {
        password: {type: "password"},
        client_id: {type: "password"},
        client_secret: {type: "password"},
		refresh_token: { type: "password" },
        access_token: { type: "password" }
      }
    });
	
	
	
	function EditContent(n){
		RED.nodes.createNode(this,n);
		var config = RED.nodes.getNode(n.reddit);
        var credentials = config.credentials;
        var node = this;
        var options = {
            userAgent: config.user_agent,
            clientId: credentials.client_id,
            clientSecret: credentials.client_secret
        }
		
        if (config.auth_type == "username_password") {
            options.username = config.username;
            options.password = credentials.password;
        }
        else if (config.auth_type == "refresh_token") {
            options.refreshToken = credentials.refresh_token;
        }
        else if (config.auth_type == "access_token") {
            options.accessToken = credentials.access_token;
        }
		
		
		const r = new snoowrap(options);
        node.status({});
        node.on('input', function(msg) {
			//node.status({fill:"grey",shape:"dot",text:"loading"});
			
			var content_type = n.content_type || msg.content_type;
			var edit_content = n.edit_content || msg.edit_content;
			var content_id = parseField(msg, n.content_id, "content_id");
			
			//console.log(n.name);
			if (content_type == "comment"){
				node.status({fill:"grey",shape:"dot",text:"editing comment"});
				
				r.getComment(content_id).fetch().then(comment => node.send({ payload: "original: " + comment.body }));
				
				r.getComment(content_id).edit(edit_content);
				
				setTimeout(function() {
					
                    r.getComment(content_id).refresh().then(comment => node.send({ payload: "edited: " + comment.body }));
					
                }, 2000);
				node.status({});
			}
			else if (content_type == "submission"){
				node.status({fill:"grey",shape:"dot",text:"editing submission"});
				
				r.getSubmission(content_id).fetch().then(submission => node.send({ payload: "original: " + submission.selftext }));
				
				r.getSubmission(content_id).edit(edit_content);
				
				setTimeout(function() {
					
                    r.getSubmission(content_id).refresh().then(submission => node.send({ payload: "edited: " + submission.selftext }));
					
                }, 2000);
				node.status({});
			}
			
        });
	}
	RED.nodes.registerType("reddit-edit", EditContent);
}
