// ════════════════════════════════════════
// HALEON REWARDS+ — app.js
// ════════════════════════════════════════

// ── State ──────────────────────────────
const state = {
  user: null,
  score: 0,
  quizzesCompleted: 0,
};

const answeredQuestions = new Set();

// ── Data ───────────────────────────────
const questions = [
  {
    q: "Which vitamin is primarily synthesized by the body through sunlight exposure?",
    choices: ["Vitamin A", "Vitamin C", "Vitamin D", "Vitamin B12"],
    correct: 2,
  },
  {
    q: "What is the recommended daily water intake for an average adult?",
    choices: ["1 Liter", "2 Liters", "3 Liters", "500 ml"],
    correct: 1,
  },
  {
    q: "Which mineral is essential for strong bones and teeth?",
    choices: ["Iron", "Potassium", "Calcium", "Magnesium"],
    correct: 2,
  },
  {
    q: "How many hours of sleep are recommended for adults per night?",
    choices: ["4–5 hours", "6–7 hours", "7–9 hours", "10–12 hours"],
    correct: 2,
  },
];

const rewardsData = [
  { title: "Exclusive Haleon Product Box",  pts: 200, icon: "📦"  },
  { title: "Premium Health Consultation",   pts: 300, icon: "👨‍⚕️" },
  { title: "Full Health Assessment",        pts: 150, icon: "🩺"  },
  { title: "Fitness Merch Bundle",          pts: 400, icon: "🏋️" },
  { title: "Nutrition Plan Session",        pts: 250, icon: "🥗"  },
  { title: "Wellness App Subscription",     pts: 180, icon: "📱"  },
];

// ════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════

function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function switchTab(tab) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');

  if (tab === 'home')    { showView('view-home');    updateHomeUI();      }
  if (tab === 'rewards') { showView('view-rewards'); renderRewardsPage(); }
  if (tab === 'profile') { showView('view-profile'); updateProfilePage(); }
}

// ════════════════════════════════════════
// AUTH
// ════════════════════════════════════════

function doLogin() {
  const email = document.getElementById('login-email').value.trim() || 'user@haleon.com';
  state.user = { name: email.split('@')[0], email };
  afterAuth();
}

function doRegister() {
  const name  = document.getElementById('reg-name').value.trim()  || 'User';
  const email = document.getElementById('reg-email').value.trim() || 'user@haleon.com';
  state.user = { name, email };
  afterAuth();
}

function afterAuth() {
  document.getElementById('bottom-nav').classList.add('visible');
  renderQuizCards();
  renderRewardsPage();
  updateHomeUI();
  showView('view-home');
}

// ════════════════════════════════════════
// TIER HELPER
// ════════════════════════════════════════

function getTier() {
  const s = state.score;
  if (s < 100) return { name: 'Student',  cls: 'card-student'  };
  if (s < 200) return { name: 'Silver',   cls: 'card-silver'   };
  if (s < 300) return { name: 'Gold',     cls: 'card-gold'     };
  return             { name: 'Platinum', cls: 'card-platinum' };
}

// ════════════════════════════════════════
// HOME — progress ring tracks quiz completion
// ════════════════════════════════════════

function updateHomeUI() {
  const tier = getTier();

  // Progress = answered questions / total  (25% per question)
  const pct = Math.round((answeredQuestions.size / questions.length) * 100);
  const circumference = 2 * Math.PI * 60;       // r = 60
  const offset = circumference - (pct / 100) * circumference;

  document.getElementById('progress-ring').style.strokeDashoffset = offset;
  document.getElementById('progress-pct').textContent             = pct + '%';
  document.getElementById('pts-display').textContent              = state.score.toLocaleString() + ' Points';
  document.getElementById('tier-badge-home').textContent          = tier.name + ' Tier';
}

// ════════════════════════════════════════
// QUIZ CARDS
// ════════════════════════════════════════

