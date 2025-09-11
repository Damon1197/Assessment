import { useEffect, useRef } from "react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string;
  readOnly?: boolean;
  className?: string;
  "data-testid"?: string;
}

export default function CodeEditor({
  value,
  onChange,
  language = "python",
  height = "400px",
  readOnly = false,
  className = "",
  "data-testid": testId,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Simple syntax highlighting classes
  const getSyntaxClass = (lang: string) => {
    const classes = {
      python: "syntax-python",
      javascript: "syntax-javascript",
      c: "syntax-c",
      cpp: "syntax-cpp",
    };
    return classes[lang as keyof typeof classes] || "syntax-default";
  };

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, parseInt(height)) + "px";
    }
  }, [value, height]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Tab key for indentation
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + "    " + value.substring(end);
      onChange(newValue);
      
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(start + 4, start + 4);
        }
      }, 0);
    }
  };

  const getLanguageDisplayName = (lang: string) => {
    const names = {
      python: "Python",
      javascript: "JavaScript",
      c: "C",
      cpp: "C++",
    };
    return names[lang as keyof typeof names] || lang.toUpperCase();
  };

  return (
    <div className={`border border-border rounded-lg overflow-hidden ${className}`} data-testid={testId}>
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
        <div className="flex items-center space-x-2">
          <i className="fas fa-code text-muted-foreground"></i>
          <span className="text-sm font-medium text-foreground">
            {getLanguageDisplayName(language)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              if (textareaRef.current) {
                textareaRef.current.select();
                document.execCommand('copy');
              }
            }}
            data-testid="button-copy-code"
          >
            <i className="fas fa-copy mr-1"></i>
            Copy
          </button>
          {!readOnly && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onChange("")}
              data-testid="button-clear-code"
            >
              <i className="fas fa-trash mr-1"></i>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Code Input Area */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          placeholder={`Enter your ${getLanguageDisplayName(language)} code here...`}
          className={`
            w-full p-4 bg-background text-foreground font-mono text-sm resize-none
            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
            ${getSyntaxClass(language)}
          `}
          style={{ 
            minHeight: height,
            lineHeight: "1.5",
            tabSize: 4,
          }}
          spellCheck={false}
          data-testid="textarea-code"
        />
        
        {/* Line Numbers */}
        <div className="absolute top-0 left-0 p-4 pointer-events-none text-muted-foreground font-mono text-sm select-none">
          {value.split('\n').map((_, index) => (
            <div key={index} className="leading-6">
              {index + 1}
            </div>
          ))}
        </div>
        
        {/* Code Content with Syntax Highlighting */}
        <div 
          className={`
            absolute top-0 left-0 w-full p-4 pointer-events-none font-mono text-sm
            whitespace-pre-wrap break-words ${getSyntaxClass(language)}
          `}
          style={{ 
            paddingLeft: "3rem", // Account for line numbers
            lineHeight: "1.5",
            color: "transparent", // Hide the text but keep layout
          }}
        >
          {value}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>Lines: {value.split('\n').length}</span>
          <span>Characters: {value.length}</span>
        </div>
        <div className="flex items-center space-x-2">
          {readOnly && (
            <span className="flex items-center">
              <i className="fas fa-lock mr-1"></i>
              Read Only
            </span>
          )}
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
}
