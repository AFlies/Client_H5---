define(['jquery', 'tmpl', 'des', 'comp/moment', 'comp/toastr', 'bootstrap', 'comp/log'], function ($, t, des, moment, toastr) {
    /**
     * KA前端JS框架核心类，这里放置框架的所有核心方法
     * 
     */
    var ka = {};
    //web服务器context配置，如需要写绝对路径的最好在路径前加上ka.contextPath
    ka.contextPath = sys_context_path;
    ka.appContextPath = sys_context_path;
    //ka.contextPath = "";
    //文件服务器路径
    ka.fileserver = "";
    //无数据样式
    ka.noData = '<div class="col-xs-12 text-center no-data float-none"><div class="icon iconfont">&#xe6a2;</div></div>';
    //选择每页显示数量
    ka.pageSizeList = [{value:'10',name:'10'},{value:'20',name:'20'},{value:'50',name:'50'}];
    /*
     * 判断是否支持本地缓存
     */
    var storageSupported = (typeof (window.Storage) !== "undefined");

    window.onerror = function(errorMessage, scriptURI, lineNumber,columnNumber,errorObj) { 
        
        var msg = "错误信息：" + errorMessage + ", 出错文件：" + scriptURI +
                    ", 出错行号：" +lineNumber+", 出错列号：" +columnNumber+
                    ", 错误详情：" + errorObj ;

        ka.addErrorLog(msg);
        return false;           
    }
    ka.addErrorLog = function (msg,type){
            var typeStr = 'error';
             var fName = ka.getFileNameLog();
             var tStr = ka.getTimeStrLog();
             msg = '['+tStr+'] ['+typeStr+'] '+msg;
             var fso = new ActiveXObject("Scripting.FileSystemObject");
             try{
             var ForAppending = 8;
             var fileObj = fso.OpenTextFile(fName, ForAppending, true);
             fileObj.WriteLine(msg);
             fileObj.Close();
             }
             catch(ex){}
    }
    ka.getNowDateStrLog=function () {
            var dObj = new Date();
            var y = dObj.getFullYear();
            var m = dObj.getMonth() + 1;
            var d = dObj.getDate();
            m = m < 10 ? '0' + m : m;
            d = d < 10 ? '0' + d : d;
            return y + '' + m + '' + d;
        }
    ka.getFileNameLog=function () {
            var dStr = ka.getNowDateStrLog();
            var path = 'c:\\Icdconfig\\log\\';
            var fso = new ActiveXObject("Scripting.FileSystemObject");
            try {
                fso.GetFolder(path);
            } catch (err) {
                if (!fso.FolderExists('c:\\Icdconfig'))
                    fso.CreateFolder('c:\\Icdconfig');
                fso.CreateFolder(path);
            }
            return path + 'jsLog' + dStr + '.txt';
        }
    ka.getTimeStrLog= function () {
            var dObj = new Date();
            var h = dObj.getHours();
            var m = dObj.getMinutes();
            var s = dObj.getSeconds();
            h = h < 10 ? '0' + h : h;
            m = m < 10 ? '0' + m : m;
            s = s < 10 ? '0' + s : s;
            return h + ':' + m + ':' + s;
        }

    //实现类似oracle中decode方法效果 ka.decode(value,'1','a','2','b')
    ka.decode = function () {
        var rtn = '';
        //参数长度
        var len = arguments.length;
        //最少要3个参数
        if (len < 3)
        {
            return '';
        }
        //目标值
        var val = arguments[0];
        //默认值（如匹配不到，最终返回默认值）
        var def;
        if (len % 2 == 0) {
            len = len - 1;
            def = arguments[len];
        }

        //循环判断
        for (var i = 1; i < len; i++) {
            if (val == arguments[i]) {
                i++;
                return arguments[i];
            } else {
                i++;
            }
        }

        return def;
    };
    //生成GUID
    ka.guid = function () {
        var guid = "";
        for (var i = 1; i <= 32; i++) {
            var n = Math.floor(Math.random() * 16.0).toString(16);
            guid += n;
            if ((i === 8) || (i === 12) || (i === 16) || (i === 20))
                guid += "-";
        }
        return guid.toUpperCase();
    };
    ka.alert = function (msg, timeout, options) {
        
        var code = ka.guid();
        var tmpl_modal = '<div id="ka_alert" class="modal popup fade" tabindex="-1" role="dialog" aria-labelledby="mySmallModalLabel" aria-hidden="true" style="z-index:1251">'
                + '<div class="modal-dialog {size}">'
                + '</div>'
                + '</div>';

        var tmpl_alert = 
                '<div class="alert modal-content" id="{code}">'
                +'<div class="modal-body pd-20">'
                +'<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>'
                +'<span class="icon iconfont icon-24 {cls}">&#xe697;</span>{msg}</div>'
                +'<div class="modal-footer"><button type="button" class="btn btn-sm btn-default" data-dismiss="modal">关闭<span class="timeout">{timeout}</span></button></div>'
                +'</div>';
        var opts = {
            cls: "text-warning", // alert-danger, alert-success, alert-info
            timeout: timeout === 0 ? "" : "(" + (timeout || 3) +")",
            time: timeout || 3,
            size: "modal-sm"
        };
        $.extend(opts, options);
        opts.msg = msg;
        opts.code = code;
        var $modal = $("#ka_alert");
        if ($modal.length === 0) {
            $modal = $(t._render(tmpl_modal, opts));
            $("body").append($modal);
            $modal.one('hidden.bs.modal', function () {
                if ($(".modal-backdrop").length === 0) {
                    $("body").removeClass("modal-open");
                }
                if (typeof opts.onClose === 'function') {
                    opts.onClose();
                }
                $modal.remove();
            });
            $modal.modal();
        }
        var $alert = $(t._render(tmpl_alert, opts, true));
        $alert.find("button.close").one("click", function () {
            $alert.remove();
            if ($modal.find(".alert").length === 0)
                $modal.modal('hide');
        });
        $modal.find(".modal-dialog").prepend($alert);
        if(opts.time > 0 && timeout !== 0){
            var si = setInterval(function(){
                var timeoutObj = $('#' + code).find("span.timeout");
                var time = parseInt(timeoutObj.text().replace(/\(|\)/g, ""));
                time--;
                if(time === 0){
                    window.clearInterval(si);
                    $("#" + code ).hide('normal',function(){
                        $(this).remove();
                        if($('#ka_alert .alert').length ===0){
                            $('#ka_alert').modal('hide');
                        }
                    });
                }else{
                    timeoutObj.html("("+time+")");
                }
            },1000);
        }
    };
//员工密码加密类
    ka.encrypt = function (srmm, jmyz) {
        //srmm 输入密码
        //jmyz 加密因子

        var srmm1;
        var jmyz1;

        var bit1;
        var bit2;
        var bit3;

        var i;
        var j;
        var d;
        var h1;
        var h2;

        bit1 = "";
        bit2 = "";
        bit3 = "";

        jmyz1 = jmyz.substring(0, 10);

        jmyz1 = jmyz1 + '1234567890'.substring(0, 10 - jmyz1.length);
        srmm1 = srmm.substring(0, 10);

        srmm1 = reverse(srmm1);
        srmm1 = srmm1 + "_<^@]?\\>[=";
        srmm1 = srmm1.substring(0, 10);
        srmm1 = reverse(srmm1);

        i = 0;
        while (i < 10)
        {
            d = srmm1.substring(i, i + 1).charCodeAt() ^ jmyz1.substring(i, i + 1).charCodeAt();

            if (i == 0)
            {
                h1 = 237;
                h2 = 222;
            } else if (i == 1)
            {
                h1 = 88;
                h2 = 125;
            } else
            {
                h1 = srmm1.substring(i - 1, i).charCodeAt();

                h2 = srmm1.substring(i - 2, i - 1).charCodeAt();
            }

            d = (d ^ h1) ^ h2;
            j = 7;

            while (j >= 0)
            {

                if ((d & (1 * Math.pow(2, j))) == 0)
                    bit1 = bit1 + "0";
                else
                    bit1 = bit1 + "1";

                j = j - 1;
            }

            i = i + 1;

        }

        i = 0;
        while (i < 16)
        {
            j = 0;
            while (j < 5)
            {
                bit2 = bit2 + bit1.substring(j * 16 + i, j * 16 + i + 1);
                j = j + 1;
            }
            i = i + 1;
        }

        i = 0;
        while (i < 20)
        {
            d = 65;
            j = 0;
            while (j < 4)
            {

                if (bit2.substring(i * 4 + j, i * 4 + j + 1) == "1")
                {

                    d = d + 1 * Math.pow(2, 3 - j);
                }
                j = j + 1;
            }
            bit3 = bit3 + String.fromCharCode(d);
            i = i + 1;
        }
        return bit3;

    };

    function reverse(str) {
        var arr = "";
        for (i = 0; i < str.length; i++)
        {
            arr = str.charAt(i) + arr;
        }
        return arr;
    }

    /**
     * 将json转换成string,构造输入请求格式json字符串，给makeXmlRequestStr函数用
     * @param json
     * @returns {String}
     */
    ka.jsonArryToString = function (json) {
        var a = '',
                tpl = '{0}:"{1}"';
        for (var i = 0; i < json.length; i++) {
            var temp = '{';
            for (var name in json[i]) {
                var b = tpl.replace('{0}', name).replace('{1}', json[i][name]);
                temp += temp == '{' ? b : ',' + b;
            }
            temp += "}";
            //遍历完一条请求
            a += a == '' ? temp : ',' + temp;
        }
        return '{req:[' + a + ']}';
    };
    /**
     * 拼请求后台字符串
     * @param json json对象
     * @returns {String} xml格式请求字符串
     */
    ka.makeXmlRequestStr = function (json) {
        var xmlRequestStr = '<?xml version="1.0" encoding="UTF-8"?><requests><![CDATA[';
        //json对象转json字符串
        var paramJson = ka.jsonArryToString(json);
        xmlRequestStr += paramJson;
        xmlRequestStr += "]]></requests>";
        return xmlRequestStr;
    };
    /*
     * 获取session中的用户信息
     */
    ka.getUser = function () {
        var g_user = {};
        $.ajax({
            url: ka.appContextPath + "/redis_session?" + Math.random(),
            type: "GET",
            dataType: 'text',
            async: false,
            success: function (data) {
                var retStr = eval('(' + data + ')');
                if (retStr['iRetCode'] == "0" || retStr['IRETCODE'] == "0") {
                    g_user = {
                        'userCode': retStr['USER_CODE'],
                        'userName': retStr['USER_NAME'],
                        'userRole': retStr['USER_ROLE'],
                        'mercCode': retStr['MERC_CODE'],
                        'userId': retStr['USER_CODE'],
                        'ygbh': retStr['USER_CODE'],
                        'userJsbh': retStr['JSBH'],
                        //'userPtbh': retStr['PTBH'],
                        'telNumber': retStr['KZ_EXTNUMBER'],
                        'huaweiid': retStr['KZ_HUAWEIID'],
                        'fzlx': retStr['FZLX'],
                        'gzptsyjs': retStr['KZ_GZPTSYJS'],
                        'dwbh': retStr['DWBH'],
                        'dq': retStr['DQ'],
                        'yglx': retStr['YGLX'],
                        'ygbhfj': retStr['YGBHFJ'],
                        'sszx':retStr['SSZX']
                    };
                } else if (retStr['iRetCode'] == "-1" || retStr['IRETCODE'] == "8888888888") {
                    top.location.href = ka.contextPath + '/index.html';
                }
            },
            complete: function (xhr) {
              xhr = null;
            }
        });
        return g_user;
    };

    /*
     * 获取角色菜单
     */
    ka.getMenu = function (jsbh) {
        var menu = [];
        var rs = ka.req({bex_codes: 'frameSysMenuQuery'});
        for (var i = 0; i < rs.length; i++) {
            var obj = {};
            obj.id = rs[i].MENU_ID;
            obj.pid = rs[i].MENU_PID;
            obj.name = rs[i].MENU_NAME;
            obj.url = rs[i].MENU_URL;
            obj.icon = rs[i].MENU_ICON;
            if (rs[i].MENU_TYPE === '0') {
                menu.push(obj);
            } else {
                //权限菜单
                ka.funcMenu[rs[i].MENU_ID] = true;
            }
        }
        return menu;
    };

    /*
     * 获取单位菜单
     */
    ka.getEpartmentInfoMenu = function (sfkzqx) {
        var departmentInfo = [];
        var rs = ka.req({bex_codes: '12020001', DWBH: -1, SFBKZS: 2,SFKZQX:sfkzqx!=null?sfkzqx:"1"});
        for (var i = 0; i < rs.length; i++) {
            var obj = {};
            obj.id = rs[i].DWBH;
            obj.pid = rs[i].FDWBH;
            obj.name = rs[i].DWMC;
            departmentInfo.push(obj);
        }
        return departmentInfo;
    };

    /*
     * 获取单位员工
     */
    ka.getUserInfoByEpartment = function (dwbh) {
        var userInfo = [];
        var rs = ka.req({bex_codes: 'getUserInfoByEpartment', DWBH: dwbh});
        for (var i = 0; i < rs.length; i++) {
            var obj = {};
            obj.ygbh = rs[i].YGBH;
            obj.ygxm = rs[i].YGXM;
            userInfo.push(obj);
        }
        return userInfo;
    };
    ka.getlevelinfoByempidfQuery = function (YGBH) {
        var levelinfo = [];
        var rs = ka.req({bex_codes: 'getlevelinfoByempidfQuery', YGBH: YGBH});
        for (var i = 0; i < rs.length; i++) {
            var obj = {};
            obj.ZBH = rs[i].ZBH;
            obj.ZBHMC = rs[i].ZBHMC;
            levelinfo.push(obj);
        }
        return levelinfo;
    };
    /*岗位获取级别*/
    ka.getlevelBypostid = function (BH) {
        var levelinfo = [];
        var rs = ka.req({bex_codes: 'getlevelBypostid', BH: BH});
        for (var i = 0; i < rs.length; i++) {
            var obj = {};
            obj.ZBH = rs[i].ZBH;
            obj.ZBHMC = rs[i].ZBHMC;
            obj.FBH = rs[i].FBH;
            levelinfo.push(obj);
        }
        return levelinfo;
    };
    /*
     * 功能菜单权限对象
     */
    ka.funcMenu = {};
    //快捷菜单
    ka.shortcutMenu = function (menu) {
        menu.push({
            id: 'shortcut0',
            pid: '0',
            name: '快捷菜单',
            url: '',
            icon: 'fa-star'
        });
        menu.push({
            id: 'shortcut1',
            pid: 'shortcut0',
            name: '应用桌面',
            url: 'pages/system/desktop.html',
            icon: ''
        });
        menu.push({
            id: 'shortcut2',
            pid: 'shortcut0',
            name: '最近访问',
            url: '',
            icon: ''
        });
        ka.latelyMenu(menu);
    };
    //最近访问菜单
    ka.latelyMenu = function (menu) {
        var user = ka.getUser();
        var key = "latelyMenu_" + user.ygbh + "_" + user.userJsbh + "_";
        for (var i = 0; i < 10; i++) {
            var obj = ka.getlatelyMenu(key + i);
            if (obj) {
                menu.push($.extend({
                    pid: 'shortcut2',
                    icon: ''
                }, obj));
            }
        }
    };
    //从本地获取最近访问菜单
    ka.getlatelyMenu = function (key) {
        var str = "";
        if (storageSupported) {
            str = window.localStorage[key];
        } else {
            str = ka.getCookieValue(key);
        }
        if (str) {
            try {
                return {
                    id: str.split("|")[0],
                    name: str.split("|")[1],
                    url: str.split("|")[2]
                };
            } catch (e) {
            }
        }
    };
    //最近访问菜单写入本地缓存
    ka.setlatelyMenu = function (key, str) {
        if (storageSupported) {
            window.localStorage[key] = str;
        } else {
            ka.setCookieValue(key, str);
        }
    };
    //将cookie中的键值对，以对象形式返回
    ka.getCookies = function () {
        var str = unescape(document.cookie);
        var arr = str.split("§");
        var ret = {};
        for (var i = 0; i < arr.length; i++) {
            try {
                var name = arr[i].split("〓")[0];
                var value = arr[i].split("〓")[1];
                ret[name] = value;
            } catch (e) {
            }
        }
        return ret;
    };
    //获取cookie中的某个值
    ka.getCookieValue = function (name) {
        var obj = ka.getCookies();
        return obj[name];
    };
    //设置cookie中的某个值
    ka.setCookieValue = function (name, value) {
        var obj = ka.getCookies();
        obj[name] = value;
        var arr = [];
        for (var key in obj) {
            arr.push(key + "〓" + obj[key]);
        }
        document.cookie = escape(arr.join("§"));
    };
    /*
     * 获取系统参数
     */
    ka.getSysParam = function (csbh) {
        var rtn = {};
        $.ajax({
            url: ka.appContextPath + "/kjdp_cache?cacheType=sysParamCacheOld&keyCode=" + csbh + "&r=" + Math.random(),
            type: "GET",
            dataType: 'text',
            async: false,
            success: function (data) {
                if(!data){
                  top.location.href = ka.contextPath + '/index.html';
                  return;
                }
                var retStr = eval('(' + data + ')');
                if (retStr[csbh]) {
                    rtn = retStr[csbh][0];
                }else{
                	if(retStr.ANSWERS[0].ANS_MSG_HDR.MSG_CODE&&retStr.ANSWERS[0].ANS_MSG_HDR.MSG_CODE=='8888888888'){
                		top.location.href = ka.contextPath + '/index.html';
                	}
                }
            },
            complete: function (xhr) {
              xhr = null;
            }
        });
        return rtn;
    };
    /*
     * 获取数据字典
     */
    ka.dict = [];
    ka.getDict = function (zdmc, zdqz) {

        for (var i = 0; i < ka.dict.length; i++) {
            if (ka.dict[i].zdmc === zdmc) {
                if (typeof zdqz !== "undefined") {
                    for (var n = 0; n < ka.dict[i].data.length; n++) {
                        if (ka.dict[i].data[n].item == zdqz) {
                            return ka.dict[i].data[n].qzsm + "";
                        }
                    }
                    return zdqz;
                } else {
                    return $.extend([], ka.dict[i].data);
                }
            }
        }
        var arr = [];
        var str = zdqz;

        $.ajax({
            url: ka.appContextPath + "/kjdp_cache?cacheType=dictCacheOld&keyCode=" + encodeURI(zdmc) + "&r=" + Math.random(),
            type: "GET",
            dataType: 'text',
            async: false,
            success: function (data) {
                if(!data){
                  top.location.href = ka.contextPath + '/index.html';
                  return;
                }
                var retStr = eval('(' + data + ')');
                if (retStr[zdmc]) {
                    var ii=retStr[zdmc];
                        ii=ii.sort(
                        function(a,b)
                        {
                            if(a['PX']&&b['PX']&&(parseInt(a['PX']) !== parseInt(b['PX'])))
                            {
                                return parseInt(a['PX']) - parseInt(b['PX']);
                            }else{
                               return parseInt(a['ZDBH']) - parseInt(b['ZDBH']);
                            }
                        });
                    for (var i = 0; i < retStr[zdmc].length; i++) {
                        var obj = {};
                        obj.item = retStr[zdmc][i].ZDQZ;
                        obj.item_name = retStr[zdmc][i].QZSM;
                        if (typeof zdqz !== "undefined" && obj.item == zdqz) {
                            str = obj.item_name;
                        }
                        arr.push(obj);
                    }

                    ka.dict.push({
                        name: zdmc,
                        data: arr
                    });
                }
            },
            complete: function (xhr) {
              xhr = null;
            }
        });
        return typeof zdqz !== "undefined" ? str : $.extend([], arr);
    };
    /*
     * 以对象形式返回字典
     */
    ka.getDictObj = function (zdmc) {
            var obj = {};
            var arr = ka.getDict(zdmc);
            for (var i = 0; i < arr.length; i++) {
                obj[arr[i].item] = arr[i].item_name;
            }
        return obj;
    };
    ka.getDictByName = function (zdmc, zdqz) {
        var dataObj = [];
        ka.ajax({
            async: false,
            req: [
                {
                    "service": "P9999999",
                    "bex_codes": "getDictByName",
                    "ZDMC": zdmc,
                    "ZDQZ": zdqz
                }
            ],
            func: function (msg, data) {
                dataObj = data[0];
            }
        });
        return dataObj;
    };
    /*
     * @param {type} zdmc 字典名称
     * @param {type} zdqz 字典取值，可以是多个（用分隔符分隔）
     * @param {type} split 分隔符，默认逗号
     * @returns {String} 返回取值说明，是多个时用分隔符分隔
     */
    ka.getDictMulti = function (zdmc, zdqz, split){
      var dict = ka.getDictObj(zdmc);
      var arr = [];
      var zdqzs = zdqz.split(split || ",");
      for(var i = 0; i < zdqzs.length; i++){
        arr.push(dict[zdqzs[i]] || zdqzs[i]);
      }      
      return arr.join(split || ",");
    };
    
    /*
     * 保存主题样式
     */
    ka.saveTheme = function (name) {
        if (storageSupported) {
            try {
                window.localStorage.kingAdmin_theme = escape(name);
                return;
            } catch (e) {
            }
        }
        ka.setCookieValue('kingAdmin_theme', name);
        //document.cookie = 'kingAdmin_theme=' + escape(name);
    };

    /*
     * 获取主题样式
     */
    ka.getTheme = function () {
        var theme = "default";
        if (storageSupported) {
            try {
                theme = (window.localStorage.kingAdmin_theme) ? window.localStorage.kingAdmin_theme : 'default';
            } catch (e) {
            }
        } else {
            theme = ka.getCookieValue('kingAdmin_theme') || 'default';
        }
        /*
         var key, val, pos, theme_cookies = document.cookie.split(';');
         for (var i = 0, l = theme_cookies.length; i < l; i++) {
         
         pos = theme_cookies[i].indexOf('=');
         key = theme_cookies[i].substr(0, pos).replace(/^\s+|\s+$/g, '');
         val = theme_cookies[i].substr(pos + 1).replace(/^\s+|\s+$/g, '');
         
         if (key === 'kingAdmin_theme') {
         theme = val ? val : "default";
         }
         }*/
        return theme;
    };
    /*
     * 加载主题样式
     */
  ka.loadTheme = function (b) {
    var theme = ka.getTheme();
    var dbc = document.body.className;
    if(dbc && document.body.className.indexOf("theme-")!= -1 ){
      document.body.className = document.body.className.replace(/theme\-[a-z0-9\-\_]+/ig, 'theme-' + theme);
    }else{
      document.body.className =  dbc + ' theme-' + theme;
    }


    // ture时，加载iframe中所有页面
    /*if (b) {
      $("iframe").contents().find("body").each(function () {
        console.log($(this).find("iframe"));
        var cls = $(this).attr("class");
        if(cls && cls.indexOf("theme-") != -1 ){
          cls = cls.replace(/theme\-[a-z0-9\-\_]+/ig, 'theme-' + theme);
          $(this).attr("class", cls);
        }else{
          $(this).addClass('theme-'+theme);
        };        
      });

    }*/

    if(b){
        loadIframeTheme($("iframe").contents().find("body"),theme);
    }
  };

  //多层iframe使用递归加载主题
  function loadIframeTheme(obj,theme){
    obj.each(function () {
        var cls = $(this).attr("class");
        if(cls && cls.indexOf("theme-") != -1 ){
          cls = cls.replace(/theme\-[a-z0-9\-\_]+/ig, 'theme-' + theme);
          $(this).attr("class", cls);
        }else{
          $(this).addClass('theme-'+theme);
        };  
        console.log($(this).find("iframe"));
        if($(this).find("iframe").length > 0){
            var nextIframe =  $(this).find("iframe").contents().find("body");
            loadIframeTheme(nextIframe,theme);
        }    

    });
  }

  ka.loadTheme();

    /*
     * 
     * @param url : 需要加载的页面url地址
     * @param targetID ：加载的容器id或容器对象
     */
    ka.loadUrl = function (url, targetID) {
        var obj;
        if (typeof targetID === "object") {
            obj = targetID;
        } else {
            obj = $("#" + targetID);
        }
        //去除url中的空格
        var v_url = $.trim(url);
        //设置目标url属性
        obj.attr("url", v_url);
        //设置时间戳(防止缓存)
        var time = "" + (new Date()).getHours() + (new Date()).getMinutes() + (new Date()).getSeconds();
        if (v_url.indexOf(".htm") > -1) {
            if (v_url.indexOf("?") > -1)
                v_url = v_url.replace('?', '?time=' + time + '&');
            else
                v_url += '?time=' + time;
        }
        //加载url内容
        //obj.load(v_url);
        var params = ka.getParams(v_url);
        var options = {
            type: "get",
            url: v_url,
            async: false,
            success: function (data) {
                var str = data;
                for (key in params) {
                    var reg = new RegExp('{:' + key + '}', 'gmi');
                    str = str.replace(reg, params[key]);
                }
                str = str.replace(new RegExp('{:(.*?)}', 'gmi'), "");
                obj.empty().append(str);
            },
            complete: function (xhr) {
              xhr = null;
            }
        };
        $.ajax(options);
    };
    ka.reLoadUrl = function (url) {
        var trg = $("[url='" + url + "']");
        if (trg.length > 0)
            ka.loadUrl(url, trg);
    };
//获取url后面的参数,返回对象 , 获取当前页url后参数ka.getParams();
    ka.getParams = function (url) {

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
    };
    ka.req = function (param) {
        var rtn = [];
        var ajaxParam = {};
        ajaxParam.req = [param];
        ajaxParam.async = "false";
        ajaxParam.func = function (info, data) {
            if (info[0].code === "0")
                rtn = data[0];
            else if (info[0].msg !== '没有查询结果')
                ka.alert(info[0].msg, 10);
        };
        ka.ajax(ajaxParam);
        return rtn;
    };
    //用于兼容原有ajaxRequest方法 leiqp
    ka.ajaxRequest = function (ajaxParam) {
        var requests = ajaxParam.req || [{}];
        for (var i = 0; i < requests.length; i++) {
            if (typeof (requests[i].service) != "undefined" && requests[i].service == 'P9999999'
                    && (typeof (requests[i].bex_codes) == "undefined" || requests[i].bex_codes == '')) {
                ka.alert("请求配置错误:未配置bexcode！");
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
            for (var i = 0; i < requests.length; i++) {
                if (requests[i].REQ_COMM_DATA.BPM_OP == "completeTask" || requests[i].REQ_COMM_DATA.BPM_OP == "deleteProcessInstanceWithoutCascade"
                    ||requests[i].REQ_COMM_DATA.BPM_OP == "rollbackTask" || requests[i].REQ_COMM_DATA.BPM_OP=='startProcessByForm'
                    ) {
                    requests[i].REQ_MSG_HDR.OP_CODE = requests[i].REQ_COMM_DATA.USER_ID;
                }
            }
            requestStr = "{\"REQUESTS\":" + ka.jsonToString(requests) + "}";
        }
        //加密入参
        requestStr = des.encrypt(requestStr);

        var params = {
            url: ajaxParam.url || ka.appContextPath + '/redis_ajax?returnType=' + reqType,
            async: String(ajaxParam.async) === 'false' ? false : true,
            type: ajaxParam.type || 'POST',
            contentType: 'text/xml; charset=utf-8',
            dataType: reqType,
            processData: false,
            data: requestStr,
            success: function (data, textStatus, jqXHR) {
                if(data === null){
                    ka.alert("登录超时，请重新登录！", 3, {
                        onClose:function(){
                            top.location.href = ka.contextPath + '/index.html';
                        }
                    });
                    return;
                }
                ka.jsonResultCallback2(data, ajaxParam);
            },
            error: function (pa, p, w) {
                var str = pa.responseText;
                str = str.replace(/\n/ig, '<br>');
                var data;
                try {
                    data = eval("(" + str + ")");
                    ka.jsonResultCallback(data, ajaxParam);
                } catch (e) {
                    ka.alert("数据请求异常！");
                }
            },
            complete: function (xhr) {
              xhr = null;
            }
        };
        $.ajax(params);
    };
    ka.ajax = function (ajaxParam) {
        var requests = ajaxParam.req || [{}];
        for (var i = 0; i < requests.length; i++) {
            if (typeof (requests[i].service) != "undefined" && requests[i].service == 'P9999999'
                    && (typeof (requests[i].bex_codes) == "undefined" || requests[i].bex_codes == '')) {
                ka.alert("请求配置错误:未配置bexcode！");
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
            url: ajaxParam.url || ka.appContextPath + '/redis_ajax?returnType=' + reqType,
            async: String(ajaxParam.async) === 'false' ? false : true,
            type: ajaxParam.type || 'POST',
            contentType: 'text/xml; charset=utf-8',
            dataType: reqType,
            processData: false,
            data: requestStr,
            success: function (data, textStatus, jqXHR) {
                if(data === null){
                    ka.alert("登录超时，请重新登录！", 3,{
                        onClose:function(){
                            top.location.href = ka.contextPath + '/index.html';
                        }
                    });
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
                    ka.alert("数据请求异常！");
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
        var user;
        try {
            user = top.g_user;
            if (!user)
                user = ka.getUser();
        } catch (e) {
            user = ka.getUser();
        }
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

    //针对工作流封装 leiqp
    ka.jsonResultCallback2 = function (data, params) {
        var answers = [];
        var msg = [];

        for (var i = 0; i < data.ANSWERS.length; i++) {
            answers.push(data.ANSWERS[i].ANS_COMM_DATA[0]);
            var info = {};
            info.code = data.ANSWERS[i].ANS_MSG_HDR.MSG_CODE;
            info.msg = data.ANSWERS[i].ANS_MSG_HDR.MSG_TEXT;
            info.time = data.ANSWERS[i].ANS_MSG_HDR.RUN_TIMES;
            info.len = data.ANSWERS[i].ANS_MSG_HDR.DATA_ROWS;
            msg.push(info);
        }
        if ($.isFunction(params.func)) {
            params.func.call(null, answers, msg);
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
    //数据导出
    ka.exp = function (data) {
        ka.ajax({
            req: [data],
            func: function (info, rs) {
                toastr.options = {
                    closeButton: true,
                    debug: false,
                    positionClass: 'toast-bottom-right',
                    timeOut: '0',
                    showEasing: "swing",
                    hideEasing: "linear",
                    showMethod: "fadeIn",
                    hideMethod: "fadeOut"
                };
                var url = ka.contextPath + "/ka_download?url=" + rs[0][0].PATH;
                var $msg = $('<span>下载导出文件点击：<a href="' + url + '" target="hideIFrame"><u>这里</u></a></span>');
                $msg.find("a").click(function (e) {
                    e.stopPropagation();
                });
                toastr.success($msg, '导出成功');
            }
        });
    };

    //获取当前页面,返回dom对象
    ka.getIframe = function () {
        for (var i = 0; i < window.parent.frames.length; i++)
        {
            if (window.parent.frames[i].window.document === window.document)
            {
                return window.parent.frames[i].frameElement;
            }
        }
    };
    //获取当前页面,返回iframe的name
    ka.getIframeName = function () {
        var obj = ka.getIframe();
        var name = "main";
        if (obj) {
            name = obj.name;
        }
        return name;
    };

    //loading图标
    ka.loading = function (obj, objTop, objLeft) {
        var loading = $("<div class='loading-sm'></div>"), w = 66, h = 66;
        var top = objTop ? objTop : obj.height() / 2 - h / 2;
        var left = objLeft ? objLeft : obj.width() / 2 - w / 2;
        loading.css({"top": top + "px", "left": left + "px"});
        obj.append(loading);
        return loading;
    };

    //日期格式化yyyy年mm月dd日 星期w hh:mi:ss
    ka.DateFormat = function (formatStr, dtDate) {
        var dt = new Date(dtDate);
        if (isNaN(dt))
            dt = new Date();
        var str = formatStr;
        var Week = ['日', '一', '二', '三', '四', '五', '六'];
        str = str.replace(/yyyy|YYYY/, dt.getFullYear());
        str = str.replace(/yy|YY/, (dt.getYear() % 100) > 9 ? (dt.getYear() % 100).toString() : '0' + (dt.getYear() % 100));
        var month = dt.getMonth() + 1;
        str = str.replace(/mm|MM/, month > 9 ? month.toString() : '0' + month);
        str = str.replace(/dd|DD/, dt.getDate() > 9 ? dt.getDate().toString() : '0' + dt.getDate());

        str = str.replace(/w|W/g, Week[dt.getDay()]);

        str = str.replace(/hh|HH/, dt.getHours() > 9 ? dt.getHours().toString() : '0' + dt.getHours());
        str = str.replace(/mi|MI/, dt.getMinutes() > 9 ? dt.getMinutes().toString() : '0' + dt.getMinutes());
        str = str.replace(/ss|SS/, dt.getSeconds() > 9 ? dt.getSeconds().toString() : '0' + dt.getSeconds());

        return str;
    };

    //日期加减 type:d（天） w（星期） m（月） y（年）； format:输出格式yyyymmdd ； numDay：加减的数量 ； dtDate：需要加减的日期，可为空，空时为当前日期
    ka.add_date = function (type, format, numDay, dtDate) {
        var date;
        if (dtDate)
            date = moment(dtDate);
        else
            date = moment();
        switch (type) {
            case "d":
                date = date.add(numDay, 'day');
                break;
            case "w":
                date = date.add(numDay, 'week');
                break;
            case "m":
                date = date.add(numDay, 'month');
                break;
            case "y":
                date = date.add(numDay, 'year');
                break;
        }
        return ka.DateFormat(format, date);
    };
    //过去时间显示,strDate格式yyyy-mm-dd hh:mi:ss
    ka.dateDiff = function (strDate) {
        var publishTime = 0;
        if (typeof strDate === 'string')
            publishTime = new Date(strDate.replace(/-/g, "/")).getTime();
        else
            publishTime = strDate.getTime();
        var d_minutes, d_hours, d_days;
        var timeNow = parseInt(new Date().getTime() / 1000);
        var d;
        d = timeNow - publishTime / 1000;
        d_days = parseInt(d / 86400);
        d_hours = parseInt(d / 3600);
        d_minutes = parseInt(d / 60);
        if (d < 0) {
            return d_days;
        } else if (d_days > 0 && d_days <= 30) {
            return d_days + "天前";
        } else if (d_days <= 0 && d_hours > 0) {
            return d_hours + "小时前";
        } else if (d_hours <= 0 && d_minutes > 0) {
            return d_minutes + "分钟前";
        } else if (d < 60) {
            return "刚刚";
        } else {
            var s = new Date(publishTime);
            return  s.getFullYear() + "-" + (s.getMonth() + 1) + "-" + s.getDate();
        }
    };
    
    ka.dateDiff = function (beforeDate,afterDate,m) {
        var beforeTime = 0;
        var afterTime = 0;
        if (typeof beforeDate === 'string')
        	beforeTime = new Date(beforeDate.replace(/-/g, "/")).getTime();
        else
        	beforeTime = beforeDate.getTime();
        
        if (typeof afterDate === 'string')
        	afterTime = new Date(afterDate.replace(/-/g, "/")).getTime();
        else
        	afterTime = afterDate.getTime();
        var d;
        d = afterTime/1000 - beforeTime / 1000;
        if(m=="DD"){
        	return  parseInt(d / 86400);
        }else if(m == "HH"){
        	return parseInt(d / 3600);
        }else if(m=="MI"){
        	return parseInt(d / 60);
        }else{
        	return parseInt(d / 60);
        }
    };
    //获取date日期是当年第几周（以当年第一个周一的星期为第一周，周一为每周第一天）
    ka.getYearWeek = function (date) {
        var date2 = new Date(date.getFullYear(), 0, 1);
        var day1 = date.getDay();
        if (day1 === 0)
            day1 = 7;
        var day2 = date2.getDay();
        if (day2 === 0)
            day2 = 7;
        var d = Math.round((date.getTime() - date2.getTime() + (day2 - day1) * (24 * 60 * 60 * 1000)) / 86400000);
        return Math.ceil(d / 7);
    };

    //过滤数组中重复的字符
    ka.filterArray = function (array) {
        var a = {}, c = [], l = array.length;
        for (var i = 0; i < l; i++) {
            var b = array[i];
            var d = (typeof b) + b;
            if (a[d] === undefined) {
                c.push(b);
                a[d] = 1;
            }
        }
        return c;
    };

    //取单位数
    ka.getDwTree = function () {
        var rs = ka.req({bex_codes: '12020001', dwbh: -1, sfbkzs: 2});
        for (var i = 0; i < rs.length; i++) {
            if (rs[i].FDWBH === "")
                rs[i].FDWBH = "0";
        }
        return rs;
    };

    //打开客户360
    ka.custInfo = function (khbh, khxm) {
        top.g_nav.open({id: "cust" + khbh, name: khxm, url: "pages/customer/cust_detail.html?custCode=" + khbh});
    };
    //打开员工360
    ka.empInfo = function () {
    };
    //对象转数组
    ka.obj2arr = function (obj) {
        var arr = [];
        for (var key in obj) {
            arr.push({value: key, name: obj[key]});
        }
        return arr;
    };
    //右上角弹出消息框, type:warning/error/notice
    ka.msg = function (info, opts) {
        var type = opts && opts.type ? opts.type : 'info';
        toastr.options = $.extend({
            closeButton: true,
            debug: false,
            progressBar: true,
            positionClass: 'toast-bottom-right',
            timeOut: '5000',
            showEasing: "swing",
            hideEasing: "linear",
            showMethod: "fadeIn",
            hideMethod: "fadeOut"
        }, opts);
        toastr[type](info);
    };
    //复制对象
    ka.clone = function (obj) {
        var o, obj;
        if (obj.constructor === Object) {
            o = new obj.constructor();
        } else {
            o = new obj.constructor(obj.valueOf());
        }
        for (var key in obj) {
            if (o[key] != obj[key]) {
                if (typeof (obj[key]) == 'object') {
                    o[key] = ka.clone(obj[key]);
                } else {
                    o[key] = obj[key];
                }
            }
        }
        o.toString = obj.toString;
        o.valueOf = obj.valueOf;
        return o;
    };
    //将日期strDate格式为yyyy-mm-dd hh:mi:ss转化yyyy/mm/dd hh:mi:ss
    ka.StrDatatoString = function (Str) {
    	
        if (Str.length != 0) {
            return   Str.replace(/-/g, "/").substring(0,19);
        } else {
            return "";
        }
    };
    //将8位数字日期格式化为YYYY-MM-DD
    ka.Num2Day = function (str) {
        if (str.length === 8) {
            return str.substring(0, 4) + '-' + str.substring(4, 6) + '-' + str.substring(6);
        } else {
            return str;
        }
    };
    //将8位数字日期格式化为YYYY/MM/DD
    ka.NumToDay = function (str) {
    	
        if (str.length >7) {
            return str.substring(0, 4) + '/' + str.substring(4, 6) + '/' + str.substring(6);
        } else {
            return "";
        }
    };
    //将8位数字日期格式化为YYYY/MM/DD
    ka.NumToDay2 = function (str) {
        if (str.length >7) {
            return str.substring(0, 4) + '/' + str.substring(4, 6) + '/' + str.substring(6);
        } else {
            return str;
        }
    };
    //资金账号为0显示空
    ka.ZJZHFomat = function (str) {
    	
        if (str==0) {
            return "";
        } else {
            return str;
        }
    };
    //将YYYY/MM/DD-->YYYYMMDD
    ka.NumToDayS = function (str) {

        if (str.length === 10) {
            return str.substring(0, 4) + str.substring(5, 7) + str.substring(8, 10);
        } else {
            return str;
        }
    };
    //将日期strDate格式为yyyy-mm-dd hh:mi:ss.0转化yyyy/mm/dd hh:mi:ss
    ka.StrDatatoString2 = function (Str) {

        if (Str.length != 0) {
            var rs = Str.replace(/-/g, "/");
            rs = rs.substring(0, rs.length - 2);

            return rs;
        } else {
            return "";
        }
    };
    //获取文件服务器路径
    ka.getFileServer = function () {
        if (ka.fileserver) {
            return ka.fileserver;
        } else {
            $.ajax({
                url: ka.appContextPath + "/ka_fileserver?" + Math.random(),
                type: "GET",
                dataType: 'json',
                async: false,
                success: function (data) {
                    if (data)
                        ka.fileserver = data.server;
                },
                error: function () {
                    ka.alert("请求异常！");
                },
                complete: function (xhr) {
                  xhr = null;
                }
            });
            return ka.fileserver;
        }
    };
  //获取配置参数,配置文件web_app\WEB-INF\conf\serviceConfig.properties
    ka.getServiceConfig = function(key){
    	var value ='';
    	$.ajax({
            url: ka.appContextPath + "/kjdp_cache?cacheType=serviceConfig&r=" + Math.random(),
            type: "GET",
            dataType: 'text',
            async: false,
            success: function (data) {
            	if(!data){
            		top.location.href = ka.contextPath + '/index.html';
            	}
            	json = JSON.parse(data); 
            	value = {value:json[key]};
            },
            complete: function (xhr) {
              xhr = null;
            }
        });
    	return value;
    };
    
    ka.getConfig = function (key) {
    	var value = ka.getServiceConfig(key);
//        var value = '';
//        $.ajax({
//            url: ka.appContextPath + "/ka_config?key=" + key + "&i=" + Math.random(),
//            type: "GET",
//            dataType: 'json',
//            async: false,
//            success: function (data) {
//                value = data;
//            },
//            error: function () {
//                ka.alert("获取配置异常！");
//            },
//            complete: function (xhr) {
//              xhr = null;
//            }
//        });
        return value;
    };
    //截取指定长度的标题
    ka.title = function (title, len) {
        var str = '';
        if (title) {
            if (title.length > parseInt(len)) {
                str = '<span title="' + title + '">' + title.substr(0, parseInt(len)) + '...</span>';
            } else {
                str = '<span>' + title + '</span>';
            }
        }
        return str;
    };

    ka.getPermission = function () {
        var r_permission = [];
        var kjcd = [];
        var g_permission = {};
        ka.ajax({
            req: [{bex_codes: "12400102", CDBH: -1, SFBKZS: '2', YGBH: g_user.userId}],
            async: false,
            func: function (info, data) {
                if (info[0].code === "0") {
                	//console.log(data[0]);
                    for (var i = 0; i < data[0].length; i++) {
                    	
                        if (data[0][i]['TYXBS'] == '2') {
                            g_permission[data[0][i]['CDBH']] = data[0][i]['CDMC'];//权限菜单
                        }
                        if (data[0][i]['TYXBS'] == '3') {
                        	
                            kjcd.push({CDBH: data[0][i]['CDBH'], CDMC: data[0][i]['CDMC'], CDLJ: data[0][i]['CDLJ'], BZ: data[0][i]['BZ'], CDJB: data[0][i]['CDJB']});
                        }
                    }
                }
            }
        });
        r_permission.push({g_permission: g_permission, kjcd: kjcd});
        
        return r_permission[0];

    };
//    kjdp_cache?cacheType=sysParamCacheOld&keyCode=14004&r=0.3994004539970775 HTTP/1.1

    ka.ajaxJson = function (opts, flag) {
        var data = [];
        if (!flag) {
            if (opts.data[0]) {
                for (var i in  opts.data[0]) {
                    var upperI = i.toUpperCase();
                    opts.data[0][upperI] = opts.data[0][i];
                    delete(opts.data[0][i]);
                }
            }
        }
        //通用单ajax请求,如果需要异步请求,async传true,如果需要返回提示信息,传msg参数为1
        var params = $.extend({}, {service: 'P9999999'}, {bex_codes: opts.funcId[0]}, opts.data[0]);
        ka.ajax({
            async: (typeof (opts.sync) == 'undefined') || String(opts.sync) == 'false' ? true : false,
            req: [params],
            func: function (info, res) {
                var obj = {};
                obj[opts.funcId[0]] = ka.objAttrNameToLower(res[0]);
                obj._result = {};
                obj._result[opts.funcId[0]] = {};
                var flag = info[0]['code'];
                obj._result[opts.funcId[0]].flag = flag;
                obj._result[opts.funcId[0]].length = res[0].length;
                var prompt = info[0]['msg'];
                obj._result[opts.funcId[0]].prompt = prompt;
                opts.func(obj);
            }
        });
    };

    ka.objAttrNameToLower = function (obj) {
        if (obj.length == 0)
            return obj;
        var rs = [];
        for (var i = 0; i < obj.length; i++) {
            var tmp = {};
            for (var key in obj[i]) {
                tmp[key.toLowerCase()] = obj[i][key];
            }
            rs.push(tmp);
        }
        return rs;
    };

    /*
     * 登出
     */
    ka.logOut = function () {
        $.ajax({
            url: ka.appContextPath + "/redis_logout",
            type: "GET",
            dataType: 'text',
            async: false,
            success: function (data) {
            },
            complete: function (xhr) {
              xhr = null;
            }
        });
    };
    //ajax队列
    ka.ajaxQueue = $({});
    ka.ajaxq = function (req, ajaxOpts) {
        var jqXHR,
                dfd = $.Deferred(),
                promise = dfd.promise();

        // queue our ajax request
        ka.ajaxQueue.queue(doRequest);

        // add the abort method
        promise.abort = function (statusText) {

            // proxy abort to the jqXHR if it is active
            if (jqXHR) {
                return jqXHR.abort(statusText);
            }

            // if there wasn't already a jqXHR we need to remove from queue
            var queue = ka.ajaxQueue.queue(),
                    index = $.inArray(doRequest, queue);

            if (index > -1) {
                queue.splice(index, 1);
            }

            // and then reject the deferred
            dfd.rejectWith(ajaxOpts.context || ajaxOpts, [promise, statusText, ""]);
            return promise;
        };


        // run the actual query
        function doRequest(next) {
            var requests = [req || {}];
            for (var i = 0; i < requests.length; i++) {
                if (typeof (requests[i].service) != "undefined" && requests[i].service == 'P9999999'
                        && (typeof (requests[i].bex_codes) == "undefined" || requests[i].bex_codes == '')) {
                    ka.alert("请求配置错误:未配置bexcode！");
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
                url: ajaxOpts && ajaxOpts.url || ka.appContextPath + '/redis_ajax?returnType=' + reqType,
                async: ajaxOpts && ajaxOpts.async || true,
                type: ajaxOpts && ajaxOpts.type || 'POST',
                contentType: 'text/xml; charset=utf-8',
                dataType: reqType,
                processData: false,
                data: requestStr
            };

            jqXHR = $.ajax(params)
                    .done(function (data) {
                        
                        if(data === null){
                            ka.alert("登录超时，请重新登录！", 3, {
                                onClose:function(){
                                    top.location.href = ka.contextPath + '/index.html';
                                }
                            });
                            return;
                        }
                        var answers = [];
                        var info = {
                            msg: '数据请求异常',
                            code: '-1'
                        };

                        if (data.ANSWERS.length === 1) {
                            if (data.ANSWERS[0].ANS_COMM_DATA.length === 3) {
                                answers = data.ANSWERS[0].ANS_COMM_DATA[0];
                            }

                            info.code = data.ANSWERS[0].ANS_MSG_HDR.MSG_CODE;
                            info.msg = data.ANSWERS[0].ANS_MSG_HDR.MSG_TEXT;
                            info.time = data.ANSWERS[0].ANS_MSG_HDR.RUN_TIMES;
                            info.len = data.ANSWERS[0].ANS_MSG_HDR.DATA_ROWS;
                        }
                        if (info.code === "0")
                            dfd.resolve(answers, info);
                        else
                            dfd.reject(info);
                    })
                    .fail(function () {
                        dfd.reject({
                            msg: '数据请求异常',
                            code: '-1'
                        });
                    })
                    .then(next, next);
        }

        return promise;
    };
    ka.getNowFormatDate = function() {
        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var strDate = date.getDate();
        if (month >= 1 && month <= 9) {
            month = "0" + month;
        }
        if (strDate >= 0 && strDate <= 9) {
            strDate = "0" + strDate;
        }
        var currentdate = year + '' + month + '' + strDate;
        return currentdate;
    };
    //字符串转Date类型
    ka.string2Date = function(str, format){
        var formatStr = format || "YYYYMMDD";
        formatStr = formatStr.toUpperCase();
        formatStr = formatStr.replace(/HH/, "hh");
        formatStr = formatStr.replace(/MI/, "mm");
        formatStr = formatStr.replace(/SS/, "ss");
        return moment(str, formatStr);
    };    
    
    ka.getCmUrl = function() {
    	//平台的外网地址
    	 var ourCurrentUrl = ka.getSysParam(14004).CSZ;//如：http://172.16.41.36:8080/
    	//如果访问的地址是平台的外网地址,CM也需要用外网地址
    	 if('http://'.concat(location.host) == ourCurrentUrl) {
    	 	return cmurl = ka.getSysParam(14005).CSZ || "";//CM的外网地址
    	 }
         return ka.getSysParam(14009).CSZ || "";//CM的内网地址
        // return "http://172.16.41.67:6060/callManager/";
        // return "http://192.168.24.182:7001/CallManager/"

    };
    /**
     * 加密
     * @param msg (需要加密的数据)
     * @param key (加密key只能8位)
     */
    ka.encryptStr = function(msg,key) {
    	var retStr = '';
    	ka.ajax({
            async: false,
            req: [
                {
                    "service": "encryptStr",
                    "MSG": msg,
                    "KEY": key
                }
            ],
            func: function (msg, data) {
                if(msg&&msg[0]){
                	if(msg[0]['code']==='0'){
                		retStr = msg[0]['msg'];
                	}
                }
            }
        });
    	return retStr;
    };
    /**
     * 解密
     * @param msg (需要解密的数据)
     * @param key (加密key只能8位)
     */
    ka.decryptStr = function(msg,key) {
    	var retStr = '';
    	ka.ajax({
            async: false,
            req: [
                {
                    "service": "decryptStr",
                    "MSG": msg,
                    "KEY": key
                }
            ],
            func: function (msg, data) {
            	if(msg&&msg[0]){
                	if(msg[0]['code']=='0'){
                		retStr = msg[0]['msg'];
                	}
                }
            }
        });
    	return '';
    };
    ka.getServerFlag = function(seatId) {
        var deferred = $.Deferred();
        $.ajax({
            url: ka.getCmUrl() + "getserverflag",
            type: "POST",
            dataType: "json",
            timeout: 3000,
            data: {
                seatid: seatId
            }
        }).then(function(data) {
            deferred.resolve(data);
        }, function(error) {
            deferred.reject(error);
        });
        return deferred;
    };
    ka.numChangeHz=function(num){
        var hz='';
        if(num){
        var items=num.split('');
        for(var i=0;i<items.length;i++){
            switch (items[i]){
                case  '0':
                    hz+='零';
                    break;
                case  '1':
                    hz+='一';
                    break;
                case  '2':
                    hz+='二';
                    break;
                case  '3':
                    hz+='三';
                    break;
                case  '4':
                    hz+='四';
                    break;
                case  '5':
                    hz+='五';
                    break;
                case  '6':
                    hz+='六';
                    break;
                case  '7':
                    hz+='七';
                    break;
                case  '8':
                    hz+='八';
                    break;
                case  '9':
                    hz+='九';
                    break;
                default :
                    hz+='';
                    break;
            }

         }
        }
       return hz;
    }

    return ka;
    
});
