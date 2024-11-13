let mediaFile = null;
let isTyping = false;
let conversationHistory = [];
let lastInteractionTime = Date.now();

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function checkInput() {
    const chatInput = document.getElementById('chat-input').value.trim();
    const sendBtn = document.getElementById('send-btn');
    sendBtn.disabled = chatInput.length === 0 && !mediaFile;

    if (chatInput.length > 0 && !isTyping) {
        showTypingIndicator();
    } else if (chatInput.length === 0 && isTyping) {
        hideTypingIndicator();
    }
}

function saveConversationHistory(role, content) {
    conversationHistory.push({ role, content });
    
    if (conversationHistory.length > 10) {
        conversationHistory.shift();
    }
}

function checkMemoryReset() {
    const currentTime = Date.now();
    const inactivityDuration = (currentTime - lastInteractionTime) / (1000 * 60);

    if (inactivityDuration >= 10) {
        conversationHistory = [];
        console.log('Memory reset due to inactivity');
    }
}

async function sendMessage() {
    const chatBody = document.getElementById('chat-body');
    const chatInput = document.getElementById('chat-input');
    const messageText = chatInput.value.trim();
    const user = getCookie('username');

    lastInteractionTime = Date.now();
    checkMemoryReset();
    saveConversationHistory('user', messageText);

    const GROQ_API_KEY = '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'; 
    
    const sifat = 'kamu adalah anak kecil perempuan bernama miaw. kamu  pemalu dan lucu. kamu bicara selalu singkat seperti anak kecil. kamu selalu memberi jawaban yang sangat bijak. kamu di buat oleh awy selaku owner miaw team. kamu selalu memulai topik pembicaraan agar seru.';

    if (!user) {
        console.error('User cookie is not set.');
        return;
    }

    if (messageText || mediaFile) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'sent');

        if (mediaFile) {
            const reader = new FileReader();
            reader.onload = async function (e) {
                const imgDataUrl = e.target.result;
                messageElement.innerHTML = `<div class='bubble'><img src='${imgDataUrl}' alt='Media'><br>${messageText}</div>`;
                chatBody.appendChild(messageElement);

                try {
                    const form = new FormData();
                    form.append('file', mediaFile, mediaFile.name);
                    const uploadResponse = await fetch('https://tmpfiles.org/api/v1/upload', {
                        method: 'POST',
                        body: form,
                    });
                    const uploadData = await uploadResponse.json();
                    const match = /https?:\/\/tmpfiles.org\/(.*)/.exec(uploadData.data.url);
                    const imageBuffer = `https://tmpfiles.org/dl/${match[1]}`;

                    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${GROQ_API_KEY}`
                        },
                        body: JSON.stringify({
                            messages: [
                                {
                                    role: 'system',
                                    content: `${sifat}`
                                },
                                ...conversationHistory,
                                {
                                    role: 'user',
                                    content: [
                                        { type: 'text', text: messageText || 'Deskripsikan gambar ini' },
                                        { type: 'image_url', image_url: { url: imageBuffer } }
                                    ]
                                }
                            ],
                            model: 'llama-3.2-90b-vision-preview',
                            temperature: 1,
                            max_tokens: 1024,
                            top_p: 1,
                            stream: false
                        })
                    });

                    const data = await response.json();
                    
                    saveConversationHistory('assistant', data.choices[0].message.content);

                    setTimeout(() => {
                        const botMessageElement = document.createElement('div');
                        botMessageElement.classList.add('message', 'received');
                        botMessageElement.innerHTML = `<div class='bubble'>${data.choices[0].message.content}</div>`;
                        chatBody.appendChild(botMessageElement);
                        chatBody.scrollTop = chatBody.scrollHeight;
                    }, 1000);

                    clearInputAndMedia();

                } catch (error) {
                    console.error('Error:', error);
                }
            }
            reader.readAsDataURL(mediaFile);
        } else {
            messageElement.innerHTML = `<div class='bubble'>${messageText}</div>`;
            chatBody.appendChild(messageElement);

            try {
                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${GROQ_API_KEY}`
                    },
                    body: JSON.stringify({
                        messages: [
                            {
                                role: 'system',
                                content: `${sifat}`
                            },
                            ...conversationHistory,
                            { 
                                role: 'user', 
                                content: messageText 
                            }
                        ],
                        model: 'llama-3.2-90b-vision-preview',
                        temperature: 1,
                        max_tokens: 1024,
                        top_p: 1,
                        stream: false
                    })
                });

                const data = await response.json();

                saveConversationHistory('assistant', data.choices[0].message.content);

                setTimeout(() => {
    const botMessageElement = document.createElement('div');
    botMessageElement.classList.add('message', 'received');

    // Memeriksa apakah ada kode dalam respons
    const responseContent = data.choices[0].message.content;
    const codeMatch = responseContent.match(/```(.*?)```/s);

    if (codeMatch) {
        // Jika ada kode, tampilkan dalam textarea
        const codeSnippet = codeMatch[1].trim();
        
        // Membuat kontainer untuk kode
        const codeContainer = document.createElement('div');
        codeContainer.style.border = '1px solid #ccc';
        codeContainer.style.borderRadius = '5px';
        codeContainer.style.padding = '10px';
        codeContainer.style.marginTop = '10px';

        // Textarea untuk kode
        const textarea = document.createElement('textarea');
        textarea.value = codeSnippet;
        textarea.style.width = '100%';
        textarea.style.height = '150px';
        textarea.style.resize = 'vertical';
        textarea.setAttribute('readonly', true);

        // Tombol Copy
        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy Code';
        copyButton.style.backgroundColor = '#4CAF50';
        copyButton.style.color = 'white';
        copyButton.style.border = 'none';
        copyButton.style.padding = '5px 10px';
        copyButton.style.borderRadius = '3px';
        copyButton.style.cursor = 'pointer';
        copyButton.style.marginTop = '10px';
        copyButton.onclick = () => {
            textarea.select();
            document.execCommand('copy');
            copyButton.textContent = 'Copied!';
            setTimeout(() => {
                copyButton.textContent = 'Copy Code';
            }, 2000);
        };

        // Tambahkan elemen ke kontainer
        codeContainer.appendChild(textarea);
        codeContainer.appendChild(copyButton);

        // Tambahkan pesan teks AI
        botMessageElement.innerHTML = `<div class='bubble'>${responseContent.replace(/```.*?```/s, '')}</div>`;
        botMessageElement.appendChild(codeContainer);
    } else {
        botMessageElement.innerHTML = `<div class='bubble'>${responseContent}</div>`;
    }

    chatBody.appendChild(botMessageElement);
    chatBody.scrollTop = chatBody.scrollHeight;
}, 1000);

                clearInputAndMedia();

            } catch (error) {
                console.error('Error:', error);
            }
        }
    }
    checkInput();
}

