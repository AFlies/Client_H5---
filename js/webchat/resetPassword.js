define(['jquery','webchat/common','core/valid'],function(jQuery,common,valid) {
 	var custObj;
 	var PSecondInfoFront = false;
 	var PSecondInfoReverse =false;
 	//身份证正面图片点击
 	$("#J_PSecondInfoFront ").on("click",".identity-card",function(){
 		$("#file1").click();
 	});

 	//身份证反面图片点击
 	$("#J_PSecondInfoReverse").on("click",".identity-card",function(){
 		$("#file2").click();
 	});

 	//身份证正面input
 	$('#uploadInputBus1').on("change",'input[type="file"]',function(){
		uploadImgToBus(this,1);
	})

 	//身份证反面input
	$('#uploadInputBus2').on("change",'input[type="file"]',function(){
		uploadImgToBus(this,2);
	})

 	//协议
	$("#PasswordReset .J_protocol").change(function(){
		var value = $(this).is(':checked');
		if(value){
			var infoData = {
				"msgType":"order",
				"orderType":"busicode",
				"busiType":"10000",
                "info_type": "1",
                "info_code": "protocol",
                "info_value": "10000",
                //"record_id": record_id,
                "data_type": "1"
            };
		}else{
			var infoData = {
				"msgType":"order", //消息格式
				"orderType":"busicode", //业务办理消息
				"busiType":"10000", //密码重置格式
                "info_type": "1",
                "info_code": "protocol",
                "info_value": "",
                //"record_id": record_id,
                "data_type": "1"
            };	
		}
		
        infoData = JSON.stringify(infoData);
		getSendMsg(infoData);
	});

	/*-----------------身份证信息-------------------*/
	$(".text-info1").on("change",function(){
		var  $this= $(this);
		var info_code = $this.attr("dataMark");
        getInfo1($this,info_code,'2');
	});

	function getInfo1($this,info_code,info_type){
		var infoData = {
			"msgType":"order", //消息格式
			"orderType":"busicode", //业务办理消息
			"busiType":"10000", //密码重置格式
            "info_type": info_type,
            "info_code": info_code,
            "info_value": $this.val(),
            //"record_id": record_id,
            "data_type": "1"
        };
       

        if(info_code == "correctSide"){
        }else if(info_code == "oppositeSide"){
        }else if (info_code == "name") {
        }else if (info_code == "sex") {
        }else if (info_code == "people") {
        }else if (info_code == "birthday") {
        }else if (info_code == "address") {
        }else if(info_code == "id_number"){
        }else if(info_code == "issue_authority"){
        }else if(info_code == "validity"){
        }

        infoData = JSON.stringify(infoData);
        getSendMsg(infoData);
	}

	var zjzhIsTrue = false;
	var zjzh = '';
	//资金账号
	$("#accountFunding").bind("input propertychange",function(){
		var $this = $(this);
		$this.val($this.val().replace(/\D|^0/g,''));
		zjzh = $this.val();
		if(zjzh.length<=10){
			zjzhIsTrue = true;
		}else{
			zjzhIsTrue = false;
		}
		var info_code = $this.attr("dataMark");
		var infoData = {
				"msgType":"order", //消息格式
				"orderType":"busicode", //业务办理消息
				"busiType":"10000", //密码重置格式
                "info_type": "2",
                "info_code": info_code,
                "info_value": $this.val(),
                //"record_id": record_id,
                "data_type": "1"
        };
        infoData = JSON.stringify(infoData);
        getSendMsg(infoData);
	});

	//密码
	var beforePassWord =['#','#','#','#','#','#'];
	var beforePassWordStr = '';
	$(".beforePassWord").bind('input propertychange', function() { 
		var $this = $(this);
		var index = parseInt($(this).attr("name"));
		//只能输入数字
	  	$this.val($this.val().replace(/\D|^0/g,''));

	  	if($this.val() != '' && $this.val().length==1){
	  		$this.attr("dataMark",$this.val());
	  		beforePassWord[index-1] = $this.val();

	  		if($this.next()){
		  		$this.next().focus();
		  	}
	  	}else if($this.val() != '' && $this.val().length>=1){
	  		$this.val($this.attr("dataMark"))
	  	}else{
	  		beforePassWord[index-1] = "#";
	  	}
	  	getInfo1($this,"password"+index,'2');
	  	beforePassWordStr = beforePassWord.join("");

	});


	var affterPassWord = ['@','@','@','@','@','@'];
	var affterPassWordStr = '';
	$(".affterPassWord").bind('input propertychange', function() { 
		var $this = $(this);
	  	var index = parseInt($(this).attr("name"));
		//只能输入数字
	  	$this.val($this.val().replace(/\D|^0/g,''));

	  	if($this.val() != '' && $this.val().length==1){
	  		$this.attr("dataMark",$this.val());
	  		affterPassWord[index-1] = $this.val();
	  		if($this.next()){
		  		$this.next().focus();
		  	}
	  	}else if($this.val() != '' && $this.val().length>=1){
	  		$this.val($this.attr("dataMark"))
	  	}else{
	  		affterPassWord[index-1] = '@';
	  	}
	  	getInfo1($this,"password"+(6+index),'2');
	  	affterPassWordStr = affterPassWord.join("");
	  	
	});

	recieveSeat = function(data){
		if(data.biz_type=='rebut'){
			common.msg("坐席驳回密码重置");
			reSetReadOnly();
			
		}else if(data.biz_type=='success'){
			clearTimeout(timer['sendBusiheart']);
			delete timer['sendBusiheart'];
			//办理成功
			closeBusiPanel();
		}
	}



	//点击接受业务办理请求，并返回接受信息
	recieveBus = function(){
		var infoData = {
				"msgType":"order", //消息格式
				"orderType":"busicode", //业务办理消息
				"busiType":"10000", //密码重置格式
                "info_type": "1",
                "info_code": '',
                "info_value": '',
                //"record_id": record_id,
                "data_type": "0"  //标识已接受正在填写
        };
        infoData = JSON.stringify(infoData);
        getSendMsg(infoData);
        //变成输入状态
        reSetReadOnly();
        //清空数据
        resetInputVal();
	};


	//提交
	$("#bus_submit").on("click",function(){
		
		if(!$("#PasswordReset .J_protocol").is(':checked')){
			common.msg("请勾选协议");
			return;
		}
		if(!zjzhIsTrue){
			common.msg("请输入十位资金账号");
			$("#accountFunding").focus();
			return;
		}

 		if(!PSecondInfoFront){
			common.msg("身份证正面面图片未上传");
			return;
 		}
 		if (!PSecondInfoReverse) {
 			common.msg("身份证反面图片未上传");
			return;
 		}
			
		var vv = new valid(".verifyPage");
		if(!vv.is() ){
		    vv.errObj[0].focus();
		        return;
	    }

		var infoData = {
			"msgType":"order", //消息格式
			"orderType":"busicode", //业务办理消息
			"busiType":"10000", //密码重置格式
            "info_type": "1",
            "info_code": 'bus_submit',
            "info_value": '',
                //"record_id": record_id,
            "data_type": "3"
	        };

	    infoData = JSON.stringify(infoData);
	    getSendMsg(infoData);
	    readOnly();   
		
	})

	//禁止输入
	function readOnly(){
		//协议
		$("#PasswordReset .J_protocol").attr("disabled","true");
		//
		$("#J_PSecondInfoFront .identity-card").attr("disabled","true");

		$("#J_PSecondInfoReverse .identity-card").attr("disabled","true");

		$("#J_PSecondInfoFront input").attr("disabled","true");
		
		$("#J_PSecondInfoReverse input").attr("disabled","true");

		$("#numberAndPassword input").attr("disabled","true");

		$("#bus_submit").attr("disabled","true");
		$("#bus_submit").text("已提交");
	}

	//恢复输入
	function reSetReadOnly(){
		//协议
		$("#PasswordReset .J_protocol").removeAttr("disabled");
		//
		$("#J_PSecondInfoFront .identity-card").removeAttr("disabled");

		$("#J_PSecondInfoReverse .identity-card").removeAttr("disabled");

		$("#J_PSecondInfoFront input").removeAttr("disabled");
		
		$("#J_PSecondInfoReverse input").removeAttr("disabled");

		$("#numberAndPassword input").removeAttr("disabled");

		$("#bus_submit").removeAttr("disabled");
		$("#bus_submit").text("提交给坐席审核");
	}

	//清空数据
	function resetInputVal(){
		//协议
		$("#PasswordReset .J_protocol").attr("checked",false);

		//身份证正面
		$("#frontId").attr("src","../img/IDPositive.jpg");
		$("#J_PSecondInfoFront input").val("");

		//反面
		$("#backId").attr("src","../img/IDNegative.jpg");
		$("#J_PSecondInfoReverse input").val("");
		//账号密码
		$("#numberAndPassword input").val("");

		$("#bus_submit").removeAttr("disabled");
		$("#bus_submit").text("提交给坐席审核");
	}

	//图片上传到服务器
	function uploadImgToBus(file,type){
		if(getService() !=true){
			common.alert("您不在服务状态");
			return;
		}
		if(!custObj) var custObj = getCustObj();
		//发送路径
		var url ='http://'+window.location.host+'/service/file/upload.funcid?RTC=1';
		
		//var time = new Date().getTime();
		var filePathObj = file.value.split('\\');
		
		//文件后缀 .jpg
		var fileType = filePathObj[filePathObj.length-1].split('.')[1];
		
		//生成一个文件名
		var fileName = getNowDateStr()+getTimeStr()+'-'+custObj.callNum+'.'+fileType;

		//请求的入参
		var param ="{'FILE_NAME':'"+fileName+"','COMPANY_ID':'"+custObj.companyID+"','OPER_NO':'"+custObj.callNum+"','OPER_TYPE':'2','FILE_TYPE':'5'}";
		
		var fileElementId = "file"+type;
		//发起请求
		$.ajaxFileUpload({
			url:url,
			secureuri:false,
			data:{tags:param},
			fileElementId:fileElementId, //input[type="file"]的id值
			dataType:'json',
			type: "post",   
			success:function(data,status){
				var responseText = JSON.parse( data.responseText);
				if(responseText.message == "success"){	
					var filePath = responseText.result[0].fileName.substring(0,8)+"/"+responseText.result[0].fileName
					var imgPath = 'http://'+window.location.host+'/service/file/get.funcid?RTC=1&filePath='+filePath;
	    			if(type == 1 ){
						$('.J_correctSide').val(responseText.result[0].fileName);
						$("#frontId").attr("src",imgPath);
						//正面已上传
						PSecondInfoFront = true; 
						getInfo1($('.J_correctSide'),"correctSide",'3');						
					}else{
						$('.j_oppositeSide').val(responseText.result[0].fileName);
						$("#backId").attr("src",imgPath);
						//反面已上传
						PSecondInfoReverse = true;
						getInfo1($('.j_oppositeSide'),"oppositeSide",'3');
						
					}
				}else{
					if(type == 1 ){
						PSecondInfoFront = false;
					}else{
						PSecondInfoReverse = false;
					}
					common.alert("图片获取失败，请重新选取！");		
				}				
			},
			error:function(data,status,e){
				var responseText = JSON.parse( data.responseText);
				if(responseText.message == "success"){	
					var filePath = responseText.result[0].fileName.substring(0,8)+"/"+responseText.result[0].fileName
					var imgPath = 'http://'+window.location.host+'/service/file/get.funcid?RTC=1&filePath='+filePath;
	    			if(type == 1 ){
	    				//保存上传的图片
						$('.J_correctSide').val(responseText.result[0].fileName);
						//显示图片
						$("#frontId").attr("src",imgPath);
						//正面已上传
						PSecondInfoFront = true;
						//发送正面图片
						getInfo1($('.J_correctSide'),"correctSide",'3');
						setInfoFront();

						//重置input标签 避免再次选择同一图片不触发onchange
						var $fileInput = $('<input type="file" name="file" id="file1" accept="image/*"/>');
						
						$("#uploadInputBus1").find("form[target='upload']").html('').append($fileInput);						
					}else{
						$('.j_oppositeSide').val(responseText.result[0].fileName);
						$("#backId").attr("src",imgPath);
						//反面已上传
						PSecondInfoReverse = true;
						getInfo1($('.j_oppositeSide'),"oppositeSide",'3');
						setInfoReverse();
						//重置input标签 避免再次选择同一图片不触发onchange
						var $fileInput = $('<input type="file" name="file" id="file2" accept="image/*"/>');
						
						$("#uploadInputBus2").find("form[target='upload']").html('').append($fileInput);
					}
				}else{
					if(type == 1 ){
						PSecondInfoFront = false;
					}else{
						PSecondInfoReverse = false;
					}
					common.alert("图片获取失败，请重新选取！");		
				}		
			}

		});

		//重置input标签 避免再次选择同一图片不触发onchange
		/*var imgInput = $('<input class="ui-upload-input my-ui-upload-input" type="file" name="file" id="file" accept="image/*" />');
		imgInput.on("change",function(){
				uploadImg(this);
			});
		$("#uploadForm").html('').append(imgInput);*/

		//正面信息
		function setInfoFront(){
			var info ={
						"name":"黄玉龙",
						"sex":'男',
						"people":"汉",
						"birthday":"1988.07.25",
						"address":"四川省射洪县瞿河乡新华村13组18号",
						"id_number":"510922198807254014"
					}
			var $PSecondInfoFronts = $("#J_PSecondInfoFront");		
			$.each(info, function(key, value){  
			    $PSecondInfoFronts.find("input[name="+key+"]").val(value);
			});

			var infoData = {
				"msgType":"order", //消息格式
				"orderType":"busicode", //业务办理消息
				"busiType":"10000", //密码重置格式
	            "info_value": '',
	            "side":1,
	            "data_type": "2",
	            "data":info
		        };

		    infoData = JSON.stringify(infoData);
		    getSendMsg(infoData);
		}

		function setInfoReverse(){
			var info ={
				"issue_authority":"六安市公安局裕安分局",
				"validity":'2012.04.05-2022.04.05'
			}
			var $PSecondInfoReverse = $("#J_PSecondInfoReverse");		
			$.each(info, function(key, value){  
			    $PSecondInfoReverse.find("input[name="+key+"]").val(value);
			});
			var infoData = {
				"msgType":"order", //消息格式
				"orderType":"busicode", //业务办理消息
				"busiType":"10000", //密码重置格式
	            "info_value": '',
	            "side":2,
	            "data_type": "2",
	            "data":info
		        };

		    infoData = JSON.stringify(infoData);
		    getSendMsg(infoData);
		}
	}

})

