import React from 'react';
import { Lightbulb, CheckCircle, Info, Eraser } from 'lucide-react';

export default function GameControls({ onHint, onCheck, onClear, checkMode, selectedEncryptedChar, hintedChars }) {
    return (
        <div className="max-w-2xl mx-auto px-2 py-3 pb-safe">
            {/* Action Bar */}
            <div className="flex justify-between gap-2 mb-3 px-1">
                <button
                    onClick={onHint}
                    className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors font-medium text-xs sm:text-sm border border-amber-200 active:scale-95"
                >
                    <Lightbulb size={16} /> <span>Hint</span>
                </button>

                <button
                    onClick={onCheck}
                    className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-2 rounded-lg transition-colors font-medium text-xs sm:text-sm border active:scale-95
            ${checkMode
                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                >
                    {checkMode ? <CheckCircle size={16} /> : <Info size={16} />}
                    <span>{checkMode ? 'Errors' : 'Check'}</span>
                </button>

                <button
                    onClick={onClear}
                    className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-2 bg-white text-slate-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors font-medium text-xs sm:text-sm border border-slate-200 active:scale-95"
                >
                    <Eraser size={16} /> <span>Clear</span>
                </button>
            </div>

            {/* Helper Text */}
            <div className="text-center text-xs text-slate-400 mb-2 h-4 overflow-hidden">
                {selectedEncryptedChar && hintedChars.has(selectedEncryptedChar) ? (
                    <span className="text-green-600 font-bold">Hint revealed!</span>
                ) : selectedEncryptedChar ? (
                    <span>Editing <span className="font-bold text-slate-800">{selectedEncryptedChar}</span></span>
                ) : (
                    <span>Select a letter...</span>
                )}
            </div>
        </div>
    );
}
