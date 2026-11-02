const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Global storage object for all history
let historyData = JSON.parse(localStorage.getItem('iponHistoryData')) || {};

// Controls
const monthSelect = document.getElementById('month-select');
const weekSelect = document.getElementById('week-select');
const yearSelect = document.getElementById('year-select');
const activePeriodLabel = document.getElementById('active-period-label');

const form = document.getElementById('expense-form');
const daySelect = document.getElementById('day-select');
const startingInput = document.getElementById('starting-amount');
const expenseDescInput = document.getElementById('expense-desc');
const expenseAmountInput = document.getElementById('expense-amount');

const totalIponEl = document.getElementById('total-ipon');
const totalSpentEl = document.getElementById('total-spent');
const totalRemainingEl = document.getElementById('total-remaining');
const daysContainer = document.getElementById('days-container');

// Helper to format currency
function formatPHP(amount) {
    return '₱' + Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Generate unique key for history lookup (e.g. "2026-W1-M10")
function getSelectedPeriodKey() {
    const year = yearSelect.value;
    const week = weekSelect.value;
    const month = monthSelect.value;
    return `${year}-W${week}-M${month}`;
}

// Ensure selected period data structure exists
function getCurrentPeriodData() {
    const key = getSelectedPeriodKey();
    if (!historyData[key]) {
        historyData[key] = {};
        DAYS_OF_WEEK.forEach(day => {
            historyData[key][day] = { starting: 0, expenses: [] };
        });
    }
    return historyData[key];
}

// Initialize Year Dropdown with current and surrounding years
function initYearSelect() {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 2; y <= currentYear + 2; y++) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        if (y === currentYear) option.selected = true;
        yearSelect.appendChild(option);
    }

    // Set initial month
    monthSelect.value = new Date().getMonth();
}

// Render UI for the currently selected period
function updateUI() {
    const periodData = getCurrentPeriodData();
    const monthName = MONTH_NAMES[monthSelect.value];
    const weekNum = weekSelect.value;
    const yearNum = yearSelect.value;

    activePeriodLabel.textContent = `Week ${weekNum} of ${monthName} ${yearNum}`;

    let totalBudget = 0;
    let totalSpent = 0;
    let activeDaysCount = 0;

    daysContainer.innerHTML = '';

    DAYS_OF_WEEK.forEach(day => {
        const dayData = periodData[day] || { starting: 0, expenses: [] };
        const daySpent = dayData.expenses.reduce((sum, item) => sum + Number(item.amount), 0);
        const hasBudget = Number(dayData.starting) > 0;
        const hasExpenses = dayData.expenses.length > 0;

        totalBudget += Number(dayData.starting);
        totalSpent += daySpent;

        // Only display the day card if it has a budget or expenses logged
        if (hasBudget || hasExpenses) {
            activeDaysCount++;
            const daySaved = Number(dayData.starting) - daySpent;

            const card = document.createElement('div');
            card.className = 'day-card';
            
            let expensesHTML = '<div class="expenses-list">';
            if (hasExpenses) {
                dayData.expenses.forEach((exp, index) => {
                    expensesHTML += `
                        <div class="expense-item">
                            <span class="desc">• ${exp.desc}</span>
                            <span>
                                ${formatPHP(exp.amount)} 
                                <i class="fa-solid fa-trash delete-expense" data-day="${day}" data-index="${index}" style="cursor:pointer; margin-left:8px; color: var(--muted-rose);" title="Remove"></i>
                            </span>
                        </div>
                    `;
                });
            } else {
                expensesHTML += '<span style="font-size:0.8rem; color: var(--text-muted); font-style:italic;">No expenses logged yet.</span>';
            }
            expensesHTML += '</div>';

            card.innerHTML = `
                <div class="day-card-header">
                    <span class="day-name">${day}</span>
                    <span class="day-stats">
                        Budget: <strong>${formatPHP(dayData.starting)}</strong> | 
                        Spent: <strong style="color: var(--muted-rose);">${formatPHP(daySpent)}</strong> | 
                        Saved: <strong style="color: var(--muted-emerald);">${formatPHP(Math.max(0, daySaved))}</strong>
                    </span>
                </div>
                ${expensesHTML}
            `;
            daysContainer.appendChild(card);
        }
    });

    // Show a placeholder message if no days have been logged yet for this week
    if (activeDaysCount === 0) {
        daysContainer.innerHTML = `
            <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted); font-style: italic;">
                <i class="fa-solid fa-calendar-plus" style="font-size: 2rem; margin-bottom: 0.5rem; color: var(--accent-teal); display: block;"></i>
                No entries logged for this week yet. Use the form on the left to add your daily budget and expenses!
            </div>
        `;
    }

    const totalMoneyOnHand = totalBudget - totalSpent;

    totalIponEl.textContent = formatPHP(totalBudget);
    totalSpentEl.textContent = formatPHP(totalSpent);
    totalRemainingEl.textContent = formatPHP(totalMoneyOnHand);

    // Save history persistently
    localStorage.setItem('iponHistoryData', JSON.stringify(historyData));
}

// Form Submission (Add budget or expense to selected week)
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const periodData = getCurrentPeriodData();
    const day = daySelect.value;
    const starting = parseFloat(startingInput.value) || 0;
    const desc = expenseDescInput.value.trim();
    const amount = parseFloat(expenseAmountInput.value) || 0;

    if (starting > 0) {
        periodData[day].starting = starting;
    }

    if (desc && amount > 0) {
        periodData[day].expenses.push({ desc, amount });
    }

    expenseDescInput.value = '';
    expenseAmountInput.value = '';
    
    updateUI();
});

// Delete expense item from current selected period
daysContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-expense')) {
        const periodData = getCurrentPeriodData();
        const day = e.target.getAttribute('data-day');
        const index = parseInt(e.target.getAttribute('data-index'));
        
        periodData[day].expenses.splice(index, 1);
        updateUI();
    }
});

// Event Listeners for Date Selection Change
monthSelect.addEventListener('change', updateUI);
weekSelect.addEventListener('change', updateUI);
yearSelect.addEventListener('change', updateUI);

// Initial Load
initYearSelect();
updateUI();