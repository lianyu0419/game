var page_name = "";

var counter = 2;

var app_dict = {};

var recommend_page_dict = {};

var recommend_id = "";

var detail_id = "";

//如果该标志为true，证明是测试设备，否则不是测试设备，
//当前可以根据设备mac地址的最后一位来定位被测设备，如果落入被测设备名单，则属于被测设备
//两次同步调用间隔不应该再发送请求
var needtorefresh = true;

//到底后不再进行更新
var the_end = false;

var apptype = "x";

var dev = "x";

var mac = "x";

var fudid = "x";

var userid = "x";

var version = 0;

var nt = "x";

var sid = "x";

var imei = "x";

var globle_router = "";

var intFunshionVersion = 243;

var giftFunshionVersion = 251;

var funshionBetaVersion = [ "2.3.2.15", "2.4.1.12" ];

var giftFunshionBetaVersion = [ "2.4.1.12" ];

var intCurrentVersion = 0;

//当前导航对应标签的id
var current_native_id = "games";

var interface_host = "http://sjy.funshion.com";

//弹窗间隔时间，缺省为360分钟
var popup_interval = 60 * 6;

//var popup_interval = 0
var my_game_tag_id = 501;

//搜索关键字
var search_key = "";

//专题的id
var globle_topic_id = "";

//排行榜名次
var ranking_number = 1;

//详情页细节图放大
var myscroll;

var detailImgsInfo;
//详情页分享时的game_id
var detail_game_id = 0;

if (typeof Android != "undefined") {
    var android_json = JSON.parse(Android.queryReportContext());
    apptype = android_json.apptype;
    dev = android_json.dev;
    mac = android_json.mac;
    fudid = android_json.fudid;
    userid = android_json.userid;
    version = android_json.ver;
    intCurrentVersion = dealFunshionVersion(version);
    nt = android_json.nt;
    sid = android_json.sid;
    imei = android_json.imei;
}

function dealFunshionVersion(version) {
    var arr = version.split(".");
    var intVersion = parseInt(arr[0] + arr[1] + arr[2]);
    return intVersion;
}

//写cookies
function setCookie(name, value, timeout_minutes) {
    name = escape(name);
    value = escape(value);
    var exp = new Date();
    exp.setTime(exp.getTime() + timeout_minutes * 60 * 1e3);
    document.cookie = name + "=" + value + ";expires=" + exp.toGMTString();
}

//读取cookies
function getCookie(name) {
    name = escape(name);
    var arr, reg = new RegExp("(^| )" + escape(name) + "=([^;]*)(;|$)");
    if (arr = document.cookie.match(reg)) return unescape(arr[2]); else return null;
}

//检查按钮状态
var status_map = {};

status_map["not_installed"] = "下载";

status_map["downloading_failed"] = "重试";

status_map["downloading_finished"] = "安装";

status_map["installing_finished"] = "打开";

status_map["installing_failed"] = "安装";

status_map["installed_has_update"] = "更新";

status_map["downloading"] = "下载中";

//查询下载按钮状态
setTimeout(function() {
    if (typeof Android != "undefined") {
        var app_list = Array();
        for (var app in app_dict) {
            app_list.push('{"app_id":"' + app_dict[app].app_id + '", "app_version":"' + app_dict[app].app_version + '"}');
        }
        var app_json_list = '{"number": "' + app_list.length + '", "apps":[' + app_list.join(",") + "]}";
        var result = Android.queryTaskInfo(app_json_list);
        if (result != "") {
            var json = JSON.parse(result);
            for (var i = 0; i < json.number; i++) {
                $("button").each(function() {
                    if (typeof this.id != "undefined" && this.id.indexOf("gift") == -1) {
                        var status = json.apps[i].status;
                        if (this.id.split("_")[1] == json.apps[i].app_id && is_contains(status, status_map) == true) {
                            if ($("#" + this.id).html() != status_map[status]) {
                                checkbutton(this.id, status);
                            }
                        }
                    }
                });
            }
        }
        //风行版本大于2.4.3或者处于公测版本执行获取积分接口
        if (isNewFunshionApp()) {
            getNewInstalledApp();
        }
    }
    setTimeout(arguments.callee, 1e3);
}, 200);

function getNewInstalledApp() {
    var new_installed_info = JSON.parse(Android.getNewInstallApp());
    var new_installed_apps = new_installed_info.app_list;
    var imei = new_installed_info.imei;
    for (var i = 0; i < new_installed_apps.length; i++) {
        var app_name = new_installed_apps[i].app_name;
        var app_id = new_installed_apps[i].app_id;
        var app_score = new_installed_apps[i].app_score;
        var data = {
            imei:imei,
            app_name:app_name,
            app_id:app_id,
            app_score:app_score,
            type:1
        };
        getAppCredit(data);
    }
}

function getAppCredit(data) {
    var url = interface_host + "/h5/app_installed";
    $.ajax({
        type:"GET",
        url:url,
        data:data,
        dataType:"jsonp",
        jsonp:"callbackparam",
        //服务端用于接收callback调用的function名的参数
        timeout:2e3,
        success:function(data) {
            if (data.retCode == "200") {
                if (data.message.length > 0) {
                    alertMsg(data.message);
                }
            }
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("get credit fail");
        }
    });
}

//点击下载按钮触发的函数
function download_app(button_id) {
    var app_id = button_id.split("_")[1];
    app_dict[app_id]["app_download_url_md5"] = "";
    app_dict[app_id]["detail_link"] = app_dict[app_id]["app_score"];
    var paramJsonString = JSON.stringify(app_dict[app_id]);
    var json = JSON.parse(paramJsonString);
    //oxeye上报
    var gamecode = json.app_name + "_" + json.app_id;
    if ($("#" + button_id).attr("_dis") != "only") {
        if ($("#" + button_id).html() == "安装") {
            $("#" + button_id).html("安装中");
            if (typeof Android != "undefined") {
                Android.installApp(paramJsonString);
            }
        } else if ($("#" + button_id).html() == "打开") {
            if (typeof Android != "undefined") {
                Android.startApp(paramJsonString);
            }
        } else {
            getDownloadingButtonStatus(button_id);
            $("#" + button_id + "_downloading").append("<div class='downloading_img'></div>");
            setTimeout(getDownloadingHtml(button_id + "_downloading"), 0);
            if (typeof Android == "undefined") {
                setTimeout(function() {
                    $("#" + button_id + "_downloading").children("div").remove();
                    $("#" + button_id).html("已下载");
                }, 5e3);
            }
            if (typeof Android != "undefined") {
                if ($("#" + button_id).html() == "重试") {
                    Android.restartDownloadTask(paramJsonString);
                } else {
                    Android.addDownloadTask(paramJsonString);
                }
            } else {
                window.location = json.app_download_url;
            }
            //三江源下载统计上报
            report_app_to_sjy(button_id);
        }
    }
}

function getDownloadingHtml(div_id) {
    var current = 0;
    var downloadbottom_style = "";
    var bar_span_style = "";
    if (div_id.indexOf("downloadbottom") != -1) {
        downloadbottom_style = 'style="height:40px;line-height:38px;-moz-border-radius:15px;-webkit-border-radius:15px;border-radius:15px;"';
        bar_span_style = 'style="width:272px;"';
    } else if (div_id.indexOf("relateddownload") != -1) {
        bar_span_style = 'style="width:60px;"';
    }
    $("#" + div_id + " .downloading_img").html('<p><div class="Bar" ' + downloadbottom_style + '><div style="width:5%;"><span ' + bar_span_style + ">5%</span></div></div></p>");
    setTimeout(function() {
        var interval = setInterval(function() {
            current = increment(div_id, interval, current, downloadbottom_style);
        }, 500);
    }, 0);
}

function increment(div_id, interval, current, downloadbottom_style) {
    var bar_style = "";
    var bar_span_style = "";
    if (downloadbottom_style != "") {
        bar_style = 'height:40px;line-height:38px;-moz-border-radius:15px;-webkit-border-radius:15px;border-radius:15px;"';
        bar_span_style = 'style="width:272px;"';
    } else if (div_id.indexOf("relateddownload") != -1) {
        bar_span_style = 'style="width:60px;"';
    }
    current = current + 11;
    if (current == 99) {
        clearInterval(interval);
    }
    $("#" + div_id + " .downloading_img").html('<p><div class="Bar" ' + downloadbottom_style + ' ><div style="width:' + current + "%;" + bar_style + '"><span ' + bar_span_style + ">" + current + "%</span></div></div></p>");
    return current;
}

function report_app_to_sjy(button_id) {
    var recommends = [ "slide", "popup", "QZone", "sinaWeibo", "QQweibo", "QQ", "weixin"];
    var shares = ["QZone", "sinaWeibo", "QQweibo", "QQ", "weixin"];
    var recommend = button_id.split("_")[0];
    var app_id = button_id.split("_")[1];
    var site = get_site();
    if (recommends.indexOf(recommend) == -1) {
        recommend = "normal";
    }
    var report_page = (shares.indexOf(recommend) == -1)?page_name:"share";

    var url = interface_host + "/h5/statistics?app_id=" + app_id + "&page=" + report_page + "&site=" + site + "&recommend=" + recommend;
    $.ajax({
        type:"GET",
        url:url,
        dataType:"jsonp",
        jsonp:"callbackparam",
        //服务端用于接收callback调用的function名的参数
        timeout:2e3,
        success:function(data) {
            if (data.retCode == "200") {
                console.log("report app to sjyn success");
            }
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("report app to sjyn error: " + app_id);
        }
    });
}

function report_pv_vv_to_sjy() {
    var site = get_site();
    var page = page_name;
    report_pv_vv(page, site, "pv");
    report_pv_vv(page, site, "vv");
}

function report_pv_vv(page, site, type) {
    if (typeof Android == "undefined") {
        fudid = getCookie("fudid");
        if (fudid == null) {
            fudid = get_fudid();
            mac = "020202020202";
            //fudid有效期 设置为1年
            setCookie("fudid", fudid, 60 * 24 * 100);
        }
    }
    if (type == "vv") {
        var url = interface_host + "/h5/" + type + "_statistics?page=" + page + "&site=" + site + "&fudid=" + fudid;
    } else {
        var url = interface_host + "/h5/" + type + "_statistics?page=" + page + "&site=" + site;
    }
    $.ajax({
        type:"GET",
        url:url,
        dataType:"jsonp",
        jsonp:"callbackparam",
        //服务端用于接收callback调用的function名的参数
        timeout:2e3,
        success:function(data) {
            if (data.retCode == "200") {
                console.log("report " + type + " to sjyn success");
            }
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("report " + type + "  to sjyn error: " + page + " " + site);
        }
    });
}

function checkbutton(button_id, status) {
    if ($("#" + button_id).length > 0) {
        if (status != "downloading") {
            $("#" + button_id).html(status_map[status]);
            $("#" + button_id).removeAttr("_dis");
            if (button_id.indexOf("slide") != -1) {
                $("#" + button_id).css("background", "rgba(284,100,0,0.6)");
                $("#" + button_id).css("border", "1px solid #f86400");
            } else if (button_id.indexOf("downloadbottom") != -1 || button_id.indexOf("popup") != -1) {
                /*详情页删除下载中的效果css*/
                if (button_id.indexOf("downloadbottom") != -1) {
                    $("#" + button_id + "_downloading").children("div").remove();
                }
                $("#" + button_id).css("background", "#f86400");
                $("#" + button_id).css("color", "#fff");
                $("#" + button_id).css("border", "1px solid #f86400");
            } else {
                /*$('#'+button_id).css('border','1px solid #f86400');
                $('#'+button_id).css('color','#f86400');*/
                $("#" + button_id).removeClass("downloading_state");
                $("#" + button_id).addClass("downloaded_state");
                /*列表页删除下载中的效果css*/
                $("#" + button_id + "_downloading").children("div").remove();
            }
        } else {
            getDownloadingButtonStatus(button_id);
        }
    }
}

function getDownloadingButtonStatus(button_id) {
    if (button_id.indexOf("slide") != -1 || button_id.indexOf("popup") != -1) {
        $("#" + button_id).css("color", "#fff");
        $("#" + button_id).css("background", "#b6b6b6");
        $("#" + button_id).css("border", "0px");
    } else if (button_id.indexOf("downloadbottom") != -1) {
        $("#" + button_id).css("color", "#fff");
        $("#" + button_id).css("background", "#c8c8c8");
        $("#" + button_id).css("border", "1px solid #c8c8c8");
    } else {
        $("#" + button_id).removeClass("downloaded_state");
        $("#" + button_id).addClass("downloading_state");
    }
    $("#" + button_id).attr("_dis", "only");
    $("#" + button_id).html("下载中");
}

function is_contains(value, map) {
    for (var colname in map) {
        if (colname == value) {
            return true;
        }
    }
    return false;
}

String.prototype.repeat = function(num) {
    return new Array(isNaN(num) ? 1 :++num).join(this);
};

function randomChar() {
    return Math.floor(Math.random() * 16).toString(16);
}

function get_fudid() {
    var fudid = "";
    for (var i = 1; i <= 32; i++) {
        fudid += randomChar();
    }
    return fudid.toLowerCase();
}

function UrlDecode(zipStr) {
    var uzipStr = "";
    for (var i = 0; i < zipStr.length; i++) {
        var chr = zipStr.charAt(i);
        if (chr == "+") {
            uzipStr += " ";
        } else if (chr == "%") {
            var asc = zipStr.substring(i + 1, i + 3);
            if (parseInt("0x" + asc) > 127) {
                uzipStr += decodeURI("%" + asc.toString() + zipStr.substring(i + 3, i + 9).toString());
                i += 8;
            } else {
                uzipStr += AsciiToString(parseInt("0x" + asc));
                i += 2;
            }
        } else {
            uzipStr += chr;
        }
    }
    return uzipStr;
}

function AsciiToString(asccode) {
    return String.fromCharCode(asccode);
}

function getQueryStringByUrl(url, name) {
    if (url == null || typeof url == "undefined") {
        return null;
    }
    var reg = new RegExp("(\\?|^|&)" + name + "=([^&]*)(&|$)");
    var r = url.match(reg);
    if (r != null) return unescape(decodeURI(r[2]));
    return null;
}

