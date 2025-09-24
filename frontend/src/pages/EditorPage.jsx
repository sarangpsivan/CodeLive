// src/pages/EditorPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router-dom';

const EditorPage = () => {
    const [language, setLanguage] = useState('python');
    const [code, setCode] = useState('# Start coding here!');
    const { projectId } = useParams(); // Get project ID from URL
    const socketRef = useRef(null);

    useEffect(() => {
        // Establish WebSocket connection
        const socket = new WebSocket(
            `ws://localhost:8000/ws/project/${projectId}/`
        );
        socketRef.current = socket;

        socket.onopen = () => {
            console.log("WebSocket connection established");
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            // Update code when a message is received from the backend
            setCode(data.message);
        };

        socket.onclose = () => {
            console.log("WebSocket connection closed");
        };

        // Cleanup the connection when the component unmounts
        return () => {
            socket.close();
        };
    }, [projectId]); // Reconnect if projectId changes

    const handleEditorChange = (value, event) => {
        setCode(value);
        // Send the new code to the backend via WebSocket
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                'message': value
            }));
        }
    };

    return (
        <div className="h-screen flex flex-col">
            <div className="bg-dark-card p-2">
                <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-gray-700 text-white rounded px-2 py-1"
                >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                </select>
            </div>
            
            <div className="flex-grow">
                <Editor
                    height="100%"
                    theme="vs-dark"
                    language={language}
                    value={code} // The editor's content is now controlled by our state
                    onChange={handleEditorChange} // Handle user typing
                />
            </div>
        </div>
    );
};

export default EditorPage;