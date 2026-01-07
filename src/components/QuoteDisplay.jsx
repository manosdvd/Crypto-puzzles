
import { isLetter } from '../utils/cipher';

export default function QuoteDisplay({
    quote,
    cipher,
    userGuesses,
    cursorIndex,
    selectedEncryptedChar,
    checkMode,
    solved,
    hintedChars,
    onSelectChar
}) {
    let globalCharIndex = 0; // Reset this before rendering the quote

    const renderWord = (word, wordIndex, isLast) => (
        <div key={wordIndex} className={`flex flex-nowrap max-w-full gap-0.5 sm:gap-1 ${isLast ? '' : 'mr-3 sm:mr-8'} mb-4 sm:mb-6`}>
            {word.split('').map((char, charIndex) => {
                const currentIdx = globalCharIndex++; // Capture current global index

                if (!isLetter(char)) {
                    return (
                        <div key={charIndex} className="flex flex-col justify-end w-3 sm:w-6 h-14 sm:h-20 pb-2 items-center shrink min-w-0">
                            <span className="text-lg sm:text-3xl text-slate-800 font-bold">{char}</span>
                        </div>
                    );
                }

                const encryptedChar = cipher[char];
                const isCursor = cursorIndex === currentIdx;
                const isSelectedGroup = selectedEncryptedChar === encryptedChar;
                const userGuess = userGuesses[encryptedChar] || '';
                const isHinted = hintedChars.has(encryptedChar);

                // Validation styles
                const isWrong = checkMode && userGuess !== char;
                const isCorrect = solved || (checkMode && userGuess === char) || isHinted;

                return (
                    <div
                        key={charIndex}
                        id={`char-${currentIdx}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelectChar(currentIdx);
                        }}
                        className={`
              flex flex-col items-center cursor-pointer transition-all duration-150 group
              w-7 xs:w-8 sm:w-12 relative shrink min-w-0
            `}
                    >

                        <div className={`
               text-[10px] sm:text-sm font-semibold mb-0.5 sm:mb-1 select-none transition-colors
               ${isSelectedGroup ? 'text-blue-600 font-bold scale-110' : 'text-slate-400'}
               ${isHinted ? 'text-green-600' : ''}
            `}>
                            {encryptedChar}
                        </div>

                        <div className={`
              w-full aspect-square border-2 rounded sm:rounded-lg flex items-center justify-center
              text-lg sm:text-2xl font-bold uppercase select-none transition-all
              ${isCursor ? 'border-blue-600 bg-blue-100 shadow-md transform -translate-y-1' : ''}
              ${isSelectedGroup && !isCursor ? 'bg-blue-50 border-blue-400' : ''}
              ${!isSelectedGroup && !isCursor ? 'border-slate-300 hover:border-slate-400 bg-white' : ''}
              
              /* Hint / Correct Styles */
              ${isHinted ? 'bg-green-100 border-green-400 text-green-800' : ''}
              ${solved ? 'text-green-600 border-green-500' : 'text-slate-800'}
              
              /* Check Mode Styles */
              ${isWrong ? 'bg-red-50 border-red-400 text-red-600' : ''}
              ${checkMode && isCorrect && !solved ? 'text-green-600 border-green-400' : ''}
            `}>
                            {userGuess}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="flex flex-wrap justify-center content-center">
            {/* Reset globalCharIndex before rendering */}
            {(() => { globalCharIndex = 0; return null; })()}
            {quote && quote.split(' ').map((word, i, arr) => {
                const el = renderWord(word, i, i === arr.length - 1);
                globalCharIndex++; // Add 1 for the space after the word
                return el;
            })}
        </div>
    );
}