function get_site() {
    var site = "";
    var location = window.location.href;
    var referrer = document.referrer;
    var location_site = getQueryStringByUrl(location, "site");
    if (location_site == null) {
        var rererrer_site = getQueryStringByUrl(referrer, "site");
        if (rererrer_site == null) {
            site = "_unknown";
        } else {
            site = rererrer_site;
        }
    } else {
        site = location_site;
    }
    if (!site.match("^[A-Za-z0-9_#]+$")) {
        site = "others";
    } else {
        var index = site.indexOf("#");
        if (index != -1) {
            site = site.substr(0, index);
        }
    }
    return site;
}

function getBackHtml(event) {
    if (window.history && history.length > 1) {
        window.history.go(-1);
    } else {
        globle_router.navigate("games", {
            trigger:true
        });
    }
}

function popUpClose() {
    $("#openModal").remove();
    $("body").css("overflow-y", "scroll");
}

function popUpGame(imgUrl, app_id, timeout) {
    if (imgUrl == "") {
        return;
    }
    var button_id = "popup_" + app_id;
    var cookie_name = "cookie_name";
    if (getCookie(cookie_name) == null) {
        modalDiv = $('<div id="openModal" class="modalDialog"></div>');
        $("body").append(modalDiv);
        if (typeof Android == "undefined") {
            messContent = "<div class='popup_area'><div class='popup' id='popup_area'><div id='popup_close' class='popup_close'></div><div class='popup_img_area'><img class='popup_img'style='width:100%' src='" + imgUrl + "' onerror=\"this.src='img/popup_background.png'\"  onload=\"loadedImg('popup_img_area')\"/></div><div class='popupDownload'  id='" + button_id + "' ><div class='popupDownload_button' ><div class='download_flag'></div><div class='download_font'>一键下载</div></div></div></div></div>";
        } else {
            messContent = "<div class='popup_area'><div class='popup' id='popup_area'><div id='popup_close' class='popup_close'></div><div class='popup_img_area'><img class='popup_img'style='width:100%' src='" + imgUrl + "' onerror=\"this.src='img/popup_background.png'\"  onload=\"loadedImg('popup_img_area')\"/></div><button class='popupDownload'  id='" + button_id + "' >下载</button>";
        }
        var paramJsonString = JSON.stringify(app_dict[app_id]);
        var json = JSON.parse(paramJsonString);
        var gamecode = json.app_name + "_" + json.app_id;
        $("#openModal").html(messContent);
        setCookie(cookie_name, button_id, timeout);
        $("#openModal").css("height", $(window).height());
        $("#openModal").css("top", "-" + $(window).height() + "px");
        $("#openModal").animate({
            top:"0px"
        }, "fast");
        $("body").css("overflow-y", "hidden");
        $("#popup_close").on("tap", function() {
            popUpClose();
            event.stopPropagation();
        });
        $("#openModal").on("tap", function() {
            popUpClose();
        });
        $("#popup_area").on("tap", function(event) {
            download_app(button_id);
            event.stopPropagation();
        });
    }
}

function loadedImg(class_name) {
    $("." + class_name).css("width", "auto");
    $("." + class_name).css("height", "auto");
}

function popup_game() {
    if (arguments.length != 0) {
        var game_id = arguments[parseInt(arguments.length * Math.random())];
        var button_id = "popup_" + game_id;
        if (game_id.indexOf("page") != -1) {
            var imgUrl = recommend_page_dict[game_id]["popupPic"];
        } else {
            var imgUrl = app_dict[game_id]["popupPic"];
        }
    }
}

//渲染轮播图
function renderSlides(slidePosition) {
    var htmlString = "";
    var controlHtmlString = "";
    var number = 1;
    $.each(slidePosition.get("slides"), function(n, value) {
        if (number == 1) {
            htmlString = "<div class='m-item m-active' style='position:relative;'>";
            controlHtmlString = "<div data-slide='" + number + "' class='m-active'>" + number + "</div>";
        } else {
            htmlString = "<div class='m-item' style='position:relative;'>";
            controlHtmlString = "<div href='#' data-slide='" + number + "' class=''>" + number + "</div>";
        }
        if (value.focus_type == "4") {
            app_dict[value.app_id] = value;
            htmlString += "<div class='detailView'><img id='default_focus_img_" + number + "' title='" + value.app_id + "' style='width:100%;' src='img/nofoundfocus.jpg'/>" + "<img id='focus_img_" + number + "' onload='focus_onloading(this);' title='" + value.app_id + "' style='width:100%;display:none' src='" + value.focus_icon + "' onerror=\"this.src='img/nofoundfocus.jpg'\"/></div>";
        } else {
            htmlString += "<div class='subClassification'><img id='default_focus_img_" + number + "' title='" + value.app_id + "' style='width:100%;' src='img/nofoundfocus.jpg'/>" + "<img id='focus_img_" + number + "' onload='focus_onloading(this);' title='" + value.app_id + "' style='width:100%;display:none' src='" + value.focus_icon + "'/></div>" + "<div class='slide_description subClassification'>" + value.description + "</div>";
        }
        $("#slides").append(htmlString);
        $("#slides_controls").append(controlHtmlString);
        number = number + 1;
    });
}

function focus_onloading(obj) {
    defaut_img_id = "default_" + obj.id;
    $("#" + defaut_img_id).css("display", "none");
    $("#" + obj.id).css("display", "block");
}

function renderRecommends(recommendPosition, type) {
    $.each(recommendPosition.get("items"), function(n, value) {
        var recommendItemHtml = "<li class='list_view_li recommend_li' style='padding:0px'><div style='top:10px;'></div><div class='recommend_title' title='" + value.tag_id + "'>" + value.tag_name + "<div title='" + value.tag_id + "' class='more'><div title='" + value.tag_id + "' class='triangle-right'>更多></div></div></div>" + "<div class='recommend_content' ><ul class='content_list'>";
        $.each(value.recommends, function(n, value) {
            app_dict[value.app_id] = value;
            recommendItemHtml += "<li><div class='recommed_li_a'>";
            //设置金币、礼包初始值
            if (typeof value.app_score == "undefined") value.app_score = 0;
            if (typeof value.is_gift == "undefined") value.is_gift = 0;
            if (typeof value.is_activity == "undefined") value.is_activity = 0;
            if (parseInt(value.is_activity) == 1) {
                recommendItemHtml += "<div class='activity_pic detailView' title='" + value.app_id + "'></div>";
            } else if (parseInt(value.is_gift) == 1) {
                recommendItemHtml += "<div class='gift_pic detailView' title='" + value.app_id + "'></div>";
            } else if (parseInt(value.app_score) > 0) {
                recommendItemHtml += "<div class='credit_pic detailView' title='" + value.app_id + "'></div>";
            }
            recommendItemHtml += "<img class='content_list_img detailView' title='" + value.app_id + "' src='" + value.thumbnail_url + "' onerror=\"this.src='img/nofound.png'\"></div>" + "<h3 class='content_list_h3 game_name'>" + value.app_name + "</h3><p class='content_list_p'>" + value.package_size + "|" + value.download_number + "次下载</p>" + "<div id='download_" + value.app_id + "_downloading' class='downloading_position'><button id='download_" + value.app_id + "' class='download_button content_list_button' >下载</button>" + "</div></li>";
        });
        recommendItemHtml += "</ul></div></li>";
        $("#" + type + "_list_view").append(recommendItemHtml);
        if (n == 0) {
            $("#" + type + "_list_view").append("<div class='ad_position' id='ad_1'></div>");
            getAdHtml("ape_game_b1", "ad_1");
        } else if (n == 1) {
            $("#" + type + "_list_view").append("<div class='ad_position' id='ad_2'></div>");
            getAdHtml("ape_game_b2", "ad_2");
        }
    });
}

function renderCategories(recommendPosition) {
    var html = "";
    $.each(recommendPosition.get("items"), function(n, value) {
        html += "<li class='list_view_li category_li' ><div title='" + value.tag_id + "' class='category_area clear'><div title='" + value.tag_id + "'class='side-left subClassification'>" + "<img class='list_view_img detail_icon_img' title='" + value.tag_id + "' src='" + value.tag_logo + "' onerror=\"this.src='img/nofound.png'\" /><h3 class='list_view_h3' title='" + value.tag_id + "'><span title='" + value.tag_id + "'class='game_name'>" + value.tag_name + "</span></h3><p class='list_view_p' title='" + value.tag_id + "'><span title='" + value.tag_id + "'class='game_number_font'>" + value.tag_number + "</span></p></div></div><li>";
    });
    html += "<li class='list_view_li category_li' ><div title='applications' class='category_area clear'><div title='applications'class='side-left subClassification'>" + "<img class='list_view_img detail_icon_img' title='applications' src='img/applications.png' " + "onerror=\"this.src='img/nofound.png'\" /><h3 class='list_view_h3' title='applications'><span title='applications' " + "class='game_name'>应用推荐</span></h3><p class='list_view_p' title='applications'><span title='applications'class='game_number_font'>20款</span></p></div></div><li>";
    $("#category_list_view").append(html);
    var endHtml = getFunshionEnd();
    $("#end_funshion").append(endHtml);
}

function renderSubClassification(key, router) {
    if (key == "credit_app") {
        var url = interface_host + "/h5/credit_app?page=1";
    } else {
        var url = interface_host + "/h5/app_by_tag/?tag_id=" + key + "&page=1";
    }
    var ul_id = "list_view";
    $.ajax({
        type:"GET",
        url:url,
        dataType:"jsonp",
        timeout:1e4,
        jsonp:"callbackparam",
        //服务端用于接收callback调用的function名的参数
        success:function(data) {
            //处理 json格式的data数据即可
            if (data.retCode == "200") {
                if (key == my_game_tag_id) {
                    var recommend_title_html = "<div style='position:relative;border-bottom: 1px solid #e5e5e5;'><div id='recommend_title' class='my_game_title game_name'>推荐游戏</div></div>";
                    $("#list_view").append(recommend_title_html);
                } else {
                    $("#list_view").empty();
                }
                $("#header_title").append(data.tag_name);
                getSubClassificationHtml(data.app_list);
            } else {
                router.navigate("error/", {
                    trigger:true
                });
            }
            if (data.is_end == "true") {
                the_end = true;
                getEndHtml(ul_id);
            }
            imgLazyLoad();
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("subClassification data is error");
            router.navigate("error", {
                trigger:true
            });
        }
    });
}

function getSubClassificationHtml(app_list, ul_id, type) {
    var ul_id = arguments[1] ? arguments[1] :"list_view";
    var type = arguments[2] ? arguments[2] :"";
    var li_list_html = "";
    $.each(app_list, function(n, value) {
        var tag_html = "";
        $.each(value.tags, function(n, value) {
            tag_html += "<a title='" + value.tag_id + "' class='label'>" + value.tag_name + "</a>&nbsp;";
        });
        app_dict[value.app_id] = value;
        li_list_html += "<li class='list_view_li'>";
        //设置金币、礼包初始值
        if (typeof value.app_score == "undefined") value.app_score = 0;
        if (typeof value.is_gift == "undefined") value.is_gift = 0;
        if (typeof value.is_activity == "undefined") value.is_activity = 0;
        if (parseInt(value.app_score) > 0) {
            li_list_html += "<div class='credit_title'>" + value.app_score + "金币</div>";
        }
        var ranking_position = "";
        var labels_style = "";
        if (type == "ranking") {
            ranking_position = "style='margin-left:10px;'";
            var color_style = "";
            if (ranking_number <= 3) {
                color_style = "style='color:#fb6602'";
            }
            if (ranking_number >= 100) {
                color_style = "style='font-size:14px;'";
            }
            li_list_html += "<div class='ranking_number' " + color_style + ">" + ranking_number + "</div>";
            ranking_number += 1;
            labels_style = "style='left:100px;'";
        }
        var star_num = getStar(value.star);
        var empty_star_num = getStar(5 - parseInt(value.star));
        li_list_html += "<div class='list_view_area clear' " + ranking_position + "><div title='" + value.app_id + "' class='side-left detailView'>" + "<img class='list_view_img detail_icon_img' title='" + value.app_id + "' src='" + value.thumbnail_url + "' onerror=\"this.src='img/nofound.png'\">" + "<h2 title='" + value.app_id + "' class='list_view_h2 game_name'>" + value.app_name + "</h2><p class='list_view_p' title='" + value.app_id + "'>" + value.package_size + "|" + value.download_number + "次下载";
        //设置金币、礼包初始值
        if (typeof value.app_score == "undefined") value.app_score = 0;
        if (typeof value.is_gift == "undefined") value.is_gift = 0;
        if (parseInt(value.is_gift) == 1) {
            li_list_html += "<span class='marking_title marking_gift'>礼包</span>   ";
        }
        if (parseInt(value.is_activity) == 1) {
            li_list_html += "<span class='marking_title markging_activity'>活动</span>";
        }
        li_list_html += "</p></div><div class='labels' " + labels_style + "><span class='star' style='color:#fa6500'>" + star_num + "</span><span class='empty_star'>" + empty_star_num + "</span></div><div class='sub_downloading_position'><div id='download_" + value.app_id + "_downloading' class='downloading_position'><button id='download_" + value.app_id + "' class='download_button' style='width:74px' >下载</button></div></div></div></li>";
    });
    $("#" + ul_id).append(li_list_html);
}

