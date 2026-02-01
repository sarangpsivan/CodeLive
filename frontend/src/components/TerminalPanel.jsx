import React, { useEffect, useRef } from 'react';
import { VscTerminal, VscClose } from 'react-icons/vsc';

const TerminalPanel = ({ lines, inputValue, onInputChange, onSubmit, onClose, isExecuting }) => {
    const endOfTerminalRef = useRef(null);

    useEffect(() => {
        endOfTerminalRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [lines]);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        onSubmit();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    return (

        <div className="h-full w-full flex flex-col bg-transparent border-l border-white/5 font-sans">

            <div className="h-10 px-4 border-b border-white/5 flex items-center justify-between bg-white/5 flex-shrink-0 backdrop-blur-md">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <VscTerminal className="text-[var(--primary-purple)]" size={16} />
                    <h3 className="text-xs uppercase tracking-wide text-gray-300">Terminal</h3>
                </div>
                <button
                    onClick={onClose}
                    title="Close Panel"
                    className="text-gray-400 hover:text-white transition p-1 rounded hover:bg-white/10"
                >
                    <VscClose size={16} />
                </button>
            </div>

            <div className="flex-grow overflow-y-auto p-4 font-mono text-sm space-y-1 scrollbar-hide text-gray-300 custom-scrollbar">
                {lines.length === 0 && (
                    <div className="text-gray-500 italic text-center mt-10 text-xs">
                        Ready to execute code...
                    </div>
                )}
                {lines.map((line, index) => (
                    <div key={index} className="whitespace-pre-wrap break-words">
                        {line.type === 'output' && (
                            <span>{line.content}</span>
                        )}
                        {line.type === 'input' && (
                            <span className="text-cyan-400 font-bold">{line.content}</span>
                        )}
                    </div>
                ))}
                <div ref={endOfTerminalRef} />
            </div>

            <div className="p-3 border-t border-white/5 bg-white/5 flex-shrink-0 backdrop-blur-md">
                <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Standard Input</span>
                    <span className="text-[10px] text-gray-500">Press Enter to send</span>
                </div>

                <form onSubmit={handleFormSubmit} className="flex gap-2">
                    <div className="flex-grow flex items-center bg-[#0d1117]/50 rounded-lg px-3 py-2 border border-white/10 focus-within:ring-1 focus-within:ring-[var(--primary-purple)] shadow-inner">
                        <span className="text-green-500 font-mono text-sm mr-2 select-none">➜</span>
                        <input
                            type="text"
                            className="flex-grow bg-transparent text-white font-mono text-sm focus:outline-none placeholder-gray-600"
                            placeholder={isExecuting ? 'Program is running...' : "Type input here..."}
                            value={inputValue}
                            onChange={(e) => onInputChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isExecuting}
                            autoComplete="off"
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TerminalPanel;
