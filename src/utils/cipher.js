export const isLetter = (char) => /^[A-Z]$/.test(char);

export const generateCipher = () => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const shuffled = [...alphabet].sort(() => Math.random() - 0.5);

    // Ensure no letter maps to itself
    for (let i = 0; i < alphabet.length; i++) {
        if (alphabet[i] === shuffled[i]) {
            const swapIdx = (i + 1) % alphabet.length;
            [shuffled[i], shuffled[swapIdx]] = [shuffled[swapIdx], shuffled[i]];
        }
    }

    const newCipher = {};
    const newReverseCipher = {};
    alphabet.forEach((char, index) => {
        newCipher[char] = shuffled[index];
        newReverseCipher[shuffled[index]] = char;
    });

    return { newCipher, newReverseCipher };
};
