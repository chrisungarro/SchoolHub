// Grading and ranking rules according to school specifications
export function calculateGrade(totalScore) {
  const score = Math.round(Number(totalScore) || 0);
  if (score >= 70) return { grade: 'A', remark: 'Excellent', gpa: 5.0 };
  if (score >= 60) return { grade: 'B', remark: 'Very Good', gpa: 4.0 };
  if (score >= 50) return { grade: 'C', remark: 'Good', gpa: 3.0 };
  if (score >= 45) return { grade: 'D', remark: 'Fair', gpa: 2.0 };
  if (score >= 40) return { grade: 'E', remark: 'Pass', gpa: 1.0 };
  return { grade: 'F', remark: 'Fail', gpa: 0.0 };
}

export function formatOrdinal(n) {
  if (!n || n <= 0) return '-';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Standard competition ranking (1224) with tie handling.
 * Given items sorted in descending order of score, assign position.
 * Returns array of objects with `.position` (number) and `.positionStr` (e.g. "1st Position" or "2nd Position (Tied)").
 */
export function assignRankings(items, scoreKey = 'total_score') {
  if (!items || items.length === 0) return [];

  // Sort descending by score
  const sorted = [...items].sort((a, b) => (Number(b[scoreKey]) || 0) - (Number(a[scoreKey]) || 0));

  let currentRank = 1;
  return sorted.map((item, index, arr) => {
    if (index > 0) {
      const prevScore = Number(arr[index - 1][scoreKey]) || 0;
      const currentScore = Number(item[scoreKey]) || 0;
      if (currentScore < prevScore) {
        currentRank = index + 1; // standard competition ranking
      }
    }
    
    // Check if there are ties
    const tiedCount = arr.filter(x => (Number(x[scoreKey]) || 0) === (Number(item[scoreKey]) || 0)).length;
    const isTied = tiedCount > 1;

    return {
      ...item,
      position: currentRank,
      positionStr: `${formatOrdinal(currentRank)} Position${isTied ? ' (Tied)' : ''}`,
      isTied,
    };
  });
}
