import React, { useState, useRef, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    CircularProgress,
    ThemeProvider,
    createTheme,
    IconButton,
    useMediaQuery,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL;

function App() {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [darkMode, setDarkMode] = useState(() => {
        const savedMode = localStorage.getItem('darkMode');
        return savedMode !== null ? JSON.parse(savedMode) : prefersDarkMode;
    });

    const theme = createTheme({
        palette: {
            mode: darkMode ? 'dark' : 'light',
            primary: {
                main: '#2196f3',
            },
            background: {
                default: darkMode ? '#121212' : '#f5f5f7',
                paper: darkMode ? '#1e1e1e' : '#ffffff',
            },
        },
    });

    const [messages, setMessages] = useState(() => {
        const savedMessages = localStorage.getItem('chatMessages');
        return savedMessages ? JSON.parse(savedMessages) : [];
    });

    const [context, setContext] = useState(() => {
        const savedContext = localStorage.getItem('chatContext');
        return savedContext ? JSON.parse(savedContext) : '';
    });

    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        localStorage.setItem('chatMessages', JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        localStorage.setItem('chatContext', JSON.stringify(context));
    }, [context]);

    const clearChat = () => {
        setMessages([]);
        setContext('');
        localStorage.removeItem('chatMessages');
        localStorage.removeItem('chatContext');
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }, [darkMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;
        
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ context, question }),
            });
            if (!res.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await res.json();
            setMessages((prev) => [...prev, 
                { sender: 'User', text: question }, 
                { sender: 'AI', text: data.response }
            ]);
            setContext((prev) => `${prev}\nUser: ${question}\nAI: ${data.response}`);
            setQuestion('');
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ 
                minHeight: '100vh',
                bgcolor: 'background.default',
                transition: 'background-color 0.3s ease'
            }}>
                <Container maxWidth="md" sx={{ py: 4 }}>
                    <Paper elevation={3} sx={{ 
                        p: 3, 
                        bgcolor: 'background.paper',
                        position: 'relative'
                    }}>
                        <Box sx={{ 
                            position: 'absolute', 
                            right: 16, 
                            top: 16,
                            display: 'flex',
                            gap: 1
                        }}>
                            <IconButton 
                                onClick={clearChat} 
                                color="inherit"
                                aria-label="clear chat"
                                title="Clear chat history"
                                sx={{ ml: 1 }}
                            >
                                <DeleteOutlineIcon />
                            </IconButton>
                            <IconButton 
                                onClick={() => setDarkMode(!darkMode)} 
                                color="inherit"
                                sx={{ ml: 1 }}
                                aria-label="toggle dark mode"
                            >
                                {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                            </IconButton>
                        </Box>

                        <Typography variant="h5" component="h1" gutterBottom align="center">
                            AIME
                        </Typography>
                        
                        <Paper 
                            elevation={1} 
                            sx={{ 
                                height: '60vh', 
                                overflow: 'auto', 
                                p: 2, 
                                mb: 2,
                                bgcolor: 'background.paper',
                                '::-webkit-scrollbar': {
                                    width: '8px',
                                },
                                '::-webkit-scrollbar-track': {
                                    background: darkMode ? '#1e1e1e' : '#f1f1f1',
                                },
                                '::-webkit-scrollbar-thumb': {
                                    background: darkMode ? '#555' : '#888',
                                    borderRadius: '4px',
                                },
                            }}
                        >
                            {messages.map((msg, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: msg.sender === 'User' ? 'flex-end' : 'flex-start',
                                        mb: 2,
                                    }}
                                >
                                    <Paper
                                        elevation={1}
                                        sx={{
                                            p: 2,
                                            maxWidth: '70%',
                                            bgcolor: msg.sender === 'User' ? 'primary.main' : darkMode ? '#333' : 'grey.100',
                                            color: msg.sender === 'User' ? 'white' : 'text.primary',
                                        }}
                                    >
                                        <Typography variant="body1">{msg.text}</Typography>
                                    </Paper>
                                </Box>
                            ))}
                            <div ref={messagesEndRef} />
                        </Paper>

                        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                fullWidth
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Type your message..."
                                variant="outlined"
                                disabled={loading}
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                            borderColor: darkMode ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                                        },
                                    },
                                }}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                            >
                                Send
                            </Button>
                        </Box>
                    </Paper>
                </Container>
            </Box>
        </ThemeProvider>
    );
}

export default App;