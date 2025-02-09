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
    Drawer,
    List,
    ListItem,
    ListItemText,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import MenuIcon from '@mui/icons-material/Menu';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './App.css';

const REACT_APP_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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
                default: darkMode ? '#000000' : '#f5f5f7',
                paper: darkMode ? '#121212' : '#ffffff',
            },
        },
        typography: {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            h5: {
                fontSize: {
                    xs: '1.2rem',
                    sm: '1.4rem',
                    md: '1.5rem',
                    lg: '1.7rem',
                },
                fontWeight: 500,
            },
            body1: {
                fontSize: {
                    xs: '0.875rem',
                    sm: '0.9rem',
                    md: '1rem',
                    lg: '1.1rem',
                },
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
    const chatContainerRef = useRef(null);

    const [conversations, setConversations] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('chatMessages', JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        localStorage.setItem('chatContext', JSON.stringify(context));
    }, [context]);

    useEffect(() => {
        // Update theme-color meta tag when dark mode changes
        const metaThemeColor = document.querySelector("meta[name=theme-color]");
        if (metaThemeColor) {
            metaThemeColor.setAttribute("content", darkMode ? "#000000" : "#f5f5f7");
        }
    }, [darkMode]);

    const clearChat = () => {
        setMessages([]);
        setContext('');
        localStorage.removeItem('chatMessages');
        localStorage.removeItem('chatContext');
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const scrollToTop = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }, [darkMode]);

    const formatMessageContent = (text) => {
        // Handle code blocks first (text between triple backticks)
        if (text.includes('```')) {
            const parts = text.split(/(```[\s\S]*?```)/);
            return (
                <Box>
                    {parts.map((part, index) => {
                        if (part.startsWith('```') && part.endsWith('```')) {
                            // Extract language and code
                            const codeContent = part.slice(3, -3);
                            const firstLineBreak = codeContent.indexOf('\n');
                            const language = firstLineBreak > -1 ? codeContent.slice(0, firstLineBreak).trim() : '';
                            const code = firstLineBreak > -1 ? codeContent.slice(firstLineBreak + 1).trim() : codeContent.trim();

                            return (
                                <Box key={index} sx={{ my: 2 }}>
                                    <SyntaxHighlighter
                                        language={language || 'plaintext'}
                                        style={darkMode ? oneDark : oneLight}
                                        customStyle={{
                                            margin: 0,
                                            borderRadius: '4px',
                                            fontSize: {
                                                xs: '0.8rem',
                                                sm: '0.85rem',
                                                md: '0.9rem',
                                                lg: '1rem',
                                            },
                                        }}
                                    >
                                        {code}
                                    </SyntaxHighlighter>
                                </Box>
                            );
                        }
                        // Handle regular text
                        return part && <Typography key={index} variant="body1" sx={{ my: 1 }}>{part}</Typography>;
                    })}
                </Box>
            );
        }

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
                                            fontSize: {
                                                xs: '0.8rem',
                                                sm: '0.85rem',
                                                md: '0.9rem',
                                                lg: '1rem',
                                            },
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
                                                fontSize: {
                                                    xs: '0.8rem',
                                                    sm: '0.85rem',
                                                    md: '0.9rem',
                                                    lg: '1rem',
                                                },
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
                                    fontSize: {
                                        xs: '0.875rem',
                                        sm: '0.9rem',
                                        md: '1rem',
                                        lg: '1.1rem',
                                    },
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
                                sx={{ mb: trimmedSegment ? 1 : 0, fontSize: {
                                    xs: '0.875rem',
                                    sm: '0.9rem',
                                    md: '1rem',
                                    lg: '1.1rem',
                                } }}
                            >
                                {trimmedSegment}
                            </Typography>
                        );
                    })}
                </Box>
            );
        }

        // Return regular text
        return (
            <Typography 
                variant="body1" 
                sx={{ 
                    fontSize: {
                        xs: '0.875rem',
                        sm: '0.9rem',
                        md: '1rem',
                        lg: '1.1rem',
                    }
                }}
            >
                {text}
            </Typography>
        );
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
            const res = await fetch(`${REACT_APP_API_URL}/chat`, {
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

    const loadConversations = async () => {
        try {
            const res = await fetch(`${REACT_APP_API_URL}/conversations`);
            if (!res.ok) throw new Error('Failed to load conversations');
            const data = await res.json();
            setConversations(data);
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    };

    const saveConversation = async () => {
        if (messages.length === 0) return;
        
        try {
            const res = await fetch(`${REACT_APP_API_URL}/conversations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages }),
            });
            if (!res.ok) throw new Error('Failed to save conversation');
            const data = await res.json();
            setCurrentConversationId(data.id);
        } catch (error) {
            console.error('Error saving conversation:', error);
        }
    };

    const loadConversation = async (conversationId) => {
        try {
            const res = await fetch(`${REACT_APP_API_URL}/conversations/${conversationId}`);
            if (!res.ok) throw new Error('Failed to load conversation');
            const data = await res.json();
            
            // Convert the loaded messages to the format your app uses
            const formattedMessages = data.messages.map(msg => ({
                sender: msg.sender,
                text: msg.text
            }));
            
            setMessages(formattedMessages);
            // Rebuild the context
            const newContext = formattedMessages
                .map(msg => `${msg.sender}: ${msg.text}`)
                .join('\n');
            setContext(newContext);
            setDrawerOpen(false);
        } catch (error) {
            console.error('Error loading conversation:', error);
        }
    };

    const deleteConversation = async (conversationId, event) => {
        event.stopPropagation(); // Prevent triggering the conversation load
        try {
            const res = await fetch(`${REACT_APP_API_URL}/conversations/${conversationId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete conversation');
            
            // Remove from local state
            setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    };

    useEffect(() => {
        if (drawerOpen) {
            loadConversations();
        }
    }, [drawerOpen]);

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ 
                minHeight: '100vh',
                minHeight: '-webkit-fill-available',
                bgcolor: 'background.default',
                transition: 'background-color 0.3s ease',
                position: 'fixed',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
            }}>
                <Container maxWidth="md" sx={{ 
                    py: {
                        xs: 1,
                        sm: 4
                    },
                    height: '100%',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    <Box sx={{ 
                        position: 'relative',
                        height: '90vh',
                        height: {
                            xs: 'calc(100vh - 32px)',
                            sm: '90vh'
                        },
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }}>
                        {messages.length === 0 ? (
                            <Box 
                                sx={{ 
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    flexGrow: 1,
                                    gap: 3,
                                }}
                            >
                                <Box sx={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    maxWidth: '800px',
                                    px: 2,
                                }}>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <IconButton 
                                            onClick={() => setDrawerOpen(true)}
                                            sx={{
                                                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                                                '&:hover': {
                                                    color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                                                }
                                            }}
                                        >
                                            <MenuIcon />
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
                                        onClick={scrollToTop}
                                        sx={{ 
                                            color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                                            fontSize: {
                                                xs: '1.2rem',
                                                sm: '1.4rem',
                                                md: '1.5rem',
                                                lg: '1.7rem',
                                            },
                                            cursor: 'pointer',
                                            '&:hover': {
                                                opacity: 0.8,
                                            },
                                            transition: 'opacity 0.2s ease',
                                            position: 'absolute',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                        }}
                                    >
                                        AIME
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
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
                                            onClick={saveConversation}
                                            disabled={messages.length === 0}
                                            sx={{
                                                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                                                '&:hover': {
                                                    color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                                                }
                                            }}
                                        >
                                            <SaveIcon />
                                        </IconButton>
                                    </Box>
                                </Box>

                                <Box 
                                    component="form" 
                                    onSubmit={handleSubmit} 
                                    sx={{ 
                                        display: 'flex', 
                                        gap: 1,
                                        px: 2,
                                        width: '100%',
                                        maxWidth: '800px',
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
                                                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.05)',
                                                '& fieldset': {
                                                    borderColor: 'transparent',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: 'transparent',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: 'primary.main',
                                                },
                                                fontSize: {
                                                    xs: '16px',
                                                    sm: '0.9rem',
                                                    md: '1rem',
                                                    lg: '1.1rem',
                                                },
                                            },
                                            '& input': {
                                                fontSize: {
                                                    xs: '16px',
                                                    sm: '0.9rem',
                                                    md: '1rem',
                                                    lg: '1.1rem',
                                                },
                                            },
                                        }}
                                    />
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={loading}
                                        sx={{
                                            minWidth: 'unset',
                                            width: '40px',
                                            height: '40px',
                                            padding: 0,
                                            borderRadius: '8px'
                                        }}
                                    >
                                        {loading ? <CircularProgress size={20} /> : <SendIcon />}
                                    </Button>
                                </Box>
                            </Box>
                        ) : (
                            <>
                                <Box sx={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    mb: {
                                        xs: 1,
                                        sm: 4
                                    },
                                    px: 2,
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 2,
                                    bgcolor: 'background.default',
                                    py: {
                                        xs: 0.5,
                                        sm: 1
                                    },
                                }}>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <IconButton 
                                            onClick={() => setDrawerOpen(true)}
                                            sx={{
                                                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                                                '&:hover': {
                                                    color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                                                }
                                            }}
                                        >
                                            <MenuIcon />
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
                                        onClick={scrollToTop}
                                        sx={{ 
                                            color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                                            fontSize: {
                                                xs: '1.2rem',
                                                sm: '1.4rem',
                                                md: '1.5rem',
                                                lg: '1.7rem',
                                            },
                                            cursor: 'pointer',
                                            '&:hover': {
                                                opacity: 0.8,
                                            },
                                            transition: 'opacity 0.2s ease',
                                            position: 'absolute',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                        }}
                                    >
                                        AIME
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
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
                                            onClick={saveConversation}
                                            disabled={messages.length === 0}
                                            sx={{
                                                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                                                '&:hover': {
                                                    color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                                                }
                                            }}
                                        >
                                            <SaveIcon />
                                        </IconButton>
                                    </Box>
                                </Box>

                                <Box sx={{ 
                                    flexGrow: 1,
                                    overflow: 'auto',
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    maxHeight: {
                                        xs: 'calc(100vh - 120px)',
                                        sm: 'calc(90vh - 180px)',
                                    },
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
                                }} ref={chatContainerRef}>
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
                                                        width: msg.text.includes('```') ? '100%' : 'auto',
                                                        bgcolor: msg.sender === 'User' ? 'primary.main' : darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                                                        color: msg.sender === 'User' ? 'white' : 'text.primary',
                                                        borderRadius: 2,
                                                        position: 'relative',
                                                        display: 'flex',
                                                        alignItems: msg.csvData ? 'center' : 'stretch',
                                                        gap: 2,
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    <Box sx={{ 
                                                        width: '100%',
                                                        overflowX: 'auto',
                                                    }}>
                                                        {msg.csvData ? (
                                                            <Typography variant="body1">
                                                                Table converted to CSV
                                                            </Typography>
                                                        ) : (
                                                            formatMessageContent(msg.text)
                                                        )}
                                                    </Box>
                                                    {msg.csvData && (
                                                        <IconButton
                                                            onClick={() => downloadCSV(msg.csvData)}
                                                            size="small"
                                                            sx={{
                                                                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                                                                '&:hover': {
                                                                    color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                                                                },
                                                                flexShrink: 0,
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
                                        py: {
                                            xs: 0.5,
                                            sm: 2
                                        },
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
                                                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.05)',
                                                '& fieldset': {
                                                    borderColor: 'transparent',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: 'transparent',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: 'primary.main',
                                                },
                                                fontSize: {
                                                    xs: '16px',
                                                    sm: '0.9rem',
                                                    md: '1rem',
                                                    lg: '1.1rem',
                                                },
                                            },
                                            '& input': {
                                                fontSize: {
                                                    xs: '16px',
                                                    sm: '0.9rem',
                                                    md: '1rem',
                                                    lg: '1.1rem',
                                                },
                                            },
                                        }}
                                    />
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={loading}
                                        sx={{
                                            minWidth: 'unset',
                                            width: '40px',
                                            height: '40px',
                                            padding: 0,
                                            borderRadius: '8px'
                                        }}
                                    >
                                        {loading ? <CircularProgress size={20} /> : <SendIcon />}
                                    </Button>
                                </Box>
                            </>
                        )}
                    </Box>
                </Container>
                <Drawer
                    anchor="left"
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                >
                    <Box
                        sx={{
                            width: 250,
                            bgcolor: darkMode ? '#000000' : 'background.paper',
                            height: '100%',
                        }}
                    >
                        <List>
                            {conversations.map((conv) => (
                                <ListItem 
                                    key={conv.id}
                                    button
                                    onClick={() => loadConversation(conv.id)}
                                    secondaryAction={
                                        <IconButton 
                                            edge="end" 
                                            aria-label="delete"
                                            onClick={(e) => deleteConversation(conv.id, e)}
                                            sx={{
                                                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                                                '&:hover': {
                                                    color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                                                }
                                            }}
                                        >
                                            <DeleteOutlineIcon />
                                        </IconButton>
                                    }
                                >
                                    <ListItemText
                                        primary={`Conversation ${conv.id}`}
                                        secondary={new Date(conv.created_at).toLocaleString()}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </Drawer>
            </Box>
        </ThemeProvider>
    );
}

export default App;