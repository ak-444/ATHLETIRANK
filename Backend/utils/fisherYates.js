// Fisher-Yates Shuffle
function fisherYatesShuffle(array) {
  const arr = [...array]; // copy to avoid mutating
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

module.exports = fisherYatesShuffle;