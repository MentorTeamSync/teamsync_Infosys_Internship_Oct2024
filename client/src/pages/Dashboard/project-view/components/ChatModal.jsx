import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BiChat } from 'react-icons/bi';
import ReplyBox from './ReplyBox';

const ChatModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [media, setMedia] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userReactions, setUserReactions] = useState({});
  const [isLikeDislikeUpdate, setIsLikeDislikeUpdate] = useState(false); // New state
  const [replyTo, setReplyTo] = useState(null); // New state for reply
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    return `${month} ${day}, ${year} ${hours}:${minutes} ${ampm}`;
  };

  const fetchMessages = async (isReactionUpdate = false) => { // Accept parameter
    try {
      const token = localStorage.getItem('token');
      const projectId = localStorage.getItem('project_id');
      
      const response = await axios.post(
        'http://localhost:3001/comment/messages',
        { project_id: projectId },
        { headers: { Authorization: token } }
      );
      
      setMessages(response.data);
      setIsLikeDislikeUpdate(isReactionUpdate); // Set the reaction update state
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };
  

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isLikeDislikeUpdate) { // Only scroll if it's not a like/dislike update
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    setIsLikeDislikeUpdate(false); // Reset after handling
  }, [messages]);

  // Add this useEffect hook for keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [message, isOpen]);
  

  const handleLikeDislike = async (commentId, isLike) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:3001/comment/like-dislike',
        { 
          like: isLike ? 1 : 0, 
          comment_id: commentId 
        },
        { headers: { Authorization: token } }
      );
      
      fetchMessages(true); // Pass true to indicate a reaction update
    } catch (error) {
      console.error('Error updating like/dislike:', error);
    }
  };
  

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleFileDownload = async (file) => {
    try {
      const byteCharacters = atob(file.file_data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: file.file_type });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const FileDisplay = ({ file }) => (
    <div className="mt-2 p-2 bg-gray-100 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">{file.file_name}</span>
          <span className="text-xs text-gray-500">({formatFileSize(file.file_size)})</span>
        </div>
        <button 
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          onClick={() => handleFileDownload(file)}
        >
          Download
        </button>
      </div>
    </div>
  );

  const sendMessage = async () => {
    if (message.trim() !== '' || media) {
      try {
        const token = localStorage.getItem('token');
        const projectId = localStorage.getItem('project_id');
        const creatorId = localStorage.getItem('userName');
        
        const requestBody = {
          project_id: projectId,
          creator_id: creatorId,
          content: message.trim(),
          reply_to: replyTo ? replyTo._id : null,
        };

        if (media) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            requestBody.file = {
              fileName: media.name,
              fileType: media.type,
              fileSize: media.size,
              data: e.target.result.split(',')[1]
            };
            await sendRequestToServer(requestBody, token);
          };
          reader.readAsDataURL(media);
        } else {
          await sendRequestToServer(requestBody, token);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const sendRequestToServer = async (requestBody, token) => {
    try {
      await axios.post(
        'http://localhost:3001/comment/send-message',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'authorization': token
          }
        }
      );
      
      setMessage('');
      setMedia(null);
      setReplyTo(null);
      fetchMessages();
    } catch (error) {
      console.error('Error sending message to server:', error);
    }
  };

  const handleReply = (message) => {
    setReplyTo(message); // Set the message to reply to
  };

  const cancelReply = () => {
    setReplyTo(null); // Reset replyTo if the user cancels the reply
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(prevIsOpen => !prevIsOpen)} 
        className="bg-blue-950 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded-lg shadow-lg"
        aria-label="Toggle Chat"
        title="Toggle Chat"
      >
        <BiChat className="w-5 h-5 inline" />
      </button>

      {isOpen && (
        <div className="fixed z-10 top-20 right-5 bg-transparent">
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="bg-white rounded-2xl shadow-2xl sm:max-w-md w-full overflow-hidden border border-gray-200">
              <div className="bg-blue-950 px-4 py-4 border-b border-gray-950 shadow-md">
                <h3 className="text-lg font-bold text-white">Chat Room</h3>
              </div>
              <div
                className="px-4 py-5 h-80 overflow-y-auto space-y-3 bg-gray-50"
                ref={messagesContainerRef}
              >
                {messages.map((msg, index) => (
                  <div
                  key={msg._id}
                  className={`p-3 rounded-lg shadow-sm ${
                      msg.creator_id === localStorage.getItem('userName')
                        ? 'bg-blue-100 text-gray-800 ml-auto'
                        : 'bg-gray-100 text-gray-800 mr-auto'
                    }`}
                  style={{ maxWidth: '70%', position: 'relative' }}
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-sm text-gray-700">{msg.creator_id}</p>
                      <p className="text-xs text-gray-500 absolute bottom-1 right-4">
                        {formatDate(msg.created_at)}
                      </p>
                    </div>
                    
                    {msg.content && (
                      <p className="mt-1 text-gray-800">{msg.content}</p>
                    )}
                    
                    {msg.file_name && (
                      <FileDisplay file={msg} />
                    )}

                    {msg.reply_to && (
                      <div className="bg-gray-100 p-2 rounded-lg mt-2">
                        <p className="text-xs text-gray-500">Replying to {msg.reply_to.creator_id}</p>
                        <p className="text-sm">{msg.reply_to.content}</p>
                      </div>
                    )}
                             
                    <div className="flex items-center space-x-4 mt-2">
                      <button 
                        onClick={() => handleLikeDislike(msg._id, true)}
                        className="text-sm flex items-center space-x-1 hover:bg-gray-200 p-1 rounded-full"
                      >
                        <span>👍</span>
                        <span>{msg.likes.length}</span>
                      </button>
                      <button 
                        onClick={() => handleLikeDislike(msg._id, false)}
                        className="text-sm flex items-center space-x-1 hover:bg-gray-200 p-1 rounded-full"
                      >
                        <span>👎</span>
                        <span>{msg.dislike.length}</span>
                      </button>
                      <button
                        onClick={() => handleReply(msg)}
                        className="text-sm text-gray-600 hover:text-blue-600"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="bg-gray-200 px-4 py-4 flex items-center space-x-3 border-t border-gray-300">
                {replyTo && (
                  <div className="bg-blue-100 p-2 rounded-lg w-full flex items-center justify-between">
                    <p className="text-sm text-gray-700">Replying to: {replyTo.creator_id}</p>
                    <button onClick={cancelReply} className="text-sm text-blue-600">Cancel</button>
                  </div>
                )}
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-grow border border-gray-300 rounded-full p-2 px-4 text-gray-800"
                  placeholder="Type a message..."
                />
                <label className="flex items-center cursor-pointer">
                  <input
                    type="file"
                    onChange={(e) => setMedia(e.target.files[0])}
                    className="hidden"
                    accept="*/*"
                  />
                  <span className="bg-blue-950 text-white rounded-full p-2 shadow-md hover:bg-blue-900">
                    📎
                  </span>
                </label>
                <button
                  onClick={sendMessage}
                  className="bg-blue-950 text-white rounded-full px-6 py-2 shadow-lg hover:bg-blue-900"
                >
                  Send
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-600 p-2 hover:bg-gray-200 rounded-full"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatModal;