function renderQuizCards() {
  const container = document.getElementById('quiz-cards');
  container.innerHTML = '';

  questions.forEach((q, qi) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.id = 'qcard-' + qi;

    card.innerHTML = `
      <div class="quiz-card-header" onclick="toggleQuizCard(${qi})">
        <div class="quiz-card-label">
          <div class="quiz-card-num">${qi + 1}</div>
          <div class="quiz-card-title">Question ${qi + 1}</div>
        </div>
        <div class="quiz-card-right">
          <div class="quiz-card-status" id="qstatus-${qi}">Tap to answer</div>
          <div class="quiz-chevron">&#9662;</div>
        </div>
      </div>
      <div class="quiz-body" id="qbody-${qi}">
        <div class="quiz-body-inner">
          <div class="quiz-q">${q.q}</div>
          <div class="choices">
            ${q.choices.map((c, ci) =>
              `<button class="choice-btn" id="qbtn-${qi}-${ci}"
                onclick="answerQuiz(event,${qi},${ci})">${c}</button>`
            ).join('')}
          </div>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function toggleQuizCard(qi) {
  if (answeredQuestions.has(qi)) return;   // lock answered cards

  const card   = document.getElementById('qcard-' + qi);
  const body   = document.getElementById('qbody-' + qi);
  const isOpen = card.classList.contains('open');

  // Close every card first
  document.querySelectorAll('.quiz-card').forEach(c => c.classList.remove('open'));
  document.querySelectorAll('.quiz-body').forEach(b => b.style.maxHeight = '0');

  // Open the tapped card only if it was closed
  if (!isOpen) {
    card.classList.add('open');
    body.style.maxHeight = body.scrollHeight + 'px';
  }
}

function answerQuiz(e, qi, ci) {
  e.stopPropagation();
  if (answeredQuestions.has(qi)) return;

  const q      = questions[qi];
  const card   = document.getElementById('qcard-' + qi);
  const body   = document.getElementById('qbody-' + qi);
  const status = document.getElementById('qstatus-' + qi);

  // Highlight correct / wrong buttons
  for (let i = 0; i < q.choices.length; i++) {
    const btn = document.getElementById(`qbtn-${qi}-${i}`);
    btn.disabled = true;
    if (i === q.correct)                   btn.classList.add('correct');
    else if (i === ci && ci !== q.correct) btn.classList.add('wrong');
  }

  // Record answer
  answeredQuestions.add(qi);

  if (ci === q.correct) {
    state.score += 100;
    state.quizzesCompleted++;
    status.textContent = '+100 pts ✓';
    showToast('+100 Points 🎉');
  } else {
    status.textContent = 'Incorrect ✗';
    showToast('Wrong answer ❌');
  }

  // Update ring immediately
  updateHomeUI();

  // Collapse & lock after short delay
  setTimeout(() => {
    card.classList.add('answered');
    card.classList.remove('open');
    body.style.maxHeight = '0';
  }, 1000);
}

// ════════════════════════════════════════
// REWARDS PAGE
// ════════════════════════════════════════

function renderRewardsPage() {
  const grid = document.getElementById('rewards-full-grid');
  grid.innerHTML = '';

  rewardsData.forEach(r => {
    grid.innerHTML += `
      <div class="reward-card">
        <div class="reward-img">${r.icon}</div>
        <div class="reward-info">
          <div class="reward-title">${r.title}</div>
          <button class="redeem-btn">${r.pts} Pts — Redeem</button>
        </div>
      </div>
    `;
  });
}

// ════════════════════════════════════════
// PROFILE PAGE
// ════════════════════════════════════════

function updateProfilePage() {
  if (!state.user) return;
  const tier = getTier();

  // Apply tier colour skin to both card faces
  document.getElementById('card-face-front').className = `card-face card-front ${tier.cls}`;
  document.getElementById('card-face-back').className  = `card-face card-back-face ${tier.cls}`;

  // Card text
  document.getElementById('card-tier-label').textContent      = tier.name + '.';
  document.getElementById('card-watermark').textContent       = tier.name + '.';
  document.getElementById('card-back-watermark').textContent  = tier.name + '.';
  document.getElementById('card-name-front').textContent      = state.user.name;
  document.getElementById('card-name-back').textContent       = state.user.name;
  document.getElementById('card-email-back').textContent      = state.user.email;

  // Stats row
  document.getElementById('stat-pts').textContent     = state.score.toLocaleString();
  document.getElementById('stat-quizzes').textContent = state.quizzesCompleted;
  document.getElementById('stat-tier').textContent    = tier.name;
}

function flipCard() {
  document.getElementById('card-inner').classList.toggle('flipped');
}

// ════════════════════════════════════════
// TOAST
// ════════════════════════════════════════

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}