function renderDetail(key, router) {
    var url = interface_host + "/h5/app_detail/?app_id=" + key;
    $.ajax({
        type:"GET",
        url:url,
        dataType:"jsonp",
        timeout:1e4,
        jsonp:"callbackparam",
        //服务端用于接收callback调用的function名的参数
        success:function(data) {
            //处理 json格式的data数据即可
            var items = new Array();
            if (data.retCode == "200") {
                var gameInfo = data.app;
                try {
                    app_dict[gameInfo.app_id] = gameInfo;
                    $("#game_title").append(gameInfo.app_name);
                    $(".detail_info").empty();
                    var star_num = getStar(gameInfo.star);
                    var empty_star_num = getStar(5 - parseInt(gameInfo.star));
                    var app_score = "";
                    if (parseInt(gameInfo.app_score) > 0) {
                        app_score = "|" + gameInfo.app_score + "金币";
                    }
                    var headHtml = "<div class='detail_title_content'><div class='detail_icon'><img id='game_icon' class='detail_head_icon_img' src='" + gameInfo.thumbnail_url + "' onerror=\"this.src='img/nofound.png'\"/></div>" + "<p id='game_name' class='detail_game_name detail_title_font'>" + gameInfo.app_name + "</p>" + "<p class='detail_explain detail_title_font'>" + gameInfo.package_size + "|" + gameInfo.download_number + "次下载" + app_score + "</p>" + "<div style='margin-top:-2px'><span class='star'>" + star_num + "</span><span class='empty_star'>" + empty_star_num + "</span></div></div><img class='detail_background' src='img/detail_background1.png'/>";
                    $(".detail_info").append(headHtml);
                    var screenShotsUrlHtml = "";
                    detailImgsInfo = gameInfo.img;
                    $.each(gameInfo.img, function(n, value) {
                        screenShotsUrlHtml += "<img src='" + value + "' class='detail_screen_shots_img' onerror=\"this.src='img/detail_background2.png'\" onload='loadedDetailScreenShotsImg(this)'>";
                    });
                    $("#screenShotsUrl").append(screenShotsUrlHtml);
                    var gameInfoHtml = "<li style='float:left;width:50%;'><p>更新：<span>" + gameInfo.update_time + "</span></p><p>版本：<span>" + gameInfo.app_version + "</span></p>" + "<li><p>大小：<span>" + gameInfo.package_size + "</span></p><p>语言：<span>中文</span></p></li><li><p>厂商：<span>" + gameInfo.manufacturers + "</span></p></li>";
                    $("#gameInfo").append(gameInfoHtml);
                    //游戏简介做只显示两行效果
                    var short_description_list = gameInfo.short_description.split("\n");
                    if (short_description_list.length <= 2) {
                        $("#description_show").append(gameInfo.short_description);
                    } else {
                        $("#description_show").append(short_description_list.slice(0, 2).join("\n"));
                        $("#description_hide").append(short_description_list.slice(2, -1).join("\n"));
                    }
                    var labelsHtml = "";
                    //标签模块
                    var label_html = "";
                    $.each(gameInfo.tags, function(n, value) {
                        label_html += "<li><a title='" + value.tag_id + "' class='label'>" + value.tag_name + "</a></li>";
                    });
                    $(".label_list").append(label_html);
                    //小编力荐模块
                    var number = 0;
                    var relation_app_html = "";
                    $.each(data.relation_app_list, function(n, value) {
                        if (number <= 3) {
                            relation_app_html += "<li><div title='" + value.app_id + "' class='detailView'><img title='" + value.app_id + "'  class='detail_icon_img' src='" + value.thumbnail_url + "' onerror=\"this.src='img/nofound.png'\"></div>" + "<h2>" + value.app_name + "</h2><div id='relateddownload_" + value.app_id + "_downloading' class='downloading_position' style='width:60px;height:auto'><button id='relateddownload_" + value.app_id + "' class='download_button relation_download'>下载</button></div></li>";
                            if (typeof value.app_score == "undefined") {
                                value["app_score"] = 0;
                            }
                            app_dict[value.app_id] = value;
                        }
                        number++;
                    });
                    $("#recommend_info").append(relation_app_html);
                    addBottomButton(gameInfo.app_id);
                    imgLazyLoad();
                } catch (e) {
                    //router.navigate('error', {trigger:true});
                    console.log(e);
                }
            } else {
                router.navigate("error", {
                    trigger:true
                });
            }
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("detail is error");
            router.navigate("error", {
                trigger:true
            });
        }
    });
}

/**获取详情页详情图放大版**/
function getBigDetailImgsHtml() {
    //渲染详情截图放大元素
    var bigDetailImgsHtml = "";
    var detailImgNumber = detailImgsInfo.length;
    $("body").append("<div id='big_detail_imgs' class='detailImgs'  onclick='detailBigDetailImgs()'><div id='wrapper'><div id='scroller' style='width:" + detailImgNumber * $(window).width() + "px'><ul id='thelist'></ul></div></div>");
    var detailImgWidth = $(window).width();
    $.each(detailImgsInfo, function(n, value) {
        bigDetailImgsHtml += "<li style='width:" + $(window).width() + "px'><img style='width:100%;' src='" + value + "'></li>";
    });
    $("#thelist").append(bigDetailImgsHtml);
    myscroll = new iScroll("wrapper", {
        snap:true,
        momentum:false,
        hScrollbar:false,
        vScrollbar:false,
        vScroll:false,
        hScroll:true
    });
    $("#big_detail_imgs").css("left", $(window).width());
    $("#big_detail_imgs").animate({
        left:"0px"
    }, "fast");
}

/**获取游戏星级**/
function getStar(number) {
    var star_string = "";
    for (var i = 0; i < number; i++) {
        star_string += "★";
    }
    return star_string;
}

/**添加底部下载按钮**/
function addBottomButton(app_id, button_text) {
    var button_text = arguments[1] || "下载";
    $(".bottom_button").empty();
    var downloadBottomButton_html = "<div id='downloadbottom_" + app_id + "_downloading' class='downloading_position' " + "style='width:272px;height:40px;margin:10px auto'><button class='button' id='downloadbottom_" + app_id + "'>" + button_text + "</button></div>";
    $(".bottom_button").append(downloadBottomButton_html);
    $(".bottom_button").append("<div class='share_img'></div>");
}

function loadedDetailScreenShotsImg(obj) {
    obj.style.width = "auto";
}

function renderRule(key, router) {
    var url = interface_host + "/h5/rule/?type=" + key;
    $.ajax({
        type:"GET",
        url:url,
        dataType:"jsonp",
        timeout:1e4,
        jsonp:"callbackparam",
        //服务端用于接收callback调用的function名的参数
        success:function(data) {
            //处理 json格式的data数据即可
            var items = new Array();
            if (data.retCode == "200") {
                var rule_html = data.rule_html;
                var title = data.title;
                $("#header_title").append(title);
                $("#rule_list").append(rule_html);
            } else {
                router.navigate("error", {
                    trigger:true
                });
            }
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("rule is error");
            router.navigate("error", {
                trigger:true
            });
        }
    });
}

function renderPopup() {
    var url = interface_host + "/h5/popup/";
    //从rest接口获取数据
    $.ajax({
        type:"GET",
        url:url,
        dataType:"jsonp",
        jsonp:"callbackparam",
        //服务端用于接收callback调用的function名的参数
        timeout:1e4,
        success:function(data) {
            if (data.retCode == "200") {
                value = data.popup;
                if (!isEmptyObject(value) && data.popup.resource_type == 4) {
                    app_dict[value.app_id] = value;
                    popUpGame(value.resource_icon, value.app_id, popup_interval);
                }
            }
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("popup is error");
        }
    });
}

function isEmptyObject(obj) {
    for (var key in obj) {
        return false;
    }
    return true;
}

function searchWord() {
    var key = $("#search_content").val();
    if (key.trim() != "输入感兴趣的关键字试试" && key != "") {
        $("#search_label_area").css("display", "none");
        $("#searching").show();
        var url = interface_host + "/h5/app_search?keywords=" + key;
        $.ajax({
            type:"GET",
            url:url,
            dataType:"jsonp",
            jsonp:"callbackparam",
            //服务端用于接收callback调用的function名的参数
            timeout:1e4,
            success:function(data) {
                //处理 json格式的data数据即可
                if (data.retCode == "200") {
                    $("#searching").hide();
                    search_key = key;
                    $("#list_view").empty();
                    if (data.total_number == 0) {
                        $("#no_search_img").show();
                        $("#search_label_area").css("display", "block");
                        $("#search_label_area_title").html("sorry！没有搜到结果，可以试试以下热搜");
                        refreshHotWord();
                    } else {
                        $("#no_search_img").hide();
                        app_dict = {};
                        getGameListHtml(data, "list_view");
                        $("#list_view").css("margin-top", "50px");
                    }
                }
            },
            error:function(XMLHttpRequest, textStatus, errorThrown) {
                $("#searching").hide();
                $("#search_label_area").css("display", "block");
                $("#search_label_area_title").html("网络故障，可以试试以下热搜");
            }
        });
    } else {
        $("#search_label_area_title").html("您的输入为空，可以试试以下热搜");
    }
}

function changeContent(a) {
    changeHead(a);
    current_native_id = a;
    globle_router.navigate(a, {
        trigger:true
    });
}

function changeHead(a) {
    //search_key = "";
    $("#" + current_native_id).attr("class", "child");
    $("#" + a).attr("class", "child active");
}

function _loadComplete(type) {
    var type_function_map = {
        prize:"renderPrize",
        gift_list:"renderGiftList",
        topic_list:"renderTopicList",
        topic:"renderTopicDetail"
    };
    ul_id = "list_view";
    //增加滑动的动作，判断到底前进行刷新
    window.onscroll = function() {
        var a = document.documentElement.scrollTop != 0 ? document.body.clientHeight :document.documentElement.clientHeight;
        var b = document.documentElement.scrollTop == 0 ? document.body.scrollTop :document.documentElement.scrollTop;
        var c = document.documentElement.scrollTop == 0 ? document.body.scrollHeight :document.documentElement.scrollHeight;
        if (a + b + 30 > c && b != 0 && !the_end) {
            if (needtorefresh) {
                $(".loading").remove();
                getLoadingHtml(ul_id);
                needtorefresh = false;
                if (type_function_map[type]) {
                    var fn = window[type_function_map[type]];
                    fn(counter);
                } else {
                    refresh_game_list_view(type, ul_id);
                }
                counter++;
            }
        }
    };
}

function refresh_game_list_view(tag_id, ul_id) {
    var url = "";
    if (tag_id == "ranking") {
        url = interface_host + "/h5/ranking/?&page=" + counter;
    } else if (tag_id == "search") {
        var key = $("#search_content").val();
        url = interface_host + "/h5/app_search?keywords=" + key + "&page=" + counter;
    } else if (tag_id == "credit") {
        url = interface_host + "/h5/history_record?type=1&imei=" + imei + "&page=" + counter;
    } else {
        url = interface_host + "/h5/app_by_tag/?tag_id=" + tag_id + "&page=" + counter;
    }
    $.ajax({
        type:"GET",
        url:url,
        dataType:"jsonp",
        jsonp:"callbackparam",
        //服务端用于接收callback调用的function名的参数
        async:false,
        success:function(data) {
            //处理 json格式的data数据即可
            if (data.retCode == "200") {
                $(".loading").remove();
                if (tag_id == "credit") {
                    var record_html = "";
                    record_html = getCreditRecordHtml(data, record_html);
                    if (data.is_end == "true") {
                        record_html += getFunshionEnd();
                        the_end = true;
                    }
                    $("#list_view").append(record_html);
                } else {
                    getGameListHtml(data, ul_id, tag_id);
                    imgLazyLoad();
                }
                needtorefresh = true;
            }
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            if (XMLHttpRequest.status == 404) {}
        }
    });
}

function getGameListHtml(data, ul_id, type) {
    var type = arguments[2] ? arguments[2] :"";
    var _app_dict = {};
    $.each(data.app_list, function(n, value) {
        _app_dict[value.app_id] = "";
    });
    getSubClassificationHtml(data.app_list, ul_id, type);
    isEnd(data.is_end, ul_id);
}

function getEndHtml(ul_id) {
    var html = "<li class='list_view_li' style='background:#eee;text-align:center;padding:10px;border:0px;'>" + "<div class='at_last end_font' rel='external'>更多精品游戏 >></div></li>";
    $("#" + ul_id).append(html);
}

function refreshHotWord() {
    var url = interface_host + "/h5/tag_hotword_recommend";
    $.ajax({
        type:"GET",
        url:url,
        dataType:"jsonp",
        jsonp:"callbackparam",
        timeout:1e4,
        success:function(data) {
            //处理 json格式的data数据即可
            if (data.retCode == "200") {
                $("#search_label_list").empty();
                var li = "";
                $.each(data.hot_words, function(n, value) {
                    li += "<li><div class='hotWord'>" + value + "</div></li>";
                });
                $("#search_label_list").append(li);
            }
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("hot word' interface:" + url + " is error");
        }
    });
}

/**nid  ：导航id
应用：1
游戏：2
分类：3
排行：4
搜索：5
**/
var nid_map = {
    app:1,
    game:2,
    classification:3,
    ranking:4,
    search:5
};

function getNewSlides(type, router, position) {
    var url = interface_host + "/h5/focus_by_navigation/?nid=" + nid_map[type];
    var key = type + "_slides";
    $.ajax({
        type:"GET",
        url:url,
        dataType:"jsonp",
        jsonp:"callbackparam",
        //服务端用于接收callback调用的function名的参数
        timeout:1e4,
        success:function(data) {
            if (data.retCode == "200") {
                //处理 json格式的data数据即可
                var slides = new Array();
                $.each(data.focus_img, function(n, value) {
                    var slide = {
                        app_id:value.resource_id,
                        focus_icon:value.focus_icon,
                        focus_type:value.focus_type,
                        app_download_url:value.app_download_url,
                        thumbnail_url:value.thumbnail_url,
                        description:value.description,
                        file_size_bytes:value.file_size_bytes,
                        app_version:value.version_name,
                        app_name:value.app_name,
                        app_score:value.app_score,
                        package_size:value.package_size
                    };
                    slides.push(slide);
                });
                position = {
                    id:key,
                    slides:slides
                };
                var slidePosition = router.positions.get(key);
                if (slidePosition) {
                    slidePosition.bind("change", function(model) {
                        console.log(type + " slide start refresh");
                        $("#slides").empty();
                        $("#slides_controls").empty();
                        renderSlides(model);
                    });
                    createPosition(router, position);
                    slidePosition.fetch();
                } else {
                    createPosition(router, position);
                    slidePosition = router.positions.get(key);
                    renderSlides(slidePosition);
                }
            }
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            if (!router.positions.get(key)) {
                router.navigate("error", {
                    trigger:true
                });
            }
            console.log(type + " slide's interface: " + url + " is error");
        }
    });
}