function clearInputAndMedia() {
    const chatInput = document.getElementById('chat-input');
    chatInput.value = '';
    mediaFile = null;
    document.getElementById('media-input').value = '';
    document.getElementById('preview-img').src = '';
    document.getElementById('media-preview').style.display = 'none';
}

function previewMedia() {
    const mediaInput = document.getElementById('media-input');
    mediaFile = mediaInput.files[0];
    const previewImg = document.getElementById('preview-img');
    const mediaPreview = document.getElementById('media-preview');

    if (mediaFile && mediaFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function (e) {
            previewImg.src = e.target.result;
            mediaPreview.style.display = 'flex';
        }
        reader.readAsDataURL(mediaFile);
    }
    checkInput();
}

function cancelMedia() {
    mediaFile = null;
    document.getElementById('media-input').value = '';
    document.getElementById('preview-img').src = '';
    document.getElementById('media-preview').style.display = 'none';
    checkInput();
}

function getRandomText() {
    return 'user-' + Math.floor(Math.random() * 100000);
}

function setRandomTextCookie(randomText) {
    document.cookie = `username=${randomText}; path=/`;
}

window.onload = function () {
    if (!getCookie('username')) {
        setRandomTextCookie(getRandomText());
    }
}

function showTypingIndicator() {
    isTyping = true;
    const statusElement = document.getElementById('status');
    statusElement.textContent = 'Mengetik';
    statusElement.classList.add('typing');
}

function hideTypingIndicator() {
    isTyping = false;
    const statusElement = document.getElementById('status');
    statusElement.textContent = 'Online';
    statusElement.classList.remove('typing');
}