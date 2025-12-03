import { useState } from 'react';
import { motion as m } from 'framer-motion';
import { Rocket, Settings, Type, Users, AlertTriangle, FileText, ChevronDown, Clock, Ban, EyeOff, Sparkles, Skull, Zap } from 'lucide-react';

// Create Room Card: Select word count and create room. Shows Start when host and room is ready.
export default function CreateRoomForm({
  wordCount: initialWordCount = 25,
  onWordCountChange,
  onCreate,
  canStart = false,
  isHost = false,
  onStart,
}) {
  const [wordCount, setWordCount] = useState(null); // null = use difficulty, number = use word count
  const [roomName, setRoomName] = useState('');
  const [modifiers, setModifiers] = useState([]);
  const [useCustomText, setUseCustomText] = useState(false);
  const [customText, setCustomText] = useState('');
  const [teamMode, setTeamMode] = useState(false);
  const [difficulty, setDifficulty] = useState(''); // Empty by default to show placeholder
  const [timeLimit, setTimeLimit] = useState(60); // Default 60 seconds
  const [wordCountFocused, setWordCountFocused] = useState(false);
  const [difficultyFocused, setDifficultyFocused] = useState(false);
  const [timeLimitFocused, setTimeLimitFocused] = useState(false);


  const toggleModifier = (mod) => {
    setModifiers(prev => 
      prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
    );
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-slate-900/70 backdrop-blur-md rounded-xl border border-slate-800 shadow-lg p-4 sm:p-6 flex flex-col self-start max-h-[80vh] sm:max-h-[600px] min-h-0"
      aria-label="Create Room Card"
    >
      <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            Create Room
          </h2>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Configure your race settings</p>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-5 flex-1 min-h-0 overflow-y-auto scrollbar-hide pr-1 sm:pr-2">
        {/* Room Name */}
        <div className="flex flex-col">
          <label htmlFor="roomName" className="text-xs font-medium text-slate-300 mb-1.5">Room Name</label>
          <input
            id="roomName"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="e.g. Friday Night Sprint"
            className="w-full bg-slate-800/50 text-slate-100 border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-slate-600"
          />
        </div>

        {/* Mode Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
            useCustomText 
              ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/20' 
              : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
          }`}>
            <input
              type="checkbox"
              checked={useCustomText}
              onChange={(e) => setUseCustomText(e.target.checked)}
              className="hidden"
            />
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
              useCustomText ? 'border-emerald-500 bg-emerald-500' : 'border-slate-500'
            }`}>
              {useCustomText && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
            </div>
            <div className="flex flex-col">
              <span className={`text-sm font-medium ${useCustomText ? 'text-emerald-400' : 'text-slate-300'}`}>Custom Text</span>
              <span className="text-[10px] text-slate-500">Paste your own content</span>
            </div>
          </label>

          <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
            teamMode 
              ? 'bg-blue-500/10 border-blue-500/50 ring-1 ring-blue-500/20' 
              : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
          }`}>
            <input
              type="checkbox"
              checked={teamMode}
              onChange={(e) => setTeamMode(e.target.checked)}
              className="hidden"
            />
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
              teamMode ? 'border-blue-500 bg-blue-500' : 'border-slate-500'
            }`}>
              {teamMode && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
            </div>
            <div className="flex flex-col">
              <span className={`text-sm font-medium ${teamMode ? 'text-blue-400' : 'text-slate-300'}`}>Team Battle</span>
              <span className="text-[10px] text-slate-500">Red vs Blue teams</span>
            </div>
          </label>
        </div>

        {/* Settings: Word Count/Difficulty or Custom Text */}
        {!useCustomText ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex flex-col">
              <label htmlFor="wordCount" className="text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-emerald-500" />
                Word Count
              </label>
              <div className="relative group">
                <select
                  id="wordCount"
                  value={wordCount || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : Number(e.target.value);
                    setWordCount(val);
                    onWordCountChange?.(val);
                  }}
                  onFocus={() => setWordCountFocused(true)}
                  onBlur={() => setWordCountFocused(false)}
                  className="w-full bg-slate-800/50 text-slate-100 border border-slate-700 rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none cursor-pointer [&>option]:bg-slate-800 [&>option]:text-slate-100"
                >
                  <option value="" className="bg-slate-800 text-slate-100">Set Words</option>
                  {[10, 25, 50, 75, 100].map((n) => (
                    <option key={n} value={n} className="bg-slate-800 text-slate-100">{n} words</option>
                  ))}
                </select>
                <m.div
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  animate={{ rotate: wordCountFocused ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-300 transition-colors" />
                </m.div>
              </div>
            </div>
            <div className="flex flex-col">
              <label htmlFor="difficulty" className="text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Difficulty
              </label>
              <div className="relative group">
                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  onFocus={() => setDifficultyFocused(true)}
                  onBlur={() => setDifficultyFocused(false)}
                  className="w-full bg-slate-800/50 text-slate-100 border border-slate-700 rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none cursor-pointer [&>option]:bg-slate-800 [&>option]:text-slate-100"
                >
                  <option value="" disabled className="bg-slate-800 text-slate-100">Set Difficulty</option>
                  <option value="easy" className="bg-slate-800 text-slate-100">Easy (Common)</option>
                  <option value="medium" className="bg-slate-800 text-slate-100">Medium (Mixed)</option>
                  <option value="hard" className="bg-slate-800 text-slate-100">Hard (Complex)</option>
                  <option value="code" className="bg-slate-800 text-slate-100">Code (Syntax)</option>
                  <option value="quote" className="bg-slate-800 text-slate-100">Quotes (Famous)</option>
                </select>
                <m.div
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  animate={{ rotate: difficultyFocused ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-300 transition-colors" />
                </m.div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <label htmlFor="customText" className="text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              Custom Text (50-500 chars)
            </label>
            <textarea
              id="customText"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Paste your text here..."
              rows={4}
              className="w-full bg-slate-800/50 text-slate-100 border border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none placeholder:text-slate-600 text-sm"
            />
            <div className="flex items-center justify-end mt-1.5 gap-2">
              <span className={`text-[10px] font-medium ${
                customText.trim().length > 0 && (customText.trim().length < 50 || customText.trim().length > 500) ? 'text-rose-400' : 'text-slate-500'
              }`}>
                {customText.trim().length}/500
              </span>
            </div>
          </div>
        )}

        {/* Time Limit Selector */}
        <div className="flex flex-col">
          <label htmlFor="timeLimit" className="text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            Time Limit {timeLimit === 60 && <span className="text-[10px] text-slate-500 font-normal">(default mode)</span>}
          </label>
          <div className="relative group">
            <select
              id="timeLimit"
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              onFocus={() => setTimeLimitFocused(true)}
              onBlur={() => setTimeLimitFocused(false)}
              className="w-full bg-slate-800/50 text-slate-100 border border-slate-700 rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none cursor-pointer [&>option]:bg-slate-800 [&>option]:text-slate-100"
            >
              {[10, 15, 30, 45, 60, 120].map((seconds) => (
                <option key={seconds} value={seconds} className="bg-slate-800 text-slate-100">{seconds}s</option>
              ))}
            </select>
            <m.div
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              animate={{ rotate: timeLimitFocused ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-300 transition-colors" />
            </m.div>
          </div>
        </div>

        {/* Race Modifiers Grid */}
        <div className="flex flex-col">
          <label className="text-[10px] sm:text-xs font-medium text-slate-300 mb-2">Modifiers</label>
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 'no-backspace', label: 'No Backspace', Icon: Ban, color: 'text-rose-400', desc: 'Prevents using backspace or delete keys' },
              { id: 'blind', label: 'Blind Mode', Icon: EyeOff, color: 'text-purple-400', desc: 'Text fades as you type, hiding your progress' },
              { id: 'zen', label: 'Zen Mode', Icon: Sparkles, color: 'text-sky-400', desc: 'No time limit, type at your own pace' },
              { id: 'sudden-death', label: 'Sudden Death', Icon: Skull, color: 'text-orange-400', desc: 'Eliminated after making mistakes (host controls limit)' },
              { id: 'sprint', label: 'Sprint (15w)', Icon: Zap, color: 'text-yellow-400', desc: 'Short 15-word race for quick matches' },
            ].map((mod) => {
              const IconComponent = mod.Icon;
              return (
                <label 
                  key={mod.id} 
                  className={`flex flex-col gap-1.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    modifiers.includes(mod.id)
                      ? 'bg-slate-800 border-emerald-500/50 ring-1 ring-emerald-500/20'
                      : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600'
                  }`}
                  title={mod.desc}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={modifiers.includes(mod.id)}
                        onChange={() => toggleModifier(mod.id)}
                        className={`w-3.5 h-3.5 rounded border-2 transition-all appearance-none cursor-pointer focus:ring-offset-0 focus:ring-1 focus:ring-emerald-500 ${
                          modifiers.includes(mod.id)
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'bg-slate-800/50 border-slate-600 hover:border-slate-500'
                        }`}
                      />
                      {modifiers.includes(mod.id) && (
                        <svg
                          className="absolute w-2.5 h-2.5 pointer-events-none"
                          fill="none"
                          viewBox="0 0 12 12"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.5 6L5 8.5L9.5 4"
                            className="text-slate-900"
                          />
                        </svg>
                      )}
                    </div>
                    <IconComponent className={`w-4 h-4 ${mod.color} ${modifiers.includes(mod.id) ? 'opacity-100' : 'opacity-60'}`} strokeWidth={2} />
                    <span className={`text-xs font-medium ${modifiers.includes(mod.id) ? 'text-slate-200' : 'text-slate-400'}`}>
                      {mod.label}
                    </span>
                  </div>
                  <span className={`text-[10px] ${modifiers.includes(mod.id) ? 'text-slate-400' : 'text-slate-500'}`}>
                    {mod.desc}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-800/50 flex-shrink-0">
        <m.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            const trimmedText = customText.trim();
            if (useCustomText && (trimmedText.length < 50 || trimmedText.length > 500)) return;
            const roomOptions = {
              wordCount: useCustomText ? null : wordCount, 
              roomName, 
              modifiers,
              customText: useCustomText ? trimmedText : null,
              teamMode,
              difficulty: difficulty || 'easy', // Default to 'easy' if not set
              timeLimit: timeLimit || 60 // Default to 60 seconds
            };
            console.log('[CreateRoomForm] Creating room with options:', { modifiers, wordCount, difficulty, teamMode, useCustomText, timeLimit });
            onCreate?.(roomOptions);
          }}
          disabled={useCustomText && (customText.trim().length < 50 || customText.trim().length > 500)}
          className="flex-1 relative px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-900 font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 hover:shadow-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          aria-label="Create Room"
        >
          <span className="inline-flex items-center gap-2">
            <Rocket size={18} strokeWidth={2.5} /> Create Room
          </span>
        </m.button>

        {isHost && (
          <m.button
            whileTap={{ scale: 0.98 }}
            onClick={onStart}
            disabled={!canStart}
            className="px-6 py-2.5 rounded-lg bg-slate-800 text-slate-200 font-semibold border border-slate-700 hover:border-emerald-500/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all"
            aria-label="Start Game"
          >
            Start
          </m.button>
        )}
      </div>
    </m.div>
  );
}
