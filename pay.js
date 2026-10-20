(function () {
  'use strict';

  // Public client-side token: safe to ship in the page (it can only open checkouts).
  var CLIENT_TOKEN = 'live_1a292d53182bbb5e10b1571ddf2';
  var RETURN_URL = 'https://mquant.org/?paid=1';

  var PLANS = {
    starter:  { name: 'Starter',  price: '$29',  priceId: 'pri_01m5d3rnk2yt6h5zwzg1hh1j6n', desc: 'A first look at the method on one instrument.' },
    terminal: { name: 'Terminal', price: '$59',  priceId: 'pri_01m5d3t4eb1nvv6zdhca37qtk5', desc: 'The full ensemble and calibration view for daily reading.' },
    desk:     { name: 'Desk',     price: '$149', priceId: 'pri_01m5d3v97dzsk9j2aqgsp3ve6z', desc: 'More instruments and a higher daily run limit, for heavier personal use.' }
  };
  var LOCALES = { en: 1, ru: 1, de: 1, fr: 1, es: 1, it: 1, pt: 1, tr: 1, pl: 1, nl: 1 };
  var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  var EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}$/;

  var qs = new URLSearchParams(location.search);
  var planKey = (qs.get('plan') || '').toLowerCase();
  var plan = Object.prototype.hasOwnProperty.call(PLANS, planKey) ? PLANS[planKey] : null;
  var uid = qs.get('uid') || '';
  var email = qs.get('email') || '';
  var lang = (qs.get('lang') || 'en').toLowerCase();
  if (!UUID.test(uid)) uid = '';
  if (!EMAIL.test(email) || email.length > 254) email = '';
  if (!LOCALES[lang]) lang = 'en';

  var $ = function (id) { return document.getElementById(id); };
  var statusEl = $('status');
  function say(msg, isErr) {
    statusEl.textContent = msg;
    statusEl.className = 'status' + (isErr ? ' err' : '');
  }

  if (!plan) {
    $('chooser').hidden = false;
    return;
  }

  $('plan-name').textContent = plan.name;
  $('plan-price').textContent = plan.price + ' / month';
  $('plan-desc').textContent = plan.desc;
  $('plan-box').hidden = false;

  var ready = false;
  var opened = false;

  function openCheckout() {
    if (!ready) { say('Payment form is still loading. Please wait a moment.'); return; }
    var payload = {
      items: [{ priceId: plan.priceId, quantity: 1 }],
      customData: uid ? { user_id: uid, plan: planKey } : { plan: planKey },
      settings: {
        displayMode: 'overlay',
        theme: 'dark',
        locale: lang,
        successUrl: RETURN_URL
      }
    };
    if (email) payload.customer = { email: email };
    say('');
    Paddle.Checkout.open(payload);
  }

  $('pay-btn').addEventListener('click', openCheckout);

  if (typeof Paddle === 'undefined') {
    say('The payment form could not be loaded (a blocker may be stopping it). Please allow cdn.paddle.com or write to mquant@mquant.org.', true);
    return;
  }

  try {
    Paddle.Initialize({
      token: CLIENT_TOKEN,
      eventCallback: function (ev) {
        if (!ev || !ev.name) return;
        if (ev.name === 'checkout.error') say('The payment form reported an error. Please try again or write to mquant@mquant.org.', true);
        if (ev.name === 'checkout.closed') say('Checkout closed. Use the button above to reopen it.');
      }
    });
    ready = true;
    if (!opened) { opened = true; openCheckout(); }
  } catch (e) {
    say('The payment form could not be started. Please try again or write to mquant@mquant.org.', true);
  }
})();
