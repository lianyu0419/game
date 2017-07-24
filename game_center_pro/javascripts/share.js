/**
 * 分享
 * Created by zhaoning on 2015/06/19.
 */
  // 平台检测
window.F = window.F || {};
F.config = F.config || {};
// api接口使用域名 动态
F.config.api = 'http://api.fun.tv';
//页面异步刷新
F.EventCenter = F.EventCenter || {};
F.EventCenter.PAGE_REFRESH         = 'page_refresh';
/**
 * 根据参数名从目标URL中获取参数值
 * @name getQueryValue
 * @function
 * @grammar getQueryValue(key, url)
 * @param {string} key 要获取的参数名
 * @param {string} url 目标URL
 * @meta standard
 * @see jsonToQuery
 *
 * @returns {string|null} - 获取的参数值，其中URI编码后的字符不会被解码，获取不到时返回null
 */
getQueryValue = function( key, url ) {
    var reg   = new RegExp( '(^|&|\\?|#)' + escapeReg( key ) + '=([^&#]*)', 'g' );
    var match = (url || window.location.href).match( reg );
    if ( match ) {
        return match[ match.length - 1 ].split( '=' )[ 1 ];
    }
    return null;
};
F.namespace = function( str, obj, func ) {
    var arr = str.split( '.' );
    var val = func;
    if ( typeof obj == 'string' ) {
        if ( !obj ) {
            obj = arr.pop();
        }
    } else {
        //第二个参数不是字符串时，就认为是val
        val = obj;
        obj = arr.pop();
    }
    var k    = '';
    var root = F;
    while ( arr.length > 0 ) {
        k = arr.shift();
        if ( k != '' ) {
            if ( typeof root[ k ] == 'undefined' ) {
                root[ k ] = {};
            }
            if ( typeof root[ k ] != 'object' ) {
                throw new Error( '***当前命名空间' + k + '已经被其它类型占用***' );
            }
            root = root[ k ];
        }
    }
    /*if( obj && typeof func == 'function'){
     root[obj] = func;
     }*/
    if ( typeof obj == 'string' ) {
        if ( typeof val != 'undefined' ) {
            root[ obj ] = val;
        }
    }
};

var userAgent = navigator.userAgent || '';
/**
 * 判断平台类型和特性的属性
 */
F.platform = F.platform || {};
//判断是否为android平台
F.platform.isAndroid     = /android/i.test( userAgent );
//判断是否为Winphone平台
F.platform.isWinphone    = /windows phone/i.test( userAgent );
//判断是否为ipad平台
F.platform.isIpad        = /(iPad).*OS\s([\d_]+)/i.test( userAgent );
//判断是否为iphone平台
F.platform.isIphone      = /(iPhone\sOS)\s([\d_]+)/i.test( userAgent );
//判断是否为IOS平台
F.platform.isIos         = F.platform.isIpad || F.platform.isIphone;
//判断是否为macintosh平台
F.platform.isMacintosh   = /macintosh/i.test( userAgent );
//判断是否为windows平台
F.platform.isWindows     = /windows/i.test( userAgent ) || navigator.platform == 'Win32' || navigator.platform == 'Windows';
//判断是否为x11平台
F.platform.isX11         = /x11/i.test( userAgent );
//判断是否是微信
F.platform.isWeChat      = /micromessenger/i.test( userAgent );
//判断是否是UC浏览器
F.platform.isUc          = /ucbrowser/i.test( userAgent );
//判断是否是微博APP
F.platform.isSinaWeibo   = /__weibo__/i.test( userAgent );
//判断是否是QQ APP
F.platform.isQQ          = /qq\//i.test( userAgent );
//判断是否是QQ 浏览器
F.platform.isQQBrowser   = /mqqbrowser/i.test( userAgent );
//判断是否在风行APP内
F.platform.isFunshionApp = /funshionplayer/i.test( userAgent );

var UA = navigator.appVersion;
var bLevel = {
        qq: {forbid: 0, lower: 1, higher: 2},
        uc: {forbid: 0, allow: 1}
};

var version = {
        uc: "",
        qq: ""
};

var isqqBrowser = (UA.split("MQQBrowser/").length > 1) ? bLevel.qq.higher : bLevel.qq.forbid;
var isucBrowser = (UA.split("UCBrowser/").length > 1) ? bLevel.uc.allow : bLevel.uc.forbid;
var isNativeSupport = false;

