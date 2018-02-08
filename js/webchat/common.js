define(['jquery','webchat/toastr','core/bootstrap'],function(jQuery,toastr,bootstrap) {
    /**
     * 生成div的抽象
     * @param fn 函数
     * @returns {Function}
     */
    var singleton = function( fn ){
        var result;
        return function(){
            return result || ( result = fn.apply( this, arguments ) );
        };
    }

    /**
     * 生成confirm的div方法
     * @type {Function}
     */
    var createConfirmDiv  = singleton(function(){
        return document.body.appendChild(  document.createElement("div")  );
    });

    /**
     * 生成alert的div层方法
     * @type {Function}
     */
    var createAlertDiv  = singleton(function(){
        return document.body.appendChild(  document.createElement("div")  );
    });

    var common = { 
        /**
         * 提示框
         * @param params
         * @param timeOut
         */
        alert:function(params,timeOut){
            var modal_open = $("#common_alert_model").attr("class") || false;
            if(modal_open && modal_open.indexOf("in")>-1){
                return;
            }

            if ($(".modal-backdrop").length === 0) {
                $("body").removeClass("modal-open");
            }
            if ($(".modal-backdrop").length > 0) {
                return;
            }

            time = timeOut || 3;
            var tmpl_modal = '<div id="common_alert_model" class="modal popup fade" tabindex="-1">'
                +'<div class="modal-dialog modal-sm">'
                +'<div class="modal-content">'
                +'<div class="modal-body" style="padding: 20px;">'
                +'</div>'
                +'<div class="modal-footer" >'
                +'<button type="button" class="btn btn-sm btn-default cancel" data-dismiss="modal">关闭('+time+')</button>'
                +'</div>'
                +'</div>'
                +'</div>'
                +'</div>';
            //$("#common_alert").html(tmpl_modal);
            var $div = createAlertDiv();
            $($div).html(tmpl_modal);
            var model = $("#common_alert_model");
            var body = '<span class="icon iconfont icon-24 text-warning">&#xe697;</span>'+params+'';

            model.find(".modal-body").html(body);

            $("#common_alert_model").modal({keyboard: true});

            if(time > 0 && time !== 0){
                var si = setInterval(function(){
                    time -- ;
                    if(time === 0){
                        model.hide('normal',function(){
                            model.modal("hide");
                        });
                    }else{
                        model.find(".cancel").text("关闭("+time+")");
                    }
                },1000);
            }

            model.one('hidden.bs.modal',function(){
                window.clearInterval(si);
                if ($(".modal-backdrop").length === 0) {
                    $("body").removeClass("modal-open");
                }
                model.remove();
            });

            model.find(".cancel").on("click",function(){
                model.modal("hide");
                return;
            });



        }, 

        /**
         * 获取现在时间 按照输入的分隔符分隔
         * @param param 分隔符 比如 :
         * @returns {*} 13:49:31
         */
        getTimeStr: function (param,date) {
            if(param == undefined) param ='';
            if(date){
                var dObj = new Date(date);
            }
            else{
                var dObj = new Date();
            }
            var h = dObj.getHours();
            var m = dObj.getMinutes();
            var s = dObj.getSeconds();
            h = h < 10 ? '0' + h : h;
            m = m < 10 ? '0' + m : m;
            s = s < 10 ? '0' + s : s;
            return h + param + m + param + s;
        },
        
        /**
         * 获取现在的日期 按照输入的分隔符分隔
         * @param param 分隔符 /
         * @returns {*} 2017/03/31
         */
        getNowDateStr : function (param,date) {
            if(param == undefined) param ='';
            if(date){
                var dObj = new Date(date);
            }
            else{
                var dObj = new Date();
            }
            var y = dObj.getFullYear();
            var m = dObj.getMonth() + 1;
            var d = dObj.getDate();
            m = m < 10 ? '0' + m : m;
            d = d < 10 ? '0' + d : d;
            return y + param + m + param + d;
        },

        getChatTime : function(date){
            var nowDate = common.getNowDateStr("-",date);
            var nowTime = common.getTimeStr(":",date);
            var time = nowDate +' '+ nowTime;
            return time;
        },

        /**
         * 生成log文件名
         * @returns {*}
         */
        getFileNameLog :function () {
            var dStr = common.getNowDateStr();
            var path = 'c:\\Icdconfig\\log\\';
            var fso ;
            try {
                fso = new ActiveXObject("Scripting.FileSystemObject");
                fso.GetFolder(path);
            } catch (err) {
                if(fso == undefined) return '';
                if (!fso.FolderExists('c:\\Icdconfig'))
                    fso.CreateFolder('c:\\Icdconfig');
                fso.CreateFolder(path);
            }
            return path + 'webchatLog' + dStr + '.txt';
        },

        /**
         * 添加log 
         * @param msg
         * @param type
         */
        log :function (msg,type){
            var typeStr = type || 'INFO';
            var fName = common.getFileNameLog();
            var tStr = common.getTimeStr(":");
            msg = '['+tStr+'] ['+typeStr+'] '+msg;
            var fso;
            try{
                fso = new ActiveXObject("Scripting.FileSystemObject");
                var ForAppending = 8;
                var fileObj = fso.OpenTextFile(fName, ForAppending, true);
                fileObj.WriteLine(msg);
                fileObj.Close();
            }
            catch(ex){}
        },

        //解析链接
        htmlToLink :function(msg){
            var pattern = /([^\u4E00-\u9FA5\uF900-\uFA2D.\s]{1,}\.[^\u4E00-\u9FA5\uF900-\uFA2D]{1,}\.[^\u4E00-\u9FA5\uF900-\uFA2D]{1,})|([^\u4E00-\u9FA5\uF900-\uFA2D]{1,}\.[^\u4E00-\u9FA5\uF900-\uFA2D]{1,}\.[^\u4E00-\u9FA5\uF900-\uFA2D]{1,}\.[^\u4E00-\u9FA5\uF900-\uFA2D]{1,})/g;
            var strs = msg.match(pattern);
            if(strs){
                for(var i = 0; i < strs.length; i++){
                    if(!(strs[i].replace(/(^\s*)|(\s*$)/g,"").substr(0,4) == "http")){
                        msg = msg.replace(strs[i],'<a class="text-warning" href="http://'+strs[i]+'" target="_blank">'+strs[i]+'</a>')
                    }else{
                        msg = msg.replace(strs[i],'<a class="text-warning" href="'+strs[i]+'" target="_blank">'+strs[i]+'</a>')
                    }
                }
            }
            return msg;
        },

        //机器人内容解析 
        //不在这里 msg+拼接内容，只返回需要拼接的内容
        decipherRobotMsg:function(param,type){
            var msg ='';
            /*if(type == 4){
                if(/\[link/.test(msg)){
                    //解析link标签
                    msg = msg.replace(/\[link/g,"<a href='#' flag='"+type+"'").replace(/"\]/g,'">').replace(/\[\/link\]/g,"</a>");
                }
            }*/
            //建议问  标准答
            if(param.category == 11 || param.category == 1){
                var rs = [];
                //字符串转数组
                try{
                    rs = eval("("+param.relatedQuestion+")");
                    rs.length;//无数据时,便走catch
                }catch(e){
                    rs = [];
                }
                if(rs.length > 0){
                    //建议问直接返回相关问题  标准答回复标准内容后追加相关问内容
                    if(param.category == 11) msg = "";
                    else msg = "<br><br>";

                    msg += "您想要问的问题是：<br>";
                    for(var i =0;i<rs.length;i++){
                        msg += ((i+1)+"、<a href='#' class='J_robotLink' flag='"+type+"' submit='"+rs[i].content+"'>"+rs[i].content+"</a><br>");
                    }
                }
            }

            return msg;
        }

        //todo

    }
    window.onerror = function(errorMessage, scriptURI, lineNumber,columnNumber,errorObj) {

        var msg = "错误信息：" + errorMessage + ", 出错文件：" + scriptURI +
            ", 出错行号：" +lineNumber+", 出错列号：" +columnNumber+
            ", 错误详情：" + errorObj ;

        common.log(msg,"ERROR");
        return false;
    }

    return common;

})

