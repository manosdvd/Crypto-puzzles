import { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy } from 'lucide-react';
import Header from './components/Header';
import QuoteDisplay from './components/QuoteDisplay';
import Keyboard from './components/Keyboard';
import GameControls from './components/GameControls';
import { fetchNewGameData } from './utils/api';
import { isLetter } from './utils/cipher';
import { saveGameState, loadGameState, clearGameState } from './utils/storage';

export default function App() {
    const [loading, setLoading] = useState(true);
    const [originalQuote, setOriginalQuote] = useState(null);
    const [author, setAuthor] = useState("");
    const [source, setSource] = useState("");
    const [cipher, setCipher] = useState({}); // Map: Plain char -> Encrypted char
    const [reverseCipher, setReverseCipher] = useState({}); // Map: Encrypted char -> Plain char
    const [userGuesses, setUserGuesses] = useState({}); // Map: Encrypted char -> User guessed char

    // Track specific cursor index instead of just the selected character value
    const [cursorIndex, setCursorIndex] = useState(null);

    const [solved, setSolved] = useState(false);
    const [checkMode, setCheckMode] = useState(false);
    const [hintedChars, setHintedChars] = useState(new Set());
    const [showConfetti, setShowConfetti] = useState(false);

    // Derived state for the currently selected encrypted character based on cursor position
    const selectedEncryptedChar = useMemo(() => {
        if (cursorIndex === null || !originalQuote || !cipher) return null;
        const plainChar = originalQuote[cursorIndex];
        return cipher[plainChar];
    }, [cursorIndex, originalQuote, cipher]);

    // Calculate duplicate assignments (same letter used for different encrypted chars)
    const duplicateLetters = useMemo(() => {
        const counts = {};
        const duplicates = new Set();
        Object.values(userGuesses).forEach(char => {
            counts[char] = (counts[char] || 0) + 1;
        });
        Object.entries(counts).forEach(([char, count]) => {
            if (count > 1) duplicates.add(char);
        });
        return duplicates;
    }, [userGuesses]);

    const startNewGame = useCallback(async (isRetry = false) => {
        setLoading(true);
        setSolved(false);
        setUserGuesses({});
        setCursorIndex(null);
        setCheckMode(false);
        setHintedChars(new Set());
        setShowConfetti(false);
        clearGameState();

        const data = await fetchNewGameData();
        setOriginalQuote(data.quote);
        setAuthor(data.author);
        setSource(data.source);
        setCipher(data.cipher);
        setReverseCipher(data.reverseCipher);
        setLoading(false);
    }, []);

    // Initial Load / Persistence
    useEffect(() => {
        const saved = loadGameState();
        if (saved && saved.originalQuote) {
            setOriginalQuote(saved.originalQuote);
            setAuthor(saved.author);
            setSource(saved.source);
            setCipher(saved.cipher);
            setReverseCipher(saved.reverseCipher);
            setUserGuesses(saved.userGuesses);
            setHintedChars(saved.hintedChars);
            setSolved(saved.solved);
            setLoading(false);
        } else {
            startNewGame();
        }
    }, [startNewGame]);

    // Save state on change
    useEffect(() => {
        if (!loading && originalQuote) {
            saveGameState({
                originalQuote,
                author,
                source,
                cipher,
                reverseCipher,
                userGuesses,
                hintedChars,
                solved
            });
        }
    }, [loading, originalQuote, author, source, cipher, reverseCipher, userGuesses, hintedChars, solved]);


    // Helper to find valid letter indices for navigation
    const getLetterIndices = useCallback(() => {
        if (!originalQuote) return [];
        return originalQuote.split('').map((c, i) => isLetter(c) ? i : -1).filter(i => i !== -1);
    }, [originalQuote]);

    // Auto-focus first empty cell on load if not solved
    useEffect(() => {
        if (!loading && !solved && cursorIndex === null && originalQuote) {
            const indices = getLetterIndices();
            if (indices.length > 0) {
                // Find first unfilled
                let firstUnfilled = indices.find(idx => {
                    const char = originalQuote[idx];
                    const enc = cipher[char];
                    return !userGuesses[enc];
                });

                // If all filled (but not solved?), fallback to first
                if (firstUnfilled === undefined) firstUnfilled = indices[0];

                setCursorIndex(firstUnfilled);
            }
        }
    }, [loading, solved, originalQuote, getLetterIndices, cipher, userGuesses]); // Careful with dependencies to avoid sticky focusing

    // Handle Navigation
    const moveCursor = useCallback((direction) => {
        if (cursorIndex === null) {
            const indices = getLetterIndices();
            if (indices.length > 0) setCursorIndex(indices[0]);
            return;
        }

        const indices = getLetterIndices();
        const currentPos = indices.indexOf(cursorIndex);
        if (currentPos === -1) return;

        let newPos = currentPos + direction;
        // Clamp
        if (newPos < 0) newPos = 0;
        if (newPos >= indices.length) newPos = indices.length - 1;

        setCursorIndex(indices[newPos]);
    }, [cursorIndex, getLetterIndices]);

    const handleGuess = useCallback((guessChar) => {
        if (solved || !selectedEncryptedChar) return;
        // Prevent changing hinted characters
        if (hintedChars.has(selectedEncryptedChar)) return;

        setUserGuesses(prev => {
            const newGuesses = { ...prev };

            if (guessChar === null) {
                delete newGuesses[selectedEncryptedChar];
            } else {
                newGuesses[selectedEncryptedChar] = guessChar;
            }

            const isComplete = originalQuote.split('').every(char => {
                if (!isLetter(char)) return true;
                const encrypted = cipher[char];
                return newGuesses[encrypted] === char;
            });

            if (isComplete) {
                setSolved(true);
                setShowConfetti(true);
                setCursorIndex(null);
                setCheckMode(false);
                clearGameState(); // Clear state on win? Or keep it so they can see? Let's keep duplicate save logic for now.
            }

            return newGuesses;
        });
    }, [solved, selectedEncryptedChar, hintedChars, originalQuote, cipher]);

    const moveCursorToNextUnfilled = useCallback(() => {
        if (!originalQuote || cursorIndex === null) return;

        const indices = getLetterIndices();
        const currentPos = indices.indexOf(cursorIndex);
        if (currentPos === -1) return;

        // Search for next unfilled
        let nextIndex = -1;
        for (let i = currentPos + 1; i < indices.length; i++) {
            const rawIndex = indices[i];
            const plainChar = originalQuote[rawIndex];
            const enc = cipher[plainChar];
            if (!userGuesses[enc]) {
                nextIndex = rawIndex;
                break;
            }
        }

        if (nextIndex !== -1) {
            setCursorIndex(nextIndex);
        } else {
            // If no more unfilled ahead, wrap around or just check everything?
            // Let's just standard move(1)
            moveCursor(1);
        }
    }, [cursorIndex, originalQuote, cipher, userGuesses, getLetterIndices, moveCursor]);

    const moveCursorLeft = useCallback(() => {
        if (!originalQuote || cursorIndex === null) return;

        const indices = getLetterIndices();
        const currentPos = indices.indexOf(cursorIndex);
        if (currentPos === -1) return;

        // Try to move left
        let nextPos = currentPos - 1;
        while (nextPos >= 0) {
            const rawIndex = indices[nextPos];
            const plainChar = originalQuote[rawIndex];
            const enc = cipher[plainChar];

            // If it's a hint, keep going left
            if (hintedChars.has(enc)) {
                nextPos--;
                continue;
            }

            // Found a valid non-hint spot
            setCursorIndex(rawIndex);
            return;
        }
    }, [cursorIndex, originalQuote, cipher, hintedChars, getLetterIndices]);

    // Handle keyboard input (Physical Keyboard)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (solved || loading) return;

            const key = e.key.toUpperCase();

            // Navigation
            if (e.key === 'ArrowRight') {
                moveCursor(1);
                return;
            }
            if (e.key === 'ArrowLeft') {
                moveCursor(-1);
                return;
            }

            // Typing
            if (isLetter(key)) {
                if (cursorIndex !== null && selectedEncryptedChar) {
                    handleGuess(key);
                    moveCursorToNextUnfilled();
                }
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                if (cursorIndex !== null && selectedEncryptedChar) {
                    handleGuess(null);
                    if (e.key === 'Backspace') {
                        moveCursorLeft();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cursorIndex, selectedEncryptedChar, solved, loading, moveCursor, handleGuess, moveCursorToNextUnfilled, moveCursorLeft]);


    const giveHint = () => {
        if (solved || !originalQuote) return;

        const availableHints = [];
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

        alphabet.forEach(plainChar => {
            if (!originalQuote.includes(plainChar)) return;

            const encrypted = cipher[plainChar];
            if (hintedChars.has(encrypted)) return;

            const currentGuess = userGuesses[encrypted];
            if (currentGuess !== plainChar) {
                availableHints.push(encrypted);
            }
        });

        if (availableHints.length > 0) {
            const randomEncrypted = availableHints[Math.floor(Math.random() * availableHints.length)];
            const correctPlain = reverseCipher[randomEncrypted];

            setHintedChars(prev => new Set(prev).add(randomEncrypted));

            setUserGuesses(prev => {
                const newGuesses = { ...prev };
                newGuesses[randomEncrypted] = correctPlain;

                // duplicated win check logic
                const isComplete = originalQuote.split('').every(char => {
                    if (!isLetter(char)) return true;
                    const encrypted = cipher[char];
                    return newGuesses[encrypted] === char;
                });

                if (isComplete) {
                    setSolved(true);
                    setShowConfetti(true);
                    setCursorIndex(null);
                    setCheckMode(false);
                }

                return newGuesses;
            });

            // Find the first occurrence of this encrypted char to select it visually
            const firstIndex = originalQuote.indexOf(reverseCipher[randomEncrypted]);
            if (firstIndex !== -1) setCursorIndex(firstIndex);
        }
    };

    const toggleCheckWork = () => {
        setCheckMode(!checkMode);
    };

    const clearMistakes = () => {
        if (solved) return;
        setUserGuesses(prev => {
            const newGuesses = { ...prev };
            Object.keys(newGuesses).forEach(enc => {
                if (hintedChars.has(enc)) return;
                delete newGuesses[enc];
            });
            return newGuesses;
        });
        setCheckMode(false);
    };

    return (
        <div
            className="h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200 flex flex-col overflow-hidden"
            onClick={() => setCursorIndex(null)}
        >
            <Header loading={loading} onNewGame={() => startNewGame()} />

            <main className="flex-grow overflow-y-auto w-full bg-slate-50 relative">
                <div className="max-w-4xl mx-auto px-4 py-6 pb-64">

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400 animate-pulse">
                            <p>Fetching a thought...</p>
                        </div>
                    ) : (
                        <>
                            <div className="w-full bg-white p-4 sm:p-8 rounded-xl shadow-sm border border-slate-200 min-h-[150px] flex flex-col justify-center mb-6">
                                <QuoteDisplay
                                    quote={originalQuote}
                                    cipher={cipher}
                                    userGuesses={userGuesses}
                                    cursorIndex={cursorIndex}
                                    selectedEncryptedChar={selectedEncryptedChar}
                                    checkMode={checkMode}
                                    solved={solved}
                                    hintedChars={hintedChars}
                                    onSelectChar={setCursorIndex}
                                />

                                {/* Author Reveal */}
                                <div className={`
                        mt-8 text-center transition-all duration-700 overflow-hidden
                        ${solved ? 'opacity-100 max-h-20 translate-y-0' : 'opacity-0 max-h-0 translate-y-4'}
                    `}>
                                    <div className="inline-flex items-center gap-2 text-green-700 font-medium px-4 py-2 bg-green-50 rounded-full border border-green-200">
                                        <Trophy size={18} />
                                        <span>Solved! &mdash; <span className="font-bold">{author}</span></span>
                                    </div>
                                </div>
                            </div>

                            {solved && (
                                <div className="flex justify-center animate-bounce mt-8">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); startNewGame(); }}
                                        className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all"
                                    >
                                        Play Again
                                    </button>
                                </div>
                            )}

                            <footer className="mt-8 text-center text-slate-400 text-xs">
                                Cryptogram Challenge • Data provided by {source || 'Unknown'}
                            </footer>
                        </>
                    )}
                </div>
            </main>

            {!solved && !loading && (
                <>
                    <div
                        className="flex-none bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GameControls
                            onHint={giveHint}
                            onCheck={toggleCheckWork}
                            onClear={clearMistakes}
                            checkMode={checkMode}
                            selectedEncryptedChar={selectedEncryptedChar}
                            hintedChars={hintedChars}
                        />
                        <Keyboard
                            onGuess={(char) => {
                                handleGuess(char);
                                moveCursorToNextUnfilled();
                            }}
                            onDelete={() => {
                                handleGuess(null);
                                moveCursorLeft();
                            }}
                            selectedEncryptedChar={selectedEncryptedChar}
                            solved={solved}
                            hintedChars={hintedChars}
                            usedLetters={new Set(Object.values(userGuesses))}
                            duplicateLetters={duplicateLetters}
                        />
                    </div>
                </>
            )}

            {solved && showConfetti && (
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-fall"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `-5%`,
                                animationDuration: `${Math.random() * 3 + 2}s`,
                                animationDelay: `${Math.random() * 2}s`,
                                fontSize: `${Math.random() * 20 + 10}px`
                            }}
                        >
                            {['🎉', '✨', '👏', '⭐'][Math.floor(Math.random() * 4)]}
                        </div>
                    ))}
                </div>
            )}
            <style>{`
        @keyframes fall {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        .animate-fall {
            animation-name: fall;
            animation-timing-function: linear;
            animation-iteration-count: 1;
        }
      `}</style>
        </div>
    );
}