function getNewRecommends(type, router, position) {
    var key = type + "_recommends";
    var ul_id = type + "_list_view";
    if (type == "app") {
        var url = interface_host + "/h5/tag_info";
    } else {
        var url = interface_host + "/h5/app_info_by_navigation?nid=" + nid_map[type];
    }
    $.ajax({
        type:"GET",
        url:url,
        dataType:"jsonp",
        timeout:1e4,
        jsonp:"callbackparam",
        //服务端用于接收callback调用的function名的参数
        success:function(data) {
            if (data.retCode == "200") {
                //处理 json格式的data数据即可
                var items = new Array();
                $.each(data.tag_info, function(n, value) {
                    var item = {
                        tag_id:value.tag_id,
                        tag_name:value.tag_name,
                        recommends:[]
                    };
                    $.each(value.app_list, function(n, value) {
                        item["recommends"].push(value);
                    });
                    items.push(item);
                });
                position = {
                    id:key,
                    items:items
                };
                var recommendPosition = router.positions.get(key);
                if (recommendPosition) {
                    recommendPosition.bind("change", function(model) {
                        console.log(type + " start refresh");
                        $("#" + type + "_list_view").empty();
                        renderRecommends(model, type);
                    });
                    createPosition(router, position);
                    recommendPosition.fetch();
                } else {
                    createPosition(router, position);
                    recommendPosition = router.positions.get(key);
                    renderRecommends(recommendPosition, type);
                }
                the_end = true;
                getEndHtml(ul_id);
            }
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            if (!router.positions.get(key)) {
                router.navigate("error", {
                    trigger:true
                });
            }
            //出错上报
            console.log(type + " recommends's interface: " + url + " is error");
        }
    });
}

function createPosition(router, position) {
    try {
        router.positions.create(position);
    } catch (e) {}
}

function getNewCategories(router, position) {
    var url = interface_host + "/h5/tag";
    $.ajax({
        type:"GET",
        url:url,
        dataType:"jsonp",
        timeout:1e4,
        jsonp:"callbackparam",
        //服务端用于接收callback调用的function名的参数
        success:function(data) {
            //处理 json格式的data数据即可
            var items = new Array();
            if (data.retCode == "200") {
                var items = new Array();
                $.each(data.tag_list, function(n, value) {
                    var app_item = {
                        tag_id:value.tag_id,
                        tag_logo:value.tag_logo,
                        tag_name:value.tag_name,
                        tag_number:value.tag_number
                    };
                    items.push(app_item);
                });
                position = {
                    id:"classification_categories",
                    items:items
                };
                var recommendPosition = router.positions.get("classification_categories");
                if (recommendPosition) {
                    recommendPosition.bind("change", function(model) {
                        console.log("categories start refresh");
                        $("#category_list_view").empty();
                        renderCategories(model);
                    });
                    createPosition(router, position);
                    recommendPosition.fetch();
                } else {
                    console.log("categories no cache");
                    createPosition(router, position);
                    recommendPosition = router.positions.get("classification_categories");
                    renderCategories(recommendPosition);
                }
            }
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            if (!router.positions.get("classification_categories")) {
                router.navigate("error", {
                    trigger:true
                });
            }
            //出错上报
            console.log("classification categories's interface: " + url + " is error");
        }
    });
}

function getNewRanking(router, position) {
    var url = interface_host + "/h5/ranking/";
    var key = "ranking";
    $.ajax({
        type:"GET",
        url:url,
        dataType:"jsonp",
        jsonp:"callbackparam",
        //服务端用于接收callback调用的function名的参数
        timeout:1e4,
        success:function(data) {
            //处理 json格式的data数据即可
            var items = new Array();
            if (data.retCode == "200") {
                $("#searching").hide();
                var items = new Array();
                $.each(data.app_list, function(n, value) {
                    items.push(value);
                });
                position = {
                    id:key,
                    items:items
                };
                var recommendPosition = router.positions.get(key);
                if (recommendPosition) {
                    recommendPosition.bind("change", function(model) {
                        console.log("ranking start refresh");
                        $("#list_view").empty();
                        getSubClassificationHtml(model.get("items"), "list_view", "ranking");
                    });
                    createPosition(router, position);
                    recommendPosition.fetch();
                } else {
                    console.log("ranking no cache");
                    createPosition(router, position);
                    recommendPosition = router.positions.get(key);
                    getSubClassificationHtml(recommendPosition.get("items"), "list_view", "ranking");
                }
                if (recommendPosition.get("items").length > 0) {
                    getLoadingHtml("list_view");
                }
            }
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            $("#searching").hide();
            if (!router.positions.get("ranking")) {
                router.navigate("error", {
                    trigger:true
                });
            }
            //出错上报
            console.log("ranking's interface: " + url + " is error");
        }
    });
}

function quickDelete() {
    $("#no_search_img").hide();
    $("#search_content").val("  输入感兴趣的关键字试试");
    $("#search_content").css("color", "#d0d0d0");
    $("#list_view").empty();
    $("#search_label_area").css("display", "block");
    if (search_key != "") {
        search_key = "";
        $("#search_label_area_title").text("大家都在搜");
        refreshHotWord();
    }
}

function getUrlsite() {
    var href = window.location.href;
    if (href.indexOf("agc.funshion.com") != -1) {
        if (href.indexOf("?") == -1) {
            var hrefItems = href.split("#");
            if (hrefItems.length == 1) {
                window.location.href = hrefItems[0] + "?site=" + get_site();
            } else {
                window.location.href = hrefItems[0] + "?site=" + get_site() + hrefItems[1];
            }
        }
    }
}

function goClassification(router) {
    changeHead("classifications");
    router.navigate("classifications", {
        trigger:true
    });
}

function hideNavigation() {
    $("#navigation").hide();
}

function showNavigation() {
    $("#navigation").show();
}

function imgLazyLoad() {
    //图片延时加载
    $("img").picLazyLoad();
}

