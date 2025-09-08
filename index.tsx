// @ts-nocheck
import React, { useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

function App() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  const [htmlResult, setHtmlResult] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copySuccess, setCopySuccess] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLLabelElement>(null);

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setOriginalFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target && typeof e.target.result === 'string') {
            setImageSrc(e.target.result);
            setError('');
            setHtmlResult('');
          }
        };
        reader.readAsDataURL(file);
      } else {
        setError('Please upload a valid image file (PNG, JPG, etc.).');
      }
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.add('dragging');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove('dragging');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove('dragging');
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange(files);
    }
  }, []);
  
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if(file) {
            handleFileChange({ 0: file, length: 1, item: (index) => file });
        }
        break;
      }
    }
  }, []);

  React.useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
           resolve((reader.result as string).split(',')[1]);
        }
      };
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  const handleConvert = async () => {
    if (!originalFile) {
      setError('Please upload an image first.');
      return;
    }
    if (!ai) {
      setError("Google GenAI client is not initialized. Make sure the API_KEY is set.");
      return;
    }

    setIsLoading(true);
    setError('');
    setHtmlResult('');
    
    try {
      // Step 1: Extract text with high accuracy
      setLoadingMessage('1/2 단계: 텍스트 추출 중...');
      const imagePart = await fileToGenerativePart(originalFile);
      const ocrPrompt = "Perform OCR on the image. Extract all text exactly as it appears, without any modification, correction, or interpretation. Preserve all symbols, spacing, and line breaks precisely. Do not add any commentary. Output only the raw text content.";
      
      const ocrResult = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, {text: ocrPrompt}] }
      });
      const extractedText = ocrResult.text.trim();

      if (!extractedText) {
        throw new Error("Could not extract any text from the image.");
      }

      // Step 2: Convert extracted text to HTML
      setLoadingMessage('2/2 단계: HTML 구조화 중...');
      const htmlPrompt = `Based ONLY on the following text, convert it to semantic HTML.

      Text to convert:
      ---
      ${extractedText}
      ---
      
      Follow these rules STRICTLY:
      1.  **PRESERVE ORIGINAL TEXT CONTENT.** Output the text exactly as it is provided. Do not correct spelling, grammar, or spacing, with the specific exception of list markers detailed below.
      2.  **ABSOLUTELY NO CHARACTER SUBSTITUTION.** Do not replace characters, for example, do not change '*' to '★' or '-' to '–'. The original characters must be preserved.
      3.  For bulleted lists (lines starting with characters like -, *, •, ㆍ), use <ul> and <li> tags. **Crucially, you must REMOVE the leading bullet character and any subsequent space from the text inside the <li> tag.** For example, convert the line "ㆍ Event details" into "<li>Event details</li>". Do NOT convert it to "<li>ㆍ Event details</li>".
      4.  For numbered lists (lines starting with "1.", "2)", etc.), use <ol> and <li> tags. Similarly, **REMOVE the leading number/marker from the text inside the <li> tag.** For example, convert "1. First item" into "<li>First item</li>".
      5.  Use <strong> for text that appears to be emphasized (bold, important notices).
      6.  **TABLES:** ONLY use a table structure (<figure class="table">, <table>, etc.) if the source text is undeniably and visually laid out as a grid with clear rows and columns. **Do NOT reformat simple line-by-line text or lists into a table, even if you think it would improve readability.** If it's not a table in the image, do not make it a table in the HTML. Do not use colspan or rowspan.
      7.  Include all other symbols like ⚠, ※ as plain text within the HTML (unless they are list markers at the start of a line).
      8.  Exclude purely visual elements that are not text, such as "NEW" badges, icons, or "바로가기" buttons.
      9.  Output only the final HTML code. Do not include any explanations, markdown formatting, or any text outside the HTML structure.`;

      const htmlResultResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: htmlPrompt
      });

      setHtmlResult(htmlResultResponse.text);
      setActiveTab('preview');

    } catch (e: any) {
      setError(e.message || 'An error occurred during conversion.');
      console.error(e);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };
  
  const handleCopy = (content: string, type: 'code' | 'preview') => {
    if (type === 'preview') {
        const blob = new Blob([content], { type: 'text/html' });
        const clipboardItem = new ClipboardItem({ 'text/html': blob });
        navigator.clipboard.write([clipboardItem]).then(() => {
            setCopySuccess('Formatted preview copied to clipboard!');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    } else {
        navigator.clipboard.writeText(content).then(() => {
            setCopySuccess('HTML code copied to clipboard!');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    }
  };


  return (
    <div className="container">
      <header>
        <h1>Image to HTML Converter</h1>
        <p>Upload an image to convert its text content into structured HTML.</p>
      </header>
      <main>
        <div className="card">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileChange(e.target.files)}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <label
            ref={dropZoneRef}
            className="drop-zone"
            onClick={triggerFileSelect}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {imageSrc ? (
              <img src={imageSrc} alt="Uploaded preview" className="preview-image" />
            ) : (
              <div className="drop-zone-prompt">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
                <span>Drag & drop, click, or paste an image here.</span>
              </div>
            )}
          </label>
        </div>
        
        <button onClick={handleConvert} disabled={isLoading || !imageSrc}>
          {isLoading ? 'Converting...' : 'Convert to HTML'}
        </button>

        {isLoading && <div className="loader">
            <div className="spinner"></div>
            <span>{loadingMessage}</span>
        </div>}
        
        {error && <div className="error-message">{error}</div>}
        
        {htmlResult && (
          <div className="card result-card">
            <div className="tabs">
              <button className={activeTab === 'preview' ? 'active' : ''} onClick={() => setActiveTab('preview')}>Preview</button>
              <button className={activeTab === 'code' ? 'active' : ''} onClick={() => setActiveTab('code')}>HTML Code</button>
            </div>
            
            <div className="tab-content">
              {activeTab === 'preview' ? (
                <div className="preview-panel">
                  <button className="copy-btn preview-copy-btn" onClick={() => handleCopy(htmlResult, 'preview')}>Copy</button>
                  <div dangerouslySetInnerHTML={{ __html: htmlResult }} />
                </div>
              ) : (
                <div className="code-panel">
                  <button className="copy-btn" onClick={() => handleCopy(htmlResult, 'code')}>Copy</button>
                  <pre><code>{htmlResult}</code></pre>
                </div>
              )}
            </div>
          </div>
        )}
        {copySuccess && <div className="copy-alert">{copySuccess}</div>}
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);