//index.js
//获取应用实例
const app = getApp()
const DB = wx.cloud.database().collection("IOT_Patient")
const db = wx.cloud.database()
Page({
  data: {
    // 蓝牙模块数据
    to: "oTvD95GRhDLbf7pkJI-mcDCzWfTk",
    mine: "oTvD95KyTP9kIUG6eIGrNI_GDVpQ",
    devs: [],
    motto: 'Hello World！',
    userInfo: {},
    mode: -1,
    itemList: ['病人', '医生'],
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    patientList: [],
    floor: [{
        id: 0,
        name: "早间数据",
        contain: [{
            id_sec: 0,
            name_sec: "2020-12-10 09:34",
            Active: false
          }

        ]
      },
      {
        id: 1,
        name: "晚间数据",
        contain: [{
            id_sec: 0,
            name_sec: "2020-12-10 19:23",
            Active: false
          }

        ]
      }
    ],

    tabs: [{
        id: 0,
        name: "病人消息",
        isactive: true
      },
      {
        id: 1,
        name: "最新监测",
        isactive: false
      }
    ],
    tabs2: [{
        id: 0,
        name: "蓝牙连接",
        isactive: true
      }
      // ,
      // {
      //     id: 1,
      //     name: "数据获取",
      //     isactive: false
      // }
    ],
    theflag: app.globalData.haveFlag
  },
  // 蓝牙模块自定义数据
  customData: {
    _devs: []
  },
  Debug(name, content) {
    console.log(name)
    console.log(content)
  },
  itemChange(e) {
    this.Debug("选择的蓝牙信息", e)
    const {
      index
    } = e.detail;
    let tabs = this.data.tabs;
    tabs.forEach((v, i) => i === index ? v.isactive = true : v.isactive = false);
    this.setData({
      tabs
    })
  },
  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  get_data() {
    var that = this;
    DB.get({
      success(res) {
        console.log("查询成功", res.data);
        that.setData({
          patientList: res.data
        })
      },
      fail(res) {
        console.log("数据库访问查询失败", res)
      }
    })
  },
  async getAvtarAndName(anotherId) {
    return new Promise((resolve) => {
      db.collection('users').where({
          open_ID: anotherId
        }).get()
        .then(res => {
          // 只需要头像和名字
          let data = res.data[0]
          let avatar = data.avatarUrl
          let nickName = data.nickName
          let user = {
            avatar,
            nickName
          }
          resolve(user)
        })
    })
  },
  getAnotherId(e) {
    let userId = e.userId
    let openId = this.data.mine
    return userId === openId ? e.anotherId : e.userId
  },
  getPatientList(data) {
    data.forEach(e => {
      let newsId = e.newsId
      let anotherId = this.getAnotherId(e)
      db.collection('news').doc(newsId).get()
        .then(async (res) => {
          // 只需要内容和时间
          let content = res.data.text
          let time = res.data.time
          let user = await this.getAvtarAndName(anotherId)
          let patientList = []
          patientList.push({
            content,
            time,
            img: user['avatar'],
            _id: anotherId,
            name: user['nickName']
          })
          this.setData({
            patientList
          })
          console.log(patientList)
        })
    })
  },
  watchLatestNews() {
    let that = this
    let myOpenID = this.data.mine
    db.collection('latestNews').where(db.command.or([{
        userId: myOpenID
      }, {
        anotherId: myOpenID
      }]))
      .watch({
        onChange: function (snapshot) {
          console.log('snapshot in latestNews', snapshot)
          let data = snapshot.docs
          // 肯定只有一个记录
          // patientList[i]._id 表示对方的 id 号
          // if(this.data.patientList)
          that.getPatientList(data)
        },
        onError: function (err) {
          console.error('the watch closed because of error', err)
        }
      })
  },
  onLoad: function (options) {
    // 获取当前用户是医生还是病人的信息,1：医生，2：病人
    var f = app.globalData.haveFlag; //options.flag - 0;
    if (f == 2) {
      this.setData({
        tabs: [{
          id: 0,
          name: "蓝牙连接",
          isactive: true
        }]
      })
    }
    this.setData({
      theflag: f
    })
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
    if (app.getPlatform() == 'android' && this.versionCompare('6.5.7', app.getVersion())) {
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，请更新至最新版本',
        showCancel: false
      })
    } else if (app.getPlatform() == 'ios' && this.versionCompare('6.5.6', app.getVersion())) {
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，请更新至最新版本',
        showCancel: false
      })
    }
    this.watchLatestNews()
  },
  onShow: function () {
    // this.get_data({
    //   theflag: app.globalData.haveFlag
    // });
  },
  onHide: function () {
    app.stopSearchDevs()
  },
  onPullDownRefresh: function () {
    if (app.globalData.BluetoothState) {
      const self = this
      this.customData._devs = []
      wx.closeBluetoothAdapter({
        success: function (res) {
          wx.openBluetoothAdapter({
            success: function (res) {
              self.startSearchDevs()
            }
          })
        }
      })
    }
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 2000)
  },
  startSearchDevs: function () {
    const self = this
    wx.startBluetoothDevicesDiscovery({ // 开启搜索
      // 不允许重复上报同一设备
      // services: ['A52D3A26-AC88-FD59-F9CC-72A9577DA478'],
      allowDuplicatesKey: false,
      success: function (res) {
        console.log(res)
        // 监听搜索到新设备的事件
        wx.onBluetoothDeviceFound(function (devices) {
          console.log(devices)
          var isExist = false
          if (devices.deviceId) {
            for (let item of self.customData._devs) {
              if (item.deviceId === devices.deviceId) {
                isExist = true
                break;
              }
            }!isExist && self.customData._devs.push(devices)
            self.setData({
              devs: self.customData._devs
            })
          } else if (devices.devices) {
            for (let item of self.customData._devs) {
              if (item.deviceId === devices.devices[0].deviceId) {
                isExist = true
                break;
              }
            }!isExist && self.customData._devs.push(devices.devices[0])
            self.setData({
              devs: self.customData._devs
            })
          } else if (devices[0]) {
            for (let item of self.customData._devs) {
              if (item.deviceId === devices[0].deviceId) {
                isExist = true
                break;
              }
            }!isExist && self.customData._devs.push(devices[0])
            self.setData({
              devs: self.customData._devs
            })
          }
        })
      },
      fail: (res) => {
        console.log("startBluetoothDevicesDiscovery() 调用失败返回")
        console.log(res)
      }
    })
  },
  versionCompare: function (ver1, ver2) {
    var version1pre = parseFloat(ver1)
    var version2pre = parseFloat(ver2)
    var version1next = parseInt(ver1.replace(version1pre + ".", ""))
    var version2next = parseInt(ver2.replace(version2pre + ".", ""))
    if (version1pre > version2pre)
      return true
    else if (version1pre < version2pre)
      return false
    else {
      if (version1next > version2next)
        return true
      else
        return false
    }
  },
  connect(event) {
    if (app.globalData.BluetoothState) {
      this.Debug("dev in connect()", event.currentTarget.dataset.dev)
      const deviceId = event.currentTarget.dataset.dev.deviceId
      const deviceName = event.currentTarget.dataset.dev.name
      wx.showLoading({
        title: '正在连接...',
      })
      app.startConnect(deviceId, deviceName)
    }
  },
  getUserInfo: function (e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  //  点击tabbar跳转函数
  //  flag是参数 flag 1：医生；2： 病人
  goCenter: function () {
    wx.redirectTo({
      url: `../login/login?flag=${this.data.flag}`
    })
  },
  goList: function () {
    wx.redirectTo({
      url: `../catelog/catelog?flag=${this.data.flag}`
    })
  },
  goSearch: function () {
    wx.redirectTo({
      url: `../search/search?flag=${this.data.flag}`
    })
  }
})