$(function() {
    var dolymood = {};
    (function(dolymood) {
        var userid = 0;
        var View = Backbone.View.extend({
            register:function(state) {
                this.state = state;
                return this;
            }
        });
        var Position = Backbone.Model.extend({});
        var PositionCollection = Backbone.Collection.extend({
            model:Position,
            // 持久化到本地数据库
            localStorage:new Store("apps")
        });
        //应用页面渲染
        var AppListView = View.extend({
            template:_.template($("#app-template").html()),
            initialize:function() {
                var view = this;
                this.state = new Backbone.Model();
                this.router = this.options.router;
                globle_router = this.router;
                // 调用fetch的时候触发reset
                this.collection.unbind("reset");
                //注意这里不要重复绑定
                this.collection.bind("reset", this.addAllApp, this);
                //注意这里不要重复绑定
                setTimeout(function() {
                    view.collection.fetch();
                }, 0);
                page_name = "application";
                getUrlsite();
                //setTimeout(function() {
                //	showNavigation();
                //}, 300);
                showNavigation();
                page_init();
            },
            events:{
                "tap .more":"viewSubClassification",
                "tap .subClassification":"viewSubClassification",
                "tap .detailView":"viewDetail",
                "tap .download_button":"download",
                "tap .at_last":"viewClassification",
                "tap .last":"goBack"
            },
            viewClassification:function(event) {
                goClassification(this.router);
                current_native_id = "classifications";
            },
            viewSubClassification:function(event) {
                this.router.navigate("subClassification/" + event.target.title, {
                    trigger:true
                });
            },
            viewDetail:function(event) {
                this.router.navigate("detail/" + event.target.title, {
                    trigger:true
                });
            },
            download:function(event) {
                download_app(event.target.id);
            },
            refreshSlides:function() {
                var router = this.router;
                var position = new Position();
                getNewSlides("app", router, position);
            },
            refreshRecommends:function() {
                var router = this.router;
                var position = new Position();
                getNewRecommends("app", router, position);
            },
            render:function() {
                var view = this;
                this.$el.html(this.template());
                return this;
            },
            goBack:function(event) {
                getBackHtml(event);
            },
            addAllApp:function() {
                var view = this;
                var appRecommendPosition = this.collection.get("app_recommends");
                if (appRecommendPosition) {
                    console.log("app recommendPosition has cached");
                    renderRecommends(appRecommendPosition, "app");
                    setTimeout(function() {
                        view.refreshRecommends();
                    }, 0);
                } else {
                    view.refreshRecommends();
                }
                imgLazyLoad();
            }
        });
        //游戏页面渲染
        var GameListView = View.extend({
            template:_.template($("#game-template").html()),
            initialize:function() {
                var view = this;
                this.state = new Backbone.Model();
                this.router = this.options.router;
                globle_router = this.router;
                // 调用fetch的时候触发reset
                this.collection.unbind("reset");
                //注意这里不要重复绑定
                this.collection.bind("reset", this.addAllGame, this);
                //注意这里不要重复绑定
                setTimeout(function() {
                    view.collection.fetch();
                }, 0);
                page_name = "game";
                getUrlsite();
                showNavigation();
                page_init();
            },
            events:{
                "tap .recommend_title":"viewSubClassification",
                "tap .subClassification":"viewSubClassification",
                "tap .detailView":"viewDetail",
                "tap .download_button":"download",
                "tap .slide_button":"download",
                "tap .at_last":"viewClassification",
                "tap .menu_content":"viewMenumeContent",
                "tap .search_img":"viewMenumeContent",
                "tap .ad_img":"viewAd"
            },
            viewClassification:function(event) {
                goClassification(this.router);
                current_native_id = "classifications";
            },
            viewSubClassification:function(event) {
                this.router.navigate("subClassification/" + event.target.title, {
                    trigger:true
                });
            },
            viewDetail:function(event) {
                this.router.navigate("detail/" + event.target.title, {
                    trigger:true
                });
            },
            viewMenumeContent:function(event) {
                if (event.target.title == "manage") {
                    if (typeof Android != "undefined") {
                        Android.startAppManagementActivity();
                    } else {
                        alertMsg("该频道只适用于风行app");
                    }
                } else {
                    goSubMenume(this.router, event.target.title);
                }
            },
            viewAd:function() {
                reportUrl(event.target.title);
                window.location = event.target.id;
            },
            download:function(event) {
                download_app(event.target.id);
            },
            refreshSlides:function() {
                var router = this.router;
                var position = new Position();
                getNewSlides("game", router, position);
            },
            refreshRecommends:function() {
                var router = this.router;
                var position = new Position();
                getNewRecommends("game", router, position);
            },
            render:function() {
                var view = this;
                this.$el.html(this.template());
                return this;
            },
            addAllGame:function() {
                var view = this;
                //加载幻灯推荐位
                var gameSlidePosition = this.collection.get("game_slides");
                if (gameSlidePosition) {
                    //已缓存，则先加载本地，在进行刷新数据
                    console.log("game has cached");
                    renderSlides(gameSlidePosition);
                    setTimeout(function() {
                        view.refreshSlides();
                    }, 0);
                } else {
                    //未缓存，直接刷新数据
                    view.refreshSlides();
                }
                //加载游戏列表推荐位
                var gameRecommendPosition = this.collection.get("game_recommends");
                if (gameRecommendPosition) {
                    console.log("game recommend has cached");
                    renderRecommends(gameRecommendPosition, "game");
                    setTimeout(function() {
                        view.refreshRecommends();
                    }, 0);
                } else {
                    //未缓存，直接刷新游戏列表推荐位
                    view.refreshRecommends();
                }
                //开启弹窗
                setTimeout(function() {
                    renderPopup();
                }, 0);
                imgLazyLoad();
            }
        });
        //排行页面渲染
        var RankingView = View.extend({
            template:_.template($("#ranking-template").html()),
            initialize:function() {
                var view = this;
                this.router = this.options.router;
                globle_router = this.router;
                // 调用fetch的时候触发reset
                this.collection.unbind("reset");
                //注意这里不要重复绑定
                this.collection.bind("reset", this.addAllRanking, this);
                //注意这里不要重复绑定
                setTimeout(function() {
                    view.collection.fetch();
                }, 0);
                ranking_number = 1;
                page_name = "ranking";
                _loadComplete(page_name);
                getUrlsite();
                showNavigation();
                page_init(true);
            },
            events:{
                "tap .detailView":"viewDetail",
                "tap .label":"viewSubClassification",
                "tap .at_last":"viewClassification",
                "tap .download_button":"download",
                "tap .last":"goBack"
            },
            viewSubClassification:function(event) {
                this.router.navigate("subClassification/" + event.target.title, {
                    trigger:true
                });
            },
            viewClassification:function(event) {
                goClassification(this.router);
                current_native_id = "classifications";
            },
            viewDetail:function(event) {
                this.router.navigate("detail/" + event.target.title, {
                    trigger:true
                });
            },
            download:function(event) {
                download_app(event.target.id);
            },
            refreshRanking:function() {
                var router = this.router;
                var position = new Position();
                ranking_number = 1;
                getNewRanking(router, position);
            },
            render:function() {
                var view = this;
                this.$el.html(this.template());
                return this;
            },
            goBack:function(event) {
                getBackHtml(event);
            },
            addAllRanking:function() {
                var view = this;
                //如果已缓存，实行页面更新
                var rankingPosition = this.collection.get("ranking");
                if (rankingPosition) {
                    console.log("ranking has cached");
                    //如果已缓存，先显示本地 数据，再实行页面更新
                    getSubClassificationHtml(rankingPosition.get("items"), "list_view", "ranking");
                    setTimeout(function() {
                        view.refreshRanking();
                    }, 0);
                } else {
                    //未缓存，直接刷新数据
                    $("#searching").show();
                    view.refreshRanking();
                }
                imgLazyLoad();
            }
        });
        //分类页面渲染
        var ClassificationListView = View.extend({
            template:_.template($("#classification-template").html()),
            initialize:function() {
                var view = this;
                this.state = new Backbone.Model();
                this.router = this.options.router;
                globle_router = this.router;
                // 调用fetch的时候触发reset
                this.collection.unbind("reset");
                //注意这里不要重复绑定
                this.collection.bind("reset", this.addAllCategories, this);
                //注意这里不要重复绑定
                setTimeout(function() {
                    view.collection.fetch();
                }, 0);
                page_name = "classification";
                getUrlsite();
                showNavigation();
                page_init();
            },
            events:{
                "tap .subClassification":"viewSubClassification",
                "tap .detailView":"viewDetail",
                "tap .slide_button":"download",
                "tap .last":"goBack"
            },
            viewSubClassification:function(event) {
                if (event.target.title == "applications") {
                    this.router.navigate("applications", {
                        trigger:true
                    });
                } else {
                    this.router.navigate("subClassification/" + event.target.title, {
                        trigger:true
                    });
                }
            },
            viewDetail:function(event) {
                this.router.navigate("detail/" + event.target.title, {
                    trigger:true
                });
            },
            download:function(event) {
                download_app(event.target.id);
            },
            refreshSlides:function() {
                var router = this.router;
                var position = new Position();
                getNewSlides("classification", router, position);
            },
            refreshCategories:function() {
                var router = this.router;
                var position = new Position();
                getNewCategories(router, position);
            },
            render:function() {
                var view = this;
                this.$el.html(this.template());
                return this;
            },
            goBack:function(event) {
                getBackHtml(event);
            },
            addAllCategories:function() {
                var view = this;
                //加载幻灯推荐位
                var classificationSlidePosition = this.collection.get("classification_slides");
                if (classificationSlidePosition) {
                    //已缓存，则先加载本地，在进行刷新数据
                    console.log("classification slide has cached");
                    renderSlides(classificationSlidePosition);
                    setTimeout(function() {
                        view.refreshSlides("classification");
                    }, 0);
                } else {
                    //未缓存，直接刷新数据
                    view.refreshSlides("classification");
                }
                //加载分类列表推荐位
                var classificationRecommendPosition = this.collection.get("classification_categories");
                if (classificationRecommendPosition) {
                    console.log("classification categories has cached");
                    renderCategories(classificationRecommendPosition);
                    setTimeout(function() {
                        view.refreshCategories();
                    }, 0);
                } else {
                    view.refreshCategories();
                }
                imgLazyLoad();
            }
        });
        //搜索页面渲染
        var SearchView = View.extend({
            template:_.template($("#search-template").html()),
            initialize:function() {
                var view = this;
                this.router = this.options.router;
                globle_router = this.router;
                app_dict = {};
                showNavigation();
                page_name = "search";
                page_init(true);
                _loadComplete(page_name);
            },
            events:{
                "tap .hotWord":"tapTag",
                "tap .search_button":"tapSearchButton",
                "tap .download_button":"download",
                "tap .label":"viewSubClassification",
                "tap .detailView":"viewDetail",
                "tap .at_last":"viewClassification",
                "tap .quickdelete":"quickdelete",
                "tap .last":"goBack"
            },
            tapTag:function(event) {
                var tag = event.target.innerHTML;
                $("#search_content").val(tag);
                $("#search_content").css("color", "#000");
                this.tapSearchButton();
            },
            tapSearchButton:function() {
                searchWord();
            },
            viewSubClassification:function(event) {
                this.router.navigate("subClassification/" + event.target.title, {
                    trigger:true
                });
            },
            viewClassification:function(event) {
                goClassification(this.router);
                current_native_id = "classifications";
            },
            viewDetail:function(event) {
                this.router.navigate("detail/" + event.target.title, {
                    trigger:true
                });
            },
            download:function(event) {
                download_app(event.target.id);
            },
            quickdelete:function(event) {
                quickDelete();
            },
            goBack:function(event) {
                getBackHtml(event);
            },
            render:function() {
                var view = this;
                this.$el.html(this.template());
                //缓存搜索结果
                if (search_key != "") {
                    setTimeout(function() {
                        $("#search_content").val(search_key);
                        $("#search_content").css("color", "#000");
                        searchWord();
                    }, 200);
                } else {
                    setTimeout(function() {
                        $("#search_label_area_title").text("大家都在搜");
                    }, 200);
                    refreshHotWord();
                }
                return this;
            }
        });
        //子分类页面渲染
        var SubClassificationView = View.extend({
            template:_.template($("#subClassification-template").html()),
            initialize:function() {
                this.router = this.options.router;
                globle_router = this.router;
                hideNavigation();
                page_name = "subClassification";
                page_init(true);
            },
            events:{
                "tap .label":"viewSubClassification",
                "tap .side-left":"viewDetail",
                "tap .last":"goBack",
                "tap .download_button":"download",
                "tap .at_last":"viewClassification"
            },
            viewSubClassification:function(event) {
                this.router.navigate("subClassification/" + event.target.title, {
                    trigger:true
                });
            },
            viewDetail:function(event) {
                this.router.navigate("detail/" + event.target.title, {
                    trigger:true
                });
            },
            viewClassification:function(event) {
                goClassification(this.router);
                current_native_id = "classifications";
            },
            goBack:function(event) {
                getBackHtml(event);
            },
            download:function(event) {
                download_app(event.target.id);
            },
            render:function() {
                var view = this;
                var router = this.options.router;
                var key = window.location.href.split("#")[1].split("/")[1];
                counter = 2;
                the_end = false;
                needtorefresh = true;
                _loadComplete(key);
                renderSubClassification(key, router);
                this.$el.html(this.template());
                return this;
            }
        });
        /**详情页**/
        var DetailView = View.extend({
            template:_.template($("#detail-template").html()),
            initialize:function() {
                this.router = this.options.router;
                globle_router = this.router;
                hideNavigation();
                page_name = "detail";
                page_init();
            },
            events:{
                "tap .label":"viewSubClassification",
                "tap .detailView":"viewDetail",
                "tap .detail_last":"goBack",
                "tap .button":"download",
                "tap .download_button":"download",
                "tap .content_flex":"flex",
                "tap .view_gift_list":"viewGiftList",
                "tap .view_app_activity":"viewAppActivity",
                "tap .detail_screen_shots_img":"viewDetailImgs",
                "click .share_img":"share"
            },
            viewSubClassification:function(event) {
                $("#shareListWrap").remove();
                this.router.navigate("subClassification/" + event.target.title, {
                    trigger:true
                });
            },
            viewDetail:function(event) {
                $("#shareListWrap").remove();
                this.router.navigate("detail/" + event.target.title, {
                    trigger:true
                });
            },
            goBack:function(event) {
                $("#shareListWrap").remove();
                getBackHtml(event);
            },
            download:function(event) {
                download_app(event.target.id);
            },
            flex:function(event) {
                $("#description_hide").toggle();
                if ($("#flex").attr("class") == "triangle-up") {
                    $("#flex").attr("class", "triangle-down");
                } else {
                    $("#flex").attr("class", "triangle-up");
                }
            },
            viewGiftList:function(event) {
                $("#shareListWrap").remove();
                var app_id = window.location.href.split("#")[1].split("/")[1];
                this.router.navigate("detail_gift/" + app_id, {
                    trigger:true
                });
            },
            viewAppActivity:function(event) {
                $("#shareListWrap").remove();
                this.router.navigate("app_activity/" + event.target.title, {
                    trigger:true
                });
            },
            viewDetailImgs:function() {
                getBigDetailImgsHtml();
            },
            share:function() {
                new F.share(".j-share-toggle");
            },
            render:function() {
                var key = window.location.href.split("#")[1].split("/")[1];
                var view = this;
                var router = this.options.router;
                setTimeout(function() {
                    renderDetail(key, router);
                }, 0);
                //加载礼包入口
                setTimeout(function() {
                    getBriefGiftInfo(key);
                }, 0);
                //加载活动入口
                setTimeout(function() {
                    getAppActivityEntry(key);
                }, 0);
                this.$el.html(this.template());
                return this;
            }
        });
        /**错误页**/
        var ErrorView = View.extend({
            template:_.template($("#error-template").html()),
            initialize:function() {
                hideNavigation();
                this.router = this.options.router;
                globle_router = this.router;
                page_name = "error";
                page_init();
            },
            events:{
                "tap .last":"goBack",
                "tap .return_home":"goBack"
            },
            goBack:function(event) {
                changeHead("games");
                current_native_id = "games";
                this.router.navigate("games", {
                    trigger:true
                });
            },
            render:function() {
                this.$el.html(this.template());
                return this;
            }
        });
        /**反馈页面**/
        var FeedbackView = View.extend({
            template:_.template($("#feedback-template").html()),
            initialize:function() {
                hideNavigation();
                this.router = this.options.router;
                globle_router = this.router;
                page_name = "feedback";
                page_init();
            },
            events:{
                "tap .last":"goBack",
                "tap .submit_button":"submit"
            },
            goBack:function(event) {
                getBackHtml(event);
            },
            submit:function() {
                router = this.options.router;
                checkFeedBackInfo(router);
            },
            render:function() {
                this.$el.html(this.template());
                return this;
            }
        });
        /**我的游戏页面**/
        var MyGameView = View.extend({
            template:_.template($("#my_game-template").html()),
            initialize:function() {
                hideNavigation();
                this.router = this.options.router;
                globle_router = this.router;
                page_name = "my_game";
                page_init();
            },
            events:{
                "tap .last":"goBack",
                "tap .quick_start":"start_quick",
                "tap .download_button":"download",
                "tap .label":"viewSubClassification",
                "tap .side-left":"viewDetail",
                "tap .at_last":"viewClassification"
            },
            goBack:function(event) {
                getBackHtml(event);
            },
            download:function(event) {
                download_app(event.target.id);
            },
            start_quick:function(event) {
                Android.quickStartApp(event.target.title);
            },
            viewSubClassification:function(event) {
                this.router.navigate("subClassification/" + event.target.title, {
                    trigger:true
                });
            },
            viewDetail:function(event) {
                this.router.navigate("detail/" + event.target.title, {
                    trigger:true
                });
            },
            viewClassification:function(event) {
                goClassification(this.router);
                current_native_id = "classifications";
            },
            render:function() {
                counter = 2;
                the_end = false;
                needtorefresh = true;
                setTimeout(function() {
                    getInstalledAppList();
                }, 0);
                _loadComplete(my_game_tag_id);
                renderSubClassification(my_game_tag_id, this.router);
                this.$el.html(this.template());
                return this;
            }
        });
        /**我的积分页面**/
        var CreditView = View.extend({
            template:_.template($("#credit-template").html()),
            initialize:function() {
                hideNavigation();
                this.router = this.options.router;
                globle_router = this.router;
                page_name = "credit";
                page_init();
            },
            events:{
                "tap .last":"goBack",
                "tap .rule":"viewRule",
                "tap .credit_history":"viewHistory",
                "tap .add_credit_button":"addCredit"
            },
            goBack:function(event) {
                getBackHtml(event);
            },
            viewRule:function(event) {
                this.router.navigate("rule/1", {
                    trigger:true
                });
            },
            viewHistory:function() {
                counter = 2;
                the_end = false;
                needtorefresh = true;
                _loadComplete(page_name);
                var router = this.options.router;
                renderHistoryCredit(router);
            },
            addCredit:function() {
                this.router.navigate("subClassification/credit_app", {
                    trigger:true
                });
            },
            render:function() {
                var router = this.options.router;
                setTimeout(function() {
                    renderCredit(router);
                }, 0);
                this.$el.html(this.template());
                return this;
            }
        });
        /**礼包列表页面**/
        var GiftListView = View.extend({
            template:_.template($("#gift_list-template").html()),
            initialize:function() {
                hideNavigation();
                this.router = this.options.router;
                globle_router = this.router;
                page_name = "gift_list";
                page_init(true);
            },
            events:{
                "tap .last":"goBack",
                "tap .detailView":"viewDetail",
                "tap .gift_li":"toggleGiftInfo",
                "tap .rule":"viewRule",
                "tap .gift_button":"getGift",
                "tap .at_last":"viewClassification",
                "tap .my_gift_button":"viewMyPrize"
            },
            goBack:function(event) {
                getBackHtml(event);
            },
            viewDetail:function(event) {
                this.router.navigate("detail/" + event.target.title, {
                    trigger:true
                });
            },
            viewRule:function(event) {
                this.router.navigate("rule/2", {
                    trigger:true
                });
            },
            toggleGiftInfo:function(event) {
                $("#detail_" + event.target.title).toggle();
            },
            getGift:function(event) {
                getAppGift(event.target.id);
            },
            viewClassification:function(event) {
                goClassification(this.router);
                current_native_id = "classifications";
            },
            viewMyPrize:function() {
                this.router.navigate("prize", {
                    trigger:true
                });
            },
            render:function() {
                setTimeout(function() {
                    renderGiftList();
                }, 0);
                this.$el.html(this.template());
                return this;
            }
        });
        var RuleView = View.extend({
            template:_.template($("#rule-template").html()),
            initialize:function() {
                hideNavigation();
                this.router = this.options.router;
                globle_router = this.router;
                page_name = "rule";
                page_init();
            },
            events:{
                "tap .last":"goBack"
            },
            goBack:function(event) {
                getBackHtml(event);
            },
            render:function() {
                var key = window.location.href.split("#")[1].split("/")[1];
                var view = this;
                var router = this.options.router;
                renderRule(key, router);
                this.$el.html(this.template());
                return this;
            }
        });
        /**活动列表页面**/
        var ActivityView = View.extend({
            template:_.template($("#activity-template").html()),
            initialize:function() {
                $("body").css("background", "#fff");
                hideNavigation();
                this.router = this.options.router;
                globle_router = this.router;
                page_name = "activity";
                page_init();
            },
            events:{
                "tap .last":"goBack",
                "tap .activity_li":"viewActivity"
            },
            goBack:function(event) {
                $("body").css("background", "#eee");
                getBackHtml(event);
            },
            viewActivity:function(event) {
                $("body").css("background", "#eee");
                var title = event.target.title;
                if (title == "add_credit") {
                    this.router.navigate("subClassification/credit_app", {
                        trigger:true
                    });
                } else {
                    goActivity(this.router, event.target.title);
                }
            },
            render:function() {
                setTimeout(function() {
                    renderAppActivityList();
                }, 0);
                this.$el.html(this.template());
                return this;
            }
        });
        /**个人中心页面**/
        var PersonView = View.extend({
            template:_.template($("#person-template").html()),
            initialize:function() {
                $("body").css("background", "#fff");
                hideNavigation();
                this.router = this.options.router;
                globle_router = this.router;
                page_name = "activity";
                page_init();
            },
            events:{
                "tap .last":"goBack",
                "tap .person_menu":"viewActivity"
            },
            goBack:function(event) {
                $("body").css("background", "#eee");
                getBackHtml(event);
            },
            viewActivity:function(event) {
                $("body").css("background", "#eee");
                var title = event.target.title;
                this.router.navigate(event.target.title, {
                    trigger:true
                });
            },
            render:function() {
                this.$el.html(this.template());
                return this;
            }
        });
        /*游戏活动页*/
        var AppActivityView = View.extend({
            template:_.template($("#app_activity-template").html()),
            initialize:function() {
                hideNavigation();
                this.router = this.options.router;
                globle_router = this.router;
                page_name = "app_activity";
                page_init();
            },
            events:{
                "tap .last":"goBack",
                "tap .button":"download",
                "tap .activity_li":"viewActivity"
            },
            goBack:function(event) {
                getBackHtml(event);
            },
            download:function(event) {
                download_app(event.target.id);
            },
            viewActivity:function(event) {
                var title = event.target.title;
                goActivity(this.router, event.target.title);
            },
            render:function() {
                var key = window.location.href.split("#")[1].split("/")[1];
                setTimeout(function() {
                    renderAppActivity(key);
                }, 0);
                this.$el.html(this.template());
                return this;
            }
        });
        /**专题列表页**/
        var TopicListView = View.extend({
            template:_.template($("#topic_list-template").html()),
            initialize:function() {
                hideNavigation();
                this.router = this.options.router;
                globle_router = this.router;
                page_name = "topic_list";
                page_init(true);
                _loadComplete(page_name);
            },
            events:{
                "tap .last":"goBack",
                "tap .topic_li":"viewTopic",
                "tap .at_last":"viewClassification"
            },
            goBack:function(event) {
                getBackHtml(event);
            },
            viewTopic:function(event) {
                this.router.navigate("topic/" + event.target.title, {
                    trigger:true
                });
            },
            viewClassification:function(event) {
                goClassification(this.router);
                current_native_id = "classifications";
            },
            render:function() {
                setTimeout(function() {
                    renderTopicList();
                }, 0);
                this.$el.html(this.template());
                return this;
            }
        });
        /**专题内容页**/
        var TopicView = View.extend({
            template:_.template($("#topic-template").html()),
            initialize:function() {
                hideNavigation();
                this.router = this.options.router;
                globle_router = this.router;
                page_name = "topic";
                page_init(true);
                globle_topic_id = window.location.href.split("#")[1].split("/")[1];
                _loadComplete(page_name);
            },
            events:{
                "tap .last":"goBack",
                "tap .download_button":"download",
                "tap .at_last":"viewClassification",
                "tap .label":"viewSubClassification",
                "tap .detailView":"viewDetail"
            },
            viewClassification:function(event) {
                goClassification(this.router);
                current_native_id = "classifications";
            },
            viewDetail:function(event) {
                this.router.navigate("detail/" + event.target.title, {
                    trigger:true
                });
            },
            viewSubClassification:function(event) {
                this.router.navigate("subClassification/" + event.target.title, {
                    trigger:true
                });
            },
            goBack:function(event) {
                getBackHtml(event);
            },
            download:function(event) {
                download_app(event.target.id);
            },
            render:function() {
                setTimeout(function() {
                    renderTopicDetail();
                }, 0);
                this.$el.html(this.template());
                return this;
            }
        });
        /**详情页礼包列表**/
        var DetailGiftView = View.extend({
            template:_.template($("#detail_gift-template").html()),
            initialize:function() {
                this.router = this.options.router;
                globle_router = this.router;
                hideNavigation();
                page_name = "detail_gift";
                page_init();
            },
            events:{
                "tap .last":"goBack",
                "tap .detailView":"viewDetail",
                "tap .gift_li":"toggleGiftInfo",
                "tap .rule":"viewRule",
                "tap .gift_button":"getGiftCard",
                "tap .button":"download"
            },
            goBack:function(event) {
                getBackHtml(event);
            },
            viewDetail:function(event) {
                this.router.navigate("detail/" + event.target.title, {
                    trigger:true
                });
            },
            viewRule:function(event) {
                this.router.navigate("rule/2", {
                    trigger:true
                });
            },
            toggleGiftInfo:function(event) {
                $("#detail_" + event.target.title).toggle();
            },
            getGiftCard:function(event) {
                getAppGift(event.target.id);
            },
            download:function(event) {
                download_app(event.target.id);
            },
            render:function() {
                var key = window.location.href.split("#")[1].split("/")[1];
                var view = this;
                var router = this.options.router;
                setTimeout(function() {
                    renderDetailGift(key, router);
                }, 0);
                this.$el.html(this.template());
                return this;
            }
        });
        /**用户奖品记录列表**/
        var prizeView = View.extend({
            template:_.template($("#prize-template").html()),
            initialize:function() {
                hideNavigation();
                this.router = this.options.router;
                globle_router = this.router;
                page_name = "prize";
                page_init(true);
                _loadComplete(page_name);
            },
            events:{
                "tap .last":"goBack",
                "tap .rule":"viewRule",
                "tap .add_gift_button":"addGift",
                "tap .gift_button":"getGiftCard",
                "tap .at_last":"viewClassification",
                "tap .gift_li":"toggleGiftInfo",
                "tap .detailView":"viewDetail"
            },
            goBack:function(event) {
                getBackHtml(event);
            },
            viewDetail:function(event) {
                this.router.navigate("detail/" + event.target.title, {
                    trigger:true
                });
            },
            viewRule:function(event) {
                this.router.navigate("rule/2", {
                    trigger:true
                });
            },
            addGift:function() {
                this.router.navigate("gift_list", {
                    trigger:true
                });
            },
            toggleGiftInfo:function(event) {
                $("#detail_" + event.target.title).toggle();
            },
            getGiftCard:function() {
                var card_code = $("#" + event.target.id + "_card").text();
                returnGiftCard(card_code);
            },
            viewClassification:function(event) {
                goClassification(this.router);
                current_native_id = "classifications";
            },
            render:function() {
                var router = this.options.router;
                setTimeout(function() {
                    renderPrize();
                }, 0);
                this.$el.html(this.template());
                return this;
            }
        });
        dolymood.App = Backbone.Router.extend({
            initialize:function(el) {
                this.el = el;
                this.positions = new PositionCollection();
            },
            routes:{
                "":"games",
                games:"games",
                applications:"applications",
                classifications:"classifications",
                ranking:"ranking",
                search:"search",
                "detail/:game_id":"detail",
                "subClassification/:classification_id":"subClassification",
                error:"error",
                feedback:"feedback",
                credit:"credit",
                "rule/:rule_id":"rule",
                my_game:"my_game",
                gift_list:"gift_list",
                activity:"activity",
                "detail_gift/:app_id":"detail_gift",
                prize:"prize",
                topic_list:"topic_list",
                "topic/:topic_id":"topic",
                "app_activity/:activity_id":"app_activity",
                person:"person"
            },
            games:function() {
                var router = this;
                this.clean();
                this.currentView = new GameListView({
                    collection:router.positions,
                    router:router
                }).render().$el.appendTo($(this.el));
                setTimeout(function() {
                    $(".m-carousel").carousel();
                }, 1e3);
            },
            applications:function() {
                var router = this;
                this.clean();
                this.currentView = new AppListView({
                    collection:router.positions,
                    router:router
                }).render().$el.appendTo($(this.el));
                setTimeout(function() {
                    $(".m-carousel").carousel();
                }, 1e3);
            },
            classifications:function() {
                var router = this;
                this.clean();
                this.currentView = new ClassificationListView({
                    collection:router.positions,
                    router:router
                }).render().$el.appendTo($(this.el));
                setTimeout(function() {
                    $(".m-carousel").carousel();
                }, 1e3);
            },
            ranking:function() {
                var router = this;
                this.clean();
                this.currentView = new RankingView({
                    collection:router.positions,
                    router:router
                }).render().$el.appendTo($(this.el));
            },
            search:function() {
                var router = this;
                this.clean();
                this.currentView = new SearchView({
                    collection:router.positions,
                    router:router
                }).render().$el.appendTo($(this.el));
            },
            subClassification:function(classification_id) {
                var router = this;
                this.clean();
                this.currentView = new SubClassificationView({
                    collection:router.positions,
                    router:router
                }).render().$el.appendTo($(this.el));
            },
            detail:function(game_id) {
            	detail_game_id = game_id;
                var router = this;
                this.clean();
                this.currentView = new DetailView({
                    collection:router.positions,
                    router:router
                }).render().$el.appendTo($(this.el));
            },
            error:function() {
                var router = this;
                this.clean();
                this.currentView = new ErrorView({
                    collection:router.positions,
                    router:router
                }).render().$el.appendTo($(this.el));
            },
            rule:function() {
                var router = this;
                this.clean();
                this.currentView = new RuleView({
                    collection:router.positions,
                    router:router
                }).render().$el.appendTo($(this.el));
            },
            feedback:function() {
                var router = this;
                this.clean();
                this.currentView = new FeedbackView({
                    collection:router.positions,
                    router:router
                }).render().$el.appendTo($(this.el));
            },
            credit:function() {
                var router = this;
                this.clean();
                this.currentView = new CreditView({
                    collection:router.positions,
                    router:router
                }).render().$el.appendTo($(this.el));
            },
            my_game:function() {
                var router = this;
                this.clean();
                this.currentView = new MyGameView({
                    collection:router.positions,
                    router:router
                }).render().$el.appendTo($(this.el));
            },
            gift_list:function(app_id) {
                var router = this;
                this.clean();
                this.currentView = new GiftListView({
                    collection:router.positions,
                    router:router
                }).render().$el.appendTo($(this.el));
            },
            activity:function() {
                var router = this;
                this.clean();
                this.currentView = new ActivityView({
                    collection:router.positions,
                    router:router
                }).render().$el.appendTo($(this.el));
            },
            detail_gift:function() {
                var router = this;
                this.clean();
                this.currentView = new DetailGiftView({
                    collection:router.positions,
                    router:router
                }).render().$el.appendTo($(this.el));
            },
            prize:function() {
                var router = this;
                this.clean();
                this.currentView = new prizeView({
                    collection:router.positions,
                    router:router
                }).render().$el.appendTo($(this.el));
            },
            topic_list:function() {
                var router = this;
                this.clean();
                this.currentView = new TopicListView({
                    collection:router.positions,
                    router:router
                }).render().$el.appendTo($(this.el));
            },
            topic:function(topic_id) {
                var router = this;
                this.clean();
                this.currentView = new TopicView({
                    collection:router.positions,
                    router:router
                }).render().$el.appendTo($(this.el));
            },
            app_activity:function(activity_id) {
                var router = this;
                this.clean();
                this.currentView = new AppActivityView({
                    collection:router.positions,
                    router:router
                }).render().$el.appendTo($(this.el));
            },
            person:function() {
                var router = this;
                this.clean();
                this.currentView = new PersonView({
                    collection:router.positions,
                    router:router
                }).render().$el.appendTo($(this.el));
            },
            clean:function() {
                if (this.currentView) {
                    this.currentView.remove();
                    this.currentView = null;
                }
            }
        });
    })(dolymood);
    new dolymood.App("body");
    Backbone.history.start();
});

