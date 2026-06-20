const assert = require("assert");
const { sortNews } = require("../lib/news/sortNews");

function makeItem({ title, publishedAt, desc = "", source = "" }) {
  return { title, description: desc, publishedAt, source };
}

const now = new Date();
const today = now.toISOString();
const earlier = new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(); // yesterday

const items = [
  makeItem({ title: "Some crypto news", publishedAt: today }),
  makeItem({ title: "Tesla releases new update", publishedAt: earlier }),
  makeItem({ title: "Breaking: Tesla announces earnings", publishedAt: today }),
  makeItem({ title: "Tech roundup", publishedAt: earlier }),
];

const sorted = sortNews(items);

// Expect order: Tesla today, Other today, Tesla earlier, other earlier
assert.strictEqual(sorted[0].title.includes("Tesla"), true, 'First item should be Tesla-related');
assert.strictEqual(new Date(sorted[0].publishedAt).toDateString(), new Date(today).toDateString(), 'First item should be today');
assert.strictEqual(sorted[1].publishedAt, today, 'Second item should be today (non-Tesla)');
assert.strictEqual(sorted[2].title.includes("Tesla"), true, 'Third item should be Tesla-related older item');

console.log("sortNews test passed");
