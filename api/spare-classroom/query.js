﻿const models = require("./models");

module.exports = {
  hasSchoolInterface: ctx => ctx.query.campusId === 22, // 22为九龙湖（本科）区编号

  querySchoolInterface: async ctx => {
    let result = (await ctx.axios.post(
      "http://58.192.114.179/classroom/show/getemptyclassroomlist",
      ctx.querystring
    )).data

    // 尝试剔除多余属性
    result.rows.forEach((classroom, index) => {
      try {
        result.rows[index] = new models.Classroom(classroom);
      } catch (ex) {
        console.log(ex);
      }
    });

    return result;
  },

  // 分页该怎么处理比较好？用缓存暂存一下找到的所有结果吗？
  queryServiceDatabase: async ctx => {
    let query = ctx.query;
    Object.keys(query).forEach(key => query[key] = (query[key] ? parseInt(query[key]) : null)); // 转换字符串属性至对应整数

    // 利用课表筛选出该条件下有课的教室ID
    let occupiedClassroomIds = models.classRecords.filter(record =>
      (query.campusId == null || record.campusId == query.campusId)
      &&
      (query.buildingId == null || record.buildingId == query.buildingId)
      &&
      (query.startWeek <= record.endWeek && record.startWeek <= query.endWeek)
      &&
      (query.dayOfWeek == record.dayOfWeek)
      &&
      record.sequences.some(value => value >= query.startSequence && value <= query.endSequence)
    ).map(record => record.classroomId);

    // 筛选出所有无课的教室
    let spareClassrooms = Object.values(models.classrooms).map(c => new models.Classroom(c)).filter(classroom =>
      (query.campusId == null || classroom.building.campusId == query.campusId)
      &&
      (query.buildingId == null || classroom.buildingId == query.buildingId)
      &&
      !occupiedClassroomIds.includes(classroom.Id)
    );

    return {
      "pager.pageNo": query.pageNo,
      "pager.totalRows": spareClassrooms.length,
      "rows": spareClassrooms.slice(query.pageSize * (query.pageNo - 1), query.pageSize * query.pageNo)
    };
  }
}
