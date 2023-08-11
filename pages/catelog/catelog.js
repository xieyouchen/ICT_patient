// pages/catelog/catelog.js
var localData = require("../catelog/data.js");
var p_localData = require("../catelog/p_data.js");
const db = wx.cloud.database()
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    to: "oTvD95GRhDLbf7pkJI-mcDCzWfTk",
    mine: "oTvD95KyTP9kIUG6eIGrNI_GDVpQ",
    left_list: [],
    patientsOpenID: [],
    dataOneDay: {},
    right_contents: [],
    current: 0,
    scrollTOP: 0,
    flag: app.globalData.haveFlag
  },
  Cates: [],
  handleindex(e) {
    const {
      index
    } = e.currentTarget.dataset;
    // let right_content = localData.dataList[index].children;
    let data = this.data.right_contents
    let right_content = data[index]
    console.log("right_content in handleindex", right_content)
    this.setData({
      current: index,
      right_content,
      scrollTOP: 0
    })
    console.log(this.data.right_contents)
  },
  getToDaySplice(time) {
    let year = time.substring(1, 5)
    let month = time.substring(5, 7)
    let day = time.substring(7)
    return year + '.' + month + '.' + day
  },
  // 计算PEF肺活量值用的数组数据，用得到的吹气数据，两个数据之差作为每个时间段的PEF
  getMyseries_Sum(today) {
    let myseries_Sum = [];
    console.log("today in getMyseries_Sum()", today)
    if (today != null)
      for (var i = 0; i < today.length; i++) {
        var tmp = {};
        tmp["name"] = today[i].tag;
        tmp["type"] = 'line';
        tmp["smooth"] = true;
        let data_sum = [0]
        let dataTmp = today[i].data
        for (let i = 2; i < dataTmp.length; i++) {
          let num = dataTmp[i] - dataTmp[i - 1]
          num = parseInt(num / 0.045 * 15)
          data_sum.push(num)
        }
        tmp["data"] = data_sum;
        myseries_Sum.push(tmp);
      }
    return myseries_Sum
  },
  getPEFR(todayData, cnt) {
    if (todayData.length == 0) return
    let arr_pef = []
    for (let i = 0; i < cnt; i++) {
      arr_pef.push(this.max(todayData[i].data))
    }
    let max = this.max(arr_pef)
    let min = this.min(arr_pef)
    let res = 2 * (max - min) / (max + min) * 100
    res = parseFloat(res.toFixed(2))
    return res
  },
  max(arrData) {
    let pef = 0
    arrData.sort((a, b) => {
      return a - b
    })
    pef = arrData[arrData.length - 1]
    return pef
  },
  min(arrData) {
    let pef = 0
    arrData.sort((a, b) => {
      return a - b
    })
    pef = arrData[0]
    return pef
  },
  getFactors(todayData) {
    console.log("todayData in getFac", todayData)
    let detail_factors = []
    // 肺活量峰值，L/min
    let myseries_Sum = this.getMyseries_Sum(todayData)
    console.log("myseries_Sum", myseries_Sum)
    // 以下得到 detail_factor，最后的渲染数据
    for (let i = 0; i < todayData.length; i++) {
      let e = todayData[i]
      // 如果是中午或者晚上数据为空，那么就跳出循环
      if (e.data.length == 1) break
      let dataTmp = e.data
      let fev1 = dataTmp[dataTmp.length - 1] - dataTmp[0]
      let morning_Or_noon_Or_night = myseries_Sum[i]
      console.log("早或中或晚的数据", morning_Or_noon_Or_night)
      let pef = ""
      // 计算 pefr
      let pefr = this.getPEFR(myseries_Sum, i + 1)
      if (morning_Or_noon_Or_night) {
        let arrData = myseries_Sum[i].data
        pef = this.max(arrData)
      }
      let tag = e.tag
      let data = []
      data.push(fev1)
      data.push(pef)
      data.push(pefr)
      detail_factors.push({
        tag,
        data
      })
    }
    return detail_factors
  },
  computeDetail_Factors(detail) {
    let detail_factors = []
    for (let i = 0; i < detail.length; i++) {
      let factor = this.getFactors(detail[i].today)
      detail_factors.push(factor)
    }
    this.setData({
      detail_factors
    })
  },
  watchAllData() {
    let that = this
    // let id = wx.getStorageSync('open_ID')
    let id = this.data.to
    db.collection('dataOneDay').where({
        patientId: id
      })
      .watch({
        onChange: function (snapshot) {
          console.log('snapshot', snapshot)
          let data = snapshot.docs
          data.sort(that.compareFn)
          // console.log("res of all data after sorting in login.js", data)
          that.setData({
            dataAll: data
          })
          that.dealAllDataToDetails(data)
        },
        onError: function (err) {
          console.error('the watch closed because of error', err)
        }
      })
  },
  addLastNum(data) {
    data['morning'].push(data['morning'][5])
    data['noon'].push(data['noon'][5])
    data['night'].push(data['night'][5])
    return data
  },
  getTimeSplice(time) {
    let res = {
      year: time.slice(1, 5),
      month: time.slice(5, 7),
      day: time.slice(7)
    }
    return res
  },
  getDataOneDay(index) {
    let data = this.data.dataAll[index]
    data = this.addLastNum(data)
    console.log("data after addLastNum()", data)
    let time = this.getTimeSplice(data['time'])
    let dataToday = {
      today: [{
          img: data['img'],
          data: data['morning'],
          tag: '早'
        },
        {
          data: data['noon'],
          tag: '中'
        },
        {
          data: data['night'],
          tag: '晚'
        }
      ],
      year: time['year'],
      month: time['month'],
      day: time['day']
    }
    return dataToday
  },
  dealAllDataToDetails(data) {
    let detail = []
    for (let i = 0; i < data.length; i++) {
      detail.push(this.getDataOneDay(i))
    }
    this.setData({
      detail
    })
    this.computeDetail_Factors(detail)
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.watchAllData()
    db.collection('users').get()
      .then(res => {
        console.log("all users", res)
        let data = res.data
        for (let i = 0; i < data.length; i++) {
          let user = data[i]
          let left_list = this.data.left_list
          let patientsOpenID = this.data.patientsOpenID
          if (user.nickName == "Hypnotic.") continue
          patientsOpenID.push(user.open_ID)
          left_list.push(user.nickName)
          this.setData({
            left_list,
            patientsOpenID
          })
        }
      })
      .then(() => {
        let patientsID = this.data.patientsOpenID
        console.log(patientsID)
        patientsID.forEach(patientId => {
          // 每个患者的数据显示在右边
          db.collection('dataOneDay').where({
              patientId
            }).get()
            .then(res => {
              console.log("all data of one patient", res)
              let right_contents = this.data.right_contents
              let data = res.data
              data.forEach(dataOneDay => {
                right_contents.push({
                  img: dataOneDay.img,
                  imgSum: dataOneDay.imgSum,
                  time: this.getToDaySplice(dataOneDay.time)
                })
              });
              this.setData({
                right_contents
              })
            })
        });
      })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  //  点击tabbar跳转函数
  //  flag是参数 flag 1：医生；2： 病人
  goIndex: function () {
    wx.redirectTo({
      url: `../index/index?flag=${this.data.flag}`
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
  },
  goCenter: function () {
    wx.redirectTo({
      url: `../login/login?flag=${this.data.flag}`
    })
  }
})