function getLoadingHtml(id) {
    var html = "<li class='list_view_li loading' style='maring-top:10px;background:#fff;text-align:center;padding:0px;color:#87CEFA;font-size:12px;font-weight:normal;'><div class='loading_img'></div></li>";
    $("#" + id).append(html);
}

/***************************************************************新版游戏中心*********************************************************/
/*反馈页面*/
function checkFeedBackInfo(router) {
    if ($("#submit").attr("_dis") != "only") {
        if ($("#problem_text").val().trim() == "" || $("#problem_text").val().trim() == "请输入内容") {
            alertMsg("问题描述不能为空");
            return false;
        } else if ($("#problem_text").val().length < 15) {
            alertMsg("问题描述不能少于15个字");
            return false;
        } else if ($("#phone_num").val().trim() == "" || $("#phone_num").val().trim() == "手机/qq/微信") {
            alertMsg("联系方式不能为空");
            return false;
        }
        $("#submit").css("background", "#c2e6ba");
        $("#submit").attr("_dis", "only");
        postProblemInfo(router);
    }
}

function postProblemInfo(router) {
    var feedback_content = $("#problem_text").val();
    var contact_information = $("#phone_num").val();
    var url = interface_host + "/h5/user_feedback?imei=" + imei + "&feedback_content=" + feedback_content + "&contact_information=" + contact_information;
    $.ajax({
        type:"GET",
        url:url,
        dataType:"jsonp",
        success:function(result) {
            alertMsg("提交成功");
            $("#submit").css("background", "#f86400");
            $("#submit").removeAttr("_dis");
            router.navigate("games", {
                trigger:true
            });
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            alertMsg("提交失败，请稍后再试");
            $("#submit").css("background", "#f86400");
            $("#submit").removeAttr("_dis");
        }
    });
}

function renderCredit(router) {
    var url = interface_host + "/h5/record?imei=" + imei + "&type=1";
    $.ajax({
        type:"GET",
        url:url,
        dataType:"jsonp",
        jsonp:"callbackparam",
        //服务端用于接收callback调用的function名的参数
        success:function(data) {
            var record_html = "";
            if (data.retCode == "200") {
                credit = data.total_credit;
                $("#total_credit").html(credit);
                record_html = getCreditRecordHtml(data, record_html);
            }
            if (isNewFunshionApp()) {
                if (credit > 0) {
                    record_html += "<li class='record' style='background:#eee;border:0px;'><div class='credit_history end_font'>查看历史记录 >></div></li>";
                }
            } else {
                record_html += "<li class='record' style='background:#eee;border:0px;'><div class='end_font'><p>金币规则只适用于新版风行视频安卓客户端</p><p>请安装或升级</p></div></li>";
            }
            $("#list_view").append(record_html);
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("credit data is error");
            router.navigate("error", {
                trigger:true
            });
        }
    });
}

function renderHistoryCredit(router) {
    var url = interface_host + "/h5/history_record?imei=" + imei + "&type=1";
    $.ajax({
        type:"GET",
        url:url,
        dataType:"jsonp",
        jsonp:"callbackparam",
        //服务端用于接收callback调用的function名的参数
        success:function(data) {
            var record_html = "";
            if (data.retCode == "200") {
                record_html = getCreditRecordHtml(data, record_html);
            }
            if (data.is_end == "true") {
                record_html += getFunshionEnd();
                the_end = true;
            }
            $("#list_view").html(record_html);
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("credit data is error");
            router.navigate("error", {
                trigger:true
            });
        }
    });
}

function getCreditRecordHtml(data, record_html) {
    credit_records = data.credit_records;
    $.each(credit_records, function(n, value) {
        record_html += "<li class='record'><div class='credit_message'>" + value.message + "</div><div class='credit_date'>" + value.date + "</div><div class='app_credit'>" + value.credit + "</div></li>";
    });
    return record_html;
}

function goSubMenume(router, target_id) {
    if (target_id == "my_game") {
        if (typeof Android != "undefined" && isNewFunshionApp()) {
            router.navigate(target_id, {
                trigger:true
            });
        } else {
            router.navigate("subClassification/" + my_game_tag_id, {
                trigger:true
            });
        }
    } else {
        router.navigate(target_id, {
            trigger:true
        });
    }
}

