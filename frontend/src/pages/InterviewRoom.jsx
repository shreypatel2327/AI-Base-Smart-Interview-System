import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Bot, Mic, MicOff, Video, MonitorUp, Phone, Flag, Sparkles, MoreHorizontal, LayoutTemplate, Hexagon } from 'lucide-react';
import api from '../services/api';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const InterviewRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const endOfMessagesRef = useRef(null);
  
  const [question, setQuestion] = useState(location.state?.initialData?.question || 'Loading next question...');
  const [questionIndex, setQuestionIndex] = useState(location.state?.initialData?.questionIndex || 1);
  const [maxQuestions, setMaxQuestions] = useState(location.state?.initialData?.maxQuestions || 5);
  
  const [answer, setAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // New states for the redesign
  const [transcriptHistory, setTranscriptHistory] = useState([]);
  const [sessionTime, setSessionTime] = useState(0);

  // Initialize transcript with the first question
  useEffect(() => {
    if (question && transcriptHistory.length === 0 && question !== 'Loading next question...') {
      setTranscriptHistory([{ role: 'ai', text: question }]);
    }
  }, [question, transcriptHistory.length]);

  // Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Scroll to bottom of transcript when it changes or when answer is actively typed
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptHistory, answer]);

  const speakQuestion = (textToSpeak) => {
    if (!window.speechSynthesis) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (englishVoice) utterance.voice = englishVoice;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (question && question !== 'Loading next question...') {
      // Small delay to ensure smooth transition
      setTimeout(() => speakQuestion(question), 500);
    }
    
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [question]);

  useEffect(() => {
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        setAnswer((prev) => prev + finalTranscript);
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      setRecognition(rec);
    } else {
      console.warn('SpeechRecognition API not supported in this browser.');
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognition?.stop();
      setIsRecording(false);
    } else {
      setAnswer(''); // Clear previous answer before new recording
      recognition?.start();
      setIsRecording(true);
    }
  };

  const handleFinishInterview = async () => {
    // If there is a recorded answer, submit it before finishing
    if (answer.trim()) {
      await handleSubmit();
    } else {
      navigate(`/report/${id}`);
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    
    if (isRecording) {
      recognition?.stop();
      setIsRecording(false);
    }
    
    if (window.speechSynthesis) {
       window.speechSynthesis.cancel();
    }

    const currentAnswer = answer;
    
    // Add user's answer to the transcript
    setTranscriptHistory(prev => [...prev, { role: 'user', text: currentAnswer }]);

    setIsSubmitting(true);
    setAnswer('');

    try {
      const { data } = await api.post(`/interviews/${id}/answer`, { answer: currentAnswer });
      
      if (data.data.completed) {
        navigate(`/report/${id}`);
      } else {
        const nextQ = data.data.question;
        setQuestion(nextQ);
        setQuestionIndex(data.data.questionIndex);
        
        // Add AI's new question to the transcript
        setTranscriptHistory(prev => [...prev, { role: 'ai', text: nextQ }]);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit answer');
      // On failure, allow retry (put the answer back)
      setAnswer(currentAnswer);
      // Remove the last added transcript
      setTranscriptHistory(prev => prev.slice(0, -1));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --dark-bg: #f4f7fb;
          --panel-bg: rgba(255, 255, 255, 0.95);
          --panel-border: rgba(0, 0, 0, 0.05);
          --bubble-ai: #f8fafc;
          --bubble-user: #005af0;
          --accent-purple: #005af0;
          --accent-purple-glow: rgba(0, 90, 240, 0.4);
          --text-main: #0f172a;
          --text-muted: #64748b;
        }

        body, html {
          margin: 0;
          padding: 0;
          background-color: var(--dark-bg);
          color: var(--text-main);
          font-family: "Inter", sans-serif;
          height: 100vh;
          overflow: hidden;
        }

        /* Clean overrides for root layout just for this page */
        #root {
          background-color: var(--dark-bg);
        }

        /* Top Navbar */
        .top-navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 40px;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 10;
        }

        .brand-sect {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-logo {
          color: #fff;
          background: #005af0;
          padding: 8px;
          border-radius: 8px;
        }

        .brand-name {
          font-size: 1.25rem;
          font-family: "Inter", sans-serif;
          font-weight: 700;
          letter-spacing: -0.5px;
          color: var(--text-main);
        }

        .pill-badge {
          background-color: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 6px 14px;
          border-radius: 50px;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: var(--text-muted);
          margin-left: 10px;
        }

        .status-sect {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .rec-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #ffffff;
          border: 1px solid rgba(0,0,0,0.05);
          padding: 8px 16px;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 600;
          box-shadow: 0 4px 10px rgba(0,0,0,0.02);
        }

        .rec-dot {
          width: 8px;
          height: 8px;
          background-color: #EF4444;
          border-radius: 50%;
          box-shadow: 0 0 10px #EF4444;
          animation: pulse-red 2s infinite;
        }

        .timer-text {
          font-family: monospace;
          font-size: 1.2rem;
          font-weight: 500;
          letter-spacing: 1px;
        }

        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        /* Main Workspace Layout */
        .workspace {
          display: grid;
          grid-template-columns: 1fr 450px;
          height: 100vh;
          padding-top: 80px; /* Space for navbar */
          gap: 24px;
          padding-right: 24px;
        }

        /* Left Central Area */
        .main-stage {
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .question-card-wrapper {
          position: absolute;
          top: 15%;
          left: 50%;
          transform: translateX(-50%);
          width: 80%;
          max-width: 800px;
        }

        .question-card {
          background-color: var(--panel-bg);
          border: 1px solid var(--panel-border);
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }

        .question-text {
          font-size: 1.4rem;
          line-height: 1.5;
          font-weight: 600;
          color: var(--text-main);
          margin-bottom: 24px;
        }

        .ai-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--accent-purple);
          font-size: 0.85rem;
          font-weight: 600;
          background: rgba(0, 90, 240, 0.1);
          padding: 6px 16px;
          border-radius: 50px;
        }

        .mic-container {
          position: absolute;
          top: 60%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .mic-button {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          border: none;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          z-index: 2;
        }

        .mic-button.idle {
          background-color: #ffffff;
          border: 1px solid rgba(0,0,0,0.05);
          color: #64748b;
          box-shadow: 0 10px 20px rgba(0,0,0,0.02);
        }

        .mic-button.recording {
          background-color: #005af0;
          background: linear-gradient(135deg, #2563eb 0%, #005af0 100%);
          color: white;
          box-shadow: 0 0 60px rgba(0, 90, 240, 0.4);
        }

        .mic-ripple {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: rgba(168, 85, 247, 0.3);
          z-index: 1;
          animation: ripple 2s infinite ease-out;
        }

        .mic-ripple:nth-child(2) {
          animation-delay: 1s;
        }

        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }

        /* Helper manual submit block overlay */
        .manual-submit-area {
           position: absolute;
           bottom: 120px;
           left: 50%;
           transform: translateX(-50%);
           display: flex;
           flex-direction: column;
           align-items: center;
           z-index: 20; /* make sure it is clickable above other wrappers */
        }
        
        .finish-button-center {
           background-color: #005af0;
           border: none;
           color: white;
           padding: 12px 24px;
           border-radius: 50px;
           font-size: 0.95rem;
           cursor: pointer;
           transition: all 0.2s;
           display: flex;
           align-items: center;
           gap: 8px;
        }
        .finish-button-center:hover:not(:disabled) {
           background-color: #0046c4;
        }
        .finish-button-center:disabled {
           opacity: 0.5;
           cursor: not-allowed;
        }

        /* Dock / Navbar */
        .bottom-dock {
          position: absolute;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(0,0,0,0.05);
          backdrop-filter: blur(20px);
          padding: 12px 24px;
          border-radius: 50px;
          display: flex;
          align-items: center;
          gap: 24px;
          z-index: 10;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }

        .dock-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .dock-btn:hover {
          background: rgba(0,0,0,0.05);
          color: var(--text-main);
        }

        .dock-btn.active-mic {
          background: #005af0;
          color: white;
        }

        /* Transcript Sidebar */
        .transcript-sidebar {
          background-color: #ffffff;
          border: 1px solid var(--panel-border);
          border-radius: 20px;
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
          box-shadow: 0 10px 30px rgba(0,0,0,0.02);
        }

        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid rgba(0,0,0,0.03);
        }

        .sidebar-header h2 {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-main);
          margin: 0;
        }

        .cc-icon {
          color: var(--text-muted);
        }

        .chat-area {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .chat-area::-webkit-scrollbar {
          width: 6px;
        }
        .chat-area::-webkit-scrollbar-track {
          background: transparent;
        }
        .chat-area::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }

        .bubble-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .bubble-label {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: var(--text-muted);
        }

        .ai-bubble-label {
          text-align: left;
        }

        .user-bubble-label {
          text-align: right;
        }

        .bubble {
          padding: 16px 20px;
          border-radius: 16px;
          font-size: 0.95rem;
          line-height: 1.5;
          max-width: 90%;
        }

        .bubble.ai {
          background-color: var(--bubble-ai);
          color: var(--text-main);
          border-top-left-radius: 4px;
          align-self: flex-start;
          border: 1px solid rgba(0,0,0,0.03);
        }

        .bubble.user {
          background-color: var(--bubble-user);
          color: #ffffff;
          border-top-right-radius: 4px;
          align-self: flex-end;
          border: 1px solid transparent;
        }

        .bubble.ongoing {
          opacity: 0.8;
          border-style: dashed;
        }

        .sidebar-footer {
          padding: 16px 24px;
          background: linear-gradient(to top, rgba(255, 255, 255, 1) 40%, rgba(255, 255, 255, 0));
        }

        .assessing-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: rgba(0, 90, 240, 0.1);
          color: #005af0;
          padding: 10px 16px;
          border-radius: 50px;
          font-size: 0.8rem;
          font-weight: 600;
          width: fit-content;
        }

        .assessing-icon {
          width: 14px;
          height: 14px;
        }
        
        .finish-wrap {
          position: absolute;
          bottom: 30px;
          right: 30px;
        }
        
        .btn-finish-sidebar {
           background-color: #ffffff;
           border: 1px solid rgba(0,0,0,0.1);
           color: #ef4444;
           padding: 12px 24px;
           border-radius: 50px;
           font-size: 0.95rem;
           font-weight: 600;
           cursor: pointer;
           display: flex;
           align-items: center;
           gap: 10px;
           transition: background-color 0.2s;
           box-shadow: 0 4px 10px rgba(0,0,0,0.02);
        }
        
        .btn-finish-sidebar:hover {
           background-color: #fee2e2;
        }

      `}} />

      {/* Top Navigation */}
      <div className="top-navbar">
        <div className="brand-sect">
          <div className="brand-logo">
            <Bot size={24} />
          </div>
          <span className="brand-name">InterviewAI</span>
          <span className="pill-badge">SMART INTERVIEW V2.0</span>
        </div>
        <div className="status-sect">
          <div className="rec-indicator">
            <div className="rec-dot"></div>
            REC
          </div>
          <div className="timer-text">
            {formatTime(sessionTime)}
          </div>
        </div>
      </div>

      <div className="workspace">
        
        {/* Main Stage (Left) */}
        <div className="main-stage">
          
          <div className="question-card-wrapper animate-slide-up">
            <div className="question-card">
              <h2 className="question-text">
                {question}
              </h2>
              <div className="ai-status">
                <Sparkles size={14} /> 
                {isSubmitting ? 'AI Analyzing Response...' : 'AI Generating follow-up...'}
              </div>
            </div>
          </div>

          <div className="mic-container">
            {isRecording && (
              <>
                <div className="mic-ripple"></div>
                <div className="mic-ripple"></div>
              </>
            )}
            <button 
              className={`mic-button ${isRecording ? 'recording' : 'idle'}`}
              onClick={toggleRecording}
              disabled={isSubmitting || isSpeaking}
              title={isRecording ? 'Stop Recording' : 'Start Recording'}
            >
              {isRecording ? <Mic size={48} /> : <MicOff size={48} />}
            </button>
          </div>

          <div className="manual-submit-area">
             {/* If user dictation has captured something, give them a button to manually submit immediately */}
             {(answer.trim() || isSubmitting) && (
               <button 
                 className="finish-button-center" 
                 onClick={handleSubmit} 
                 disabled={isSubmitting || !answer.trim()}
               >
                 {isSubmitting ? 'Analyzing...' : 'Submit Answer'}
               </button>
             )}
          </div>

          <div className="bottom-dock">
            <button className={`dock-btn ${isRecording ? 'active-mic' : ''}`} onClick={toggleRecording}>
              {isRecording ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button className="dock-btn"><Video size={20} /></button>
            <button className="dock-btn"><MonitorUp size={20} /></button>
            <button className="dock-btn"><div style={{width: '14px', height: '14px', borderRadius: '50%', border: '2px solid currentColor'}}></div></button>
            <button className="dock-btn" style={{ background: '#EF4444', color: 'white' }} onClick={handleFinishInterview}>
              <Phone size={20} style={{ transform: 'rotate(135deg)' }} />
            </button>
          </div>

        </div>

        {/* Transcript Sidebar (Right) */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 104px)' }}>
           <div className="transcript-sidebar" style={{ height: 'calc(100% - 80px)' }}>
             <div className="sidebar-header">
               <h2>Live Transcript</h2>
               <LayoutTemplate size={18} className="cc-icon" />
             </div>
             
             <div className="chat-area">
               {transcriptHistory.map((item, idx) => (
                 <div key={idx} className="bubble-group" style={{ alignSelf: item.role === 'ai' ? 'flex-start' : 'flex-end', width: '100%' }}>
                   <div className={`bubble-label ${item.role === 'ai' ? 'ai-bubble-label' : 'user-bubble-label'}`}>
                     {item.role === 'ai' ? 'AI INTERVIEWER' : 'YOU'}
                   </div>
                   <div className={`bubble ${item.role}`}>
                     {item.text}
                   </div>
                 </div>
               ))}
               
               {/* Ongoing Answer Bubble */}
               {isRecording && answer && (
                 <div className="bubble-group" style={{ alignSelf: 'flex-end', width: '100%' }}>
                   <div className="bubble-label user-bubble-label">YOU</div>
                   <div className="bubble user ongoing">
                     {answer}
                     <span className="pulse" style={{ display: 'inline-block', width: '4px', height: '14px', background: 'currentColor', marginLeft: '4px', verticalAlign: 'middle', animationDuration: '0.8s' }}></span>
                   </div>
                 </div>
               )}
               <div ref={endOfMessagesRef} />
             </div>
             
             <div className="sidebar-footer">
               <div className="assessing-badge">
                 <Bot size={14} className="assessing-icon" />
                 {isSubmitting ? 'Evaluating response...' : 'Assessing problem-solving framework'}
               </div>
             </div>
           </div>

           <div className="finish-wrap">
             <button className="btn-finish-sidebar" onClick={handleFinishInterview}>
               Finish Interview <Flag size={16} />
             </button>
           </div>
        </div>

      </div>
    </>
  );
};

export default InterviewRoom;
