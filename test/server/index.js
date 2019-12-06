const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const ejs = require('koa-ejs');
const fs = require('fs');
const jsonp = require('koa-jsonp');
const Koa = require('koa');
const koaQs = require('koa-qs');
const logger = require('koa-logger');
const path = require('path');
const route = require('koa-route');
const send = require('koa-send')

const app = module.exports = new Koa();
const port = process.env.PORT || 9877;

koaQs(app);
app.use(bodyParser());
app.use(jsonp());
app.use(cors());

ejs(app, { root: __dirname, layout: false, viewExt: 'html.ejs', cache: false });

// Utility endpoints
app.use(route.get('/build/:artifact', build));
app.use(route.get('/e2e', e2e));
app.use(route.get('/frame_mock', postMessage));
app.use(route.get('/mock-404'), ctx => ctx.status = 404);

// Standard API fixtures
app.use(route.get('/apple_pay/info', json));
app.use(route.get('/apple_pay/start', json));
app.use(route.get('/apple_pay/token', json));
app.use(route.post('/apple_pay/start', json));
app.use(route.post('/apple_pay/token', json));
app.use(route.get('/bank', json));
app.use(route.get('/coupons/:id', json));
app.use(route.get('/events', ok));
app.use(route.post('/events', ok));
app.use(route.get('/field.html', html('field')));
app.use(route.get('/fraud_data_collector', json));
app.use(route.get('/gift_cards/:id', json));
app.use(route.get('/items/:id', json));
app.use(route.get('/paypal/start', postMessage));
app.use(route.get('/plans/:plan_id', json));
app.use(route.get('/plans/:plan_id/coupons/:id', json));
app.use(route.get('/relay', html('relay')));
app.use(route.get('/risk/preflights', json));
app.use(route.get('/tax', json));
app.use(route.get('/three_d_secure/start', postMessage));
app.use(route.get('/three_d_secure/mock', postMessage));
app.use(route.get('/token', json));
app.use(route.post('/token', json));
app.use(route.get('/tokens/:token_id', json));
app.use(route.post('/tokens', json));


app.listen(port, () => {
  log(`Ready on ${port}`);
});

/**
 * Response functions
 */
async function build (ctx, artifact) {
  setHeaders(ctx);
  await send(ctx, artifact, { root: path.join(__dirname, '../../build') });
}

async function e2e (ctx) {
  if (!ctx.query.config) {
    ctx.status = 400;
    ctx.body = 'config not set';
    return;
  }
  setHeaders(ctx);
  await ctx.render(`views/e2e`, { config: JSON.parse(ctx.query.config) });
}

function html (view) {
  return async ctx => {
    setHeaders(ctx);
    await ctx.render(`fixtures/${view}`);
  };
}

async function json (ctx) {
  setHeaders(ctx);
  ctx.body = fixture(ctx);
}

async function ok (ctx) {
  setHeaders(ctx);
  ctx.body = '';
}

async function postMessage (ctx) {
  setHeaders(ctx);
  await ctx.render('fixtures/post-message', {
    message: {
      recurly_event: ctx.query.event,
      recurly_message: fixture(ctx)
    }
  });
}

/**
 * Utility functions
 */

function fixture (ctx) {
  const f = require(`./fixtures${ctx.request.path}`);
  if (typeof f === 'function') return f.apply(ctx)
  return f;
}

function setHeaders (ctx) {
  ctx.set('Connection', 'keep-alive');
}

function log (...messages) {
  console.log('Test server -- ', ...messages);
}
