// This file implements the chat feature for user interaction with the AI.
// It manages the chat interface, handles user input, and communicates with the AI for recommendations.

document.addEventListener('DOMContentLoaded', function() {
    const chatContainer = document.createElement('div');
    chatContainer.id = 'chat-container';
    document.body.appendChild(chatContainer);

    const chatInput = document.createElement('input');
    chatInput.type = 'text';
    chatInput.placeholder = 'Escribe tu pregunta o solicitud...';
    chatContainer.appendChild(chatInput);

    const sendButton = document.createElement('button');
    sendButton.textContent = 'Enviar';
    chatContainer.appendChild(sendButton);

    const chatLog = document.createElement('div');
    chatLog.id = 'chat-log';
    chatContainer.appendChild(chatLog);

    sendButton.addEventListener('click', function() {
        const userMessage = chatInput.value;
        if (userMessage.trim() !== '') {
            addMessageToChatLog('Usuario: ' + userMessage);
            chatInput.value = '';
            getAIResponse(userMessage);
        }
    });

    function addMessageToChatLog(message) {
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        chatLog.appendChild(messageElement);
        chatLog.scrollTop = chatLog.scrollHeight; // Scroll to the bottom
    }

    function getAIResponse(userMessage) {
        // Simulate an AI response for demonstration purposes
        const aiResponse = 'Respuesta de AI: ' + userMessage; // Replace with actual AI logic
        setTimeout(() => {
            addMessageToChatLog(aiResponse);
        }, 1000); // Simulate a delay for the AI response
    }
});