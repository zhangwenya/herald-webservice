/**
  # 参数解析中间件

  将 GET/DELETE 的 query 与 POST/PUT 的 body 合并成 ctx.params API。
  这里使用更严格的 HTTP 规范，GET/DELETE 不读 body，POST/PUT 不读 URL query。

  ## 暴露接口

  ctx.params  object
 */
const bodyparser = require('koa-bodyparser')()

module.exports = async (ctx, next) => {
  await bodyparser(ctx, async () => {
    if (/^get|delete$/i.test(ctx.method)) {
      ctx.params = ctx.query
    } else {
      ctx.params = ctx.request.body
    }

    // 过河拆桥
    delete ctx.request.body
    await next()
  })
}
