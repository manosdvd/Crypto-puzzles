import { generateCipher } from './cipher';

const FALLBACK_QUOTES = [
    { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { quote: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
    { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { quote: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
    { quote: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
    { quote: "In three words I can sum up everything I've learned about life: it goes on.", author: "Robert Frost" },
    { quote: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", author: "Ralph Waldo Emerson" },
    { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" }
];

export const fetchNewGameData = async () => {
    try {
        const response = await fetch('https://dummyjson.com/quotes/random');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        const cleanQuote = data.quote.toUpperCase();
        const cleanAuthor = data.author;

        const { newCipher, newReverseCipher } = generateCipher();

        return {
            quote: cleanQuote,
            author: cleanAuthor,
            cipher: newCipher,
            reverseCipher: newReverseCipher
        };

    } catch (error) {
        console.warn("API failed, using fallback", error);
        const randomFallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
        const cleanQuote = randomFallback.quote.toUpperCase();
        const { newCipher, newReverseCipher } = generateCipher();

        return {
            quote: cleanQuote,
            author: randomFallback.author,
            cipher: newCipher,
            reverseCipher: newReverseCipher
        };
    }
};
