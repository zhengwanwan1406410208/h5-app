/**
 * @author swing
 * @data 2019-.3-05
 * 自定义模块 封装请求接口，返回数据解析，ajax请求
 */

layui.define(["layer", "jquery", "table", "laypage", "upload", "form"], function(exports) {
	$ = layui.jquery;
	table = layui.table;
	laypage = layui.laypage;
	upload = layui.upload;
	form = layui.form;
	var obj = {
		//将请求参数格式化成后端需要的数据格式(字符串形式)
		requestData: function(_data) {
			return JSON.stringify({
				requestBody: {
					data: _data
				}
			});
		},
		//将请求参数格式化成后端需要的数据格式(json形式)
		requestJsonData: function(_data) {
			return {
				requestBody: {
					data: _data
				}
			};
		},
		//获取令牌
		getToken: function(key) {
			var token;
			if (key != undefined) {
				token = get_address(key);
			}
			token = get_address("token");
			if (token == undefined || token == "") {
				top.location.href = '../login.html';
				return;
			}
			return token;
		},
		setToken: function(value) {
			set_address("token", value);
		},
		//获取表格所有选中的ID
		getSelectIds: function(checkStatus) {
			var selectClassId = [];
			for (var i = 0; i < checkStatus.data.length; i++) {
				selectClassId.push(checkStatus.data[i].id);
			}
			return selectClassId;
		},
		//生成资源超级链接
		getResourceUrl: function(resourceName) {
			//          return server + '/admin/file/dw?fileName=' + resourceName;
		},
		opendDialog: function(title, content, w, h) {
			if (title == null || title == "") {
				title = false;
			}
			if (w == null || w == "") {
				w = 800;
			}
			if (h == null || h == "") {
				h = $(window).height() - 50;
			}
			layer.open({
				type: 1,
				area: [w + "px", h + "px"],
				fix: true, //不固定
				maxmin: false,
				shadeClose: true,
				shade: 0.4,
				title: title,
				content: content
			});
			// 取消
			$("button:contains('取消')").on("click", function() {
				layer.closeAll();
				return false;
			});
		},
		opendDialogs: function(title, content, w, h) {
			if (title == null || title == "") {
				title = false;
			}
			if (w == null || w == "") {
				w = 800;
			}
			if (h == null || h == "") {
				h = $(window).height() - 50;
			}
			var index = layer.open({
				type: 1,
				area: [w + "px", h + "px"],
				fix: true, //不固定
				maxmin: false,
				shadeClose: false,
				resize: false,
				title: title,
				content: content,
				end: function() {
					$('.tabs').remove()
				}
			});
			// 取消
			$("button:contains('取消')").on("click", function() {
				layer.closeAll();
				return false;
			});
			return index;
		},
		//上传组件
		upload: function(options) {
			upload.render({
				elem: options.elem,
				url: server + options.url,
				auto: options.auto,
				accept: options.accept,
				exts: options.exts,
				multiple: options.multiline,
				headers: {
					authorization: this.getToken()
				},
				field: options.field,
				bindAction: options.bindAction,
				done: function(data) {
					if (options.done != undefined) {
						if (data.code == '200') {
							if (data.responseBody.code == '200') {
								if (options.done != undefined) {
									var responseData = data.responseBody.data;
									options.done(responseData);
								}
							} else {
								layer.msg(data.responseBody.message);
							}
						} else {
							layer.msg(data.message);
						}
					}
				},
				error: function(index, upload) {
					if (options.error != undefined) {
						options.error(index, upload);
					} else {
						layer.msg("网络错误");
						layer.closeAll();
					}
				}
			});
		},
		//全局异常处理的ajax请求
		post: function(options) {
			var requestToken = this.getToken();
			var postData = this.requestData(options.data);
			if (options.loading) {
				mui.showLoading();
			}
			$.ajax({
				url: get_address('ajaxUrl') + options.url,
				data: postData,
				type: "post",
				dataType: "json",
				async: options.async == undefined ? true : options.async,
				contentType: "application/json",
				headers: options.headers ? options.headers : {
					Accept: "application/json; charset=utf-8",
					authorization: requestToken
				},
				success: function(data) {
					if (options.loading) {
						mui.hideLoading();
					}
					if (data.code == '200') {
						if (data.responseBody.code == '200') {
							if (options.success != undefined) {
								var responseData = data.responseBody.data;
								options.success(responseData);
							}
						} else if (data.responseBody.code == '401' || data.code == '403') {
							top.location.href = '../login.html';
						} else {
							if (options.error != undefined) {
								options.error(data.responseBody.message);
							} else {
								layer.msg(data.responseBody.message);
							}
						}
					} else {
						layer.msg(data.message);
					}
				},
				//网络请求失败
				error: function(msg) {
					if (options.loading) {
						mui.hideLoading();
					}
					layer.msg(msg);
				}
			});
		},
		reloadTable: function(option) {
			table.reload(option.id, {
				where: this.requestJsonData(option.where)
			});
		},
		//重新封装table渲染方法
		randerTable: function(options) {
			table.render({
				elem: options.elem,
				toolbar: options.toolbar,
				skin: options.skin,
				even: options.even,
				title: options.title,
				limit: options.limit,
				id: options.id,
				url: get_address('ajaxUrl') + options.url,
				height: options.height,
				method: 'post',
				contentType: "application/json",
				headers: {
					Accept: "application/json; charset=utf-8",
					authorization: this.getToken()
				},
				//重新规定成功的状态码为 200，table 组件默认为 0
				response: {
					statusCode: 200
				},
				parseData: function(res) {
					return {
						//解析接口状态
						code: res.responseBody.code,
						//解析提示文本
						msg: res.responseBody.message,
						//解析数据长度
						count: res.responseBody.data.total ? res.responseBody.data.total : res.responseBody.data.length,
						//解析数据列表
						data: res.responseBody.data.list ? res.responseBody.data.list : res.responseBody.data,
						//当前页
						page: options.where.pageNum
					};
				},

				done: function(res, curr, count) {
					if (options.done != undefined) {
						options.done(res, curr, count);
					}
					//如果有分页
					if (options.pageid != undefined) {
						laypage.render({
							elem: options.pageid,
							count: count,
							limit: options.where.pageSize,
							theme: '#1E9FFF',
							limits: count > 10 ? [10, 30, 50, 70, 100] : [10],
							layout: options.layout == undefined ? ['prev', 'page', 'next'] : options.layout,
							curr: options.where.pageNum,
							jump: function(obj, first) {
								//首次不执行
								if (!first) {
									options.where.pageNum = obj.curr;
									options.where.pageSize = obj.limit;
									table.reload(options.id, {
										where: {
											requestBody: {
												data: options.where
											}
										}
									});
								}
							}
						});
					}
				},
				where: this.requestJsonData(options.where),
				cols: options.cols
			});
		},
		// 查询条件展开与折叠
		fold: function() {
			form.on('switch(fold)', function(data) {
				if (data.elem.checked) {
					data.othis.parent().parent().siblings('.fold-box').show()
				} else {
					data.othis.parent().parent().siblings('.fold-box').hide()
				}
			});
		},
		// 公共按钮不同颜色方法
		chooseSpan: function(data, color) {
			return "<span style='width:12px;height:12px;vertical-align:middle;border-radius:50%;background:" + color +
				";display:inline-block;margin-right:10px;'></span>" + data;
		},
		// echarts饼图封装
		publicBing: function(send) {
			var myChart = echarts.init(document.getElementById(send.id));
			option = {
				tooltip: {
					trigger: 'item',
					formatter: "{a} <br/>{b}: {c} ({d}%)"
				},
				series: [{
					name: send.name,
					type: 'pie',
					radius: ['50%', '70%'],
					avoidLabelOverlap: false,
					label: {
						normal: {
							show: false,
							position: 'center'
						},
						emphasis: {
							show: true,
							textStyle: {
								fontSize: '15',
								fontWeight: 'bold'
							}
						}
					},
					labelLine: {
						normal: {
							show: false
						}
					},
					data: send.data
				}]
			};
			myChart.setOption(option);
		},
		//渲染数据---大众
		publicLoad: function(data) {
			for (var i = 0; i < $('[dataLoad]').length; i++) {
				$('[dataLoad]')[i].innerHTML = (data[$('[dataLoad]')[i].getAttribute("dataLoad")]);
			}
		},
		//获取url参数，以对象返回
		getUrlParam: function() {
			var url = location.search; //获取url中"?"符后的字串   
			var param = {};
			if (url.indexOf("?") != -1) {
				var str = url.substr(1);
				strs = str.split("&");
				for (var i = 0; i < strs.length; i++) {
					param[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1]);
				}
			}
			return param;
		},
		//转换为数字
		parseIntNum: function(str) {
			str = str.replace(/[^\d]/g, '');
			if ('' != str) {
				str = parseInt(str);
			}
			return str;
		}
	}
	exports("NB", obj);
});
