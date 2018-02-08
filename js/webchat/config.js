define(['jquery'],function ($) {
	var Config = Config || {};

	var sysName = "银河";//$.trim(getParam("sysName").value);

	var isHttps = 'https:' == document.location.protocol ? "https://": "http://";

	Config = {
		companyID : '10011',
		groupId:'',
		mtlx:25, //媒体类型
		anyChatIp: '116.204.107.109:8906',
		decryptkey : "ea8a706c4c34a168", 
	    decryptIv : "ea8a706c4c34a168" ,
		//http请求的统一配置
		requestHost:isHttps+window.location.host,
        skill: '1',
	  	sysName:sysName,//1,     // 0-默认 1-华安
		questionLen:5, //华安左边显示的问题数量
		leaveMsg:0,    //留言 1开启 0关闭
		robotType:0,    //机器人类型  1星网 2追一 3智雨 4小i
		isSuggested:0,  //智能关联 1开启 0关闭
		
		/***************话术配置 start**************/
		queueInfoTips: "正在排队中,当前排在第{{#}}位,已等待{{@}}秒",
	};

	switch (sysName){
		case '华安':{

			break;
		}
        case '申万宏源':{
			Config.robotType = 4;
            Config.isSuggested = 1;
			//添加排队人数
			Config.isAddQueueNum = 1;
			//机器人欢迎语
			Config.robotWelcome = "您好，我是小申，很高兴为您服务!";
            //机器人非服务时间转人工提示语
            Config.robotOffWorkTime = "当前为非人工时间,还是让小申继续为您服务吧。";
            // 服务评价推送方式   0-弹窗 1-聊天框
            Config.evaluationPushMode = 1;
			//F5 统一代理服务域名
            //Config.requestHost = Config.requestHost+"/webchat";
            break;
        }
        case '信达':{

			break;
		}

		case '银河':{
			Config.evaluationPushMode = 1;
			break;
		}
	}
	
	return 	Config;
})