function isNewFunshionApp() {
    if (intCurrentVersion >= intFunshionVersion || funshionBetaVersion.in_array(version)) {
        return true;
    }
    return false;
}

Array.prototype.S = String.fromCharCode(2);

Array.prototype.in_array = function(e) {
    var r = new RegExp(this.S + e + this.S);
    return r.test(this.S + this.join(this.S) + this.S);
};

function getInstalledAppList() {
    //加载我的app列表
    if (typeof Android != "undefined") {
        var installed_app_info = JSON.parse(Android.getAllInstalledApp());
        var installed_app_list = installed_app_info.app_list;
        if (installed_app_list.length > 0) {
            $("#installed_app_list").addClass("my_game_position");
        }
        for (var i = 0; i < installed_app_list.length; i++) {
            var app_icon = installed_app_list[i].app_icon;
            var app_id = installed_app_list[i].app_id;
            var installed_app_html = "<li class='installed_app_li' ><img title='" + installed_app_list[i].app_id + "' id='installed_" + installed_app_list[i].app_id + "' class='installed_app_img quick_start' src='" + app_icon + "'/></li>";
            $("#installed_app_list").append(installed_app_html);
        }
    }
}

/*提示框*/
function alertMsg(msg, mode) {
    //mode为空，即只有一个确认按钮，mode为1时有确认和取消两个按钮
    msg = msg || "";
    mode = mode || 0;
    var top = document.body.scrollTop || document.documentElement.scrollTop;
    var isIe = document.all ? true :false;
    var isIE6 = isIe && !window.XMLHttpRequest;
    var sTop = document.documentElement.scrollTop || document.body.scrollTop;
    var sLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
    var winSize = function() {
        var xScroll, yScroll, windowWidth, windowHeight, pageWidth, pageHeight;
        // innerHeight获取的是可视窗口的高度，IE不支持此属性
        if (window.innerHeight && window.scrollMaxY) {
            xScroll = document.body.scrollWidth;
            yScroll = window.innerHeight + window.scrollMaxY;
        } else if (document.body.scrollHeight > document.body.offsetHeight) {
            // all but Explorer Mac
            xScroll = document.body.scrollWidth;
            yScroll = document.body.scrollHeight;
        } else {
            // Explorer Mac...would also work in Explorer 6 Strict, Mozilla and Safari
            xScroll = document.body.offsetWidth;
            yScroll = document.body.offsetHeight;
        }
        if (self.innerHeight) {
            // all except Explorer
            windowWidth = self.innerWidth;
            windowHeight = self.innerHeight;
        } else if (document.documentElement && document.documentElement.clientHeight) {
            // Explorer 6 Strict Mode
            windowWidth = document.documentElement.clientWidth;
            windowHeight = document.documentElement.clientHeight;
        } else if (document.body) {
            // other Explorers
            windowWidth = document.body.clientWidth;
            windowHeight = document.body.clientHeight;
        }
        // for small pages with total height less then height of the viewport
        if (yScroll < windowHeight) {
            pageHeight = windowHeight;
        } else {
            pageHeight = yScroll;
        }
        // for small pages with total width less then width of the viewport
        if (xScroll < windowWidth) {
            pageWidth = windowWidth;
        } else {
            pageWidth = xScroll;
        }
        return {
            pageWidth:pageWidth,
            pageHeight:pageHeight,
            windowWidth:windowWidth,
            windowHeight:windowHeight
        };
    }();
    //alert(winSize.pageWidth);
    //遮罩层
    var styleStr = "top:0;left:0;position:absolute;z-index:10000;background:#666;width:" + winSize.pageWidth + "px;height:" + (winSize.pageHeight + 30) + "px;";
    styleStr += isIe ? "filter:alpha(opacity=80);" :"opacity:0.8;";
    //遮罩层DIV
    var shadowDiv = document.createElement("div");
    //添加阴影DIV
    shadowDiv.style.cssText = styleStr;
    //添加样式
    shadowDiv.id = "shadowDiv";
    //如果是IE6则创建IFRAME遮罩SELECT
    if (isIE6) {
        var maskIframe = document.createElement("iframe");
        maskIframe.style.cssText = "width:" + winSize.pageWidth + "px;height:" + (winSize.pageHeight + 30) + "px;position:absolute;visibility:inherit;z-index:-1;filter:alpha(opacity=0);";
        maskIframe.frameborder = 0;
        maskIframe.src = "about:blank";
        shadowDiv.appendChild(maskIframe);
    }
    document.body.insertBefore(shadowDiv, document.body.firstChild);
    //遮罩层加入文档
    //弹出框
    var styleStr1 = "display:block;position:fixed;_position:absolute;left:20%;top:" + (winSize.windowHeight / 2 - 150) + "px;_top:" + (winSize.windowHeight / 2 + top - 150) + "px;";
    //弹出框的位置
    var alertBox = document.createElement("div");
    alertBox.id = "alertMsg";
    alertBox.style.cssText = styleStr1;
    //创建弹出框里面的内容P标签
    var alertMsg_info = document.createElement("P");
    alertMsg_info.id = "alertMsg_info";
    alertMsg_info.innerHTML = msg;
    alertBox.appendChild(alertMsg_info);
    //创建按钮
    var btn1 = document.createElement("a");
    btn1.id = "alertMsg_btn1";
    btn1.className = "alertMsg_btn";
    btn1.href = "javas" + "cript:void(0)";
    btn1.innerHTML = "确    定";
    btn1.onclick = function() {
        document.body.removeChild(alertBox);
        document.body.removeChild(shadowDiv);
        return true;
    };
    alertBox.appendChild(btn1);
    if (mode === 1) {
        var btn2 = document.createElement("a");
        btn2.id = "alertMsg_btn2";
        btn2.className = "alertMsg_btn copy_chose_btn";
        btn2.href = "javas" + "cript:void(0)";
        btn2.innerHTML = "复制礼包码";
        btn2.onclick = function() {
            var card_code = msg.split("<br><br>")[1];
            choseCopyCode(card_code);
            return true;
        };
        alertBox.appendChild(btn2);
    }
    document.body.appendChild(alertBox);
}

/**选中要复制的礼包码**/
function choseCopyCode(card_code) {
    try {
        if (typeof Android != "undefined") {
            var message = "";
            var flag = Android.saveToClipBoard(card_code);
            if (flag) {
                message = "复制礼包码成功！";
            } else {
                message = "复制礼包码失败！";
            }
            Android.showToast(message, true);
        }
    } catch (e) {}
}

function getFunshionEnd(is_bottom) {
    if (is_bottom) {
        html = "<div class='end_title end_position'><div class='end_image'></div></div>";
    } else {
        html = "<div class='end_title'><div class='end_image'></div></div>";
    }
    return html;
}

/***礼包相关页面***/
function renderGiftList(page) {
    var page = arguments[0] || 1;
    var url = interface_host + "/h5/gift_info?page=" + page;
    $.ajax({
        type:"GET",
        url:url,
        dataType:"jsonp",
        jsonp:"callbackparam",
        //服务端用于接收callback调用的function名的参数
        success:function(data) {
            var record_html = "";
            if (data.retCode == "200") {
                record_html = getGiftListHtml(data);
            }
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("gift_list data is error");
        }
    });
}

function getGiftListHtml(data) {
    $(".loading").remove();
    var type = arguments[1] || "gift_list";
    var item_html = "";
    $.each(data.gift_infos, function(n, value) {
        item_html += "<li title='" + value.app_id + "' class='list_view_li gift_app_li detailView'><div title='" + value.app_id + "' class='list_view_area clear'><div title='" + value.app_id + "' class='side-left'>" + "<img class='list_view_img detail_icon_img' title='" + value.app_id + "' src='" + value.thumbnail_url + "' onerror=\"this.src='img/nofound.png'\">" + "<h2 title='" + value.app_id + "' class='gift_app_name game_name'>" + value.app_name + "</h2></div></li>";
        if (type == "gift_list") {
            item_html = getAppGiftListHtml(value, item_html);
        } else {
            item_html = getAppGiftRecordHtml(value, item_html);
        }
    });
    $("#gift_list_view").append(item_html);
    isEnd(data.is_end, "gift_list_view");
}

function getAppGiftListHtml(app_gift_info, item_html) {
    $.each(app_gift_info.gift_list, function(n, gift_item) {
        var button_html = "";
        if (gift_item.is_empty == 1) {
            button_html = "<button id='gift" + gift_item.gift_id + "_" + app_gift_info.app_id + "' class='empty_button gitf_button_position'>领光</button></li>";
        } else {
            button_html = "<button id='gift" + gift_item.gift_id + "_" + app_gift_info.app_id + "' class='download_button gift_button gitf_button_position'>领取</button></li>";
        }
        var gift_detail_html = getGiftDetailHtml(gift_item);
        item_html += "<li title='" + gift_item.gift_id + "' class='list_view_li gift_li'><div title='" + gift_item.gift_id + "' class='list_view_area clear'><div title='" + gift_item.gift_id + "' class='side-left moreView'>" + "<img title='" + gift_item.gift_id + "' class='gift_icon_img gift_icon_position' src='" + gift_item.gift_img + "' onerror=\"this.src='img/gift_nofound.png'\">" + "<h2 title='" + gift_item.gift_id + "' class='game_name gift_name'>" + gift_item.gift_name + "</h2><h2 title='" + gift_item.gift_id + "'class='game_name gift_summary_titie'>" + gift_item.summary + "</h2></div>" + button_html + gift_detail_html;
    });
    app_gift_info.gift_list = [];
    app_dict[app_gift_info.app_id] = app_gift_info;
    return item_html;
}

function getAppGiftRecordHtml(app_gift_info, item_html) {
    $.each(app_gift_info.gift_list, function(n, gift_item) {
        var button_html = "";
        if (gift_item.overdue == 1) {
            button_html = "<button id='" + gift_item.gift_id + "' class='empty_button gitf_button_position'>过期</button></li>";
        } else {
            button_html = "<button id='" + gift_item.gift_id + "' class='download_button gift_button gitf_button_position'>使用</button></li>";
        }
        var gift_detail_html = getGiftDetailHtml(gift_item);
        item_html += "<li title='" + gift_item.gift_id + "' class='list_view_li gift_li'><div title='" + gift_item.gift_id + "' class='list_view_area clear'><div title='" + gift_item.gift_id + "' class='side-left moreView'>" + "<h2 title='" + gift_item.gift_id + "' class='game_name gift_name'>" + gift_item.gift_name + "</h2><h2 title='" + gift_item.gift_id + "'class='game_name gift_record_titie'>礼包编码: <span title='" + gift_item.gift_id + "' id='" + gift_item.gift_id + "_card' >" + gift_item.card_code + "</span></h2>" + "<h2 title='" + gift_item.gift_id + "'class='game_name gift_record_titie'>兑换日期: " + gift_item.begin_time + "到" + gift_item.end_time + "</h2></div>" + button_html + gift_detail_html;
    });
    app_gift_info.gift_list = [];
    app_dict[app_gift_info.app_id] = app_gift_info;
    return item_html;
}

function getGiftDetailHtml(gift_item) {
    var html = "<div id='detail_" + gift_item.gift_id + "'class='gift_more' style='display:none'><div class='gift_info_item'><div class='gift_info_title'> 礼包内容</div><div class='gift_info_content'>" + gift_item.summary + "</div></div>" + "<div class='gift_info_item'><div class='gift_info_title'>兑换日期</div>" + "<div class='gift_info_content'>" + gift_item.begin_time + "到" + gift_item.end_time + "</div></div>" + "<div class='gift_info_item'><div class='gift_info_title'>使用条件</div><div class='gift_info_content'>" + gift_item.use_condition + "</div></div>" + "<div class='gift_info_item'><div class='gift_info_title'>使用方法</div><div class='gift_info_content'>" + gift_item.use_method + "</div></div></div>";
    return html;
}

function getAppGift(button_id) {
    var button_array = button_id.split("_");
    var gift_id = button_array[0].replace("gift", "");
    var app_id = button_array[1];
    if (typeof Android == "undefined" || !isNewFunshionApp()) {
        alertMsg("礼包规则只适用于新版风行视频请安装或升级安卓客户端!");
    } else {
        app_status = checkAppStatus(app_id);
        app_dict[app_id]["app_download_url_md5"] = "";
        app_dict[app_id]["detail_link"] = app_dict[app_id]["app_score"];
        var paramJsonString = JSON.stringify(app_dict[app_id]);
        if (app_status == "installing_finished" || app_status == "installed_has_update") {
            //领取礼包
            getGiftCard(gift_id, button_id);
        } else {
            if (app_status == "not_installed") {
                //下载对应app
                Android.addDownloadTask(paramJsonString);
            } else if (app_status == "downloading_finished") {
                //安装对应app
                Android.installApp(paramJsonString);
            } else if (app_status == "downloading_failed") {
                //重新下载app
                Android.restartDownloadTask(paramJsonString);
            }
            alertMsg(" 亲，已经自动为您下载游戏！ 安装成功后即可领取礼包");
        }
    }
}

/**检查对应活动的app状态**/
function checkAppStatus(app_id) {
    var app_list = Array();
    app_list.push('{"app_id":"' + app_dict[app_id].app_id + '", "app_version":"' + app_dict[app_id].app_version + '"}');
    var app_json_list = '{"number": "' + app_list.length + '", "apps":[' + app_list.join(",") + "]}";
    var result = Android.queryTaskInfo(app_json_list);
    if (result != "") {
        var json = JSON.parse(result);
        return json.apps[0].status;
    }
}

/**跳转对应的活动页面**/
function goActivity(router, activity_id) {
    if (activity_id) {
        router.navigate(activity_id, {
            trigger:true
        });
    }
}

/**获取礼包编码**/
function getGiftCard(gift_id, button_id) {
    var url = interface_host + "/h5/gift_card?gift_id=" + gift_id + "&imei=" + imei;
    $.ajax({
        type:"GET",
        url:url,
        dataType:"jsonp",
        jsonp:"callbackparam",
        //服务端用于接收callback调用的function名的参数
        success:function(data) {
            if (data.retCode == "200") {
                $("#" + button_id).css("color", "#fff");
                $("#" + button_id).css("background", "#f86400");
                $("#" + button_id).text("已领取");
                returnGiftCard(data.card_code);
            }
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("get card data is error");
        }
    });
}

