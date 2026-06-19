export type DiffStatus = "correct" | "incorrect" | "missing";

export interface DiffResult {
  word: string;
  status: DiffStatus;
}

/**
 * Clean a word by removing punctuation, converting to lowercase, and trimming spaces.
 */
export function cleanWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

/**
 * Compare user input against the original transcript using a word-level Levenshtein alignment algorithm.
 * Returns an array of original transcript words, each labeled as 'correct', 'incorrect', or 'missing'.
 */
export function diffWords(transcript: string, userInput: string): DiffResult[] {
  const originalWords = transcript.trim().split(/\s+/).filter((w) => w.length > 0);
  const cleanWordsT = originalWords.map(cleanWord);

  const userWords = userInput.trim().split(/\s+/).filter((w) => w.length > 0);
  const cleanWordsU = userWords.map(cleanWord);

  const n = cleanWordsT.length;
  const m = cleanWordsU.length;

  if (n === 0) {
    return [];
  }

  if (m === 0) {
    return originalWords.map((word) => ({
      word,
      status: "missing" as const,
    }));
  }

  // dp[i][j] stores the minimum alignment cost for prefix T[0..i-1] and U[0..j-1]
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  // parent[i][j] stores traceback direction:
  // 0 = Diagonal (Match/Mismatch)
  // 1 = Up (Deletion from T -> Missing in U)
  // 2 = Left (Insertion to U -> Extra word in U)
  const parent: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  // Initialize boundary states
  for (let i = 0; i <= n; i++) {
    dp[i][0] = i * 1.0;
    parent[i][0] = 1;
  }
  for (let j = 0; j <= m; j++) {
    dp[0][j] = j * 1.0;
    parent[0][j] = 2;
  }

  // DP state transitions
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const matchCost = cleanWordsT[i - 1] === cleanWordsU[j - 1] ? 0.0 : 1.2;

      const diag = dp[i - 1][j - 1] + matchCost;
      const up = dp[i - 1][j] + 1.0;
      const left = dp[i][j - 1] + 1.0;

      let minVal = diag;
      let dir = 0;

      if (up < minVal) {
        minVal = up;
        dir = 1;
      }
      if (left < minVal) {
        minVal = left;
        dir = 2;
      }

      dp[i][j] = minVal;
      parent[i][j] = dir;
    }
  }

  // Traceback
  let i = n;
  let j = m;
  const result: DiffResult[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const dir = parent[i][j];
      if (dir === 0) {
        const isMatch = cleanWordsT[i - 1] === cleanWordsU[j - 1];
        result.push({
          word: originalWords[i - 1],
          status: isMatch ? "correct" : "incorrect",
        });
        i--;
        j--;
      } else if (dir === 1) {
        result.push({
          word: originalWords[i - 1],
          status: "missing",
        });
        i--;
      } else {
        // Insertion: ignore the user's extra word in the output
        j--;
      }
    } else if (i > 0) {
      result.push({
        word: originalWords[i - 1],
        status: "missing",
      });
      i--;
    } else {
      j--;
    }
  }

  return result.reverse();
}
