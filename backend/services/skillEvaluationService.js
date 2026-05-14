export function normalizeSkill(s) {
  return String(s || '').toLowerCase().trim();
}

export function computeSkillMetrics(goldArr = [], predArr = []) {
  const gold = new Set((goldArr || []).map(normalizeSkill));
  const pred = new Set((predArr || []).map(normalizeSkill));
  const inter = [...gold].filter(x => pred.has(x));
  const TP = inter.length;
  const FP = [...pred].filter(x => !gold.has(x)).length;
  const FN = [...gold].filter(x => !pred.has(x)).length;
  const precision = TP + FP === 0 ? 0 : TP / (TP + FP);
  const recall = TP + FN === 0 ? 0 : TP / (TP + FN);
  const f1 = (precision + recall) ? (2 * precision * recall) / (precision + recall) : 0;
  const unionSize = new Set([...gold, ...pred]).size;
  const jaccard = unionSize === 0 ? 1.0 : TP / unionSize;
  return { TP, FP, FN, precision, recall, f1, jaccard };
}