version.qq = isqqBrowser ? getVersion(UA.split("MQQBrowser/")[1]) : 0;
version.uc = isucBrowser ? getVersion(UA.split("UCBrowser/")[1]) : 0;

if ((isqqBrowser && version.qq < 5.4 && F.platform.isIos) || (isqqBrowser && version.qq < 5.3 && F.platform.isAndroid)) {
        isqqBrowser = bLevel.qq.forbid
} else {
        if (isqqBrowser && version.qq < 5.4 && F.platform.isAndroid) {
                isqqBrowser = bLevel.qq.lower
        } else {
                if (isucBrowser && ((version.uc < 10.2 && F.platform.isIos) || (version.uc < 9.7 && F.platform.isAndroid))) {
                        isucBrowser = bLevel.uc.forbid
                }
        }
}

isNativeSupport = isucBrowser || isqqBrowser;

function getVersion(c){
        var a = c.split("."), b = parseFloat(a[0] + "." + a[1]);
        return b;
}

function commonShare(target, config) {

        this.target = $(target);

        if(!this.target.length) return;

        $.extend(this, config);

        this.init();
};

commonShare.prototype.share = function(app){
        var shareObj = getShareInfo(this.config);
        var shareUrl = shareObj.url;
        var shareTitle = encode( shareObj.title );
        var shareImg =  encode( shareObj.img );

        switch(app){
                case 'sinaWeibo':

                        var s = window.screen,
                                url = "http://service.weibo.com/share/share.php?appkey=3704997029&ralateUid=1704741001&url=";

                        url += encode( addParam(shareUrl, { malliance : 2243} ) )
                        + '&time=' + (+new Date)
                        + "&title=" + shareTitle
                        + "&content=utf-8"
                        + "&pic=" + shareImg;
                        //分享点击上报
                        setTimeout(report_app_to_sjy("sinaWeibo_"+detail_game_id), 100);
                        window.open( url, '_self', 'width=640,height=580,toolbar=no,menubar=no,scrollbars=no,location=yes,resizable=no,status=no,left=' + parseInt( (s.width - 640) / 2 ) + ',top=' + parseInt( (s.height - 580) / 2 ) );

                        break;

                case 'QQ':
                        var u = "http://openmobile.qq.com/api/check?page=shareindex.html&action=shareToQQ";
                        var pageUrl = encode( addParam(shareUrl, { malliance : 2245} ) );
                        var params = '&page_url=' + pageUrl
                                + '&targetUrl=' + pageUrl
                                + '&summary=' + encode( shareObj.desc )
                                + '&title=' + shareTitle
                                + '&imageUrl=' + shareImg
                                + '&site=' + encode( shareObj.from )
                                + '&appId=100247639'
                                + '&status_os=0'
                                + '&sdkv=0&sdkp=0&style=9'
                                + (shareObj.desc ? '&desc=' + encode( shareObj.desc ) : '');

                        u += params;
                        //分享点击上报
			setTimeout(report_app_to_sjy("QQ_"+detail_game_id), 100);
                        window.open(u, '_self', 'scrollbars=no,width=600,height=450,left=320,top=180,status=no,resizable=yes');

                        break;

                case 'QQweibo':

                        var _url = encode( addParam(shareUrl, { malliance : 2245} ) );
                        var _appkey = '6df7d7131d5c4d5b817ac1f06637b80b';
                        var _u = 'http://v.t.qq.com/share/share.php?';
                        _u +=
                                'title=' + shareTitle +
                                '&url=' + _url +
                                '&appkey=' + _appkey +
                                '&pic=' + shareImg;
                        //分享点击上报
			setTimeout(report_app_to_sjy("QQweibo_"+detail_game_id), 100);
                        window.open(_u, '_self', '转播到腾讯微博', 'width=700, height=580, top=180, left=320, toolbar=no, menubar=no, scrollbars=no, location=yes, resizable=no, status=no');

                        break;

                case 'QZone':
                        var u = "http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=";
                        //desc 输入框
                        var params = encode( addParam(shareUrl, { malliance : 2245} ) )
                        + '&title=' + encode( shareObj.title )
                        + '&pics=' + encode( shareObj.img )
                        + (shareObj.desc ? '&summary=' + encode( shareObj.desc ) : '');

                        u += params;
			//分享点击上报
			setTimeout(report_app_to_sjy("QZone_"+detail_game_id), 100);
                        window.open(u, '_self', 'scrollbars=no,width=600,height=450,left=320,top=180,status=no,resizable=yes');

                        break;

                case 'weixin':
                	//分享点击上报
			setTimeout(report_app_to_sjy("weixin_"+detail_game_id), 100);
						
                        var shadow = $('#wechatTipshadow');

                        if(!shadow.length){
                                var wxTpl = '<section id="wechatTipshadow" class="m-vx-shadow z-root">'
                                        + '<p class="f-cb"><i class="i-guide"></i></p>'
                                        + '<div class="con">'
                                        + '<p class="tit">分享到微信，请点击右上角 <div class="i-wx-top-btn"></div></p>'
                                        + '<p>选择 <i class="i-forward"></i>【发送给朋友】</p>'
                                        + '<p>或 <i class="i-pengyouquan"></i>【分享到朋友圈】</p>'
                                        + '</div>'
                                        + '</section>';

                                var broTpl = '<section id="wechatTipshadow" class="m-vx-shadow bro z-root">'
                                        + '<div class="con">'
                                        + '<p class="tit">分享到微信</p>'
                                        + '<p><i class="num">1</i>先点击浏览器的分享按钮</p>'
                                        + '<p><i class="num">2</i>再选择<i class="i-forward"></i>发给微信指定的【朋友】</p>'
                                        + '<p><i class="num" style="visibility:hidden"></i>或 <i class="i-pengyouquan"></i>分享到微信【朋友圈】</p>'
                                        + '</div>'
                                        + '</section>';

                                var html = F.platform.isWeChat ? wxTpl : broTpl;
                                shadow = $(html);
                                shadow.appendTo('body');
                        }

                        shadow.show();

                        shadow.off('click').click(function(e){
                                e.preventDefault();
                                e.stopPropagation();
                                shadow.hide();
                        });
                        break;
        }
};

