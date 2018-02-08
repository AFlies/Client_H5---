	var timer = {};//定时器
define(['jquery','webchat/common','core/sockjs','webchat/config','core/iscroll','webchat/jquery.cookie'],
	function ($,common,SockJS,config,IScroll) {
	
	//socket连接地址
	var sockjsUrl = config.requestHost+'/yichat/broker';
	var ca = null; //主动触发动作
	var custObj = {}; //客户信息
	var seatObj = {};//保存坐席信息	
	var timerArr = null;   //标题提示消息
	var loseFoces = false; //是焦点
	var questionList = [];
	var keyInput = false; //键输入
	var keyInputTimer = false;//键输入计时器
	var suggestedTimer = false; // 智能关联计时器
	var isRobotService = true;//机器人服务

	var befforMsg=[];
	custObj.companyID = config.companyID || '10011';
	custObj.isService = false;
	custObj.isAnswer = false;

	window.ChatManage = {}
	window.ChatManage.custObj = custObj;
	//客服应答
	var isAnswer = false;
	//socket对象
	var webSocket = { };
	webSocket.socket = null;
    webSocket.wsIsConnect = false;
	//是否在服务状态
	var isService = false;
	var countObj = {};
	//页面操作对象
	var pageOperation = {backEvent:{}};
	var histPosition = 0; //历史记录查询开始位置

	var myScroll;

	//socket基础功能初始化
	webSocket.socketInit = function(){
		webSocket.socket.onopen = function () {
			//common.log("socket连接成功");
			var param= {data:{}};
			param.data.response = {};
			param.data.response.msgType = "OnChatOpenSuccess";
			ChatManage.handleEvent2(param);
		};
		webSocket.socket.onclose = function (e) {
			//common.log("socket断开");
			var param= {data:{}};
			param.data.response = {};
			param.data.response.msgType = "OnChatCloseSuccess";
			param.e = e;			
			ChatManage.handleEvent2(param);
		};
		webSocket.socket.onerror = function (e) {
			//common.log("socket断开");
			var param= {data:{}};
			param.data.response = {};
			param.data.response.msgType = "OnChatCloseSuccess";
			param.e = e;
			ChatManage.handleEvent2(param);
		};
		webSocket.socket.onmessage = function (message) {
			message.data = JSON.parse(message.data);
			common.log("socket接收到消息："+JSON.stringify(message.data));
			ChatManage.handleEvent2(message);
		}
	}
	
	//socket连接
	webSocket.socketConn = function (host) {
		webSocket.socket = new SockJS(host); //sockeJs
		webSocket.socketInit();
	}
	
	//初始化cm连接
	function initConn(){
		webSocket.wsIsConnect ='ing';
		if(custObj.token != ''){
			webSocket.socketConn(sockjsUrl + '?token='+custObj.token);
		}else{

		}
		ca.getEvaluationOption();
	}
	
	//关闭连接
	function disConn(){
		webSocket.socket.close();
	}
	
	//发送消息
	function sendMessage(msg){
		if(msg != ''){
			webSocket.socket.send(msg);
		}
	}

	/**
	 * 接收事件数据处理
	 * @param param
	 */
	ChatManage.handleEvent2 = function(param){
		if(param && param.data.response &&  param.data.response.msgType){
			/*if(param.data.resultData && custObj.sessionId != param.data.resultData.session && param.data.response.msgType !='CHAT_SESSION_RECEIVEDATA'){
				return;
			}*/
			switch(param.data.response.msgType){
				case "OnChatOpenSuccess":{
					//socket连接状态为true
					webSocket.wsIsConnect = true;
					if(countObj['OnChatClose']) countObj['OnChatClose'] = 0;
					break;
				}
				case "OnChatCloseSuccess":{
					//socket连接状态为true
					webSocket.wsIsConnect = false;

					if(!countObj['OnChatClose']) countObj['OnChatClose'] = 0;

					if(countObj['OnChatClose']<6){
						countObj['OnChatClose']++;
						common.log("重连第"+countObj['OnChatClose']+"次")
						//重连socket
						initConn();
					}else{
						isService = false;
						countObj['OnChatClose'] = 0;
						var info ={type:"sysnotice",content:"连接已断开"};
						desMsg(info);
					}
					break;
				}
				//会话建立事件
				case "CHAT_SESSION_CONNECTED":{
					var resultData = param.data.resultData;
					custObj = $.extend({}, custObj, resultData)

					//服务状态改为TRUE
					isService = true;
					break;
				}
				//会话释放事件
				case "CHAT_SESSION_DISCONNECTED":{

					break;
				}

				//进入机器人
				case 'CHAT_SESSION_ROBOT_CONNECTED':{
					var resultData = param.data.resultData;
					custObj = $.extend({}, custObj, resultData);
					//服务状态改为TRUE
					isService = true;
					isRobotService = true;
					break;
				}

				//结束机器人
				case 'CHAT_SESSION_ROBOT_DISCONNECTED':{
					isService = false;
					isRobotService = false;
					break;
				}

				//进入排队事件
				case "CHAT_SESSION_QUEUING":{
					//服务状态改为false
					isService = "wait";

					//应答状态改为false
					isAnswer = false;

					break;
				}

				//排队超时事件
				case "CHAT_SESSION_QUEUE_TIMEOUT":{
					//服务状态改为false
					isService = false;

					//应答状态改为false
					isAnswer = false;

					clearInterval(timer['setGetQueueInfoInterval']);
					delete timer["setGetQueueInfoInterval"];				

					break;
				}

				//取消排队事件
				case "CHAT_SESSION_CANCEL_QUEUE":{
					//服务状态改为false
					isService = false;

					//应答状态改为false
					isAnswer = false;

					clearInterval(timer['setGetQueueInfoInterval']);
					delete timer["setGetQueueInfoInterval"];
					break;
				}

				//排队过长时间
				case "CHAT_SESSION_QUEUE_LONG":{

					break;
				}

				//会话建立失败
				case "CHAT_SESSION_FAILURE":{
					//服务状态改为false
					isService = false;

					//应答状态改为false
					isAnswer = false;
					clearInterval(timer['setGetQueueInfoInterval']);
					delete timer["setGetQueueInfoInterval"];
					break;
				}

				//会话转移
				case "CHAT_SESSION_TRANSFER":{
					window.console && console.log("会话转移");
					window.console && console.log(param);
					break;
				}

				//收到数据
				case "CHAT_SESSION_RECEIVEDATA":{
					if(custObj.sessionId != param.data.resultData.sessionId){
						var resultData = param.data.resultData;
						histMessage = [];
						histMessage.push(resultData);
					}
					break;
				}

				//久不操作
				case "YICHAT_USER_LONGTIME_NOOPERATE":{

					break;
				}
			}
		}

		pageOperation.operEvent2(param);
	}

	pageOperation.operEvent2 =function(param){
		if(param && param.data.response &&  param.data.response.msgType){
			switch(param.data.response.msgType){
				case "OnChatOpenSuccess":{
					//ca.createSession();
					//获取最近的消息
					//ca.getMessage();
					ca.getLatestSession();
					break;
				}
				//会话建立事件
				case "CHAT_SESSION_CONNECTED":{

					//放开结束会话按钮
					$('#releaseCall').show();

					//设置客服头像名称
					$('#agentId').html(custObj.agentNiceName || '');

					//排队信息清空
					$('#getQueueInfo').remove();

					isRobotService = false;

					//发送缓存的消息
					sendBefforMsg();

					var info ={type:"sysnotice",content:"客服"+custObj.agentNiceName+"即将为你服务"};
					desMsg(info);


					break;
				}
				//会话释放事件
				case "CHAT_SESSION_DISCONNECTED":{
					//禁用结束会话按钮
					$('#releaseCall').hide();
					isRobotService = true;
					//清除服务时间定时器
					clearInterval(timer['setServiceTime']);
					delete timer['setServiceTime'];
					if(isService == false){
						sessionOver(false);
					}else{
						sessionOver(true);
					}	
					break;
				}

				//进入机器人
				case 'CHAT_SESSION_ROBOT_CONNECTED':{
					$('#createSession').remove();
					$('#releaseCall').hide();
					$('#transferToArtificial').show();
					
					var content = config.robotWelcome ? config.robotWelcome : '在线机器人为您服务中……' ;
					var info={"type":"sysnotice","content":content,id:"transferToArtificialMsg"};
					desMsg(info);
					//发送缓存的消息
					sendBefforMsg();
					break;
				}

				//结束机器人
				case 'CHAT_SESSION_ROBOT_DISCONNECTED':{
					$('#transferToArtificial').hide();
					
					if(isService == false){
						sessionOver(false);
					}else{
						sessionOver(true);
					}
					break;
				}

				//进入排队事件
				case "CHAT_SESSION_QUEUING":{
					setGetQueueInfoInterval();
					//发送缓存的消息
					sendBefforMsg();
					//ca.getQueueInfo();
					break;
				}

				//排队超时事件
				case "CHAT_SESSION_QUEUE_TIMEOUT":{
					var causeId = param.data.resultData.causeId; //释放原因ID
					var causeDesc = param.data.resultData.causeDesc; //释放原因说明

					var info={"type":"sysnotice","content":"排队超时，请重新发起咨询"};
					desMsg(info);
					sessionOver(true);
					break;
				}

				//排队过长时间
				case "CHAT_SESSION_QUEUE_LONG":{
					var rs = param.data.resultData;
					if(rs.longQueueLeftMessageEnable == 1){
						layer.open({
							content: '客服正忙，请稍候...或者可以给我们留言！'
							,btn: ['确定', '取消']
							,yes: function(index){
								$("#leaveMsgModal").show();
								ca.dropSession();
								layer.close(index);
							}
						});
					}
					break;
				}

				case "CHAT_SESSION_OFFWORKTIME":{
					if(config.leaveMsg == 1){
						layer.open({
							content: '当前为非服务时间，或者您可以给我们留言。'
							,btn: ['确定', '取消']
							,yes: function(index){
								$("#leaveMsgModal").show();
								layer.close(index);
							}
						});
					}else{
                        var content = config.robotOffWorkTime ? config.robotOffWorkTime : "当前未服务时间.";
                        var _info={"type":"sysnotice","content":content};
                        desMsg(_info);
                    }
					break;
				}

				//取消排队事件
				case "CHAT_SESSION_CANCEL_QUEUE":{
					var causeId = param.data.resultData.causeId; //取消原因ID
					var causeDesc = param.data.resultData.causeDesc; //取消原因说明

					var info={"type":"sysnotice","content":causeDesc};
					desMsg(info);

					break;
				}

				//会话建立失败
				case "CHAT_SESSION_FAILURE":{

					var causeId = param.data.resultData.causeId; //失败原因ID
					var causeDesc = param.data.resultData.causeDesc; //失败原因

					var info={"type":"sysnotice","content":"转人工失败，失败原因："+causeDesc};
					desMsg(info);
					break;
				}

				//会话转移
				case "CHAT_SESSION_TRANSFER":{
					break;
				}

				//收到数据
				case "CHAT_SESSION_RECEIVEDATA":{
					var resultData = param.data.resultData;
					resultData.data = resultData.content;
					param = resultData;
					//console.log("----------接收到消息----------");

					//不显示 小I机器人额解决未解决
					if(config.robotType && config.robotType == 4){
						if(resultData.content.indexOf("faqvote:") == 0){
							return;
						}
					}

					desMsg(param);
					break;
				}

				//久不操作
				case "YICHAT_USER_LONGTIME_NOOPERATE":{
					var info = {"type":"sysnotice","content":"请问还有什么需要咨询？"};
					desMsg(info);
					break;
				}
			}
		}
	}
	
	//解析消息格式 并发送到网关
	function sendToGw(data){
		setTimeout(function(){
			var mediaType ='text'; //定义消息类型
			var sdata = $("<div>"+data+"</div>").find('img');
			//console.log(sdata.eq(0).attr('flag'));
			//判断是否是图片 
			if(sdata.eq(0).attr('flag')=='pic'){
				mediaType = "image";
				data = '{"picUrl": "'+sdata.eq(0).attr("id")+'"}';
			};

			//录音
			if(data.indexOf('"msgType":"voice"')>-1){
				var dataObj = JSON.parse(data);
				//delete dataObj["msgType"];
				data = jsonToString(dataObj);
				mediaType = "voice";
			}

			//验证成功
			if(data.indexOf('"msgType":"custVerify"')>-1){
				var dataObj = JSON.parse(data);
				//delete dataObj["msgType"];
				data = jsonToString(dataObj);
				mediaType = "custVerify";
			}

			//视频
			if(data.indexOf('"msgType":"custVideo"')>-1){
				var dataObj = JSON.parse(data);
				//delete dataObj["msgType"];
				data = jsonToString(dataObj);
				mediaType = "custVideo";
			}

			//指令  该类型不计入数据库
			if(data.indexOf('"msgType":"order"')>-1){
				var dataObj = JSON.parse(data);
				//delete dataObj["msgType"];
				data = jsonToString(dataObj);
				mediaType = "order";
			}

			//text类型
			if(mediaType == 'text'){
				
			}
            ca.sendMessage(data,mediaType);
            //$("#chatsent").focus();
            //自动滚动到底部
			if(mediaType != "order")
            autoToBottom($('#message-list'));
		},100)
			
	}

	function sendBefforMsg(){
		//console.log(befforMsg);
		if(befforMsg.length==undefined||befforMsg==null) return;
		for (var i = 0; i <  befforMsg.length; i++) {
			var data = befforMsg[i];
			//console.log("发送消息到网关");
			sendToGw(data);
		}
		befforMsg =[];
	}
	jsonToString = function(obj){     
	    var THIS = this;      
	    switch(typeof(obj)){     
	        case 'string':     
	            return '"' + obj.replace(/(["\\])/g, '\\$1') + '"';     
	        case 'array':     
	            return '[' + obj.map(THIS.jsonToString).join(',') + ']';     
	        case 'object':     
	             if(obj instanceof Array){     
	                var strArr = [];     
	                var len = obj.length;     
	                for(var i=0; i<len; i++){     
	                    strArr.push(THIS.jsonToString(obj[i]));     
	                }     
	                return '[' + strArr.join(',') + ']';     
	            }else if(obj==null){     
	                return 'null';     

	            }else{     
	                var string = [];     
	                for (var property in obj) string.push(THIS.jsonToString(property) + ':' + THIS.jsonToString(obj[property]));     
	                return '{' + string.join(',') + '}';     
	            }     
	        case 'number':     
	            return obj;
			case 'boolean':
				return obj;
	        case false:     
	            return obj;     
	    }     
	}

	//主动发起操作
	function custActive(){

		custActive.prototype.service = function(opts){
			var url = config.requestHost+"/service/"+opts.msgType;
			var dataObj = {
				"request":
				{
					"version":"1.0",
					"msgType":opts.msgType,
					"sequenceNo": new Date().getTime(),
					"tenantId":custObj.tenantId,
					"validateString":"XXXXX",
				},
				"msgBody":opts.msgBody?opts.msgBody:null
			};
			var data = jsonToString(dataObj);
			var ajaxParam={
				type:opts.type?opts.type:"POST",
				url:url,
				async:opts.async?opts.async:true, //同步				
				dataType:opts.dataType?opts.dataType:'json',
				contentType:'application/json;charset=UTF-8',
				data:data,
				beforeSend:function(XHR){
	                if(opts.token && opts.token !=''){
	                   XHR.setRequestHeader('Authorization',opts.token);
	                }
	            },
	            success:function(data){
	            	if(opts.success)opts.success(data?data:{});
	            },
	            error:function(data, textStatus, errorThrown){
	            	if(opts.error)opts.error(data?data:{});
	            }
			};
			try{$.ajax(ajaxParam)}catch(e){};
		};
		/**
		 * (产生访客用户名)
		 */
		custActive.prototype.getVisitorUsername = function(){
			var opts = {
				msgType:"getVisitorUsername",
				msgBody:null,
				success:function(data){
					if(data.response.resultCode == "0"){
						custObj.username = data.resultData.username;
						$.cookie(custObj.tenantId+"||username",custObj.username);
						ca.visitorLogin();
					}else{
						custObj.username = "";
					}
				},
				error:function(data){
					//layer.msg("产生访客用户名错误", {icon: 5,shade: [0.3,'#000'], shadeClose:true});
					//提示
					layer.open({
					    content: '产生访客用户名错误',
					    skin: 'msg',
					    time: 2//2秒后自动关闭
					});
				}
			};
			this.service(opts);			

		};

		//获取客户端配置信息
		custActive.prototype.getWebConfig = function(){
			var opts = {
				msgType:"getWebConfig",
				msgBody:{tenantId:custObj.tenantId,webConfigId:custObj.webConfigId},
				success:function(data){
					if(data.response.resultCode == "0"){
						//initWebConfig(data.resultData);
						window.console && console.log(data.resultData);

						//获取访客身份并登陆
						if(custObj.username != '' && custObj.token!='' && custObj.userId!=''){
							ca.visitorLogin();
						}else{
							ca.getVisitorUsername();
						}
					}else{
						
					}
				},
				error:function(data){
					//layer.msg("客户端配置信息获取错误", {icon: 5,shade: [0.3,'#000'], shadeClose:true});
					//提示
					layer.open({
					    content: '客户端配置信息获取错误',
					    skin: 'msg',
					    time: 2//2秒后自动关闭
					});
				}
			};
			this.service(opts);	
		}

		/**
		 * 访客登录 获取用户id和令牌
		 */
		custActive.prototype.visitorLogin = function(){
			var opts = {
				msgType:"visitorLogin",
				msgBody:{"username":custObj.username},
				success:function(data){
					if(data.response.resultCode == "0"){
						custObj.userId = data.resultData.userId;
						custObj.callnum = data.resultData.userId;
						custObj.token = data.resultData.token;
						initConn();
					}else{
						custObj.userId = "";
						custObj.token = "";
					}
				},
				error:function(data){
					custObj.userId = "";
					custObj.token = "";
				}
			};
			this.service(opts);		
		};

		/**
		 * 建立会话 (发起转人工)
		 * @param skillId 请求建立会话的技能队列
		 * @param callData 随路数据 JsonObject
		 * @param level 客户级别 默认为0 越大优先级越高
		 */
		custActive.prototype.createSession = function(){
			common.log(custObj.username+"发起转人工请求");
			var info={type:"sysnotice",content:"正在为您接入客服，请稍后...",msgId:"createSession"};
			desMsg(info);
			var skillId = custObj.skillId;
			var callData = custObj.callData;
			var level = custObj.level ||0;

			var opts = {
				msgType:"createSession",
				msgBody:{"skillId":skillId,"callData":callData,"level":level},
				token:custObj.token,
				success:function(data){
					common.log("转人工请求返回:"+JSON.stringify(data));
					if(data.response.resultCode == "0"){
						custObj.sessionId = data.resultData.sessionId;
						if(countObj['100010']) countObj['100010'] = 0;
					}else if(data.response.resultCode == "100006"){ //当前非服务时间
						var info = {type:"sysnotice",content:"当前非服务时间,请在服务时间咨询"};
						desMsg(info);
						if(config.leaveMsg){
							layer.open({
								content: '当前为非服务时间，或者您可以给我们留言。'
								,btn: ['确定', '取消']
								,yes: function(index){
									$("#leaveMsgModal").show();
									layer.close(index);
								}
							});
						}
					}else if(data.response.resultCode == "100010"){ //已经申请过 先结束后申请
						custObj.sessionId = data.resultData.sessionId;
						if(!countObj['100010']) countObj['100010'] = 0;
						if(countObj['100010']<6){
							countObj['100010']++;
							ca.dropSession(1);
						}else{
							var info = {type:"sysnotice",content:"转人工失败，请稍后重试！"};
							desMsg(info);
						}
					}else if(data.response.resultCode == "100011"){ 
						ca.createSession();
					}else{

					}
				},
				error:function(data){
					var info={type:'sysnotice',"content":'转人工失败，请稍后重试！'};
					desMsg(info);
					common.log("转人工请求异常:"+JSON.stringify(data),"ERROR");
				}

			};
			this.service(opts);			
		};

		//结束会话
		custActive.prototype.dropSession = function(type){
			common.log(custObj.username+"----------发起结束会话-----------");
			var opts = {
				msgType:"dropSession",
				msgBody:{sessionId:custObj.sessionId},
				token:custObj.token,
				success:function(data){
					common.log("结束会话返回"+JSON.stringify(data));
					if(data.response.resultCode=="0"){
						if(type == 1){ //表示重新签入
							ca.createSession();	
						}else{
							sessionOver(true);
						}
						
					}else{
						//layer.msg(data.response.resultMsg, {icon: 5,shade: [0.3,'#000'], shadeClose:true});
						//提示
						layer.open({
						    content: data.response.resultMsg,
						    skin: 'msg',
						    time: 2//2秒后自动关闭
						});
						
					}

				},
				error:function(data){

				}
			};
			this.service(opts);
			
		};

		//机器人时发起转人工
		custActive.prototype.transferToArtificial = function(){
			common.log(custObj.username+"转移到人工服务");
			/*var info={type:"sysnotice",content:config.serviceStarTips,id:"transferToArtificial"};
			desMsg(info);*/
			var sessionId = custObj.sessionId;
			var opts = {
				msgType:"transferToArtificial",
				msgBody:{sessionId:sessionId},
				token:custObj.token,
				success:function(data){
					common.log("转人工请求返回:"+JSON.stringify(data));
					if(data.response.resultCode == "0"){
						if(countObj['100010']) countObj['100010'] = 0;
					}else if(data.response.resultCode == "100006"){ //当前非服务时间
						var info = {type:"sysnotice",content:config.serviceTime};
						desMsg(info);
						//是否启动留言
						if(config.leaveMsg){
							//询问框
							layer.confirm('当前为非服务时间，或者您可以给我们留言。', {
								btn: ['确定','取消'], //按钮
								icon: 3,
								title:'提示'
							}, function(index){
								layer.close(index); //关闭弹出框
								leaveMsgModal = layer.open({
									title:"我们会第一时间处理您的留言",
									type: 1,
									area: ['650px', '380px'],
									content: $('#leaveMsg')
								});
							}, function(){

							});
						}

					}else if(data.response.resultCode == "100010"){ //已经申请过 先结束后申请

					}else if(data.response.resultCode == '100009'){
						var info={"type":"sysnotice",content:"您已在其他页面打开聊天界面"};
						desMsg(info);
						sessionOver(true);
					}else if(data.response.resultCode == "100011"){
						ca.transferToArtificial();
					}else{

					}
				},
				error:function(data){
					if(data.responseJSON.response.resultCode == '100009'){
						var info={"type":"sysnotice",content:"您已在其他页面打开聊天界面"};
						desMsg(info);
						sessionOver(true);
					}else{
						//layer.msg("转人工异常，请重试", {icon: 5,shade: [0.3,'#000'], shadeClose:true,anim: 6});
						//提示
						layer.open({
						    content: "转人工异常，请重试",
						    skin: 'msg',
						    time: 2//2秒后自动关闭
						});
					}
					common.log("转人工请求异常:"+JSON.stringify(data),"ERROR");
				}

			};
			this.service(opts);
		};

		//取消排队
		custActive.prototype.cancelQueue = function(){

			var opts = {
				msgType:"cancelQueue",
				msgBody:{"sessionId":custObj.sessionId},
				token:custObj.token,
				success:function(data){
					var resultObj = {
						resultCode:data.response.resultCode,
						resultMsg:data.response.resultMsg,
						resultData:data.resultData
					};
					if(resultObj.resultCode == "0"){
						var info = {type:"sysnotice",content:"排队已取消"};
						desMsg(info);
						sessionOver(true);
					}else{
						//common.alert(resultObj.resultMsg);
						//提示
						layer.open({
						    content: resultObj.resultMsg,
						    skin: 'msg',
						    time: 2//2秒后自动关闭
						});
					}


				},
				error:function(data){
					//common.alert("取消排队出现错误");
					layer.open({
						    content: "取消排队出现错误",
						    skin: 'msg',
						    time: 2//2秒后自动关闭
						});
				}
			}
			this.service(opts);

			
		}

		/**
		 * 发送消息
		 * @param content 数据内容
		 * @param type  消息类型
		 */
		custActive.prototype.sendMessage = function(content,type){
			var opts = {
				msgType:"sendMessage",
				msgBody:{"sessionId":custObj.sessionId,"content":content,"type":type},
				token:custObj.token,
				success:function(data){
					var resultObj = {
						resultCode:data.response.resultCode,
						resultMsg:data.response.resultMsg,
						resultData:data.resultData
					};
					return resultObj;

				},
				error:function(data){
					var resultObj = {
						resultCode:'-1',
						resultMsg:"error"
					};
					return resultObj;
				}
			}

			this.service(opts);
		}

		//获取排队信息
		custActive.prototype.getQueueInfo = function(){
			var opts = {
				msgType:"getQueueInfo",
				msgBody:{"sessionId":custObj.sessionId},
				token:custObj.token,
				success:function(data){
					if(data.response.resultCode == '0'){
						var resultData = data.resultData;
						if(resultData != ""){
							//cust.skillId = resultData.skillId; //当前排队的技能队列
							var onlineAgentNum = resultData.onlineAgentNum;//对应队列签入的坐席数
							var position = resultData.position;//当前在排队中的位置
							var currentWaitTime = resultData.currentWaitTime;//当前队列排队时长

							var info={"type":"sysnotice",msgId:"getQueueInfo"};
							info.content = "正在排队中,当前排在第" + position + "位,已等待"+currentWaitTime+"秒";
							desMsg(info);
						}
					}

				},
				error:function(data){

				}
			}
			this.service(opts);
			
		}


		/**
		 * 获取聊天历史消息
		 *
		 * @param size  消息条数
		 * @param direction 查询的方向 forward查询更新的聊天记录,
		 * 							  backward查询更早的聊天记录
		 * @param position  起始位置(返回记录不包含该位置)
		 */
		custActive.prototype.getMessage = function(size,direction,position){			
			if(size =='' || size == null || typeof size == undefined ){ size = 10};
			if(direction =='' || direction == null || typeof size == undefined){ direction = "backward"};
			if(position =='' || position == null || typeof position == undefined){ position = 0};
			var opts = {
				msgType:"getMessage",
				msgBody:{"size":size,"direction":direction,"position":position},
				token:custObj.token,
				success:function(data){
					if(data.response.resultCode == 0){						
						if(data.resultData.message.length > 0){
							histPosition = data.resultData.message[data.resultData.message.length-1].id;
							showHistMessage(data.resultData.message);
						}else{
							$("#history").attr("disabled","disabled").removeClass("m-color-1");
						}
					}else{
						//common.alert("token异常");
					}

				},
				error:function(data){
					//return "error";
				}
			}
			this.service(opts);
		}

		custActive.prototype.getLatestSession = function(){
			var opts = {
				msgType:"getLatestSession",
				msgBody:null,
				token:custObj.token,
				success:function(data){
					if(data.response.resultCode == 0){
						if( data.resultData == null ){
							/*if(config.sysName == '华安'){
								showQuestToChatPanel(questionList);	
							}else{								
								ca.createSession();
							}*/
							return;
						}
						custObj.sessionId = data.resultData.sessionId;
						custObj.state = data.resultData.state || '';
						if(custObj.state == 'terminal'){ //终止状态
							/*if(config.sysName == '华安'){
								showQuestToChatPanel(questionList);	
							}else{
								ca.createSession();
							}*/
						}else if(custObj.state == 'queuing'){ //排队状态
							//服务状态改为false
							isService = "wait";

							//应答状态改为false
							isAnswer = false;
							setGetQueueInfoInterval();
						}else if(custObj.state == 'normal'){  //正常服务状态
							isService = true;
							//放开结束会话按钮
							$('#releaseCall').show();

							//设置客服头像名称
							$('#agentId').html(data.resultData.agentNiceName || '');
							sendBefforMsg();
							
							var info={type:'sysnotice',"content":'正在服务中'};
							desMsg(info);
						}else if(custObj.state == "robot"){
							isService = true;
                            $('#releaseCall').hide();
							var info={type:'sysnotice',"content":'在线机器人为您服务中……',id:'transferToArtificialMsg'};	
							desMsg(info);
							sendBefforMsg();
						}else{
							if(config.sysName == '华安'){
								showQuestToChatPanel(questionList);	
							}else{
								ca.createSession();
							}
						}

					}else{
						var info={type:'sysnotice',"content":'转人工失败，请稍后重试！'};
						desMsg(info);
					}

				},
				error:function(data){
					var info={type:'sysnotice',"content":'转人工失败，请稍后重试！'};
					desMsg(info);
				}
			}
			this.service(opts);	
		}

		/**
		 * 主动发送消息
		 * @param data
		 */
		custActive.prototype.sendMsg = function(data){			
			if(webSocket.wsIsConnect == false){
				befforMsg.push(data);
				if(isService == true ){
					initConn();					
				}else{						
					ca.visitorLogin(); //重新获取token
					
				}
				return;				
			}else if(webSocket.wsIsConnect == 'ing'){
				befforMsg.push(data); //记录连接之前的消息
				return;
			}else{				
				//断开服务 再次发起服务请求
				if(isService == false ){					
					befforMsg.push(data);						
					ca.createSession();	
					return;				
				}else if( isRobotService == true && data == "转人工"){
					befforMsg.push(data);
					ca.transferToArtificial();
					return;
				}
			}			
			//发送消息到网关
			sendToGw(data);            
		};

		//获取满意度评价选项。
		custActive.prototype.getEvaluationOption = function(){

			var opts = {
				msgType:"getEvaluationOption",
				msgBody:null,
				token:custObj.token,
				success:function(data){
					if(data.response && data.response.resultCode ==0){
						var evaluationConfig  = data.resultData.evaluationConfig;
						custObj.evaluationConfig = evaluationConfig;
						appendEval();
					}
				},
				error:function(){

				}
			};
			this.service(opts);
		}

		//提交满意度评价
		custActive.prototype.evalution = function(transferId,evaluationLevel,evaluationContent){
			var opts = {
				msgType:"evalution",
				msgBody:{transferId:transferId,evaluationLevel:evaluationLevel,evaluationContent:evaluationContent},
				token:custObj.token,
				success:function(data){
					if(data.response.resultCode == 0){
						var info={"type":"sysnotice",content:"感谢您的评价！再见！"};
						desMsg(info);
					}else{
						//common.alert("评价失败！");
						layer.open({
						    content: "评价失败！",
						    skin: 'msg',
						    time: 2//2秒后自动关闭
						});
					}
					
				},
				error:function(data){
					//common.alert("评价失败!");
					layer.open({
						    content: "评价失败！",
						    skin: 'msg',
						    time: 2//2秒后自动关闭
						});
				}
			}
			this.service(opts);
		}
		//提交满意度评价
		custActive.prototype.evalutionRobot = function(accessId,evaluationLevel,evaluationContent){
			var opts = {
				msgType:"evalutionRobot",
				msgBody:{accessId:accessId,evaluationLevel:evaluationLevel,evaluationContent:evaluationContent},
				token:custObj.token,
				success:function(data){
					if(data.response.resultCode == 0){
						var info={"type":"sysnotice",content:"感谢您的评价！"};
						desMsg(info);
					}else{
						//common.alert("评价失败！");
						layer.open({
						    content: "评价失败！",
						    skin: 'msg',
						    time: 2//2秒后自动关闭
						});
					}
					
				},
				error:function(data){
					//common.alert("评价失败!");
					layer.open({
						    content: "评价失败！",
						    skin: 'msg',
						    time: 2//2秒后自动关闭
						});
					
				}
			}
			this.service(opts);
		}
		// 留言
		custActive.prototype.leaveMsg = function(name,phone,content){
			var opts = {
				msgType:"addLeftMessage",
				msgBody:{name:name,phone:phone,content:content},
				token:custObj.token,
				success:function(data){
					if(data.response.resultCode == 0){
						var info={"type":"sysnotice",content:"留言成功,我们会尽快为您处理！"};
						desMsg(info);
					}else{
						common.alert("留言失败！");
					}
					$("#leaveMsgModal").hide();
				},
				error:function(data){
					common.alert("留言失败！");
					$("#leaveMsgModal").hide();
				}
			};
			this.service(opts);
		};

		// 获取智能提示
		custActive.prototype.getSuggestedQuestion = function (val,func) {
            var url = config.requestHost +"/yibot/getSuggestedQuestion";
            var dataObj = {
                "request":
                    {
                        "version":"1.0",
                        "msgType":"getSuggestedQuestion",
                        "sequenceNo": new Date().getTime(),
                        "tenantId":custObj.tenantId,
                        "validateString":"XXXXX"
                    },
                "msgBody":{
                    content:val,
                    channelId:custObj.callData.channelId,
                    size:3
                }
            };
            var data = jsonToString(dataObj);
            var ajaxParam = {
                type:"POST",
                url:url,
                async:false,
                dataType:'json',
                contentType:'application/json;charset=UTF-8',
                data:data,
                beforeSend:function(XHR){
                    if(custObj.token && custObj.token !=''){
                        XHR.setRequestHeader('Authorization',custObj.token);
                    }
                },
                success:function(data){
                    if(func)func(data?data:{});
                },
                error:function(data, textStatus, errorThrown){
                    //if(opts.error)opts.error(data?data:{});
                }
			}
			try{$.ajax(ajaxParam)}catch(e){}
        }
	}

	function showHistMessage(msgList){
		for(var  i=0; i<= msgList.length-1;i++){
			
			var param = msgList[i];	
			if( $("#"+param.msgId)[0] != undefined ){continue;}		
			//系统消息
			if(param.type == 'sysnotice'){  //系统消息			

				var tabStr = $('<div id="'+param.msgId+'" class="weui-flex">'  
		            +'<div class="weui-flex__item">'
		             + '<div class="sys-msg"><small>'+param.content+'</small></div>'
		            +'</div>'
		        +'</div>');

				tabStr.hide();
				$('#historyInfo').after(tabStr);
				tabStr.fadeIn(500);
			}else{		

				var headName = ''; //头像文字
				var showName = ""; //显示的名字
				var msgType;
				var headImg = "";
				var time = common.getChatTime(param.sendTime);
				if(param.msgFrom == custObj.userId){ //客户发送的消息
					headName = "我";
					msgType = 2;//消息方向
				}else{					
					param.senderNiceName = param.senderNiceName || "";
					headName = "客服";
					msgType = 1; //消息方向 客服->客户	
					//机器人头像和客服头像区分
					headImg = param.msgFrom == 10001?'../images/robot.png':'../images/stewardess.png';				
				}

				if(msgType == 1){	
				
				var divStr = $('<div id="'+param.msgId+'" class="weui-flex">'
				            +'<div>'
				            +'    <div class="placeholder"><img class="img-thumbnail" src="'+headImg+'" alt="" width="40"></div>'
				            +'</div>'
				            +'<div class="weui-flex__item">'
				            +'    <div class="chat-content lt-chat J_content"></div>'
				            +'</div>'
				            +'<div>'
				             +'   <div class="placeholder"></div>'
				           +' </div>'
				        +'</div>');
					
				}else{
					var divStr = $('<div  class="weui-flex">'
				            +'<div>'
				            +   ' <div class="placeholder"></div>'
				            +'</div>'
				            +'<div class="weui-flex__item">'
				            +    '<div class="chat-content rt-chat J_content"></div>'
				            +'</div>'
				            +'<div>'
				            +    '<div class="placeholder"><img class="img-thumbnail" src="../images/user.png" alt="" width="40"></div>'
				            +'</div>'
				        +'</div>');

				}					

				//接收文本消息
				if(param.type == 'text'){
					//去掉html标签
					param.content = removeHTMLTag(param.content  );
					//替换空格字符
					param.content = param.content.trim().replace(/&nbsp;/ig,' ');	
                    // param.content = common.decipherRobotMsg(param,config.robotType||0);
					divStr.find(".J_content").text(param.content);
					divStr.hide();
					$("#historyInfo").after(divStr);
					//淡出效果
					divStr.fadeIn(500);
					timeTips(param,1);
				}else if(param.type == 'image' ){ //接收图片消息
					//common.msg("收到【图片消息】"); 
					var data = eval('('+param.content+')');
					var filePath = data.picUrl;
					var imgPath = config.requestHost+'/service/getFile?filePath='+filePath;
		    
				    //showReceiveImg(imgPath,param.msgId,divStr);
				    divStr.hide();
					$("#historyInfo").after(divStr);
				    (function(){
				    	var $img;
					    var img = new Image();	   
					    img.src = '';
					    img.onload = function(){
					    	var s = Math.round(this.width/200);
					    	var w = s == 0 ? this.width:Math.round(this.width/s);
					    	var h = s == 0 ? this.height:Math.round(this.height/s);
					    	$img = $('<img flag="pic"  width="'+w+'" height="'+h+'" _width="'+img.width+'" _height="'+img.height+'" />').attr('src',this.src);
					    	$('#'+param.msgId).find(".J_content").html($img);
							divStr.fadeIn(500);
					    };
					    img.src = imgPath;
				    })();

				}else if(param.type == 'voice'){  //接收语音消息
					var _msgObj = JSON.parse(param.content) ;
					var msg = recordPlay.getVoiceHtml(_msgObj,msgType);
					divStr.find(".J_content").html(msg);
					$("#historyInfo").after(divStr);
				}else if(param.type == 'custVerify' ){//身份验证
					param.content = JSON.parse(param.content);
					if(param.content.sendToAgent){
						return;
					}
					divStr.hide();				
					var msg = $('<a class="text-red" onclick="javascript:void(0)">点击进入账户验证</a>');
					divStr.find(".J_content").html(msg);
					$("#historyInfo").after(divStr);									
					divStr.fadeIn(500);
				}
			}
		}

		setTimeout(function () {
	        myScroll.refresh();
	    }, 0);	

	}
	

		/**
		 * 会话结束后释放
		 */
	function sessionOver(p){
		isService = false;
		isAnswer = false;
		//禁用结束会话按钮
		$('#releaseCall').hide();
		//排队信息清空
		$('#getQueueInfo').remove();
		//清除定时器
		clearInterval(timer['setServiceTime']);
		delete timer['setServiceTime'];
		clearInterval(timer['setGetQueueInfoInterval']);
		delete timer["setGetQueueInfoInterval"];
		timer = {};
		befforMsg = [];
		
		if(p){	
			param = {type:'sysnotice',content:'本次会话结束，感谢您的使用！'};
			desMsg(param);
		}
	}

	//获取配置信息后初始化页面
	function initWebConfig(data){
		var tenant = data.tenant;
		var webConfig = data.webConfig;
		var webTabPage = data.webTabPage;

		//setTenantConfig(tenant);

		//setWebConfig(webConfig);

		setWebTabPage(webTabPage);		

	}

	//webTabPage = List<WebTabPageInfo>
	function setWebTabPage(webTabPage){		
		for (var i = 0; i < webTabPage.length; i++) {
			//TAB类型 1公司介绍 2常见问题 3自定义url
			switch(webTabPage[i].webTabPageType){
				case 1:{
					
					break;
				}
				case 2 :{
					questionList = 	JSON.parse( webTabPage[i].question);
					questionList = questionList.splice(0,config.questionLen||5);
					//showQuestToChatPanel(questionList);
					break;
				}
				case 3 :{
					
				}


			}
		}

	}

	//显示问题到聊天界面
	function showQuestToChatPanel(questionList){
		var $befQ ="";
		var len = questionList.length >5? 5 : questionList.length;
		for(var i = 0; i<len;i++){
			$befQ += '<div class="J_befQ" ><a class="text-blue J_question" index="'+i+'" href="javascript:void(0)">'+questionList[i].question+'</a></div>'
		}
		$("#questionList").remove();

		var $div = $('<div id="questionList" class="touch-left cell" data-msg-id="bb6a2e2d-26c8-42e8-848d-ebcf1f5a892f">'
							+'<div class="head-left service-logo"></div><div class="cell-fit position-r">'
							+'<div class="touch-content-wrap cell touch-left-width"><div class="touch-white-left"></div><div class="cell-fit">'
							+'<div class="touch-content touch-content-spal wrap-word J_content">'
							+'<div class="J_befQ text-grey" >您是否想咨询</div>'
					    	+ $befQ
					    	+'<div  class="J_befQ J_createSession text-grey">直接转<a class="text-red" href="javascript:void(0)">人工服务</a></div>'
							+'</div></div></div></div><div class="head-right"></div></div>').hide();


		$("#message-list").append($div);
		$div.fadeIn(500,function(){
			autoToBottom($('#message-list'));
		});	
		//滚动条
		autoToBottom($('#message-list'));			
	}

	function setAnswerToPanel(index){		
		var $div = $('<div id="" class="touch-left cell" data-msg-id="bb6a2e2d-26c8-42e8-848d-ebcf1f5a892f">'
							+'<div class="head-left service-logo"></div><div class="cell-fit position-r">'
							+'<div class="touch-content-wrap cell touch-left-width"><div class="touch-white-left"></div><div class="cell-fit">'
							+'<div class="touch-content touch-content-spal wrap-word J_content">'
					    	+ questionList[index].answer
					    	+"<br>"
					    	+'<div  class="J_befQ text-grey J_createSession">直接转<a class="text-red" href="javascript:void(0)">人工服务</a></div>'
							+'</div></div></div></div><div class="head-right"></div></div>').hide();

		$("#message-list").append($div);
		$div.fadeIn(500,function(){
			autoToBottom($('#message-list'));
		});		
		//滚动条
		autoToBottom($('#message-list'));
	}

	//
	function appendEval(){
		var evaluationConfig  = custObj.evaluationConfig;
		custObj.evalLvl = 5;
		//清空数据
		$(".agr_t li").remove();
		var message = $(".pj-message");
		var _html = "";
		for (var i = 0; i < evaluationConfig.length; i++) {
            var checked = i == 0 ? "agr_t_spa" : "";
            custObj.evalLvl = i == 0 ? evaluationConfig[i].level : custObj.evalLvl;
            _html = '<li val="'+evaluationConfig[i].level+'"><span class="'+checked+'"></span>'+evaluationConfig[i].name+'</li>';
            _html = $(_html).click(function(){
                $(".agr_t_spa").removeClass("agr_t_spa");
                custObj.evalLvl = $(this).attr("val");
                $(this).find("span").addClass("agr_t_spa");
            });
            message.before(_html);
		}
	}

	//绑定事件
	function bindEvent(){

		//失去焦点
		window.onblur = function() {
			loseFoces = true;
		};	
		//获得焦点
		window.onfocus = function() {
			blinkTitleClear(timerArr);
			loseFoces = false;
			timerArr = null;
		};

		//点击发送消息按钮事件
	    $("#searchCancel").on('click',function(){		        	
    		var data = $("#searchInput").val();
			//data = removeHTMLTag(data)
	    	data = data.trim().replace('&nbsp;',' ');
	    	if(data == '' || data == '<br>'){
	    		//提示
				layer.open({
				    content: '请输入内容',
				    skin: 'msg',
				    anim:false,
				    time: 2//2秒后自动关闭
				});						

	    		$("#searchInput").val("");
	    		return;
	    	}else if(data.length>500){
	    		//提示
				layer.open({
				    content: '您发送消息过长，请删减后重试',
				    skin: 'msg',
				    time: 2//2秒后自动关闭
				});

				return;
	    	}
			//机器人服务不发送 键输入提示
			if(!isRobotService) {
				//取消键输入计时  提示坐席客户未输入
				if (keyInputTimer) clearTimeout(keyInputTimer);
				keyInput = false;
				var infoData = {
					"msgType": "order",
					"orderType": "keyInput",
					"keyType": keyInput,
					"content": ""
				};
				//停止输入
				var infoData = JSON.stringify(infoData);
				getSendMsg(infoData);
			}
	    	ca.sendMsg(data);

			$("#searchInput").val("");
	    	
	    	
	    });
		
	    //点击查询历史记录
		$("#history").on("click",function (e) {	

			if($(this).attr("disabled") == "disabled"){return;}
			
			ca.getMessage(10,"backward",histPosition);

		});
        //点击关闭人工服务
        $("#releaseCall").on('click',function(){
            //让焦点不在输入框上面
            $("#os-textarea-action").blur();
            if(isService!=true){
                return;
            }
            //询问框
            layer.open({
                content: '您好，确定结束本次服务吗?'
                ,btn: ['确定','取消']
                ,yes: function(index){
                    ca.dropSession();
                    set_focus($("#os-textarea-action")[0]);
                    layer.close(index);
                }
            });
        });

		
		$("#os-textarea-action").on("keyup",function(){
			//机器人服务 不发送键输入提示
			if(!isRobotService) {
				//首次输入
				if (!keyInput) keyInputFun(true);
				//默认不改变当前态
				keyInputFun(false);
			}
            getSuggestedQuestion();
		});
		$("#searchInput").on('click',function(){
			//alert( document.body.scrollTop);
			var target = this;
			setTimeout(function(){
				// 解决苹果端弹出的第三方输入法软键盘挡住input的问题
				//target.scrollIntoView(false);
				//target.scrollIntoViewIfNeeded(false);
				//alert('scrollIntoViewIfNeeded');
			
			}, 100);
			return false;
		});
		//获得焦点
		$("#searchInput").focus(function(){
			
			var target = this;
			/*setTimeout(function(){
				// 解决苹果端弹出的第三方输入法软键盘挡住input的问题
				//target.scrollIntoView(false);
				//target.scrollIntoViewIfNeeded(false);
				//alert( document.body.scrollTop);
				$(target).parent().parent().parent().scrollIntoView(true);
			}, 500);*/
			window.webchat_top = window.webchat_top? window.webchat_top:document.body.scrollTop;
			var u = navigator.userAgent;
			var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1; //android终端
			var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
			
			if(isAndroid){
				setTimeout(function(){				
				//target.scrollIntoView(false);
				target.scrollIntoViewIfNeeded(false);
				//alert( document.body.scrollTop);
					//$(target).parent().parent().parent().scrollIntoView(true);
					 /*layer.open({
					    content:  "Android"
					    ,skin: 'msg'
					    ,time: 2 //2秒后自动关闭
					});*/
				}, 300);				
				
			}

			if(isiOS){
				/*var  cnt = 0;
				var timerId = setInterval( function() {
				    if (cnt < 3) {
				      cnt++;
				    } else {
				      clearInterval(timerId);
				      timerId = null;
				      return;
				    }

				  }, 300);*/
				
			}
			return false;
		});

		//失去焦点
		/*$("#searchInput").blur(function(){
			var target = this;
			setTimeout(function(){
				// 解决苹果端弹出的第三方输入法软键盘挡住input的问题
				$(target).parent().parent().parent()[0].scrollIntoView(true);
				//target.scrollIntoViewIfNeeded(false);
				//alert('scrollIntoViewIfNeeded');
			
			}, 700);
			return false;
		});*/

		//点击转人工
		$("#message-list").on("click",".J_createSession",function(){
			if(isService != false){
				return;
			}
			
			//if(custObj.callData.phoneNum){
				ca.createSession();
				return;
			//}


		});

		//点击转人工
		$("#message-list").on("click",".J_transferToArtificial",function(){
			if(isService != false && isRobotService == false){
				return;
			}else{
				ca.transferToArtificial();
			}


		});

		//点击已解决
		$("#message-list").on("click",".J_releaseCall",function(){
			if(isRobotService == false){
				return;
			}else{
				ca.dropSession();
			}


		});

		$('#searchBar form').on('submit', function(e){
		  // 不提交
		  $("#searchCancel").click();
		  return false;
		});

	};
	

	//键输入函数
	function keyInputFun(bool){
		if(bool){
			keyInput = true;
			var infoData = {
				"msgType":"order",
				"orderType":"keyInput",
				"keyType":keyInput,
				"content":""
			};
			//提示输入
			var infoData = JSON.stringify(infoData);
			getSendMsg(infoData);
		}else{
			//继续输入  重新计时
			if(keyInputTimer) clearTimeout(keyInputTimer);
			keyInputTimer = setTimeout(function(){
				keyInput = false;
				var infoData = {
					"msgType":"order",
					"orderType":"keyInput",
					"keyType":keyInput,
					"content":""
				};
				//5秒发送 停止输入
				var infoData = JSON.stringify(infoData);
				getSendMsg(infoData);
			},5*1000);
		}

	};

	function getSuggestedQuestion() {
		if(config.isSuggested){
			if(suggestedTimer) clearTimeout(suggestedTimer);
			var content = $('#os-textarea-action').val();
			if(content.trim() == ''){
				$("#os-textarea-action").popover("destroy");
			}else{
				suggestedTimer = setTimeout(function () {
					$("#os-textarea-action").popover("destroy").popover({
						html: true,
						placement: "top",
						content: function(){
							var _html = '';
							ca.getSuggestedQuestion(content,function (data) {
								if(data.response && data.response.resultCode == 0){
									var rs = data.resultData.question;
									if(rs.length > 0){
										if(rs[0].content !== ""){
											//拼接关联内容
											_html = "<div>";
											for(var i = 0;i<rs.length;i++){
												_html += "<span class='text-black text-nowrap channel-ico' flag='trust'>"+rs[i].content+"</span>";
												if((i+1) !== rs.length) _html += "<hr class='hr-dashed'>";
											}
											_html+="</div>";
											_html = $(_html);
											//关联内容选择
											_html.find("span").click(function(){
												$("#os-textarea-action").val($(this).text()).popover('destroy');
											});
										}else $("#os-textarea-action").popover("hide");
									}else $("#os-textarea-action").popover("hide");
								}
							});
							return _html
						},
						animation: false
					}).on("shown.bs.popover",function(){
						//调整位置
						$("#"+$(this).attr("aria-describedby")).css("left","0");
					}).popover("show");

				},600)
			}
		}
    }

	//可编辑框 光标移到最后一位
	set_focus = function(el){		
	    el.focus();
	    if($.support.msie)
	    {
	        var range = document.selection.createRange();
	        this.last = range;
	        range.moveToElementText(el);
	        range.select();
	        document.selection.empty(); //取消选中
	    }
	    else
	    {
	        var range = document.createRange();
	        range.selectNodeContents(el);
	        range.collapse(false);
	        var sel = window.getSelection();
	        sel.removeAllRanges();
	        sel.addRange(range);
	    }
	}

	//有新消息时在title处闪烁提示
	function blinkTitleShow() {
		var step=0, _title = window.parent.document.title;
		var timer = setInterval(function() {
			step++;
			if (step==3) {step=1;};
			if (step==1) {window.parent.document.title='【　　　】'+_title;};
			if (step==2) {window.parent.document.title='【新消息】'+_title;};
		}, 500);
		return [timer, _title];
	}

	/**
	    * @param timerArr[0], timer标记
	    * @param timerArr[1], 初始的title文本内容
	*/
	function blinkTitleClear(timerArr) {
	      //去除闪烁提示，恢复初始title文本
	    if(timerArr) {
	      	clearInterval(timerArr[0]);
	      	window.parent.document.title = timerArr[1];
	    };
	}


	/**
	 * 设置定时查询排队信息
	 */
	function setGetQueueInfoInterval(){
		ca.getQueueInfo();
		//10秒一次查询排队信息
		if(isService == "wait"){
			timer['setGetQueueInfoInterval'] = setInterval(function(){
				if(isService == "wait"){
					ca.getQueueInfo();
				}
			},10000);
		}
	}
	
	



	showHistMsg = function(){
		$("#history").click();
	}

	connectService = function(){
		if(isService == true){
			layer.open({
			    content: '正在服务中'
			    ,skin: 'msg'
			    ,time: 2 //2秒后自动关闭
			});

			return;
		}else if(isService == "wait"){
			layer.open({
			    content: '正在排队中'
			    ,skin: 'msg'
			    ,time: 2 //2秒后自动关闭
			});

		}else{
			ca.createSession();
		}
	}

	
    //滚动条自动滚动到底部
    function autoToBottom(obj){
		obj.parent().scrollTop(obj.parent()[0].scrollHeight);
	}

	function timeTips(param,type){
		var time = common.getChatTime(param.sendTime);
			if(type == 1){
				$("#historyInfo").after('<div class="weui-flex">'
		            +'<div class="weui-flex__item">'
		             +'<div class="sys-msg"><small>'+time+'</small></div>'
		           + '</div>'
		        +'</div>');
		        return;
			}
			//间隔一分钟显示时间
			if( !param.content.sendToAgent &&  (!custObj.lastMsgTime || (param.sendTime - custObj.lastMsgTime)/1000 > 60) ){
				//$('#message-list').append('<div class="touch-time"><h6 class="time-juti-y font-12">'+time+'</h6></div>');

				$('#message-list').append('<div class="weui-flex">'
		            +'<div class="weui-flex__item">'
		             +'<div class="sys-msg"><small>'+time+'</small></div>'
		           + '</div>'
		        +'</div>');
			}
			custObj.lastMsgTime = param.sendTime;
	}

    //解析接收消息
	function desMsg(param){
		//系统消息
		if(param.type == 'sysnotice'){  //系统消息			
			if(param.msgId && $("#"+param.id) ){				
				$("#"+param.msgId).remove();
				//var tabStr = $('<div id="'+param.msgId+'" class="touch-time"><h6 class="time-juti-y font-12">'+param.content+'</h6></div>');
				var tabStr = $('<div id="'+param.msgId+'" class="weui-flex">'  
		            +'<div class="weui-flex__item">'
		             + '<div class="sys-msg"><small>'+param.content+'</small></div>'
		            +'</div>'
		        +'</div>');
			}else{
				//var tabStr = $('<div class="touch-time"><h6 class="time-juti-y font-12 '+(param.color||'')+'">'+param.content+'</h6></div>');

				var tabStr = $('<div  class="weui-flex">'  
		            +'<div class="weui-flex__item">'
		             + '<div class="sys-msg"><small>'+param.content+'</small></div>'
		            +'</div>'
		        +'</div>');
			}		

			tabStr.hide();
			$('#message-list').append(tabStr);
			tabStr.fadeIn(500,function(){
				autoToBottom($('#message-list'));
			});
		}else{
			var headName = ''; //头像文字
			var showName = ""; //显示的名字
			var msgType;
			var headImg = '';			
			
			if(param.msgFrom == custObj.userId){ //客户发送的消息
				headName = "我";
				msgType = 2;//消息方向
			}else{
				//标题消息闪烁
				if (timerArr == null && loseFoces == true)timerArr = blinkTitleShow();
				//播放提示音乐
				runBgSound();

				param.senderNiceName = param.senderNiceName || "";
				headName = "客服";
				
				msgType = 1; //消息方向 客服->
				//机器人头像和客服头像区分
				headImg = param.msgFrom == 10001?'../images/robot.png':'../images/stewardess.png';

				
			}
			if(msgType == 1){	
				
				var divStr = $('<div id="'+param.msgId+'" class="weui-flex">'
			            +'<div>'
			            +'    <div class="placeholder"><img class="img-thumbnail" src="'+headImg+'" alt="" width="40"></div>'
			            +'</div>'
			            +'<div class="weui-flex__item">'
			            +'    <div class="chat-content lt-chat J_content"></div>'
			            +'</div>'
			            +'<div>'
			             +'   <div class="placeholder"></div>'
			           +' </div>'
			        +'</div>');
				
			}else{
				var divStr = $('<div  class="weui-flex">'
			            +'<div>'
			            +   ' <div class="placeholder"></div>'
			            +'</div>'
			            +'<div class="weui-flex__item">'
			            +    '<div class="chat-content rt-chat J_content"></div>'
			            +'</div>'
			            +'<div>'
			            +    '<div class="placeholder"><img class="img-thumbnail" src="../images/user.png" alt="" width="40"></div>'
			            +'</div>'
			        +'</div>');

			}

			//接收文本消息
			if(param.type == 'text'){
				timeTips(param);				
				param.content = removeHTMLTag(param.content  );
				param.content = param.content.trim().replace(/&nbsp;/ig,' ');				
				divStr.find(".J_content").text(param.content);

				//返回需要拼接的串
				var robotHtml = common.decipherRobotMsg(param,config.robotType||0);
				//机器人时需要返回的按钮
				var _p = '<br><p>以上回答是否解决了您的问题？</p><p><a href="javascript:;" class="weui-btn weui-btn_mini weui-btn_default J_releaseCall">0 已解决</a>'
                         +'<a href="javascript:;" class="weui-btn weui-btn_mini weui-btn_primary J_transferToArtificial">9 转人工</a></p>';

				var buttons = param.msgFrom == 10001?_p:'';				

				var _Html = robotHtml+buttons;
				//将需要拼接的数据追加
				divStr.find(".J_content").append($(_Html));

				//机器人信息事件绑定
				divStr = robotMsgEvent(divStr);

				//divStr.hide();
				$("#message-list").append(divStr);
				//淡出效果
				//divStr.fadeIn(500,function(){
					autoToBottom($('#message-list'));
				//});

			}else if(param.type == 'image' ){ //接收图片消息
				var data = eval('('+param.content+')');
				var filePath = data.picUrl;

				var imgPath = config.requestHost+'/service/getFile?filePath='+filePath;
	    
			    //showReceiveImg(imgPath,param.msgId,divStr);
			    divStr.hide();
				$("#message-list").append(divStr);
			    (function(){
			    	var $img;
				    var img = new Image();	   
				    img.src = '';
				    img.onload = function(){
				    	var s = Math.round(this.width/200);
				    	var w = s == 0 ? this.width:Math.round(this.width/s);
				    	var h = s == 0 ? this.height:Math.round(this.height/s);
				    	$img = $('<img flag="pic"  width="'+w+'" height="'+h+'" _width="'+img.width+'" _height="'+img.height+'" />').attr('src',this.src);
				    	$('#'+param.msgId).find(".J_content").html($img);
						divStr.fadeIn(500,function(){
							autoToBottom($('#message-list'));
						});
				    	autoToBottom($('#message-list'));
				    };
				    img.src = imgPath;
			    })();

			}
			else if(param.type == 'custVerify' ){//身份验证
				param.content = JSON.parse(param.content);
				if(param.content.sendToAgent){
					return;
				}
				divStr.hide();
				
				var msg = $('<a class="text-red" onclick="javascript:void(0)">点击进入账户验证</a>');
				divStr.find(".J_content").html(msg);
				$("#message-list").append(divStr);				
				if(!param.fromHis){
					msg.one("click",function(){
						showVerify("资金账户身份验证",param.content.param.custAcct, param.content.param.custAcctType);
					});	
				}				
				divStr.fadeIn(500,function(){
					autoToBottom($('#message-list'));
				});		    
				autoToBottom($('#message-list'));
			}else if(param.type == 'evaluate'){ //服务评价
                appendSatis(param.content);

			}else if(param.type == 'order'){ //指令消息，不存数据库
				if(param.msgFrom == custObj.username){ return };
				param.content = eval('('+param.content+')');
				if(param.content.orderType && param.content.orderType == 'busicode'){
					recieveSeat(param.content);
					return;
				}
				/*
				showVideoPanel();
				var anyChatId = param.content.anyChatId||'';
				//设置坐席anychat编号
				ChatManage.AnyChat.setUserId({mTargetUserId:anyChatId});
				//是否已登录
				if(ChatManage.AnyChat.isSign === true){
					ChatManage.AnyChat.requestCall(anyChatId);
				}else{
					//设置登录回调
					pageOperation.backEvent.OnAnyChatLoginSystem = function(){
						ChatManage.AnyChat.requestCall(anyChatId);
					};
					//发起消息时自动签入
					ChatManage.AnyChat.conn();
				}
				*/
				return;

			}else if(param.type == 'evaluateRobot' ){
				appendSatis(param.content,1);
			}
			
		}
		setTimeout(function () {
	        myScroll.refresh();
	    }, 0);	
		autoToBottom($('#message-list'));

	}

	//机器人信息事件
	function robotMsgEvent(obj){
		/*if(config.robotType == 4){
			obj.find("a[flag='0']").on("click",function(){				
				var param = $(this).attr("submit");
				if(param != ""){
					if(param.indexOf("faqvote") > -1){
						$(this).parent().find("a[flag=4]").hide();
					}
					ca.sendMsg(param);
				}
			})
		}*/
		if(config.robotType == 4 ||config.robotType == 3 || config.robotType == 0 ){
			//点击发送建议问题
			obj.find("a[flag="+config.robotType+"]").on("click",function(){				
				//var param = $(this).attr("submit").trim();
				$(this).css("color","red");
				var param = $(this).text().trim();
				if(param != ""){
					if(param.indexOf("faqvote") > -1){
						$(this).parent().find("a[flag=4]").hide();
					}
					ca.sendMsg(param);
				}
			})
		}
		
		return obj;
	}

	//获取地址栏参数
	//url为空时为调用当前url地址 
	//调用方法为 var params = getPatams();
	function getParams(url) {
        var theRequest = new Object();
        if (!url)
            url = location.href;
        if (url.indexOf("?") !== -1)
        {
            var str = url.substr(url.indexOf("?") + 1) + "&";
            var strs = str.split("&");
            for (var i = 0; i < strs.length - 1; i++)
            {
                var key = strs[i].substring(0, strs[i].indexOf("="));
                var val = strs[i].substring(strs[i].indexOf("=") + 1);
                theRequest[key] = val;
            }
        }
        return theRequest;
    }   

    //推送满意度评价 type 1机器人 0人工
    function appendSatis(data,type){
        var $evalutionLi = null,
            $radio = '';
		custObj.transferId = data||'';
		var title = "";
		if(type){
			title = "请对机器人的服务做出评价";
		}else{
			title = "请对我们的服务做出评价";
		}
        if (config.evaluationPushMode) { // 0 为推送 1为显示在聊天框内
            custObj.evaluationConfig.forEach(function (e,i) {
                $radio += '<label  class="radio-inline text-black J_satisLabel"><input type="radio" name="inlineRadioOptions'+ custObj.transferId +'"value="'+e.level+'" title="'+e.name+'">'+e.name+'</label>'
            })
            $evalutionLi = '<div class="weui-flex"><div class="weui-flex__item"><div class="" style="text-align: center;"><p>'+title+'</p>' + $radio + '</div></div></div>';
            $("#message-list").append($evalutionLi)
            $("input[name='inlineRadioOptions" + custObj.transferId + "']").parent().each(function(){
                $(this).one('click',function () {
                    $(this).siblings("label").children("input").attr("disabled","disabled");
                    var RadioName = $(this).children("input").attr("name");
                    var transferId = RadioName.substring(18,RadioName.length);
                    var evaluationLevel =  $(this).children("input").val();

                    if(type){//机器人评价
                    	ca.evalutionRobot(transferId,evaluationLevel,'');
                    }else{
                    	ca.evalution(transferId,evaluationLevel,'');
                    }
                    
                    $(this).siblings("label").unbind("click"); //移除click
                })
            })
        } else {
            $(".pj-message").show();
            $(".pj-box").show();
        }
	}
	// 过滤HTML标签以及空格
	function removeHTMLTag(str) {
		str = str.replace(/<\/?[^>]*>/g,''); //去除HTML tag
		str = str.replace(/[ | ]*\n/g,'\n'); //去除行尾空白
		//str = str.replace(/\n[\s| | ]*\r/g,'\n'); //去除多余空行
		str=str.replace(/ /ig,'');//去掉
		return str;
	}
                               
	getSendMsg = function(data){
    	if(isService) sendToGw(data);
    }

    //退格键禁用
    function banBackSpace(e){
	    var ev = e || window.event;
	    //各种浏览器下获取事件对象
	    var obj = ev.relatedTarget || ev.srcElement || ev.target ||ev.currentTarget;
	    //按下Backspace键
	    if(ev.keyCode == 8){
	      	var tagName = obj.nodeName;//标签名称

	      	//如果标签不是input或者textarea则阻止Backspace
		    if(tagName!='INPUT' && tagName!='TEXTAREA' &&  obj.getAttribute("id") !="chatsent")
		      	return stopIt(ev);
		    
		    if (obj.type == undefined)
		    	var tagType = '';
		    else 
		    	var tagType = obj.type.toUpperCase();//标签类型
		    //input标签除了下面几种类型，全部阻止Backspace
		    if(tagName=='INPUT' && (tagType!='TEL' && tagType!='TEXT' && tagType!='TEXTAREA' && tagType!='PASSWORD'))
		    	return stopIt(ev);
		    
		    //input或者textarea输入框如果不可编辑则阻止Backspace
		    if((tagName=='INPUT' || tagName=='TEXTAREA') && (obj.readOnly==true || obj.disabled ==true))
		       	return stopIt(ev);
		    
	    }
	}
	function stopIt(ev){
	    if(ev.preventDefault ){
	     	//preventDefault()方法阻止元素发生默认的行为
	     	ev.preventDefault();
	    }
	   	if(ev.returnValue){
	     	//IE浏览器下用window.event.returnValue = false;实现阻止元素发生默认的行为
	     	ev.returnValue = false;
	    }
	    return false;
	}

	//播放消息提示音
	function runBgSound(){
		$("#chatNotice").attr("src", "../js/webchat/Msg_rtx."+$("#chatNotice").attr("fmt"));
	}

	//背景音乐
	function addbgSound(){
		var html ='';
		if ((navigator.userAgent.indexOf('MSIE') >= 0) 
		    && (navigator.userAgent.indexOf('Opera') < 0)){
			html='<bgsound id="chatNotice" loop="1" autostart="false" fmt="wav"></bgsound>';
		}else if (navigator.userAgent.indexOf('Firefox') >= 0){
			html='<audio id="chatNotice" src="" autoplay="true" fmt="mp3"></audio>';
		}else if (navigator.userAgent.indexOf('Opera') >= 0){
			html='<audio id="chatNotice" src="" autoplay="true" fmt="mp3"></audio>';
		}else{
			html='<audio id="chatNotice" src="" autoplay="true" fmt="mp3"></audio>';
		}
		
		$("body").before(html);
	}

	function getAesString(data,key,iv){//加密
            var key  = CryptoJS.enc.Utf8.parse(key);
            var iv   = CryptoJS.enc.Utf8.parse(iv);
            var encrypted = CryptoJS.AES.encrypt(data,key,
                    {
                        iv:iv,
                        mode:CryptoJS.mode.CBC,
                        padding:CryptoJS.pad.Pkcs7
                    });
        return encrypted;
    }
    function getDAesString(encrypted,key,iv){//解密
        var key  = CryptoJS.enc.Utf8.parse(key);
        var iv   = CryptoJS.enc.Utf8.parse(iv);
        var decrypted = CryptoJS.AES.decrypt(encrypted,key,
                    {
                        iv:iv,
                        mode:CryptoJS.mode.CBC,
                        padding:CryptoJS.pad.Pkcs7
                    });
        return decrypted.toString(CryptoJS.enc.Utf8);
    }

		/**
		 * 初始化客户信息
		 */
	function initCust(){
		
		var url = location.href.replace(/\%0D/g,"").replace(/\%0A/g,"");
		var params = getParams( decodeURIComponent(url)  );
		var callData = {
			"channelId":"25",
			"mediaType":params.mediaType ? params.mediaType:"29",
			"childChannelId":params.channelId ? params.channelId:"0"
		};


	    custObj.skillId = params.skill || config.skill||"1"; //技能队列
		custObj.callData = callData; //随路数据
		custObj.level = "0";  //客户级别
		custObj.tenantId = params.tenantId?params.tenantId:1; //租户id
		custObj.username ='';
	    custObj.username = $.cookie(custObj.tenantId+"||username") ||'';
		custObj.webConfigId = params.webConfigId?params.webConfigId:'';

		var sign = params.sign;
		if(sign && sign !==''){	
			var gkey = config.decryptkey;
			var gIv = config.decryptIv;	
			var decrypted = getDAesString(sign,gkey,gIv);		
			var decrypted = JSON.parse(decrypted);
			var msgBody = {
				msgType:"custVerify",
				verifyRes:'1',
				appid:'14007',
	            custid:decrypted.custNo, //客户zjzh
	            phoneNum:custObj.username,
	            content:"验证成功",
	            password: '',
	            custAcctType:"Z",  //Z资金账号、R信用账号
	            param:'',
	            account:decrypted.account,
	            equipmentNo:decrypted.equipmentNo,
	            mobileNo:decrypted.mobileNo,
			};
			custObj.callData.verifyData = jsonToString(msgBody);
		}
		
		
		
	}
	
	$(function(){
		//addbgSound();
		//实现对字符码的截获，keypress中屏蔽了这些功能按键
   		//document.onkeypress = banBackSpace;

   		//对功能按键的获取
   		//document.onkeydown = banBackSpace; 

   		myScroll = new IScroll('.chat-area', {
   			mouseWheel: true,
		    scrollbars: true,  //是否显示滚动条
		    click:true, 
		    fadeScrollbars: true, //滚动条淡入淡出
		    //preventDefault: false,
		    //preventDefaultException: { tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT|A)$/ } 
		}); 
	    
		//加载绑定事件
		bindEvent();
		//inputResetHeight();
		initCust();
		//alert(inputBox.getBoundingClientRect().bottom);
		//初始化页面元素
		//initHtmlShow();		
		//新建客户操作
		ca = new custActive();
		ca.getWebConfig();
		//setComents();
	});
	
})