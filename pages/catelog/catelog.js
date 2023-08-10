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
    left_list: [],
    patientsOpenID: [],
    dataOneDay: {
      time: '2022.11.28',
      data: [{
        'FVC': 1,
        'FEV1': 2,
        'PEF': 3,
        'PEFR': 4
      }, {
        'FVC': 1,
        'FEV1': 2,
        'PEF': 3,
        'PEFR': 4
      }, {
        'FVC': 1,
        'FEV1': 2,
        'PEF': 3,
        'PEFR': 4
      }]
    },
    right_content: [],
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
    let month = time.substring(5,7)
    let day = time.substring(7)
    return year + '.' + month + '.' + day
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 找所有的患者
    let detail_factors = [
      {
        tag: '早',
        data: [4.23, 463, 0]
      },{
        tag: '中',
        data: [3.28, 463, 21.53]
      }
    ]
    let detail = {
      today: [
        {
          tag: '早',
          data: [0, 0.32, 1.17, 2.48, 3.87, 4.23]
        },{
          tag: '中',
          data: [0, 0.36, 1.17, 2.29, 3.24, 3.28]
        }
      ]
    }
    this.setData({
      detail_factors,
      detail
    })
    db.collection('users').get()
      .then(res => {
        console.log("all users", res)
        let data = res.data
        for(let i = 0 ; i < data.length ; i++) {
          let user = data[i]
          let left_list = this.data.left_list
          let patientsOpenID = this.data.patientsOpenID
          if(user.nickName == "Hypnotic.") continue
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