commonShare.prototype.init = function(){
        this.html();

        var items = $('.j-share-btn', this.target);
        var self = this;
        $.each(items, function(idx, btn){
                $(btn).off('click').click(function(){
                        self.share($(this).data('app'));
                        window._czc && window._czc.push(['_trackEvent', 'mshare', $(this).data('app')]);
                        return false;
                });
        });
};

commonShare.prototype.html = function(){
        var html =
                (F.platform.isWeChat ?
                /**'<span data-app="weixin" class="j-share-btn weixin"><i></i>微信好友</span>'+
                '<span data-app="weixin" class="j-share-btn weixin_timeline"><i></i>微信朋友圈</span>'**/
                '<span data-app="sinaWeibo" class="j-share-btn weibo"><i></i>新浪微博</span>'+
                '<span data-app="QZone" class="j-share-btn qzone"><i></i>QQ空间</span>'
                        : '') +
                '<span data-app="sinaWeibo" class="j-share-btn weibo"><i></i>新浪微博</span>'+
                '<span data-app="QZone" class="j-share-btn qzone"><i></i>QQ空间</span>' +
                (F.platform.isAndroid ?
                '<span data-app="QQweibo" class="j-share-btn qqweibo"><i></i>腾讯微博</span>'
                : '<span data-app="QQweibo" class="j-share-btn qqweibo"><i></i>腾讯微博</span>');

        this.target.html(html);
};


function share(seletor, option){

        this.html();
        $(document).on('click', 'div', function(){
                $('body').addClass('share-state-show');
                return false;
        });

        this.cancelBtn.on('click', hideShareLayer);

        //$.add(F.EventCenter.PAGE_REFRESH, hideShareLayer);

        var shareHandler = isNativeSupport ? nativeShare : commonShare;

        new shareHandler(this.btnWrap, option);
}


function hideShareLayer() {
        $('body').removeClass('share-state-show');
        $('#shareListWrap').remove();
}

share.prototype.html = function(){
        this.root = $(
                '<div id="shareListWrap" class="m-share-list z-act clearfix">'+
                '<p class="title">分享到</p>' +
                '<div class="btns"></div>' +
                '<a class="cancel j-share-cancel">取消</a>' +
                '</div>');

        $('body').append( this.root );

        this.btnWrap = $('.btns', this.root);
        this.cancelBtn = $('.j-share-cancel', this.root);

};

F.namespace('share', share);

