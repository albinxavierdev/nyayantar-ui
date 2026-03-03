// Nyayantar - Legal AI Assistant Frontend
const API_BASE_URL = 'http://localhost:8000';

// Login credentials
const VALID_USERNAME = 'admin';
const VALID_PASSWORD = 'admin123';

// DOM Elements
const loginPage = document.getElementById('login-page');
const chatInterface = document.getElementById('chat-interface');
const loginForm = document.getElementById('login-form');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const loginError = document.getElementById('login-error');
const chatForm = document.getElementById('chat-form');
const queryInput = document.getElementById('query-input');
const sendButton = document.getElementById('send-button');
const chatMessages = document.getElementById('chat-messages');
const statusIndicator = document.getElementById('status-indicator');

// Check if user is already logged in
function checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('nyayantar_logged_in') === 'true';
    if (isLoggedIn) {
        showChatInterface();
    } else {
        showLoginPage();
    }
}

// Show login page
function showLoginPage() {
    loginPage.style.display = 'flex';
    chatInterface.style.display = 'none';
    sessionStorage.removeItem('nyayantar_logged_in');
}

// Show chat interface
function showChatInterface() {
    loginPage.style.display = 'none';
    chatInterface.style.display = 'flex';
    sessionStorage.setItem('nyayantar_logged_in', 'true');
    // Focus on input after login
    setTimeout(() => {
        queryInput.focus();
    }, 100);
}

// Handle login form submission
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    // Hide previous error
    loginError.style.display = 'none';
    loginButton.disabled = true;
    loginButton.textContent = 'Logging in...';
    
    // Simple validation
    setTimeout(() => {
        if (username === VALID_USERNAME && password === VALID_PASSWORD) {
            showChatInterface();
        } else {
            loginError.textContent = 'Invalid username or password';
            loginError.style.display = 'block';
            loginButton.disabled = false;
            loginButton.textContent = 'Login';
        }
    }, 300); // Small delay for UX
});

// Handle logout
logoutButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        showLoginPage();
        // Clear chat messages
        chatMessages.innerHTML = `
            <div class="welcome-message">
                <h3>Welcome to Nyayantar</h3>
                <p>Ask me anything about Indian law. I can help with:</p>
                <ul>
                    <li>Legal provisions and sections</li>
                    <li>Act interpretations</li>
                    <li>Case law references</li>
                    <li>Document citations</li>
                </ul>
                <p class="example-queries">Try: "What is Section 138 of NI Act?"</p>
            </div>
        `;
    }
});

// Initialize - check login status on page load
checkLoginStatus();

// Auto-resize textarea
queryInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 200) + 'px';
});

// Handle Enter key to submit (Shift+Enter for new line)
queryInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
    }
});

