const PAID = "Superfocus Premium is $1.99/month after a 7-day trial.";

function sanitizeString(text) {
  if (text == null) return text;
  let s = String(text);
  s = s.replace(/Try them free/gi, "Subscribe");
  s = s.replace(/Try it free/gi, "Subscribe");
  s = s.replace(/Try each free/gi, "Try each preset");
  s = s.replace(/Try free[^.|<]{0,80}/gi, "Subscribe at $1.99/month");
  s = s.replace(/Start your free trial[^.|<]{0,120}/gi, "Subscribe");
  s = s.replace(/Start free today\.?/gi, "Subscribe.");
  s = s.replace(/No signup to try\./gi, "");
  s = s.replace(/no signup required[^.|]{0,40}/gi, "");
  s = s.replace(/No signup required[^.|]{0,40}/gi, "");
  s = s.replace(/Any preset on free tier/gi, "Any timer preset");
  s = s.replace(/Free to start\./gi, `${PAID}`);
  s = s.replace(/No credit card required to start\./gi, "");
  s = s.replace(/No credit card to start\./gi, "");
  s = s.replace(/Free to try, no credit card\./gi, PAID);
  s = s.replace(/Free to try[^.|]{0,40}/gi, `${PAID}`);
  s = s.replace(/Yes\. Superfocus is free to use\./gi, `No. ${PAID}`);
  s = s.replace(/Yes\. Free to use\./gi, `No. ${PAID}`);
  s = s.replace(/Yes\. Free users get 2 hours of focus per day; guests get 25 minutes\. Premium gives unlimited focus and all features\./gi, `No. ${PAID} There is no guest timer.`);
  s = s.replace(/Free users get 2 hours of focus per day; guests get 25 minutes\./gi, `Premium is $1.99/month. There is no guest timer.`);
  s = s.replace(/Free accounts get 2 hours of focus per day; guests can run one 25-minute session without signing up\./gi, "");
  s = s.replace(/2 hours focus per day on free tier\./gi, "");
  s = s.replace(/guests get 25 minutes\./gi, "");
  s = s.replace(/Free tier: 2 hours focus\/day\./gi, "");
  s = s.replace(/a free 25\/5/gi, "a 25/5");
  s = s.replace(/A free study timer/gi, "A study timer");
  s = s.replace(/Free study timer\.?/gi, "");
  s = s.replace(/Free for students\.?/gi, "");
  s = s.replace(/Free for professionals\.?/gi, "");
  s = s.replace(/Free for educators\.?/gi, "");
  s = s.replace(/Free Pomodoro/gi, "Pomodoro");
  s = s.replace(/free Pomodoro/gi, "pomodoro");
  s = s.replace(/Try Superfocus free/gi, "Subscribe");
  s = s.replace(/ in Superfocus\. Free/gi, " in Superfocus.");
  s = s.replace(/ All presets in one app\. Free\./gi, ` ${PAID}`);
  s = s.replace(/ Free timer\./gi, ` ${PAID}`);
  s = s.replace(/\. Free\./g, `. ${PAID}`);
  s = s.replace(/\s{2,}/g, " ");
  s = s.replace(/ \./g, ".");
  s = s.replace(/\s+\./g, ".");
  return s.trim();
}

function looksLikeFreePlanClaim(text) {
  const s = String(text || "");
  if (/no free plan|not a free plan|there is no guest timer|guides are free to read/i.test(s)) {
    const stripped = s
      .replace(/there is no free plan/gi, "")
      .replace(/no free plan/gi, "")
      .replace(/not a free plan/gi, "")
      .replace(/not “one free browser app\.”/gi, "")
      .replace(/guides are free to read/gi, "");
    return /free study timer|free for students|start free|free to try|free tier|free plan|try superfocus free/i.test(
      stripped
    );
  }
  return /free study timer|free for students|start free|free to try|free tier(?![:.] 2 hours)|try superfocus free/i.test(
    s
  );
}

module.exports = { PAID, sanitizeString, looksLikeFreePlanClaim };
