import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Mic, MicOff, Send, Loader2, StopCircle } from 'lucide-react';
import api from '../services/api';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const InterviewRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [question, setQuestion] = useState(location.state?.initialData?.question || 'Loading next question...');
  const [questionIndex, setQuestionIndex] = useState(location.state?.initialData?.questionIndex || 1);
  const [maxQuestions, setMaxQuestions] = useState(location.state?.initialData?.maxQuestions || 5);
  
  const [answer, setAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recognition, setRecognition] = useState(null);

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

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    
    if (isRecording) {
      recognition?.stop();
      setIsRecording(false);
    }

    setIsSubmitting(true);
    try {
      const { data } = await api.post(`/interviews/${id}/answer`, { answer });
      
      if (data.data.completed) {
        navigate(`/report/${id}`);
      } else {
        setQuestion(data.data.question);
        setQuestionIndex(data.data.questionIndex);
        setAnswer('');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      <div style={styles.header}>
        <div style={styles.progressContainer}>
          <div style={styles.progressText}>
            <span>Question {questionIndex} of {maxQuestions}</span>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
              {Math.round((questionIndex / maxQuestions) * 100)}%
            </span>
          </div>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${(questionIndex / maxQuestions) * 100}%` }}></div>
          </div>
        </div>
      </div>

      <div style={styles.mainArea}>
        
        {/* Question Panel */}
        <div className="glass-panel" style={styles.questionPanel}>
          <div style={styles.aiBadge}>AI Interviewer</div>
          <h2 style={styles.questionText}>
            {question}
          </h2>
        </div>

        {/* Answer Panel */}
        <div className="glass-panel" style={styles.answerPanel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem' }}>Your Response</h3>
            
            {SpeechRecognition && (
              <button 
                onClick={toggleRecording} 
                className={`btn ${isRecording ? 'btn-danger' : 'btn-secondary'}`}
                style={{ 
                  borderRadius: '50px', 
                  padding: '8px 16px',
                  background: isRecording ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)',
                  color: isRecording ? '#f87171' : 'white',
                  border: isRecording ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.2)'
                }}
              >
                {isRecording ? <><StopCircle size={18} className="pulse" /> Stop Recording</> : <><Mic size={18} /> Start Speaking</>}
              </button>
            )}
          </div>

          <textarea 
            style={styles.textArea}
            placeholder="Type your answer here or use the microphone to dictate..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={isRecording || isSubmitting}
          />

          <div style={styles.footer}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {answer.length} characters
            </p>
            <button 
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isSubmitting || answer.trim().length === 0}
            >
              {isSubmitting ? <><Loader2 className="pulse" size={18} /> Analyzing...</> : <><Send size={18} /> Submit Answer</>}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

const styles = {
  header: {
    marginBottom: '30px',
  },
  progressContainer: {
    background: 'rgba(255,255,255,0.05)',
    padding: '20px',
    borderRadius: '16px',
    border: '1px solid var(--glass-border)'
  },
  progressText: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontWeight: '600',
    fontSize: '0.95rem'
  },
  progressBar: {
    height: '8px',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: 'var(--primary)',
    transition: 'width 0.5s ease-in-out'
  },
  mainArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  questionPanel: {
    padding: '40px',
    borderLeft: '4px solid var(--primary)'
  },
  aiBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    background: 'rgba(99, 102, 241, 0.2)',
    color: '#818cf8',
    borderRadius: '50px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    marginBottom: '16px',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  questionText: {
    fontSize: '1.8rem',
    lineHeight: '1.4',
    fontFamily: 'var(--font-heading)'
  },
  answerPanel: {
    padding: '30px',
  },
  textArea: {
    width: '100%',
    minHeight: '200px',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid var(--glass-border)',
    borderRadius: '12px',
    padding: '20px',
    color: 'var(--text-main)',
    fontFamily: 'var(--font-body)',
    fontSize: '1.1rem',
    lineHeight: '1.6',
    resize: 'vertical',
    marginBottom: '20px'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
};

export default InterviewRoom;
