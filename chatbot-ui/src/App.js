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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper as MuiPaper,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DownloadIcon from '@mui/icons-material/Download';
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

    const formatMessageContent = (text) => {
        // Handle tables first
        if (text.includes('|')) {
            const lines = text.trim().split('\n');
            const headers = lines[0].split('|').map(h => h.trim()).filter(Boolean);
            const rows = lines.slice(2).map(line => 
                line.split('|').map(cell => cell.trim()).filter(Boolean)
            ).filter(row => row.length > 0);

            return (
                <TableContainer 
                    component={MuiPaper} 
                    sx={{ 
                        backgroundColor: 'transparent',
                        maxWidth: '100%',
                        overflowX: 'auto',
                    }}
                >
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                {headers.map((header, i) => (
                                    <TableCell 
                                        key={i}
                                        sx={{ 
                                            color: 'inherit',
                                            borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {header}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((row, i) => (
                                <TableRow key={i}>
                                    {row.map((cell, j) => (
                                        <TableCell 
                                            key={j}
                                            sx={{ 
                                                color: 'inherit',
                                                borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                            }}
                                        >
                                            {cell}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            );
        }

        // Check if text contains numbered lists (e.g., "1. ", "2. ", etc.)
        const hasNumberedList = /(?:^|\n)\d+\.\s/.test(text);

        if (hasNumberedList) {
            // Split text into segments, preserving line breaks and numbered items
            const segments = text.split(/(?=(?:^|\n)\d+\.\s)/);
            
            return (
                <Box>
                    {segments.map((segment, index) => {
                        const trimmedSegment = segment.trim();
                        if (!trimmedSegment) return null;

                        // Check if this segment starts with a number and period
                        const isNumberedItem = /^\d+\.\s/.test(trimmedSegment);

                        return (
                            <Typography 
                                key={index} 
                                variant="body1" 
                                sx={{ 
                                    mb: 1,
                                    pl: isNumberedItem ? 2 : 0,
                                }}
                            >
                                {trimmedSegment}
                            </Typography>
                        );
                    })}
                </Box>
            );
        }

        // Handle asterisks
        if (text.includes('*')) {
            return (
                <Box>
                    {text.split('*').map((segment, index) => {
                        const trimmedSegment = segment.trim();
                        if (!trimmedSegment) return null;
                        
                        return (
                            <Typography 
                                key={index} 
                                variant="body1" 
                                sx={{ mb: trimmedSegment ? 1 : 0 }}
                            >
                                {trimmedSegment}
                            </Typography>
                        );
                    })}
                </Box>
            );
        }

        // Return regular text
        return <Typography variant="body1">{text}</Typography>;
    };

    const downloadCSV = (csvData, filename = 'data.csv') => {
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

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
            
            // Create message object with CSV data if available
            const aiMessage = {
                sender: 'AI',
                text: data.response,
                csvData: data.csvData
            };
            
            setMessages((prev) => [...prev, 
                { sender: 'User', text: question }, 
                aiMessage
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
                    <Box sx={{ 
                        position: 'relative',
                        height: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        <Box sx={{ 
                            position: 'absolute', 
                            right: 16, 
                            top: 16,
                            display: 'flex',
                            gap: 1,
                            zIndex: 2
                        }}>
                            <IconButton 
                                onClick={clearChat} 
                                color="inherit"
                                aria-label="clear chat"
                                title="Clear chat history"
                                sx={{
                                    color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                                    '&:hover': {
                                        color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                                    }
                                }}
                            >
                                <DeleteOutlineIcon />
                            </IconButton>
                            <IconButton 
                                onClick={() => setDarkMode(!darkMode)} 
                                color="inherit"
                                aria-label="toggle dark mode"
                                sx={{
                                    color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                                    '&:hover': {
                                        color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                                    }
                                }}
                            >
                                {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                            </IconButton>
                        </Box>

                        <Typography 
                            variant="h5" 
                            component="h1" 
                            gutterBottom 
                            align="center" 
                            sx={{ 
                                mb: 4,
                                color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                            }}
                        >
                            AIME
                        </Typography>

                        {messages.length === 0 ? (
                            <Box 
                                component="form" 
                                onSubmit={handleSubmit} 
                                sx={{ 
                                    display: 'flex', 
                                    gap: 1,
                                    px: 2,
                                    mb: 3,
                                }}
                            >
                                <TextField
                                    fullWidth
                                    autoFocus
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    placeholder="Type your message..."
                                    variant="outlined"
                                    disabled={loading}
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                                            '& fieldset': {
                                                borderColor: 'transparent',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'transparent',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: 'primary.main',
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
                        ) : (
                            <>
                                <Box sx={{ 
                                    flexGrow: 1,
                                    overflow: 'auto',
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    '::-webkit-scrollbar': {
                                        width: '8px',
                                    },
                                    '::-webkit-scrollbar-track': {
                                        background: 'transparent',
                                    },
                                    '::-webkit-scrollbar-thumb': {
                                        background: darkMode ? '#555' : '#888',
                                        borderRadius: '4px',
                                    },
                                }}>
                                    <Box sx={{ px: 2, pb: 2 }}>
                                        {messages.map((msg, index) => (
                                            <Box
                                                key={index}
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: msg.sender === 'User' ? 'flex-end' : 'flex-start',
                                                    mb: 2,
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        p: 2,
                                                        maxWidth: msg.sender === 'User' ? '70%' : '85%',
                                                        bgcolor: msg.sender === 'User' ? 'primary.main' : darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                                                        color: msg.sender === 'User' ? 'white' : 'text.primary',
                                                        borderRadius: 2,
                                                        position: 'relative',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 2,
                                                    }}
                                                >
                                                    <Typography variant="body1">
                                                        {msg.csvData ? "Table converted to CSV" : formatMessageContent(msg.text)}
                                                    </Typography>
                                                    {msg.csvData && (
                                                        <IconButton
                                                            onClick={() => downloadCSV(msg.csvData)}
                                                            size="small"
                                                            sx={{
                                                                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                                                                '&:hover': {
                                                                    color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                                                                },
                                                                ml: 'auto',  // Push button to the right
                                                            }}
                                                            title="Download CSV"
                                                        >
                                                            <DownloadIcon />
                                                        </IconButton>
                                                    )}
                                                </Box>
                                            </Box>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </Box>
                                </Box>

                                <Box 
                                    component="form" 
                                    onSubmit={handleSubmit} 
                                    sx={{ 
                                        display: 'flex', 
                                        gap: 1,
                                        px: 2,
                                        py: 2,
                                        borderTop: 1,
                                        borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                        bgcolor: 'background.default',
                                        position: 'sticky',
                                        bottom: 0,
                                        zIndex: 1,
                                    }}
                                >
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
                                                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                                                '& fieldset': {
                                                    borderColor: 'transparent',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: 'transparent',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: 'primary.main',
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
                            </>
                        )}
                    </Box>
                </Container>
            </Box>
        </ThemeProvider>
    );
}

export default App;