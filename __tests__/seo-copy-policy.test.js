const { sanitizeString, looksLikeFreePlanClaim, PAID } = require("../scripts/lib/seo-copy");
const { COPY } = require("../scripts/apply-pain-copy");

function pipelineDescription(raw) {
  let description = sanitizeString(raw || "");
  if (!/1\.99|subscribe/i.test(description)) {
    description = `${description.replace(/\s+$/, "")} ${PAID}`.trim();
  }
  return description;
}

describe("pSEO copy policy", () => {
  it("strips Free study timer even when it is the last sentence", () => {
    const out = pipelineDescription(
      "15-min Sprint blocks for Anki/Quizlet. Sustainable review sessions. Free study timer."
    );
    expect(out).not.toMatch(/free study timer/i);
    expect(out).toContain("$1.99");
    expect(looksLikeFreePlanClaim(out)).toBe(false);
  });

  it("strips Free for students without requiring a trailing space", () => {
    const out = pipelineDescription(
      "25-min writing blocks. Don't edit, just draft. Rain sounds for focus. Free for students."
    );
    expect(out).not.toMatch(/free for students/i);
    expect(out).toContain("$1.99");
  });

  it("keeps honest no-free-plan wording", () => {
    const out = sanitizeString(
      "Premium is $1.99/month after a 7-day trial. There is no guest timer and no free plan."
    );
    expect(out).toMatch(/no free plan/i);
    expect(looksLikeFreePlanClaim(out)).toBe(false);
  });

  it("cleans apply-pain-copy descriptions that the Vercel build reapplies", () => {
    const leaked = Object.entries(COPY)
      .filter(([slug]) => slug.startsWith("study-timer-for-") || slug.startsWith("focus-timer-for-"))
      .map(([slug, copy]) => [slug, pipelineDescription(copy.description)])
      .filter(([, description]) => looksLikeFreePlanClaim(description) || /free study timer|free for students|start free/i.test(description));
    expect(leaked).toEqual([]);
  });
});
