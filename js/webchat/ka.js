define(['jquery','webchat/config','core/des'],function($,config,des){
	var ka={};

	ka.ajax = function (ajaxParam) {
        var requests = ajaxParam.req || [{}];
        for (var i = 0; i < requests.length; i++) {
            if (typeof (requests[i].service) != "undefined" && requests[i].service == 'P9999999'
                    && (typeof (requests[i].bex_codes) == "undefined" || requests[i].bex_codes == '')) {
                //ka.alert("请求配置错误:未配置bexcode！");
                return;
            }
            if (typeof (requests[i].bex_codes) == "string" && typeof (requests[i].service) == "undefined") {
                requests[i].service = 'P9999999';
            }
        }
        var reqType = 'json';
        var requestStr = "";
        if (reqType === 'json') {
            requests = ka.makeJsonRequest(requests);
            requestStr = "{\"REQUESTS\":" + ka.jsonToString(requests) + "}";
        }
        
        //加密入参
        requestStr = des.encrypt(requestStr);

        var params = {
            url: ajaxParam.url||ka.url,
            async: String(ajaxParam.async) === 'false' ? false : true,
            type: ajaxParam.type || 'POST',
            contentType: 'text/xml; charset=utf-8',
            dataType: reqType,
            processData: false,
            data: requestStr,
            success: function (data, textStatus, jqXHR) {            	
                if(data === null){
                    alert("数据请求异常！");
                    return;
                }
                ka.jsonResultCallback(data, ajaxParam);
            },
            error: function (pa, p, w) {            	
                var str = pa.responseText;
                str = str.replace(/\n/ig, '<br>');
                var data;
                try {
                    data = eval("(" + str + ")");
                    ka.jsonResultCallback(data, ajaxParam);
                } catch (e) {
                    alert("数据请求异常！");
                }
            },
            complete: function (xhr) {
              xhr = null;
            } 
        };
        $.ajax(params);
    };


     ka.makeJsonRequest = function (requests) {
        var jsonPack = [];
        for (var i = 0; i < requests.length; i++) {
            jsonPack[i] = {};
            jsonPack[i].REQ_MSG_HDR = ka.getKSDXReqMsgHead(requests[i]);
            jsonPack[i].REQ_COMM_DATA = requests[i];
        }
        return jsonPack;
    };

    ka.getKSDXReqMsgHead = function (request) {
        var user ={};
        
        var reqMsgHeader = {
            "OP_CODE": user.userCode || '',
            "OP_ROLE": user.userRole || '',
            "OP_BRANCH": user.orgCode || '',
            "OP_SITE": user.loginIp || '',
            "USER_TICKET_INFO": user.userTicket || '',
            "OP_WAY": '1',
            "OP_LANGUAGE": '1',
            "OP_PROGRAM": 'menuId',
            "SERVER_ID": 'service',
            "MSG_ID": 'service'
        };
        return reqMsgHeader;
    };
	 /**
     * 将json转换成string，即将json转换成str
     * @param json
     * @returns {String}
     */
    ka.jsonToString = function (object) {
        if (object == null) {
            return 'null';
        }
        var type = typeof object;
        if ('object' == type) {
            if (Array == object.constructor) {
                type = 'array';
            } else if (RegExp == object.constructor) {
                type = 'regexp';
            } else {
                type = 'object';
            }
        }
        switch (type) {
            case 'undefined':
            case 'unknown':
            {
                return;
                break;
            }
            case 'function':
            {
                return '"' + object() + '"';
                break;
            }
            case 'boolean':
            case 'regexp':
            {
                return object.toString();
                break;
            }
            case 'number':
            {
                return isFinite(object) ? object.toString() : 'null';
                break;
            }
            case 'string':
            {
                return '"' +
                        object.replace(/(\\|\")/g, "\\$1").replace(/\n|\r|\t/g, function () {
                    var a = arguments[0];
                    return (a == '\n') ? '\\n' : (a == '\r') ? '\\r' : (a == '\t') ? '\\t' : ""
                }) +
                        '"';
                break;
            }
            case 'object':
            {
                if (object === null)
                    return 'null';
                var results = [];
                for (var property in object) {
                    var value = ka.jsonToString(object[property]);
                    if (value !== undefined)
                        results.push(ka.jsonToString(property) + ':' + value);
                }
                return '{' + results.join(',') + '}';
                break;

            }
            case 'array':
            {
                var results = [];
                for (var i = 0; i < object.length; i++) {
                    var value = ka.jsonToString(object[i]);
                    if (value !== undefined)
                        results.push(value);
                }
                return '[' + results.join(',') + ']';
                break;

            }
        }
    };
    ka.jsonResultCallback = function (data, params) {
        var answers = [];
        var msg = [];

        for (var i = 0; i < data.ANSWERS.length; i++) {
            if (data.ANSWERS[i].ANS_COMM_DATA.length === 3) {
                answers.push(data.ANSWERS[i].ANS_COMM_DATA[0]);
            } else {
                answers.push([]);
            }
            var info = {};
            info.code = data.ANSWERS[i].ANS_MSG_HDR.MSG_CODE;
            info.msg = data.ANSWERS[i].ANS_MSG_HDR.MSG_TEXT;
            info.time = data.ANSWERS[i].ANS_MSG_HDR.RUN_TIMES;
            info.len = data.ANSWERS[i].ANS_MSG_HDR.DATA_ROWS;
            msg.push(info);
        }
        if ($.isFunction(params.func)) {
            params.func.call(null, msg, answers, data);
        }
    };

	return ka;

})