/**
 * Created by seawalker on 2016/12/29.
 */

var client = require('../src/httpclient');
var redis = require('../src/redis');

const NodeCache = require( "node-cache" );
const sessionCache = new NodeCache( { stdTTL: 180, checkperiod: 120 });

const SINGLE_TURN_MODE = 'st'
const MULTI_TURN_IDIOM = 'mt_idiom'

var replier1 = function (res, robot) {
  var input = res.match[1].trim();
  if (input.match(/^1/i) ) {
    console.log(10)
    res.reply(10)
    return {
      mode: SINGLE_TURN_MODE,
      ok: true
    };
  }else {
    return {
      mode: SINGLE_TURN_MODE,
      ok: false
    };;
  }
};

var replier2 = function (res, robot) {
  var input = res.match[1].trim();
  if (input.match(/^2/i) ) {
    console.log(20)
    res.reply(20)
    return {
      mode: SINGLE_TURN_MODE,
      ok: true
    };
  }else {
    return {
      mode: SINGLE_TURN_MODE,
      ok: false
    };
  }
};

var replier3 = function (res, robot) {
  var input = res.match[1].trim();
  if (input.match(/^3/i) ) {
    res.reply(30)
    return {
      mode: MULTI_TURN_IDIOM,
      ok: true
    };
  }else {
    return {
      mode: SINGLE_TURN_MODE,
      ok:false
    }
  }
};

var dispatcherTuling = function (res, robot) {
  var ret = res.match[1];
  if (ret) {
    return client.post({
        url: "http://www.tuling123.com/openapi/api?",
        json: true
      },
      {
        key: "5999e6c2547e49b88379b3cf5a009c4d",
        info: ret
      }
      , function(data) {
        if (data != null) {
          console.log(data)
          var url = ""
          if (data.hasOwnProperty("url")) {
            url = data.url
          }
          res.reply(data.text + url);
        }else {
          //TODO
          console.log('图灵没有返回结果')
        }

      });
  }
}

//TODO 参考 hubot-qq 按配置文件加载 dispatchers
//单轮
var dispatchers = [];
dispatchers.push(replier1);
dispatchers.push(replier2);
dispatchers.push(replier3);
//多轮，通过会话模式标识匹配
var multiturns = new Map();
multiturns.set(MULTI_TURN_IDIOM, replier3)


module.exports = function(robot) {
  robot.hear(/(.+)/, function(res){
    //优先使用聊天室ID
    var id = res.envelope.room
    var type = 'room'
    if (id == null || id == 'null') {
      id = res.envelope.user.id
      type = 'user'
    }

    //从memory中获取当前id的会话模式
    var sessionStatus = sessionCache.get(id)
    //进入对应的多轮对话
    if (sessionStatus != undefined  && sessionStatus.mode != SINGLE_TURN_MODE) {
      var ret =  multiturns.get(sessionStatus.mode).apply(this, [res, robot])
      sessionCache.set(id, {type: type, mode: ret.mode})
      //停留 or 仅仅退出 直接返回，否则向下进入单轮回答
      if (ret.ok) {
        return
      }
    }

    //单轮对话
    var stWork = false;
    for (var index in dispatchers){
      var ret = dispatchers[index].apply(this, [res, robot])
      if (ret.ok) {
        stWork = true
        if (ret.mode != SINGLE_TURN_MODE) {
          //更新会话模式
          sessionCache.set(id, {type: type, mode: ret.mode})
        }
        break;
      }
    }

    //图灵兜底
    if ( !stWork && index == dispatchers.length - 1) {
      console.log('兜底 ' + res.match[1].trim())
      dispatcherTuling.apply(this, [res, robot])
    }
  });

}