// Handle form submission
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const query = queryInput.value.trim();
    if (!query) return;
    
    // Clear welcome message if present
    const welcomeMsg = chatMessages.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }
    
    // Add user message
    addMessage('user', query);
    
    // Clear input
    queryInput.value = '';
    queryInput.style.height = 'auto';
    
    // Disable input
    setLoading(true);
    
    try {
        // Call FastAPI /query endpoint
        const response = await fetch(`${API_BASE_URL}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: query })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Display response
        displayResponse(data);
        
    } catch (error) {
        console.error('Error:', error);
        addMessage('assistant', `Error: ${error.message}\n\nPlease make sure the FastAPI server is running on ${API_BASE_URL}`);
    } finally {
        setLoading(false);
    }
});

function addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const header = document.createElement('div');
    header.className = 'message-header';
    header.textContent = role === 'user' ? 'You' : '⚖️ Nyayantar';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    
    messageDiv.appendChild(header);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function displayResponse(data) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';
    
    const header = document.createElement('div');
    header.className = 'message-header';
    header.textContent = '⚖️ Nyayantar';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Main response
    if (data.final_response) {
        contentDiv.textContent = data.final_response;
    } else {
        contentDiv.textContent = 'No response generated.';
    }
    
    messageDiv.appendChild(header);
    messageDiv.appendChild(contentDiv);
    
    // Add detailed phases information with dropdowns
    if (data.phases && data.phases.length > 0) {
        const phasesSection = document.createElement('div');
        phasesSection.className = 'phases-section';
        
        const phasesTitle = document.createElement('h4');
        phasesTitle.textContent = '📊 Processing Details:';
        phasesTitle.style.marginBottom = '16px';
        phasesTitle.style.fontSize = '14px';
        phasesTitle.style.fontWeight = '600';
        phasesSection.appendChild(phasesTitle);
        
        data.phases.forEach((phase, index) => {
            const phaseItem = document.createElement('div');
            phaseItem.className = 'phase-item';
            
            // Phase header (clickable)
            const phaseHeader = document.createElement('div');
            phaseHeader.className = 'phase-header';
            phaseHeader.onclick = () => togglePhaseDetails(index);
            
            const phaseName = document.createElement('h4');
            phaseName.textContent = phase.phase;
            phaseHeader.appendChild(phaseName);
            
            // Status badge
            const statusBadge = document.createElement('span');
            statusBadge.className = `phase-status ${phase.status}`;
            statusBadge.textContent = phase.status.toUpperCase();
            phaseHeader.appendChild(statusBadge);
            
            // Time
            if (phase.duration_seconds) {
                const timeSpan = document.createElement('span');
                timeSpan.className = 'phase-time';
                timeSpan.style.marginLeft = '12px';
                timeSpan.textContent = `⏱️ ${phase.duration_seconds}s`;
                phaseHeader.appendChild(timeSpan);
            }
            
            // Toggle indicator
            const toggle = document.createElement('span');
            toggle.className = 'phase-toggle';
            toggle.id = `toggle-${index}`;
            toggle.textContent = '▼';
            phaseHeader.appendChild(toggle);
            
            phaseItem.appendChild(phaseHeader);
            
            // Phase content (collapsible)
            const phaseContent = document.createElement('div');
            phaseContent.className = 'phase-content';
            phaseContent.id = `phase-content-${index}`;
            
            // Status and message
            if (phase.message) {
                const detailSection = document.createElement('div');
                detailSection.className = 'detail-section';
                detailSection.innerHTML = `<h5>Status Message</h5><div class="detail-item">${phase.message}</div>`;
                phaseContent.appendChild(detailSection);
            }
            
            // Phase 1: BIOES Tagging Details
            if (phase.phase.includes('BIOES') && phase.output) {
                const taggingSection = document.createElement('div');
                taggingSection.className = 'detail-section';
                
                let taggingHTML = '<h5>📝 Tagging Details</h5>';
                
                if (phase.output.entities_count !== undefined) {
                    taggingHTML += `<div class="detail-item"><strong>Entities Found:</strong> ${phase.output.entities_count}</div>`;
                }
                
                if (phase.output.bioes_tags_count !== undefined) {
                    taggingHTML += `<div class="detail-item"><strong>BIOES Tags Generated:</strong> ${phase.output.bioes_tags_count}</div>`;
                }
                
                // Entities
                if (phase.output.entities && phase.output.entities.length > 0) {
                    taggingHTML += '<div class="detail-item"><strong>Entities:</strong></div>';
                    taggingHTML += '<div class="entities-list">';
                    phase.output.entities.forEach(ent => {
                        taggingHTML += `<span class="entity-tag"><span class="entity-label">${ent.label}:</span>${ent.text}</span>`;
                    });
                    taggingHTML += '</div>';
                }
                
                // Tokens
                if (phase.output.tokens && phase.output.tokens.length > 0) {
                    taggingHTML += `<div class="detail-item" style="margin-top: 12px;"><strong>Tokens (${phase.output.tokens.length}):</strong></div>`;
                    taggingHTML += '<div class="tokens-list">';
                    phase.output.tokens.slice(0, 30).forEach(token => {
                        taggingHTML += `<span class="token-item">${token}</span>`;
                    });
                    if (phase.output.tokens.length > 30) {
                        taggingHTML += `<span style="font-size: 11px; color: #6e6e80; padding: 3px 8px;">... and ${phase.output.tokens.length - 30} more tokens</span>`;
                    }
                    taggingHTML += '</div>';
                }
                
                // BIOES Tags
                if (phase.output.bioes_tags && phase.output.bioes_tags.length > 0) {
                    taggingHTML += `<div class="detail-item" style="margin-top: 12px;"><strong>BIOES Tags (${phase.output.bioes_tags.length}):</strong></div>`;
                    taggingHTML += '<div class="bioes-tags">';
                    phase.output.bioes_tags.slice(0, 30).forEach(tag => {
                        const tagClass = tag.tag.charAt(0); // B, I, O, E, or S
                        const entityType = tag.entity_type ? ` (${tag.entity_type})` : '';
                        taggingHTML += `<span class="bioes-tag ${tagClass}" title="${tag.tag}${entityType}">${tag.token} [${tag.tag}]</span>`;
                    });
                    if (phase.output.bioes_tags.length > 30) {
                        taggingHTML += `<span style="font-size: 11px; color: #6e6e80; padding: 3px 8px;">... and ${phase.output.bioes_tags.length - 30} more tags</span>`;
                    }
                    taggingHTML += '</div>';
                }
                
                taggingSection.innerHTML = taggingHTML;
                phaseContent.appendChild(taggingSection);
            }
            
            // Phase 2: Agent Routing Details
            if (phase.phase.includes('Routing') && phase.output) {
                const routingSection = document.createElement('div');
                routingSection.className = 'detail-section';
                
                let routingHTML = '<h5>🔄 Routing Details</h5>';
                
                if (phase.output.agent) {
                    routingHTML += `<div class="detail-item"><strong>Routed Agent:</strong> <span style="color: #10a37f; font-weight: 600;">${phase.output.agent}</span></div>`;
                }
                
                if (phase.output.reason) {
                    routingHTML += `<div class="detail-item"><strong>Reason:</strong> ${phase.output.reason}</div>`;
                }
                
                routingSection.innerHTML = routingHTML;
                phaseContent.appendChild(routingSection);
            }
            
            // Phase 3: Agent Processing Details
            if (phase.phase.includes('Agent Processing') && phase.output) {
                const agentSection = document.createElement('div');
                agentSection.className = 'detail-section';
                
                let agentHTML = '<h5>🤖 Agent Processing Details</h5>';
                
                if (phase.output.model) {
                    agentHTML += `<div class="detail-item"><strong>Model:</strong> ${phase.output.model}</div>`;
                }
                
                if (phase.output.response_length) {
                    agentHTML += `<div class="detail-item"><strong>Response Length:</strong> ${phase.output.response_length} characters</div>`;
                }
                
                // Document Retrieval Details
                if (phase.output.document_retrieval) {
                    const docRetrieval = phase.output.document_retrieval;
                    agentHTML += '<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e5e6;">';
                    agentHTML += '<h5 style="margin-bottom: 8px;">📚 Document Retrieval</h5>';
                    
                    if (docRetrieval.has_document_context) {
                        agentHTML += `<div class="detail-item"><strong>Documents Retrieved:</strong> ${docRetrieval.num_documents_retrieved} pages from ${docRetrieval.num_sources} documents</div>`;
                        
                        // Timing breakdown
                        if (docRetrieval.retrieval_time_seconds || docRetrieval.llm_generation_time_seconds) {
                            agentHTML += '<div class="timing-info" style="margin-top: 8px;">';
                            agentHTML += '<strong>Timing Breakdown:</strong><br>';
                            if (docRetrieval.retrieval_time_seconds) {
                                agentHTML += `• Document Retrieval: ${docRetrieval.retrieval_time_seconds}s<br>`;
                            }
                            if (docRetrieval.llm_generation_time_seconds) {
                                agentHTML += `• LLM Generation: ${docRetrieval.llm_generation_time_seconds}s<br>`;
                            }
                            if (docRetrieval.total_agent_time_seconds) {
                                agentHTML += `• Total Agent Time: ${docRetrieval.total_agent_time_seconds}s`;
                            }
                            agentHTML += '</div>';
                        }
                        
                        // Documents Used - Detailed List
                        if (docRetrieval.sources && docRetrieval.sources.length > 0) {
                            agentHTML += '<div style="margin-top: 12px;"><strong>📄 Documents Used:</strong></div>';
                            docRetrieval.sources.forEach((source, idx) => {
                                agentHTML += '<div class="source-item" style="margin-top: 8px; padding: 10px; background: #ffffff; border: 1px solid #e5e5e6; border-radius: 6px;">';
                                agentHTML += `<div style="font-weight: 600; color: #202123; margin-bottom: 4px;">Document ${idx + 1}</div>`;
                                agentHTML += `<div style="font-size: 12px; color: #6e6e80; margin-bottom: 2px;"><strong>Filename:</strong> ${source.filename || 'Unknown'}</div>`;
                                if (source.category) {
                                    agentHTML += `<div style="font-size: 12px; color: #6e6e80; margin-bottom: 2px;"><strong>Category:</strong> ${source.category}</div>`;
                                }
                                if (source.subcategory) {
                                    agentHTML += `<div style="font-size: 12px; color: #6e6e80; margin-bottom: 2px;"><strong>Subcategory:</strong> ${source.subcategory}</div>`;
                                }
                                if (source.page) {
                                    agentHTML += `<div style="font-size: 12px; color: #6e6e80; margin-bottom: 2px;"><strong>Page:</strong> ${source.page}</div>`;
                                }
                                if (source.citation) {
                                    agentHTML += `<div style="font-size: 11px; color: #10a37f; margin-top: 4px; padding-top: 4px; border-top: 1px solid #e5e5e6;"><strong>Citation:</strong> ${source.citation}</div>`;
                                }
                                agentHTML += '</div>';
                            });
                        }
                    } else {
                        agentHTML += '<div class="detail-item">No document context retrieved (using general knowledge)</div>';
                    }
                    
                    agentHTML += '</div>';
                }
                
                agentSection.innerHTML = agentHTML;
                phaseContent.appendChild(agentSection);
            }
            
            phaseItem.appendChild(phaseContent);
            phasesSection.appendChild(phaseItem);
        });
        
        messageDiv.appendChild(phasesSection);
    }
    
    // Add routed agent info at top
    if (data.routed_agent) {
        const agentInfo = document.createElement('div');
        agentInfo.style.marginTop = '12px';
        agentInfo.style.padding = '10px';
        agentInfo.style.background = '#f0f9ff';
        agentInfo.style.borderRadius = '6px';
        agentInfo.style.fontSize = '13px';
        agentInfo.innerHTML = `<strong>Routed Agent:</strong> <span style="color: #10a37f; font-weight: 600;">${data.routed_agent}</span>`;
        contentDiv.appendChild(agentInfo);
    }
    
    // Add "Documents Used" section at the end (if any documents were used)
    const askPhase = data.phases?.find(p => p.phase.includes('ASK'));
    if (askPhase && askPhase.output && askPhase.output.document_retrieval && askPhase.output.document_retrieval.sources) {
        const sources = askPhase.output.document_retrieval.sources;
        if (sources.length > 0) {
            const documentsSection = document.createElement('div');
            documentsSection.className = 'sources-section';
            documentsSection.style.marginTop = '16px';
            documentsSection.style.paddingTop = '16px';
            documentsSection.style.borderTop = '2px solid #e5e5e6';
            
            const docsTitle = document.createElement('h4');
            docsTitle.textContent = '📚 Documents Used in Response:';
            docsTitle.style.marginBottom = '12px';
            docsTitle.style.fontSize = '14px';
            docsTitle.style.fontWeight = '600';
            documentsSection.appendChild(docsTitle);
            
            sources.forEach((source, idx) => {
                const docItem = document.createElement('div');
                docItem.className = 'document-item';
                
                const docHeader = document.createElement('div');
                docHeader.className = 'document-item-header';
                docHeader.textContent = `Document ${idx + 1}: ${source.filename || 'Unknown'}`;
                docItem.appendChild(docHeader);
                
                if (source.category) {
                    const categoryDiv = document.createElement('div');
                    categoryDiv.className = 'document-item-detail';
                    categoryDiv.innerHTML = `<strong>Category:</strong> ${source.category}`;
                    docItem.appendChild(categoryDiv);
                }
                
                if (source.subcategory) {
                    const subcatDiv = document.createElement('div');
                    subcatDiv.className = 'document-item-detail';
                    subcatDiv.innerHTML = `<strong>Subcategory:</strong> ${source.subcategory}`;
                    docItem.appendChild(subcatDiv);
                }
                
                if (source.page) {
                    const pageDiv = document.createElement('div');
                    pageDiv.className = 'document-item-detail';
                    pageDiv.innerHTML = `<strong>Page Number:</strong> ${source.page}`;
                    docItem.appendChild(pageDiv);
                }
                
                if (source.citation) {
                    const citationDiv = document.createElement('div');
                    citationDiv.className = 'document-citation';
                    citationDiv.innerHTML = `<strong>Full Citation:</strong> ${source.citation}`;
                    docItem.appendChild(citationDiv);
                }
                
                documentsSection.appendChild(docItem);
            });
            
            messageDiv.appendChild(documentsSection);
        }
    }
    
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function togglePhaseDetails(index) {
    const content = document.getElementById(`phase-content-${index}`);
    const toggle = document.getElementById(`toggle-${index}`);
    
    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        toggle.textContent = '▼';
    } else {
        content.classList.add('expanded');
        toggle.textContent = '▲';
    }
}

function setLoading(loading) {
    sendButton.disabled = loading;
    queryInput.disabled = loading;
    
    if (loading) {
        statusIndicator.classList.add('processing');
        statusIndicator.querySelector('span:last-child').textContent = 'Processing...';
        
        // Add loading message
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message assistant';
        loadingDiv.id = 'loading-message';
        
        const loadingContent = document.createElement('div');
        loadingContent.className = 'loading';
        loadingContent.innerHTML = `
            <span>Processing query</span>
            <div class="loading-dots">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
            </div>
        `;
        
        loadingDiv.appendChild(loadingContent);
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } else {
        statusIndicator.classList.remove('processing');
        statusIndicator.querySelector('span:last-child').textContent = 'Ready';
        
        // Remove loading message
        const loadingMsg = document.getElementById('loading-message');
        if (loadingMsg) {
            loadingMsg.remove();
        }
    }
}

// Check API connection on load
async function checkAPI() {
    try {
        const response = await fetch(`${API_BASE_URL}/docs`);
        if (response.ok) {
            if (statusIndicator) {
                statusIndicator.querySelector('span:last-child').textContent = 'Ready';
            }
        }
    } catch (error) {
        if (statusIndicator) {
            statusIndicator.querySelector('span:last-child').textContent = 'API Offline';
            statusIndicator.querySelector('.status-dot').style.background = '#ef4444';
        }
    }
}

// Initialize API check only if logged in
if (sessionStorage.getItem('nyayantar_logged_in') === 'true') {
    checkAPI();
}
