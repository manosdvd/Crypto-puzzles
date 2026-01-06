

export default function Keyboard({ onGuess, onDelete, selectedEncryptedChar, solved, hintedChars }) {
    const rows = [
        "QWERTYUIOP",
        "ASDFGHJKL",
        "ZXCVBNM"
    ];

    return (
        <div className="select-none touch-manipulation max-w-2xl mx-auto px-2 pb-3 bg-white">
            {rows.map((row, i) => (
                <div key={i} className="flex justify-center gap-1 mb-2">
                    {row.split('').map(key => {
                        return (
                            <button
                                key={key}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onGuess) onGuess(key);
                                }}
                                disabled={!selectedEncryptedChar || solved || hintedChars.has(selectedEncryptedChar)}
                                className={`
                  w-8 h-10 sm:w-9 sm:h-12 rounded shadow-sm text-sm sm:text-lg font-semibold transition-colors
                  active:scale-90 active:bg-blue-100
                  ${!selectedEncryptedChar || hintedChars.has(selectedEncryptedChar)
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-white text-slate-800 border border-slate-300 shadow-[0_2px_0_0_rgba(0,0,0,0.1)]'}
                `}
                            >
                                {key}
                            </button>
                        );
                    })}
                </div>
            ))}
            <div className="flex justify-center mt-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onDelete) onDelete();
                    }}
                    disabled={!selectedEncryptedChar || hintedChars.has(selectedEncryptedChar)}
                    className="px-8 py-2 bg-red-50 text-red-600 rounded-full text-sm font-medium hover:bg-red-100 disabled:opacity-50 border border-red-100 shadow-sm"
                >
                    Backspace / Erase
                </button>
            </div>
        </div>
    );
}