/**返回获取到的礼包编码弹窗**/
function returnGiftCard(card_code) {
    if (intCurrentVersion >= giftFunshionVersion || giftFunshionBetaVersion.in_array(version)) {
        //判断指定版本，添加礼包复制功能
        alertMsg("礼包编码<br><br>" + card_code, 1);
    } else {
        alertMsg("礼包编码<br><br>" + card_code);
    }
}

/**获取详情页礼包入口信息**/
function getBriefGiftInfo(app_id) {
    var url = interface_host + "/h5/gift_info?type=detail_brief&app_id=" + app_id;
    $.ajax({
        type:"GET",
        url:url,
        dataType:"jsonp",
        jsonp:"callbackparam",
        //服务端用于接收callback调用的function名的参数
        success:function(data) {
            var gift_number = data.gift_list.length < 3 ? data.gift_list.length :3;
            if (data.retCode == "200" && gift_number > 0) {
                var gift_info_html = "";
                var gift_li_style_map = {
                    1:"width:100%",
                    2:"width:50%",
                    3:"width:33.3333333%"
                };
                var gift_li_style = gift_li_style_map[gift_number];
                var number = 1;
                $.each(data.gift_list, function(n, value) {
                    if (number <= 3) {
                        gift_info_html += "<li class='brief_gift_li' style='" + gift_li_style + "'><div title='" + value.app_id + "'><img class='gift_icon_img' src='" + value.gift_img + "' onerror=\"this.src='img/gift_nofound.png'\"></div>" + "<p>" + value.short_name + "</p></li>";
                    }
                    number++;
                });
                $("#gift_info").append(gift_info_html);
                $("#gift_list").show();
            }
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("get detail brief gift data is error");
        }
    });
}

/**渲染详情页的礼包列表页面**/
function renderDetailGift(app_id) {
    var url = interface_host + "/h5/gift_info?type=detail&app_id=" + app_id;
    $.ajax({
        type:"GET",
        url:url,
        dataType:"jsonp",
        jsonp:"callbackparam",
        //服务端用于接收callback调用的function名的参数
        success:function(data) {
            gift_number = data.gift_list.length;
            if (data.retCode == "200" && gift_number > 0) {
                try {
                    $("#game_title").append(data.app_name);
                    var headHtml = "<div class='detail_title_content'><div class='detail_icon'><img id='game_icon' class='detail_head_icon_img' src='" + gameInfo.thumbnail_url + "' onerror=\"this.src='img/nofound.png'\"/></div>" + "<p id='game_name' class='detail_game_name detail_title_font'>" + gameInfo.app_name + "</p>" + "<p class='detail_explain detail_title_font'>" + gameInfo.package_size + "|" + gameInfo.download_number + "次下载" + app_score + "</p>" + "<div style='margin-top:-2px'><span class='star'>" + star_num + "</span><span class='empty_star'>" + empty_star_num + "</span></div></div><img class='detail_background' src='img/detail_background1.png'/>";
                    $(".detail_info").append(headHtml);
                    var item_html = "";
                    item_html = getAppGiftListHtml(data, item_html);
                    $("#gift_list_view").append(item_html);
                    addBottomButton(data.app_id);
                } catch (e) {
                    console.log("detail gift list is error:" + e);
                }
            }
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("get detail brief gift data is error");
        }
    });
}

/**渲染我的礼包页面的礼包领取记录**/
function renderPrize(page) {
    var page = arguments[0] || 1;
    if (!isNewFunshionApp()) {
        renderBrowserPrize();
        return true;
    }
    var url = interface_host + "/h5/gift_user_record?imei=" + imei + "&page=" + page;
    $.ajax({
        type:"GET",
        url:url,
        dataType:"jsonp",
        jsonp:"callbackparam",
        //服务端用于接收callback调用的function名的参数
        success:function(data) {
            gift_number = data.gift_infos.length;
            if (data.retCode == "200") {
                try {
                    $(".loading").remove();
                    if (gift_number == 0) {
                        renderEmptyPrize();
                    } else {
                        $(".empty_prize_area").hide();
                        $("#total_gift").empty();
                        $("#total_gift").append(data.total_gift + "个");
                        getGiftListHtml(data, "record_list");
                    }
                } catch (e) {
                    console.log("gift record list is error:" + e);
                }
            }
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("gift record list data is error");
            renderEmptyPrize();
        }
    });
}

/**用户记录为空**/
function renderEmptyPrize() {
    $("#total_gift").empty();
    $("#total_gift").append("0个");
    $("#gift_list_view").empty();
    $(".empty_prize_area").show();
}

function renderBrowserPrize() {
    //浏览器或者没有获取到imei的app，显示为空页面
    $("#total_gift").append("0个");
    var record_html = "<li class='record' style='background:#eee;border:0px;'><div class='end_font'><p>礼包规则只适用于新版风行视频安卓客户端</p><p>请安装或升级</p></div></li>";
    $("#gift_list_view").append(record_html);
}

/**渲染专题列表页面**/
function renderTopicList(page) {
    var page = arguments[0] || 1;
    var url = interface_host + "/h5/topic_list?page=" + page;
    $.ajax({
        type:"GET",
        url:url,
        dataType:"jsonp",
        jsonp:"callbackparam",
        //服务端用于接收callback调用的function名的参数
        success:function(data) {
            if (data.retCode == "200" && data.total_number > 0) {
                $(".loading").remove();
                var topic_li_html = "";
                var number = (page - 1) * 10;
                $.each(data.topic_list, function(n, value) {
                    var id_number = number + n;
                    var title = "title='" + value.option_id + "'";
                    topic_li_html += "<li class='topic_li' " + title + "><div " + title + " class='recommend_title topic_title'>" + value.option_name + "</div>" + "<img id='default_topic_img_" + id_number + "' " + title + " class='topic_logo' src='img/default_topic.png'/>" + "<img id='topic_img_" + id_number + "' " + title + " class='topic_logo' src='" + value.option_logo + "' style='display:none' " + " onerror=\"this.src='img/default_topic.png'\" onload=\"$('#default_topic_img_" + id_number + "').hide();$('#topic_img_" + id_number + "').show();\"/></li>";
                });
                $("#topic_list").append(topic_li_html);
                isEnd(data.is_end, "topic_list");
                needtorefresh = true;
            }
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("get topic list data is error");
        }
    });
}

function isEnd(is_end, ul_id) {
    if (is_end == "true") {
        the_end = true;
        getEndHtml(ul_id);
    } else {
        getLoadingHtml(ul_id);
    }
}

/**设置分页的页面初始化**/
function page_init(paging_flag) {
    var paging_flag = arguments[0] || false;
    if (paging_flag) {
        counter = 2;
        the_end = false;
        needtorefresh = true;
    } else {
        the_end = true;
    }
    app_dict = {};
    report_pv_vv_to_sjy();
}

/**渲染专题内容页面**/
function renderTopicDetail(page) {
    var page = arguments[0] || 1;
    var url = interface_host + "/h5/topic_detail?topic_id=" + globle_topic_id + "&page=" + page;
    $.ajax({
        type:"GET",
        url:url,
        dataType:"jsonp",
        jsonp:"callbackparam",
        //服务端用于接收callback调用的function名的参数
        success:function(data) {
            if (data.retCode == "200") {
                $(".loading").remove();
                if (page == 1) {
                    $("#header_title").append(data.option_name);
                    renderImgIntroModel(data.option_logo, data.option_intro);
                }
                if (data.show_type == 1) {
                    /**渲染简单版专题内容页面**/
                    $("#topic_app_list").css("margin-top", "10px");
                    getSubClassificationHtml(data.app_list, "topic_app_list");
                } else {
                    $("#topic_app_list").css("margin-top", "0px");
                    renderComplexTopicDetail(data);
                }
                isEnd(data.is_end, "topic_app_list");
                needtorefresh = true;
            }
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("get topic detail data is error");
            globle_router.navigate("error", {
                trigger:true
            });
        }
    });
}

/**渲染简单版专题内容页面**/
function renderComplexTopicDetail(data) {
    var li_html = "";
    $.each(data.sub_model_list, function(n, value) {
        li_html += "<div class='sub_model clear'><div class='sub_model_title_img'><div class='sub_model_title'>" + value.option_name + "</div></div>" + "<pre class='topic_intro sub_model_intro'>" + value.option_intro + "</pre><ul class='sub_model_app_list clear'>";
        $.each(value.app_list, function(n, app_info) {
            app_dict[app_info["app_id"]] = app_info;
            li_html += "<li class='topic_recommend_li'><img class='content_list_img detailView' title='" + app_info["app_id"] + "' src='" + app_info["thumbnail_url"] + "' onerror=\"this.src='img/nofound.png'\" /><div class='game_name sub_model_app_position'>" + app_info["app_name"] + "</div><div id='download_" + app_info["app_id"] + "' class='download_button sub_model_app_position'>下载</div></li>";
        });
        li_html += "</ul></div>";
    });
    $("#topic_app_list").append(li_html);
}

/**渲染活动页的游戏活动**/
function renderAppActivityList(content_id, activity_id) {
    var content_id = arguments[0] || "activity_list_view";
    var activity_id = arguments[1] || "";
    var url = interface_host + "/h5/app_activity_list";
    $.ajax({
        type:"GET",
        url:url,
        dataType:"jsonp",
        jsonp:"callbackparam",
        //服务端用于接收callback调用的function名的参数
        success:function(data) {
            if (data.retCode == "200") {
                var li_html = "";
                var number = 0;
                $.each(data.app_activity_list, function(n, value) {
                    if (value.activity_id == activity_id) return true;
                    if (activity_id && number == 4) return false;
                    number += 1;
                    var title = "title='app_activity/" + value.activity_id + "'";
                    li_html += "<li class='activity_li' " + title + ">";
                    if (value.subscript == "hot") {
                        li_html += "<div  class='hot_pic' " + title + "></div>";
                    }
                    if (value.subscript == "new") {
                        li_html += "<div  class='new_pic' " + title + "></div>";
                    }
                    li_html += "<div class='activity_area' " + title + "><div class='activity_default_img' " + title + "><img " + title + " class='activity_item' src='" + value.list_img + "' onerror=\"this.src='img/activity_nofound.png'\" onload=\"loadedImg('activity_area')\"></div>" + value.activity_name + "</div></li>";
                });
                $("#" + content_id).append(li_html);
            }
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("get topic detail data is error");
        }
    });
}

/**渲染游戏活动详情页**/
function renderAppActivity(activity_id) {
    var url = interface_host + "/h5/app_activity?activity_id=" + activity_id;
    $.ajax({
        type:"GET",
        url:url,
        dataType:"jsonp",
        jsonp:"callbackparam",
        //服务端用于接收callback调用的function名的参数
        success:function(data) {
            if (data.retCode == "200") {
                var app_id = data.app_info[0]["app_id"];
                app_dict[app_id] = data.app_info[0];
                var activity_info = data.app_activity_info;
                $("#header_title").append(activity_info.activity_name);
                renderImgIntroModel(activity_info.detail_img, "参加活动，领取奖品");
                var activity_intro = activity_info.activity_intro;
                $.each(activity_info.activity_intro, function(n, value) {
                    var intro_item_html = "<div class='detail'><div class='title_font'>" + value.title + "</div><div class='detail_content_positon'><pre>" + value.info + "</pre></div></div>";
                    $(".content").append(intro_item_html);
                });
                var relation_activity_list_html = "<div class='detail' style='margin-bottom:70px'><div class='title_font'>" + "其他游戏活动</div><div id='relation_activity_list'class='detail_content_positon'></div></div>";
                $(".content").append(relation_activity_list_html);
                renderAppActivityList("relation_activity_list", activity_id);
                addBottomButton(app_id, "下载游戏，参加活动");
            }
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("get topic detail data is error");
            globle_router.navigate("error", {
                trigger:true
            });
        }
    });
}

/**渲染图文介绍版块**/
function renderImgIntroModel(img, intro) {
    var topic_info_html = "<div class='topic_li'>" + "<img id='default_topic_img' class='topic_logo' src='img/default_topic.png'/>" + "<img id='topic_img' class='topic_logo' src='" + img + "' style='display:none' " + "onerror=\"this.src='img/default_topic.png'\" " + "onload=\"$('#default_topic_img').hide();$('#topic_img').show();\"/><pre class='topic_intro'>" + intro + "</pre></div>";
    $("#topic_info").html(topic_info_html);
}

/**获取详情页入口信息**/
function getAppActivityEntry(app_id) {
    var url = interface_host + "/h5/app_activity?app_id=" + app_id;
    $.ajax({
        type:"GET",
        url:url,
        dataType:"jsonp",
        jsonp:"callbackparam",
        //服务端用于接收callback调用的function名的参数
        success:function(data) {
            if (data.retCode == "200" && data.app_detail_img) {
                var html = "<img id='default_activity_img' title='" + data.activity_id + "' class='topic_logo'" + " src='img/default_topic.png'/><img id='activity_img' title='" + data.activity_id + "' class='topic_logo'" + " src='" + data.app_detail_img + "' style='display:none' onerror=\"this.src='img/default_topic.png'\"" + " onload=\"$('#default_activity_img').hide();$('#activity_img').show();\"/>";
                $("#app_activity").append(html);
                $("#app_activity").show();
                $("#app_activity").attr("title", data.activity_id);
                $("#app_activity_title").attr("title", data.activity_id);
            }
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("get app  data is error");
        }
    });
}

/*获取首页广告位*/
function getAdHtml(ad_id, div_id) {
    var url = "http://aa0.pub.funshion.com/interface/deliver?deliver_ver=v1&ap=" + ad_id;
    $.ajax({
        type:"GET",
        url:url,
        success:function(data) {
            try {
                var adInfo = data[0]["ad_list"][0];
                var imgUrl = adInfo["material"];
                var adLink = adInfo["link"];
                var html = "<a><img id='" + adLink + "' title='" + adInfo["monitor"]["click"][0]["url"] + "'class='ad_img' src='" + imgUrl + "'/></a>";
                $("#" + div_id).append(html);
                reportUrl(adInfo["monitor"]["view"][0]["url"]);
            } catch (e) {
                console.log("get ad data is error:" + e);
            }
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("get ad data is error");
        }
    });
}

/*上报url*/
function reportUrl(url) {
    $.ajax({
        type:"GET",
        url:url,
        success:function(data) {
            console.log("report ad data is success");
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("report ad data is error: " + url);
        }
    });
}