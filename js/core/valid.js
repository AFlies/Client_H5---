define(['jquery'],function($) {
  
  function valid(id){
    this.id = $(id);
  }
  //在循环判断验证表单的过程中，遇到验证不通过的时候，是继续验证后续表单true，还是终止验证false
  valid.prototype.continuez = true;
  //保存验证不通过的表单对象
  valid.prototype.errObj = [];
  
  valid.prototype.is = function(){
    
    var valid = this;
    var rtn = true;
    this.id.find(":input[valid]").each(function(){
      var $this = $(this);
      var val = $this.val();
      if($this.attr("placeholder")==$this.val()){
    	  val="";
      }
      var validArr = $this.attr("valid").split(",");
      var must = validArr[0];
      var type = validArr[1];
      var len = validArr[2];
      //验证是否填写
      var notNull = isMust(val);
      if(must && must.toUpperCase() === 'M' && !notNull){
        valid.errEvent($this,'不能为空！');
        rtn = false;
        //将验证不通过的表单加入数组
        valid.errObj.push($this);
        return valid.continuez;// 返回true退出当次循环，类似continue，返回false退出整个循环，类似break
      }
      //验证数据类型
      if(type && notNull && !dataType[type](val)){
        valid.errEvent($this,dataType[type].msg);
        rtn = false;
        //将验证不通过的表单加入数组
        valid.errObj.push($this);
        return valid.continuez;
      }
      //验证数据长度
      if(len && notNull && !isMaxLength(val,len)){
        valid.errEvent($this,'输入长度不能超过'+len);
        rtn = false;
        //将验证不通过的表单加入数组
        valid.errObj.push($this);
        return valid.continuez;
      }
    });
    return rtn;
  };
  
  //触发错误提示事件
  valid.prototype.errEvent = function(obj,msg){
    var p_obj = obj.parent();
    p_obj.addClass("has-error");
    if(obj.is(":hidden")){
      p_obj.popover({placement:'bottom',content:msg}).popover('show');
      p_obj.one("blur click", function(){
        p_obj.removeClass("has-error");
        p_obj.popover('destroy');
      });
    }else{
      obj.popover({placement:'bottom',content:msg}).popover('show');
      obj.one("blur click", function(){
        p_obj.removeClass("has-error");
        obj.popover('destroy');
      });
    }
  };
  
  //是否填写 return true/false  非空/空
  function isMust(str){
    if (str === "") return false; 
    var regu = "^[ ]+$"; 
    var re = new RegExp(regu); 
    return !re.test(str);
  }
  
  //最大长度
  function isMaxLength(str, len){
    return getLength(str) <= len;
  }
  //最小长度
  function isMinLength(str, len){
    return getLength(str) >= len;
  }
  //字符串长度（中文算2个）
  function getLength(str){
    var cArr = str.match(/[^\x00-\xff]/ig);      
    return str.length + (cArr === null ? 0 : cArr.length);
  }
  
  valid.prototype.isType = function(type,str){
    if(!dataType[type]){
      return false;
    }
    return dataType[type](str);
  };
  
  var dataType = {};
  //英文字母和数字和下划线组成
  dataType.String = function(str){
    var reg = "^[0-9a-zA-Z\_]+$"; 
    var re = new RegExp(reg); 
    if (re.test(str)) { 
      return true; 
    }else{ 
      return false; 
    }
  };
  dataType.String.msg = "只能输入英文字母、数字和下划线！";
  //IP地址
  dataType.IP = function(str){
    if (!isMust(str)) return false; 
    var re=/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/g; //匹配IP地址的正则表达式 
    if(re.test(str))
    {
      if( RegExp.$1 <256 && RegExp.$2<256 && RegExp.$3<256 && RegExp.$4<256) return true; 
    } 
    return false; 
  };
  dataType.IP.msg = "只能输入IP地址！";
  //整形
  dataType.Int = function(str){
    var regu = /^[-]{0,1}[0-9]{1,}$/;
    return regu.test(str); 
  };
  dataType.Int.msg = "只能输入整数！";
  //手机
  dataType.Mobile = function(str){
    var regu =/^[1][3|5|7|8][0-9]{9}$/; 
    var re = new RegExp(regu); 
    if (re.test(str)) {
      return true; 
    }else{ 
      return false; 
    }
  };
  dataType.Mobile.msg = "只能输入手机号码！";
  //浮点数
  dataType.Number = function(str){
    if(dataType.Int(str)) return true; 
    var re = /^[-]{0,1}(\d+)[\.]+(\d+)$/; 
    if (re.test(str)) {
      if(RegExp.$1 == 0 && RegExp.$2 == 0) return false; 
      return true; 
    } else {
      return false; 
    }
  };
  dataType.Number.msg = "只能输入数值！";
  //电子邮件地址
  dataType.Email = function(str){  
    var myReg = /^[-_A-Za-z0-9]+@([_A-Za-z0-9]+\.)+[A-Za-z0-9]{2,3}$/; 
    if(myReg.test(str)) return true; 
    return false;
  };
  dataType.Email.msg = "只能输入电子邮件地址！";
  //固定电话
  dataType.Phone = function(str){
    var phoneRegWithArea = /^[0][1-9]{2,3}-[0-9]{5,10}$/; 
    var phoneRegNoArea = /^[1-9]{1}[0-9]{5,8}$/;
    if( str.length > 9 ) {
      if( phoneRegWithArea.test(str) ){ 
        return true; 
      }else{
        return false; 
      }
    }else{ 
      if( phoneRegNoArea.test(str) ){ 
        return true; 
      }else{
        return false; 
      }
    }
  };
  dataType.Phone.msg = "只能输入固定电话！";
  //完整日期yyyy-mm-dd hh:mi:ss
  dataType.DateTime = function(str){
    var reg = /^(\d{4,4})-(\d{1,2})-(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/;
    var r = str.match(reg);
    if(r === null)return false;
    r[2]=r[2]-1;
    var d= new Date(r[1], r[2],r[3], r[4],r[5], r[6]);
    if(d.getFullYear()!=r[1])return false;
    if(d.getMonth()!=r[2])return false;
    if(d.getDate()!=r[3])return false;
    if(d.getHours()!=r[4])return false;
    if(d.getMinutes()!=r[5])return false;
    if(d.getSeconds()!=r[6])return false;
    return true;
  };
  dataType.DateTime.msg = "日期格式不对，格式：yyyy-mm-dd hh:mi:ss！";
  //日期yyyymmdd
  dataType.Date = function(str){
	var reg = '';
	if(str.indexOf('-')>-1)  reg = /^(\d{4,4})-(\d{1,2})-(\d{1,2})$/;
	else  reg = /^(\d{4,4})(\d{1,2})(\d{1,2})$/;
    var r = str.match(reg);
    if(r === null)return false;
    r[2]=r[2]-1;
    var d= new Date(r[1], r[2],r[3]);
    if(d.getFullYear()!=r[1])return false;
    if(d.getMonth()!=r[2])return false;
    if(d.getDate()!=r[3])return false;
    return true;
  };
  dataType.Date.msg = "日期格式不对，格式yyyymmdd！";
  //时间hh:mi:ss
  dataType.Time = function(str){
    var time = '2000-01-01 '+str;
    return dataType.DateTime(time);
  };
  dataType.Time.msg = "时间格式不对，格式hh:mi:ss！";
  //身份证
  dataType.IDCard = function(code){
    var city={11:"北京",12:"天津",13:"河北",14:"山西",15:"内蒙古",21:"辽宁",22:"吉林",23:"黑龙江 ",31:"上海",32:"江苏",33:"浙江",34:"安徽",35:"福建",36:"江西",37:"山东",41:"河南",42:"湖北 ",43:"湖南",44:"广东",45:"广西",46:"海南",50:"重庆",51:"四川",52:"贵州",53:"云南",54:"西藏 ",61:"陕西",62:"甘肃",63:"青海",64:"宁夏",65:"新疆",71:"台湾",81:"香港",82:"澳门",91:"国外 "};
    //var tip = "";
    var pass= true;

    if(!code || !/^\d{6}(18|19|20)?\d{2}(0[1-9]|1[12])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i.test(code)){
        //tip = "身份证号格式错误";
        pass = false;
    }
    else if(!city[code.substr(0,2)]){
        //tip = "地址编码错误";
        pass = false;
    }
    else{
        //18位身份证需要验证最后一位校验位
        if(code.length == 18){
            code = code.split('');
            //∑(ai×Wi)(mod 11)
            //加权因子
            var factor = [ 7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2 ];
            //校验位
            var parity = [ 1, 0, 'X', 9, 8, 7, 6, 5, 4, 3, 2 ];
            var sum = 0;
            var ai = 0;
            var wi = 0;
            for (var i = 0; i < 17; i++)
            {
                ai = code[i];
                wi = factor[i];
                sum += ai * wi;
            }
            var last = parity[sum % 11];
            if(last != code[17]){
                //tip = "校验位错误";
                pass =false;
            }
        }
    }
    return pass;
  };
  dataType.IDCard.msg = "身份证输入不正确！";
  
  return valid;
});