function getShareInfo(config){
        var config = $.extend({}, config || window.shareInfo);
        config.url = window.location.href;
        config.title = $("#game_name").text()+", 好玩的尽在风行游戏！";
        config.desc = "";
        config.img = $("#game_icon")[0].src;
        config.img_title = $("#game_name").text();
        config.from = '风行游戏';
        config.type = config.type || '';

        return config;
}

function encode(str){
        return encodeURIComponent(str);
}

function delParam(query, params){
        if(!query || !params) return query;
        var type = {}.toString.call(params).toLowerCase();
        if(type.indexOf('array') > -1) params = params.join("|");

        return query.replace(new RegExp("("+ params +")=([^&]+)","g"), "")
                .replace(/(\?&+)/g, "?").replace(/(&+|\?)$/g, "").replace(/($)+/g, '$1');
}

function hasParam(url, param){
        var params = getQuery(url).split('&') ;
        if(params){
        for (var i = 0; i < params.length; i++) {
            var pair = params[i].split('=');
            if (decodeURIComponent(pair[0]) == param)
                return true;
        }
    }
    return false;
}

function addParam(url, queryObj) {
        if (!queryObj) return url;
        var array = [];
        for(var key in queryObj){
                if( hasParam(key) ){
                        delParam(key);
                }
                array.push(key + '=' + queryObj[key]);
        }
        return (url + '&' + array.join('&')).replace(/[&?]{1,2}/, '?')
}

function getPath(url){
        var pathexp = /(?:\/([^?]*))/;
    var match = pathexp.exec(url);
    if (match != null && match.length > 1)
        return match[1];
    return "";
}

function getQuery(url){
        if( ~url.indexOf('#') ){
                url = url.substr(0, url.indexOf("#"));
        }

        if( ~url.indexOf('?') ){
                return url.substr(url.indexOf("?") + 1);
        }
        return '';
}
/**
 * 微信分享配置
 */
var ajaxReq = null;
function initWxShare( url ){
        if( !window.wx ) return;
        $.ajax({
        type: "GET",
        url: 'http://sjy.funshion.com/h5/weixin',
                data: data,
        dataType: "jsonp",
        jsonp: "callbackparam",//服务端用于接收callback调用的function名的参数
        timeout: 2000,
        success: function(data){
            appId = data.appId;
                        try{
                                window.wx.config({
                                        debug: debug,
                                        appId: data.appId,
                                        timestamp: data.timestamp,
                                        nonceStr: data.nonceStr,
                                        signature: data.signature,
                                        jsApiList: [
                                                'onMenuShareTimeline',
                                                'onMenuShareAppMessage',
                                                'onMenuShareQQ',
                                                'onMenuShareWeibo'
                                        ]
                                });

                                window.wx.showMenuItems({
                                        menuList: [
                                                'menuItem:share:appMessage',
                                                'menuItem:share:timeline',
                                                'menuItem:share:qq',
                                                'menuItem:share:weiboApp',
                                                'menuItem:favorite',
                                                'menuItem:share:QZone '
                                        ]
                                });
                            updateWxShare();
                        }catch(e){};

        },
        error: function(XMLHttpRequest, textStatus, errorThrown){
                console.log("get credit fail");
            //出错上报
        }
   });

 
}

function getWxShareObj(){

        var shareObj = getShareInfo();
        var wxUrl = addParam(shareObj.url, { malliance : 2244} );

        return {
                title: shareObj.title,
                desc: shareObj.desc, //一句话简介
                link: wxUrl,
                imgUrl: shareObj.img,
                type : shareObj.type || 'video',
                dataUrl : wxUrl
        }
};

function loadWxJs(){

        if( !F.platform.isWeChat) return;

        var script = document.createElement('script');
        $(script).on('load error', function() {
                initWxShare();
        });

        script.src = 'http://res.wx.qq.com/open/js/jweixin-1.0.0.js';
        document.head.appendChild(script);
}

function updateWxShare(){
        var wxObj = getWxShareObj();

        window.wx && wx.ready(function(){
                wx.onMenuShareTimeline( wxObj );
                wx.onMenuShareAppMessage( wxObj );
                wx.onMenuShareQQ( wxObj );
                wx.onMenuShareWeibo( wxObj );
        });
}

loadWxJs();
//$.add(F.EventCenter.PAGE_REFRESH, updateWxShare);

F.namespace('updateWxShare', updateWxShare);