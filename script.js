document.addEventListener("DOMContentLoaded", () => {
    // Nav Logic
    const navItems = document.querySelectorAll('.nav-item, .nav-link');
    const sections = document.querySelectorAll('.section');
    const pageTitle = document.getElementById('pageTitle');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            
            navItems.forEach(nav => {
                if(nav.classList.contains('nav-item')) nav.classList.remove('active');
            });
            if(item.classList.contains('nav-item')) item.classList.add('active');
            else {
                document.querySelector('.nav-item[data-target="profile"]').classList.add('active');
            }

            sections.forEach(sec => sec.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
            
            pageTitle.innerText = targetId.charAt(0).toUpperCase() + targetId.slice(1).replace('-', ' ');
            
            if(targetId === 'dashboard') {
                if(radarChartInstance) radarChartInstance.resize();
                if(doughnutChartInstance) doughnutChartInstance.resize();
                if(barChartInstance) barChartInstance.resize();
            }
        });
    });

    const searchInput = document.querySelector('.search-box input');
    const bellBtn = document.querySelector('.btn-icon .fa-bell').parentElement;
    
    if(bellBtn) {
        bellBtn.title = "Clear Activity Logs";
        bellBtn.onclick = () => {
            localStorage.setItem('activityLog', JSON.stringify([]));
            renderActivityLog();
            showToast('<i class="fa-solid fa-trash"></i> Activity logs cleared.');
        };
    }

    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const skillDivs = document.querySelectorAll('.skill-item');
            skillDivs.forEach(div => {
                const text = div.innerText.toLowerCase();
                if(text.includes(query)) {
                    div.style.display = 'flex';
                    div.style.background = query ? '#eff6ff' : '';
                } else {
                    div.style.display = 'none';
                }
            });
        });
    }

    // --- State Management ---
    function getUserProfile() {
        console.log("Fetching user profile...");
        let profile = JSON.parse(localStorage.getItem('userProfile'));
        if (!profile) {
            return { goal: "Data Scientist", level: "Beginner", interests: ["AI", "ML", "Data Science"], fullName: "Guest User", course: "MSc Data Science", college: "Tech University" };
        }
        return profile;
    }

    function logActivity(icon, text) {
        console.log("Logging activity:", text);
        let logs = JSON.parse(localStorage.getItem('activityLog')) || [];
        logs.unshift({ icon, text, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) });
        if(logs.length > 8) logs.pop();
        localStorage.setItem('activityLog', JSON.stringify(logs));
        renderActivityLog();
    }

    function renderActivityLog() {
        const feed = document.querySelector('.activity-feed');
        if(!feed) return;
        let logs = JSON.parse(localStorage.getItem('activityLog')) || [
            { icon: 'fa-rocket', text: 'MSc Data Science OS Initialized', time: 'Recently' }
        ];
        feed.innerHTML = logs.map(l => `
            <div class="activity-item">
                <div class="activity-dot" style="background:var(--primary); display:flex; align-items:center; justify-content:center; color:white; font-size:0.6rem;"><i class="fa-solid ${l.icon}"></i></div>
                <p class="text-sm">${l.text}</p>
                <span class="text-xs text-muted">${l.time}</span>
            </div>
        `).join('');
    }

    function updateMilestone() {
        const milestoneVal = document.querySelector('#dashboard .stat-card:nth-child(3) .stat-value');
        if(!milestoneVal) return;
        const nextSkill = skillsMasterList.find(s => !appState.skills[s.id]);
        if(nextSkill) {
            milestoneVal.innerText = `Master ${nextSkill.name.split(' (')[0]}`;
            milestoneVal.classList.remove('text-success');
        } else {
            milestoneVal.innerText = "All Skills Mastered!";
            milestoneVal.classList.add('text-success');
        }
    }

    let userProfile = getUserProfile();
    let userSkills = JSON.parse(localStorage.getItem('userSkills')) || {
        's1': true, 's2': true, 's3': false, 's4': false, 
        's5': false, 's6': false, 's7': false, 's8': false, 's9': false
    };

    let appState = {
        profile: userProfile,
        skills: userSkills
    };

    console.log("App State Initialized:", appState);

    function saveState() {
        localStorage.setItem('userProfile', JSON.stringify(appState.profile));
        localStorage.setItem('userSkills', JSON.stringify(appState.skills));
        console.log("State Saved to LocalStorage");
    }

    // --- DOM Elements ---
    const goalInput = document.getElementById('goalInput');
    const levelSelect = document.getElementById('levelSelect');
    const interestCheckboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
    const nameInput = document.getElementById('nameInput');
    const courseInput = document.getElementById('courseInput');
    const collegeInput = document.getElementById('collegeInput');
    
    // --- Initialize UI from State ---
    function initProfileUI() {
        if(appState.profile.goal) goalInput.value = appState.profile.goal;
        if(appState.profile.level) levelSelect.value = appState.profile.level;
        if(appState.profile.fullName) nameInput.value = appState.profile.fullName;
        if(appState.profile.course) courseInput.value = appState.profile.course;
        if(appState.profile.college) collegeInput.value = appState.profile.college;
        
        interestCheckboxes.forEach(cb => {
            cb.checked = appState.profile.interests.includes(cb.value);
        });
        
        const roleText = appState.profile.course ? `${appState.profile.course} • ${appState.profile.level}` : appState.profile.level;
        document.querySelectorAll('.user-role').forEach(node => node.innerText = roleText);
        document.querySelectorAll('.user-name').forEach(node => node.innerText = appState.profile.fullName || 'Guest User');
        
        const avUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(appState.profile.fullName || 'User')}&background=3b82f6&color=fff`;
        document.querySelectorAll('img[alt="User"], img[alt="Profile"]').forEach(img => img.src = avUrl);
    }
    initProfileUI();

    nameInput.addEventListener('input', (e) => {
        const val = e.target.value || 'User';
        const avUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(val)}&background=3b82f6&color=fff`;
        document.querySelectorAll('img[alt="User"], img[alt="Profile"]').forEach(img => img.src = avUrl);
    });


    // --- 1. Skill Progress Tracker Data & Logic ---
    const skillsMasterList = [
        { id: 's1', name: 'Python Programming' },
        { id: 's2', name: 'SQL & Databases' },
        { id: 's3', name: 'Mathematics & Statistics' },
        { id: 's4', name: 'Data Wrangling (Pandas)' },
        { id: 's5', name: 'Machine Learning (Scikit-Learn)' },
        { id: 's6', name: 'Deep Learning (TensorFlow/PyTorch)' },
        { id: 's7', name: 'Natural Language Processing (NLP)' },
        { id: 's8', name: 'Computer Vision (CV)' },
        { id: 's9', name: 'Data Engineering' }
    ];

    const skillsContainer = document.querySelector('.skills-list');
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    const overallSkillVal = document.getElementById('overall-skill-val');

    function renderSkills() {
        skillsContainer.innerHTML = '';
        skillsMasterList.forEach(skill => {
            const isChecked = appState.skills[skill.id] || false;
            
            const div = document.createElement('div');
            div.className = `skill-item ${isChecked ? 'checked' : ''}`;
            div.innerHTML = `
                <input type="checkbox" id="${skill.id}" ${isChecked ? 'checked' : ''}>
                <label for="${skill.id}">${skill.name}</label>
            `;
            
            div.querySelector('input').addEventListener('change', (e) => {
                appState.skills[skill.id] = e.target.checked;
                saveState();
                
                if(e.target.checked) div.classList.add('checked');
                else div.classList.remove('checked');
                
                updateProgress();
                logActivity(e.target.checked ? 'fa-check' : 'fa-xmark', `${e.target.checked ? 'Mastered' : 'Unchecked'} ${skill.name}`);
            });
            
            skillsContainer.appendChild(div);
        });
        updateProgress();
    }

    function updateProgress() {
        const completed = Object.values(appState.skills).filter(v => v).length;
        const total = skillsMasterList.length;
        const percent = Math.round((completed / total) * 100);
        progressText.innerText = `${percent}%`;
        progressFill.style.width = `${percent}%`;
        overallSkillVal.innerText = `${percent}%`;
        
        updateRadarChart();
        updateAnalyticsCharts(completed, total - completed);
        updateResumeBuilder();
        updateMilestone();
    }

    // --- 2. Advanced Visual Analytics (Charts) ---
    let radarChartInstance = null;
    const radarCtx = document.getElementById('radarChart');
    if(radarCtx) {
        radarChartInstance = new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: ['Coding', 'Math', 'ML', 'DL', 'Data Eng', 'Biz'],
                datasets: [
                    { label: 'Your Skills', data: [0, 0, 0, 0, 0, 0], backgroundColor: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 1)' },
                    { label: 'Industry Standard', data: [85, 80, 85, 60, 70, 75], backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.5)', borderDash: [5, 5] }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { r: { beginAtZero: true, max: 100, ticks: { display: false } } }, plugins: { legend: { position: 'bottom' } } }
        });
    }

    function updateRadarChart() {
        if(!radarChartInstance) return;
        let prog = (appState.skills['s1'] ? 30 : 0) + (appState.skills['s2'] ? 40 : 10) + (appState.skills['s4'] ? 20 : 0);
        let math = appState.skills['s3'] ? 80 : 30;
        let ml = appState.skills['s5'] ? 85 : 20;
        let dl = appState.skills['s6'] ? 70 : 10;
        let de = appState.skills['s9'] ? 80 : 20;
        let biz = 50;
        radarChartInstance.data.datasets[0].data = [prog > 100? 100: prog, math, ml, dl, de, biz];
        if(appState.profile.level === 'Advanced') radarChartInstance.data.datasets[1].data = [95, 90, 95, 80, 85, 85];
        else if(appState.profile.level === 'Intermediate') radarChartInstance.data.datasets[1].data = [75, 70, 75, 50, 60, 65];
        else radarChartInstance.data.datasets[1].data = [50, 40, 40, 20, 30, 40];
        radarChartInstance.update();
    }

    let doughnutChartInstance = null;
    const dCtx = document.getElementById('doughnutChart');
    if(dCtx) {
        doughnutChartInstance = new Chart(dCtx, {
            type: 'doughnut',
            data: {
                labels: ['Mastered', 'Pending'],
                datasets: [{ data: [2, 7], backgroundColor: ['#10b981', '#f1f5f9'], hoverBackgroundColor: ['#059669', '#e2e8f0'], borderWidth: 0, cutout: '75%' }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
    }

    let barChartInstance = null;
    const bCtx = document.getElementById('barChart');
    if(bCtx) {
        barChartInstance = new Chart(bCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{ label: 'Hours', data: [1.5, 2, 0.5, 3, 2.5, 4, 1], backgroundColor: '#3b82f6', borderRadius: 4 }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1 } }, x: { grid: { display: false } } }, plugins: { legend: { display: false } } }
        });
    }

    function updateAnalyticsCharts(completedCount, pendingCount) {
        if(doughnutChartInstance) {
            doughnutChartInstance.data.datasets[0].data = [completedCount, pendingCount];
            doughnutChartInstance.update();
        }
    }

    renderSkills();

    // --- 3. Resume Builder Execution ---
    function updateResumeBuilder() {
        const goal = appState.profile.goal || "Data Scientist";
        document.getElementById('resumeTargetRole').innerText = goal;
        
        const masteredList = document.getElementById('masteredSkillsList');
        const missingList = document.getElementById('missingSkillsList');
        const summaryText = document.getElementById('resumeSummaryText');
        
        masteredList.innerHTML = '';
        missingList.innerHTML = '';
        
        let masteredCount = 0;
        let missingArr = [];
        let masteredArr = [];
        
        skillsMasterList.forEach(skill => {
            const isChecked = appState.skills[skill.id];
            if(isChecked) {
                masteredList.innerHTML += `<span class="badge badge-success">${skill.name}</span>`;
                masteredCount++;
                masteredArr.push(skill.name);
            } else {
                missingList.innerHTML += `<span class="badge badge-danger">${skill.name}</span>`;
                missingArr.push(skill.name);
            }
        });
        
        if(masteredCount === 0) masteredList.innerHTML = '<span class="text-sm text-muted">No skills mastered yet.</span>';
        if(missingArr.length === 0) missingList.innerHTML = '<span class="text-sm text-success font-medium">You possess all core competencies!</span>';
        
        let summary = `Highly motivated ${appState.profile.level} ${goal} with a strong foundation in Data Analytics.`;
        if (masteredCount > 2) summary = `Results-driven ${goal} proficient in ${masteredArr.slice(0,3).join(", ")}. Adept at turning complex datasets into actionable insights.`;
        if (missingArr.length > 0 && masteredCount > 0) summary += ` Continuously expanding expertise in areas such as ${missingArr[0]}.`;
        summaryText.innerText = `"${summary}"`;
    }

    function updateRecommendations() {
        const roleText = appState.profile.course ? `${appState.profile.course} • ${appState.profile.level}` : appState.profile.level;
        document.querySelectorAll('.user-role').forEach(node => node.innerText = roleText);
        document.querySelectorAll('.user-name').forEach(node => node.innerText = appState.profile.fullName || 'Guest User');
        
        const avUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(appState.profile.fullName || 'User')}&background=3b82f6&color=fff`;
        document.querySelectorAll('img[alt="User"], img[alt="Profile"]').forEach(img => img.src = avUrl);

        updateRadarChart();
        updateResumeBuilder();
        renderProjects();
        renderInternships();
    }
    // --- 4. Profile Form Submission ---
    document.getElementById('profileForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        appState.profile = { 
            fullName: nameInput.value,
            course: courseInput.value,
            college: collegeInput.value,
            goal: goalInput.value, 
            level: levelSelect.value, 
            interests: Array.from(interestCheckboxes).filter(cb => cb.checked).map(cb => cb.value) 
        };
        saveState(); // Calls localStorage.setItem explicitly
        console.log("Saved Profile:", appState.profile);
        
        updateRecommendations();
        logActivity('fa-user-pen', 'Updated User Profile & Goals');
        
        const btn = e.target.querySelector('button');
        const origText = btn.innerText;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> System Updated';
        btn.classList.add('btn-success');
        
        // Show Global Toast
        const toast = document.getElementById('toastNotification');
        if(toast) {
            toast.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Recommendations updated based on your profile';
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3500);
        }

        setTimeout(() => { btn.innerText = origText; btn.classList.remove('btn-success'); }, 2000);
    });

    // --- 5. Dynamic Projects Engine ---
    const projectsGrid = document.getElementById('projectsGrid');
    const internshipsList = document.getElementById('internshipsList');
    
    const allProjects = [
        { title: 'Customer Churn Tracker', diff: 'Beginner', diffClass: 'badge-success', tags: ['Data Science', 'ML', 'AI'], desc: 'Analyze telecom data to predict cancelations.', tech: ['Python', 'Pandas', 'Scikit-learn'] },
        { title: 'Basic React Portfolio', diff: 'Beginner', diffClass: 'badge-success', tags: ['Web Dev'], desc: 'Build a fully responsive personal portfolio from scratch.', tech: ['React', 'CSS', 'HTML'] },
        { title: 'E-Commerce Backend', diff: 'Intermediate', diffClass: 'badge-warning', tags: ['Web Dev'], desc: 'Develop a REST API for a digital storefront.', tech: ['Node.js', 'Express', 'MongoDB'] },
        { title: 'House Price Regression', diff: 'Intermediate', diffClass: 'badge-warning', tags: ['ML', 'AI', 'Data Science'], desc: 'Build an XGBoost model to predict real estate prices.', tech: ['XGBoost', 'Seaborn'] },
        { title: 'Medical Image Classifier', diff: 'Advanced', diffClass: 'badge-purple', tags: ['CV', 'AI', 'ML'], desc: 'Detect pneumonia from X-Ray images using CNNs.', tech: ['PyTorch', 'CNN', 'OpenCV'] },
        { title: 'RAG Financial Chatbot', diff: 'Advanced', diffClass: 'badge-purple', tags: ['NLP', 'AI'], desc: 'Chatbot interacting with financial company reports.', tech: ['LangChain', 'OpenAI', 'Pinecone'] },
        { title: 'Real-Time Streaming Pipeline', diff: 'Advanced', diffClass: 'badge-purple', tags: ['Data Eng'], desc: 'Process live Twitter data using Kafka and Spark.', tech: ['Kafka', 'Spark', 'AWS'] },
        { title: 'Fullstack Task Manager', diff: 'Advanced', diffClass: 'badge-purple', tags: ['Web Dev'], desc: 'Microservices architecture for a scaling to-do list.', tech: ['React', 'Docker', 'PostgreSQL'] },
        { title: 'Automated EDA Bot', diff: 'Beginner', diffClass: 'badge-success', tags: ['Data Science'], desc: 'Script that automates exploratory data analysis.', tech: ['Pandas Profiling', 'Matplotlib'] },
        { title: 'Sentiment Analysis API', diff: 'Intermediate', diffClass: 'badge-warning', tags: ['NLP', 'AI', 'Web Dev'], desc: 'API that predicts sentiment of movie reviews.', tech: ['FastAPI', 'HuggingFace'] }
    ];

    function renderProjects() {
        projectsGrid.innerHTML = '';
        const profileData = getUserProfile(); // Explicit extraction from local storage
        const userInterests = profileData.interests;
        const userLevel = profileData.level;
        
        let interestFiltered = allProjects.filter(p => {
            if (userInterests.length === 0) return true;
            let match = false;
            let checksForAI = ['AI', 'ML', 'CV', 'NLP'];
            let checksForWeb = ['Web Dev'];
            let checksForData = ['Data Science', 'Data Eng', 'ML'];
            
            if (userInterests.includes('AI') && p.tags.some(t => checksForAI.includes(t))) match = true;
            if (userInterests.includes('Web Dev') && p.tags.some(t => checksForWeb.includes(t))) match = true;
            if (userInterests.includes('Data Science') && p.tags.some(t => checksForData.includes(t))) match = true;
            if (p.tags.some(tag => userInterests.includes(tag))) match = true;
            return match;
        });

        let levelFiltered = interestFiltered.filter(p => {
            if (userLevel === 'Beginner') return p.diff === 'Beginner';
            if (userLevel === 'Intermediate') return p.diff === 'Beginner' || p.diff === 'Intermediate';
            return p.diff === 'Intermediate' || p.diff === 'Advanced';
        });
        
        if (levelFiltered.length < 3) {
            interestFiltered.sort((a, b) => (b.diff === userLevel ? 1 : 0) - (a.diff === userLevel ? 1 : 0));
            levelFiltered = interestFiltered;
        } else {
             levelFiltered.sort((a, b) => (b.diff === userLevel ? 1 : 0) - (a.diff === userLevel ? 1 : 0));
        }

        let projectStates = JSON.parse(localStorage.getItem('projectStates')) || {};
        function saveProjectStates() {
            localStorage.setItem('projectStates', JSON.stringify(projectStates));
        }

        const finalProjects = levelFiltered.slice(0, 5);
        if(finalProjects.length === 0) {
            projectsGrid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1;">No exact projects found. Try adjusting interests.</p>';
            return;
        }

        finalProjects.forEach(p => {
            let techHtml = p.tech.map(t => `<span class="tech-tag">${t}</span>`).join('');
            
            const status = projectStates[p.title] || 'not-started';
            let btnHtml = '';
            let statusBadge = '';
            let cardStyle = '';
            let progressPercent = 0;
            let progressColor = 'var(--primary)';

            if (status === 'completed') {
                btnHtml = `<button class="action-btn undo-project-btn" data-title="${p.title}" style="width: 100%; margin-top: 1rem; background: var(--success); color: white; border-color: var(--success);"><i class="fa-solid fa-undo"></i> Undo Completion</button>`;
                statusBadge = `<span class="badge badge-success">Completed</span>`;
                cardStyle = 'opacity: 0.8; border-top: 3px solid var(--success);';
                progressPercent = 100;
                progressColor = 'var(--success)';
            } else if (status === 'in-progress') {
                btnHtml = `<button class="action-btn complete-project-btn" data-title="${p.title}" style="width: 100%; margin-top: 1rem; background: var(--primary); color: white; border-color: var(--primary);"><i class="fa-solid fa-check"></i> Mark as Completed</button>`;
                statusBadge = `<span class="badge badge-warning">In Progress</span>`;
                cardStyle = 'border-top: 3px solid var(--warning); box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);';
                progressPercent = 50;
                progressColor = 'var(--warning)';
            } else {
                btnHtml = `<button class="action-btn start-project-btn" data-title="${p.title}" style="width: 100%; margin-top: 1rem;"><i class="fa-solid fa-play"></i> Start Project</button>`;
                statusBadge = `<span class="badge ${p.diffClass}">${p.diff}</span>`;
                progressPercent = 0;
            }

            projectsGrid.innerHTML += `
                <div class="card project-card" style="display: flex; flex-direction: column; justify-content: space-between; transition: all 0.3s ease; ${cardStyle}">
                    <div>
                        <div class="project-header">
                            <h3 class="project-title">${p.title}</h3>
                            ${statusBadge}
                        </div>
                        <p class="project-desc">${p.desc}</p>
                        <div class="tech-stack">${techHtml}</div>
                        
                        <div class="project-progress mt-4">
                            <div class="flex-between text-xs mb-1">
                                <span class="text-muted font-medium">Tracking Progress</span>
                                <span class="font-bold" style="color: ${progressColor}">${progressPercent}%</span>
                            </div>
                            <div style="height: 6px; background: #eee; border-radius: 10px; overflow: hidden;">
                                <div style="width: ${progressPercent}%; height: 100%; background: ${progressColor}; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                            </div>
                        </div>
                    </div>
                    ${btnHtml}
                </div>
            `;
        });
        
        // Add handlers
        document.querySelectorAll('.start-project-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const title = btn.getAttribute('data-title');
                projectStates[title] = 'in-progress';
                saveProjectStates();
                renderProjects();
                logActivity('fa-play', `Started Project: ${title}`);
                showToast('<i class="fa-solid fa-play"></i> Project started! Happy coding.');
            });
        });

        document.querySelectorAll('.complete-project-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const title = btn.getAttribute('data-title');
                projectStates[title] = 'completed';
                saveProjectStates();
                renderProjects();
                updateDashboardProjectsStat();
                logActivity('fa-trophy', `Completed Project: ${title}`);
                showToast('<i class="fa-solid fa-trophy"></i> Project completed! Great job.');
            });
        });

        document.querySelectorAll('.undo-project-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const title = btn.getAttribute('data-title');
                projectStates[title] = 'in-progress';
                saveProjectStates();
                renderProjects();
                updateDashboardProjectsStat();
                logActivity('fa-rotate-left', `Reverted Project: ${title}`);
                showToast('<i class="fa-solid fa-rotate-left"></i> Project moved back to In Progress.');
            });
        });

        updateDashboardProjectsStat();
    }
    
    function showToast(message) {
        const toast = document.getElementById('toastNotification');
        if(toast) {
            toast.innerHTML = message;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3500);
        }
    }
    
    function updateDashboardProjectsStat() {
        const projectStates = JSON.parse(localStorage.getItem('projectStates')) || {};
        const completedCount = Object.values(projectStates).filter(s => s === 'completed').length;
        const total = 5;
        const percent = Math.round((completedCount / total) * 100);
        
        const statEl = document.getElementById('projects-stat');
        if(statEl) {
            statEl.innerHTML = `<span>${completedCount} / ${total}</span> <small style="font-size: 0.8rem; display: block; opacity: 0.8;">(${percent}%)</small>`;
        }
    }

    renderProjects();

    const allInternships = [
        { id: 'i1', role: 'Data Analyst Intern', company: 'FinTech Corp', icon: 'fa-chart-pie', req: ['SQL', 'Tableau', 'Excel'], tags: ['Data Science'], levels: ['Beginner', 'Intermediate'], url: 'https://www.linkedin.com/jobs/search/?keywords=Data%20Analyst%20Intern', description: 'Collaborate with the analytics team to build visualizations and perform SQL-based data extraction for financial reporting. You will assist in cleaning complex datasets and presenting insights to key stakeholders.' },
        { id: 'i2', role: 'Junior ML Engineer', company: 'HealthAI Labs', icon: 'fa-robot', req: ['Python', 'PyTorch', 'Docker'], tags: ['ML', 'AI'], levels: ['Intermediate', 'Advanced'], url: 'https://www.linkedin.com/jobs/search/?keywords=Machine%20Learning%20Engineer', description: 'Help deploy computer vision models for medical imaging. You will work with PyTorch and Docker to containerize inference engines and ensure seamless integration with our healthcare platform.' },
        { id: 'i3', role: 'Data Science Intern', company: 'Retail Giant', icon: 'fa-database', req: ['Pandas', 'A/B Testing', 'Stats'], tags: ['Data Science'], levels: ['Beginner'], url: 'https://www.linkedin.com/jobs/search/?keywords=Data%20Science%20Intern', description: 'Analyze retail consumer behavior, perform A/B tests on promotions, and present findings to the marketing team. Perfect for beginners looking to work with massive real-world transaction data.' },
        { id: 'i4', role: 'NLP Researcher', company: 'OpenTech', icon: 'fa-language', req: ['Transformers', 'PyTorch', 'HuggingFace'], tags: ['NLP', 'AI'], levels: ['Advanced'], url: 'https://www.linkedin.com/jobs/search/?keywords=NLP%20Researcher', description: 'Research state-of-the-art Large Language Models (LLMs) and fine-tune Transformers for specialized domain knowledge extraction. Requires strong background in deep learning and linguistics.' }
    ];

    const jobModal = document.getElementById('jobModal');
    const closeModal = document.querySelector('.close-modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalCompany = document.getElementById('modalCompany');
    const modalDescription = document.getElementById('modalDescription');
    const modalRequirements = document.getElementById('modalRequirements');
    const modalIcon = document.getElementById('modalIcon');
    const modalApplyBtn = document.getElementById('modalApplyBtn');

    if(closeModal) {
        closeModal.onclick = () => jobModal.classList.remove('show');
    }
    window.onclick = (event) => {
        if (event.target == jobModal) jobModal.classList.remove('show');
    }

    function renderInternships() {
        internshipsList.innerHTML = '';
        const profileData = getUserProfile(); // Explicit extraction from local storage
        const userInterests = profileData.interests;
        const userLevel = profileData.level;
        
        let appliedJobs = JSON.parse(localStorage.getItem('appliedJobs')) || [];
        function saveAppliedJobs() {
            localStorage.setItem('appliedJobs', JSON.stringify(appliedJobs));
        }

        if(!window.statusSimInterval) {
            window.statusSimInterval = setInterval(() => {
                let changed = false;
                appliedJobs.forEach(job => {
                    if(job.status === 'Applied' && Math.random() > 0.4) {
                        job.status = 'Under Review';
                        job.statusClass = 'badge-warning';
                        changed = true;
                    } else if(job.status === 'Under Review' && Math.random() > 0.3) {
                        const isAccepted = Math.random() > 0.6;
                        job.status = isAccepted ? 'Accepted' : 'Rejected';
                        job.statusClass = isAccepted ? 'badge-success' : 'badge-danger';
                        changed = true;
                    }
                });
                if(changed) {
                    saveAppliedJobs();
                    renderAppliedInternships();
                    // logActivity('fa-bell', 'Internship status updated');
                }
            }, 6000); // Check every 6s
        }
        
        const appliedInternshipsList = document.getElementById('appliedInternshipsList');
        function renderAppliedInternships() {
            if(!appliedInternshipsList) return;
            appliedInternshipsList.innerHTML = '';
            
            // Reload context directly
            appliedJobs = JSON.parse(localStorage.getItem('appliedJobs')) || [];
            
            if(appliedJobs.length === 0) {
                appliedInternshipsList.innerHTML = '<p class="text-muted text-sm" style="grid-column: 1/-1;">You haven\'t applied to any internships yet.</p>';
                return;
            }
            
            appliedJobs.forEach(job => {
                if(!job.status) { job.status = 'Applied'; job.statusClass = 'badge-purple'; }
                
                appliedInternshipsList.innerHTML += `
                    <div class="internship-card" style="opacity: 0.9;">
                        <div class="company-logo bg-green-light text-success"><i class="fa-solid ${job.icon}"></i></div>
                        <div class="role-info" style="flex: 1;">
                            <div class="flex-between" style="align-items: center;">
                                <h3 class="role-title m-0">${job.role}</h3>
                                <span class="badge ${job.statusClass}">${job.status}</span>
                            </div>
                            <div class="flex-between mt-1" style="align-items: center;">
                                <p class="text-sm text-muted m-0">${job.company}</p>
                                <span class="text-xs text-muted font-medium">Applied: ${job.date}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        renderAppliedInternships();

        let scored = allInternships.map(intern => {
            let score = 0;
            if(intern.tags.some(tag => userInterests.includes(tag))) score += 50;
            if(intern.levels.includes(userLevel)) score += 30;
            return { ...intern, matchScore: score + Math.floor(Math.random() * 20) };
        });
        
        scored.sort((a,b) => b.matchScore - a.matchScore);
        const finalInternships = scored.slice(0, 3);
        
        finalInternships.forEach(i => {
            const isApplied = appliedJobs.some(job => job.role === i.role && job.company === i.company);
            let reqHtml = i.req.map(r => `<span class="badge">${r}</span>`).join('');
            
            const btnHtml = isApplied 
                ? `<div style="display:flex; gap:0.5rem; width:100%; margin-top:1rem;">
                    <button class="action-btn view-details-btn" data-id="${i.id}" style="flex:1;">Details</button>
                    <button class="action-btn" disabled style="flex:1; background:var(--success); color:white; border-color:var(--success); cursor:not-allowed;"><i class="fa-solid fa-check"></i> Applied</button>
                  </div>`
                : `<div style="display:flex; gap:0.5rem; width:100%; margin-top:1rem;">
                    <button class="action-btn view-details-btn" data-id="${i.id}" style="flex:1;">Details</button>
                    <button class="action-btn apply-btn" data-role="${i.role}" data-company="${i.company}" data-icon="${i.icon}" data-url="${i.url}" style="flex:1;">Apply</button>
                  </div>`;

            internshipsList.innerHTML += `
                <div class="internship-card">
                    <div class="company-logo"><i class="fa-solid ${i.icon}"></i></div>
                    <div class="role-info">
                        <div class="flex-between">
                            <h3 class="role-title">${i.role}</h3>
                            <span class="text-sm font-medium text-success"><i class="fa-solid fa-bullseye"></i> ${Math.min(99, i.matchScore)}% Match</span>
                        </div>
                        <p class="text-sm text-muted mb-2">${i.company}</p>
                        <div class="req-skills">${reqHtml}</div>
                    </div>
                    ${btnHtml}
                </div>
            `;
        });
        
        // Add Detail Handlers
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const job = allInternships.find(j => j.id === id);
                if(job) {
                    modalTitle.innerText = job.role;
                    modalCompany.innerText = job.company;
                    modalIcon.innerHTML = `<i class="fa-solid ${job.icon}"></i>`;
                    modalDescription.innerText = job.description;
                    modalRequirements.innerHTML = job.req.map(r => `<span class="badge">${r}</span>`).join('');
                    
                    const isApplied = appliedJobs.some(j => j.role === job.role && j.company === job.company);
                    modalApplyBtn.onclick = () => {
                        window.open(job.url, '_blank');
                        // Logic moved to a function for reuse
                        handleApplyTransition(job.role, job.company, job.icon, job.url);
                        jobModal.classList.remove('show');
                    };
                    
                    if(isApplied) {
                        modalApplyBtn.innerText = 'Already Applied';
                        modalApplyBtn.disabled = true;
                    } else {
                        modalApplyBtn.innerText = 'Apply on LinkedIn';
                        modalApplyBtn.disabled = false;
                    }

                    jobModal.classList.add('show');
                }
            });
        });

        function handleApplyTransition(role, company, icon, url) {
            if(appliedJobs.some(job => job.role === role && job.company === company)) return;

            appliedJobs.push({ 
                role, company, icon, 
                date: new Date().toLocaleDateString(),
                status: 'Applied',
                statusClass: 'badge-purple'
            });
            saveAppliedJobs();
            renderInternships();
            logActivity('fa-paper-plane', `Linked Application: ${role} at ${company}`);
            
            showToast('<i class="fa-solid fa-paper-plane"></i> Application submitted successfully');
        }
        
        // Add Apply Event Listeners
        document.querySelectorAll('.apply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const role = btn.getAttribute('data-role');
                const company = btn.getAttribute('data-company');
                const icon = btn.getAttribute('data-icon');
                const url = btn.getAttribute('data-url');
                
                window.open(url, '_blank');
                handleApplyTransition(role, company, icon, url);
            });
        });
    }
    renderInternships();
    renderActivityLog();
    updateMilestone();
    
    // --- 6. Study Plan Generator (Restored) ---
    const generatePlanBtn = document.getElementById('generatePlanBtn');
    const roadmapContainer = document.getElementById('roadmapContainer');
    const processingState = document.getElementById('aiProcessingState');
    const aiReasoningText = document.getElementById('aiReasoningText');
    const timelineEl = document.getElementById('timelineEl');

    if (generatePlanBtn) {
        generatePlanBtn.addEventListener('click', () => {
            generatePlanBtn.disabled = true;
            generatePlanBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Engine Running...';
            roadmapContainer.classList.add('hidden');
            processingState.classList.remove('hidden');
            
            let step = 0;
            const processInterval = setInterval(() => {
                step++;
                if(step > 3) {
                    clearInterval(processInterval);
                    finishGeneration();
                }
            }, 800);
        });
    }

    function finishGeneration() {
        const profileData = getUserProfile();
        processingState.classList.add('hidden');
        roadmapContainer.classList.remove('hidden');
        timelineEl.innerHTML = `
            <div class="timeline-step"><div class="step-dot"></div><div class="step-content shadow-sm"><div class="flex-between"><h4>Phase 1: Foundations</h4><span class="badge badge-purple">Month 1</span></div><p>Master Python fundamentals and Exploratory Data Analysis.</p></div></div>
            <div class="timeline-step"><div class="step-dot"></div><div class="step-content shadow-sm"><div class="flex-between"><h4>Phase 2: Math & ML Core</h4><span class="badge badge-purple">Month 2</span></div><p>Implement core algorithms like Random Forest and SVMs from scratch.</p></div></div>
        `;
        aiReasoningText.innerText = `Based on your goal to become a ${profileData.goal}, this customized roadmap prioritizes high-ROI skills that are currently in heavy enterprise demand.`;
    }

    // --- 7. Optimized AI Mentor Logic ---
    function getRoadmap(level, goal) {
        const pathways = {
            beginner: `<h4>Beginner Roadmap for ${goal}</h4><ol><li><strong>Fundamentals:</strong> Python basics, SQL, and Statistics.</li><li><strong>Data Manipulation:</strong> Pandas, NumPy, and Data Cleaning.</li><li><strong>Visualization:</strong> Matplotlib, Seaborn, and Exploratory Analysis.</li><li><strong>Project:</strong> Build a simple EDA dashboard.</li></ol>`,
            intermediate: `<h4>Intermediate Roadmap for ${goal}</h4><ol><li><strong>ML Core:</strong> Regression, Classification, and Scikit-Learn.</li><li><strong>Advanced Math:</strong> Linear Algebra, Calculus, and Optimization.</li><li><strong>Model Tuning:</strong> Cross-validation, Grid Search, and Feature Engineering.</li><li><strong>Project:</strong> Deploy a predictive model using FastAPI or Streamlit.</li></ol>`,
            advanced: `<h4>Advanced Roadmap for ${goal}</h4><ol><li><strong>Deep Learning:</strong> Neural Networks, PyTorch/TensorFlow, and CNNs/RNNs.</li><li><strong>Specialization:</strong> NLP Transformers or Computer Vision research.</li><li><strong>MLOps:</strong> Cloud Deployment (AWS/Azure), Docker, and Model Registry.</li><li><strong>Project:</strong> Implement a research paper from scratch.</li></ol>`
        };
        return pathways[level.toLowerCase()] || pathways.beginner;
    }

    function getProjects(level, interests) {
        const mainInterest = interests[0] || 'Data Science';
        const suggestions = {
            beginner: `<h4>Beginner Project Ideas</h4><ul><li><strong>Sales Forecasting:</strong> Predict monthly sales using simple linear regression.</li><li><strong>Movie Recommendation:</strong> Use content-based filtering for user preferences.</li><li><strong>Titanic EDA:</strong> Analyze survival factors on Kaggle.</li></ul><p>Focus on ${mainInterest} fundamentals first!</p>`,
            intermediate: `<h4>Intermediate Project Ideas</h4><ul><li><strong>Credit Risk Model:</strong> Use Random Forests to predict loan defaults.</li><li><strong>Customer Segmentation:</strong> Apply K-Means clustering to store data to finds patterns.</li><li><strong>Sentiment Tracker:</strong> Build a real-time Twitter sentiment analysis pipeline.</li></ul>`,
            advanced: `<h4>Advanced Project Ideas</h4><ul><li><strong>Self-driving Perception:</strong> Use YOLO for object detection in video streams.</li><li><strong>RAG Chatbot:</strong> Create a domain-specific assistant using LangChain and Vector DBs.</li><li><strong>Trading Bot:</strong> Implement LSTM for stock price prediction.</li></ul>`
        };
        return suggestions[level.toLowerCase()] || suggestions.beginner;
    }

    function getInternships(level, goal) {
        return `<h4>${goal} Internship Strategy</h4><ol><li><strong>Optimize Presence:</strong> Build a professional portfolio and a strong LinkedIn.</li><li><strong>Target Platforms:</strong> Use Glassdoor, Wellfound, and especially Internshala for startups.</li><li><strong>Cold Messaging:</strong> Reach out to recruiters with meaningful questions about their stack.</li><li><strong>Certifications:</strong> Earn professional certs in SQL and Cloud as a ${level} level learner.</li></ol>`;
    }

    function getSkills(level) {
        return `<h4>Skills & Toolkit Recommendation</h4><p>As a <strong>${level}</strong> performer, you should master: </p><ul><li><strong>Technical:</strong> Python, SQL, Git, and Advanced Excel.</li><li><strong>Soft Skills:</strong> Data Storytelling, Business Acumen, and Ethical Data Handling.</li><li><strong>Platforms:</strong> Get comfortable with Docker and Google Cloud.</li></ul>`;
    }

    function mentorRespond(query) {
        const profile = getUserProfile();
        const level = profile.level.toLowerCase();
        const q = query.toLowerCase();

        if (q.includes('roadmap') || q.includes('how to become') || q.includes('steps') || q.includes('become') || q.includes('5-day')) {
            return getRoadmap(level, profile.goal);
        }
        if (q.includes('project') || q.includes('build') || q.includes('idea') || q.includes('portfolio')) {
            return getProjects(level, profile.interests);
        }
        if (q.includes('internship') || q.includes('job') || q.includes('career') || q.includes('work') || q.includes('hired')) {
            return getInternships(level, profile.goal);
        }
        if (q.includes('skill') || q.includes('tool') || q.includes('technology') || q.includes('stack')) {
            return getSkills(level);
        }
        if (q.includes('exam') || q.includes('prepare')) {
            return `<h4>Exam Preparation Tips</h4><ul><li><strong>Spaced Repetition:</strong> Use Anki for core concepts.</li><li><strong>Practice:</strong> Solve past papers and Kaggle notebooks.</li><li><strong>Teach:</strong> Explain concepts to others to solidify knowledge.</li></ul>`;
        }

        return `<p>I'm here as your Data Science mentor. I see you're an <strong>${profile.level}</strong> student with interests in ${profile.interests.join(', ')}.</p>
                <p>I can help you with specific **roadmaps**, **project ideas**, or **internship tips**. What should we tackle first?</p>`;
    }

    const chatViewport = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const typingIndicator = document.getElementById('typingIndicator');
    const studyChips = document.querySelectorAll('.study-chip');

    let chatHistory = JSON.parse(localStorage.getItem('studyChatHistory')) || [
        { role: 'bot', content: "Hi! I'm your AI Study Mentor. I can help you with specific roadmaps, project ideas, or exam prep tips. What's on your mind?" }
    ];

    function appendMessage(role, content, save = true) {
        if (!chatViewport) return;
        
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}-message`;
        msgDiv.innerHTML = `<div class="message-content">${content}</div>`;
        chatViewport.appendChild(msgDiv);
        
        if (save) {
            chatHistory.push({ role, content });
            if (chatHistory.length > 20) chatHistory.shift();
            localStorage.setItem('studyChatHistory', JSON.stringify(chatHistory));
        }
        chatViewport.scrollTop = chatViewport.scrollHeight;
    }

    function handleChat() {
        if (!chatInput) return;
        const text = chatInput.value.trim();
        if (!text) return;

        appendMessage('user', text);
        chatInput.value = '';
        if (typingIndicator) typingIndicator.classList.remove('hidden');
        chatViewport.scrollTop = chatViewport.scrollHeight;
        
        setTimeout(() => {
            const response = mentorRespond(text);
            if (typingIndicator) typingIndicator.classList.add('hidden');
            appendMessage('bot', response);
        }, 1200);
    }

    if (sendBtn) sendBtn.addEventListener('click', handleChat);
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleChat();
        });
    }

    studyChips.forEach(chip => {
        chip.addEventListener('click', () => {
            if (chatInput) {
                chatInput.value = chip.getAttribute('data-query');
                handleChat();
            }
        });
    });

    function renderChatHistory() {
        if (!chatViewport) return;
        chatViewport.innerHTML = '';
        chatHistory.forEach(msg => appendMessage(msg.role, msg.content, false));
    }

    renderChatHistory();
    renderSkills();
    renderProjects();
    renderInternships();
    renderActivityLog();
    updateMilestone();
});

    function showToast(message) {
        const toast = document.getElementById('toastNotification');
        if (!toast) return;
        toast.innerHTML = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

// --- AI Chatbot Logic (Study Plan Section) ---
document.addEventListener("DOMContentLoaded", () => {
    const chatViewport = document.getElementById('studyChatMessages');
    const chatInput = document.getElementById('studyChatInput');
    const sendBtn = document.getElementById('studyChatSend');

    if (!chatViewport || !chatInput || !sendBtn) return;

    let chatHistory = [];

    function appendMessage(role, content) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${role}-msg`;
        msgDiv.innerHTML = `<div class="msg-content">${content}</div>`;
        chatViewport.appendChild(msgDiv);
        chatViewport.scrollTop = chatViewport.scrollHeight;
    }

    function showTypingIndicator() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'chatLoading';
        loadingDiv.className = 'chat-msg bot-msg';
        loadingDiv.innerHTML = '<div class="msg-content"><i class="fa-solid fa-circle-notch fa-spin"></i> Analyzing...</div>';
        chatViewport.appendChild(loadingDiv);
        chatViewport.scrollTop = chatViewport.scrollHeight;
    }

    function removeTypingIndicator() {
        const loadingDiv = document.getElementById('chatLoading');
        if (loadingDiv) loadingDiv.remove();
    }

    async function handleChat() {
        const text = chatInput.value.trim();
        if (!text) return;

        appendMessage('user', text);
        chatInput.value = '';
        
        showTypingIndicator();

        try {
            const response = await fetch('http://localhost:5000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message: text,
                    history: chatHistory 
                }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            removeTypingIndicator();
            appendMessage('bot', data.response);
            
            // Update history
            chatHistory.push({ role: 'user', content: text });
            chatHistory.push({ role: 'bot', content: data.response });
            if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10);

        } catch (error) {
            console.error('Error fetching AI response:', error);
            removeTypingIndicator();
            appendMessage('bot', `I encountered an issue connecting to my local knowledge base: ${error.message || 'Server error'}. Please ensure the backend is running.`);
        }
    }

    sendBtn.addEventListener('click', handleChat);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChat();
    });

    // --- 8. Knowledge Base Handlers ---
    const addLinkBtn = document.getElementById('addLinkBtn');
    const uploadFileBtn = document.getElementById('uploadFileBtn');
    const addNoteBtn = document.getElementById('addNoteBtn');

    if (addLinkBtn) {
        addLinkBtn.onclick = async () => {
            const url = document.getElementById('linkInput').value;
            if (!url) return showToast('<i class="fa-solid fa-triangle-exclamation"></i> Please enter a URL');
            
            addLinkBtn.disabled = true;
            addLinkBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Scraping...';
            
            try {
                const res = await fetch('http://localhost:5000/add-link', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });
                const data = await res.json();
                showToast(`<i class="fa-solid fa-check"></i> ${data.message || 'Link added!'}`);
                document.getElementById('linkInput').value = '';
            } catch (err) {
                showToast('<i class="fa-solid fa-circle-xmark"></i> Failed to process link');
            } finally {
                addLinkBtn.disabled = false;
                addLinkBtn.innerHTML = 'Process Link';
            }
        };
    }

    if (uploadFileBtn) {
        uploadFileBtn.onclick = async () => {
            const fileInput = document.getElementById('fileInput');
            const file = fileInput.files[0];
            if (!file) return showToast('<i class="fa-solid fa-file-circle-plus"></i> Select a PDF first');
            
            const formData = new FormData();
            formData.append('file', file);
            
            uploadFileBtn.disabled = true;
            uploadFileBtn.innerHTML = '<i class="fa-solid fa-upload fa-spin"></i> Processing...';
            
            try {
                const res = await fetch('http://localhost:5000/upload-document', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                showToast(`<i class="fa-solid fa-file-circle-check"></i> ${data.message || 'Document indexed!'}`);
                fileInput.value = '';
            } catch (err) {
                showToast('<i class="fa-solid fa-circle-xmark"></i> Document upload failed');
            } finally {
                uploadFileBtn.disabled = false;
                uploadFileBtn.innerHTML = 'Upload & Index';
            }
        };
    }

    if (addNoteBtn) {
        addNoteBtn.onclick = async () => {
            const label = document.getElementById('noteLabel').value;
            const content = document.getElementById('noteContent').value;
            if (!content) return showToast('<i class="fa-solid fa-pen"></i> Enter some text content');
            
            addNoteBtn.disabled = true;
            
            try {
                const res = await fetch('http://localhost:5000/add-text', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ label, content })
                });
                const data = await res.json();
                showToast('<i class="fa-solid fa-check"></i> Note saved to Knowledge Base');
                document.getElementById('noteLabel').value = '';
                document.getElementById('noteContent').value = '';
            } catch (err) {
                showToast('<i class="fa-solid fa-circle-xmark"></i> Failed to save note');
            } finally {
                addNoteBtn.disabled = false;
            }
        };
    }
});
