// =======================
// TRANSLATIONS & LANGUAGE TOGGLE
// =======================
const translations = {
    en: {
        dashboardTitle: "Year 7 Cups Dashboard 2025",
        dashboard: "Dashboard",
        teamDashboard: "Team Dashboard",
        brackets: "Brackets",
        welshCupOverview: "Welsh Cup Overview",
        selectTeam: "Select Team:",
        selectData: "Select Data:",
        cardiffCupOverview: "Cardiff Cup Overview",
        friendliesOverview: "Friendlies Overview",
        stats: "Stats",
        played: "Played",
        wins: "Wins",
        gf: "GF",
        ga: "GA",
        gd: "GD",
        notes: "Notes:",
        welshMatches: "Welsh Matches",
        round: "Round",
        deadline: "Deadline",
        home: "Home",
        hScore: "H Score",
        aScore: "A Score",
        away: "Away",
        winner: "Winner",
        date: "Date",
        matchNotes: "Notes"
    },
    cy: {
        dashboardTitle: "Dangosfwrdd Cwpanau Blwyddyn 7 2025",
        dashboard: "Dangosfwrdd",
        teamDashboard: "Dangosfwrdd Tîm",
        brackets: "Braketiau",
        welshCupOverview: "Trosolwg Cwpan Cymru",
        selectTeam: "Dewiswch Dîm:",
        selectData: "Dewiswch Ddata:",
        cardiffCupOverview: "Trosolwg Cwpan Caerdydd",
        friendliesOverview: "Trosolwg Cyfeillgarwch",
        stats: "Ystadegau",
        played: "Chwaraeodd",
        wins: "Enillodd",
        gf: "Gôl I",
        ga: "Gôl Yn Erbyn",
        gd: "Gwahaniaeth Gôl",
        notes: "Nodiadau:",
        welshMatches: "Gemau Cymru",
        round: "Rownd",
        deadline: "Dyddiad Cau",
        home: "Cartref",
        hScore: "SG Cartref",
        aScore: "SG Allan",
        away: "Allan",
        winner: "Enillydd",
        date: "Dyddiad",
        matchNotes: "Nodiadau"
    }
};

let currentLang = 'en';

function switchLanguage(lang) {
    currentLang = lang;

    // Update all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (translations[lang][key]) el.textContent = translations[lang][key];
    });

    // Update all dynamic content
    Object.keys(dropdowns).forEach(cup => updateDisplay(cup));
    updateTeamCardDisplay();
    renderMatches();
    if (welshBracketContainer && cardiffBracketContainer) {
        renderBracket('Welsh', welshData, welshBracketContainer);
        renderBracket('Cardiff', cardiffData, cardiffBracketContainer);
    }
}

// =======================
// GLOBAL JSON VARIABLES
// =======================
let teamsData = [];
let welshData = {};
let cardiffData = {};
let friendliesData = {};

// =======================
// DOM ELEMENTS (if exist)
// =======================
const dropdowns = {
    Welsh: {
        team: document.getElementById('welsh-team'),
        data: document.getElementById('welsh-data'),
        display: document.getElementById('welsh-display'),
        left: document.getElementById('welsh-left')
    },
    Cardiff: {
        team: document.getElementById('cardiff-team'),
        data: document.getElementById('cardiff-data'),
        display: document.getElementById('cardiff-display'),
        left: document.getElementById('cardiff-left')
    },
    Friendlies: {
        team: document.getElementById('friendlies-team'),
        data: document.getElementById('friendlies-data'),
        display: document.getElementById('friendlies-display')
    }
};

const teamCardSelect = document.getElementById('team-select');
const teamCardDataSelect = document.getElementById('data-select');
const teamCardDisplay = document.getElementById('team-display');

const competitionSelect = document.getElementById('competition-select');
const matchesDisplay = document.getElementById('matches-display');

const welshBracketContainer = document.getElementById('welsh-bracket-container');
const cardiffBracketContainer = document.getElementById('cardiff-bracket-container');

// =======================
// LOAD JSON DATA
// =======================
async function loadAllData() {
    try {
        teamsData = await fetch('teams.json').then(res => res.json()).then(d => d.teams);
        welshData = await fetch('welsh.json').then(res => res.json());
        cardiffData = await fetch('cardiff.json').then(res => res.json());
        friendliesData = await fetch('friendlies.json').then(res => res.json());
    } catch (err) {
        console.error('Error loading JSON:', err);
    }

    Object.keys(dropdowns).forEach(cup => {
        if (dropdowns[cup].team && dropdowns[cup].data) {
            populateDropdowns(cup);
            updateTeamsLeft(cup);
        }
    });

    if (teamCardSelect && teamCardDataSelect) populateTeamCardDropdowns();
    if (competitionSelect) competitionSelect.addEventListener('change', renderMatches);
    if (welshBracketContainer && cardiffBracketContainer) {
        renderBracket('Welsh', welshData, welshBracketContainer);
        renderBracket('Cardiff', cardiffData, cardiffBracketContainer);
    }
}

// =======================
// DROPDOWN POPULATION
// =======================
function populateDropdowns(cup) {
    const teamSelect = dropdowns[cup].team;
    const dataSelect = dropdowns[cup].data;

    teamsData.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.name;
        opt.textContent = t.name;
        teamSelect.appendChild(opt);
    });

    ['Team Stats', 'Match History'].forEach(type => {
        const opt = document.createElement('option');
        opt.value = type;
        opt.textContent = type;
        dataSelect.appendChild(opt);
    });

    teamSelect.addEventListener('change', () => updateDisplay(cup));
    dataSelect.addEventListener('change', () => updateDisplay(cup));
}

function populateTeamCardDropdowns() {
    teamsData.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.name;
        opt.textContent = t.name;
        teamCardSelect.appendChild(opt);
    });

    ['Team Stats', 'Match History'].forEach(type => {
        const opt = document.createElement('option');
        opt.value = type;
        opt.textContent = type;
        teamCardDataSelect.appendChild(opt);
    });

    teamCardSelect.addEventListener('change', updateTeamCardDisplay);
    teamCardDataSelect.addEventListener('change', updateTeamCardDisplay);
}

// =======================
// TEAMS LEFT COUNTER
// =======================
function updateTeamsLeft(cup) {
    if (!dropdowns[cup].left) return;

    const cupData = cup === 'Welsh' ? welshData : cup === 'Cardiff' ? cardiffData : friendliesData;
    let left = 0;
    cupData.rounds?.forEach(round => {
        round.games.forEach(g => {
            if (!g.winner) left++;
        });
    });
    dropdowns[cup].left.textContent = left;
}

// =======================
// UPDATE DISPLAY FOR DASHBOARD
// =======================
function updateDisplay(cup) {
    const teamSelect = dropdowns[cup].team;
    const dataSelect = dropdowns[cup].data;
    const display = dropdowns[cup].display;

    if (!teamSelect || !dataSelect || !display) return;

    const teamName = teamSelect.value;
    const dataType = dataSelect.value;
    if (!teamName || !dataType) return;

    display.innerHTML = '';

    const team = teamsData.find(t => t.name === teamName);
    if (!team) return;

    if (dataType === 'Team Stats') display.innerHTML = renderTeamStats(team);
    else display.innerHTML = renderMatchHistory(teamName, cup, cup === 'Welsh' ? welshData : cup === 'Cardiff' ? cardiffData : friendliesData);
}

// =======================
// UPDATE DISPLAY FOR TEAM CARD PAGE
// =======================
function updateTeamCardDisplay() {
    if (!teamCardSelect || !teamCardDataSelect || !teamCardDisplay) return;

    const teamName = teamCardSelect.value;
    const dataType = teamCardDataSelect.value;
    if (!teamName || !dataType) {
        teamCardDisplay.innerHTML = '';
        return;
    }

    const team = teamsData.find(t => t.name === teamName);
    if (!team) return;

    teamCardDisplay.innerHTML = '';

    if (dataType === 'Team Stats') teamCardDisplay.innerHTML = renderTeamStats(team);
    else {
        ['Welsh', 'Cardiff', 'Friendlies'].forEach(cup => {
            const cupData = cup === 'Welsh' ? welshData : cup === 'Cardiff' ? cardiffData : friendliesData;
            teamCardDisplay.innerHTML += renderMatchHistory(teamName, cup, cupData);
        });
    }
}

// =======================
// HELPER: RENDER TEAM STATS
// =======================
function renderTeamStats(team) {
    return `
        <h3>${team.name} - ${translations[currentLang].stats}</h3>
        <table>
            <tr>
                <th>${translations[currentLang].played}</th>
                <th>${translations[currentLang].wins}</th>
                <th>${translations[currentLang].gf}</th>
                <th>${translations[currentLang].ga}</th>
                <th>${translations[currentLang].gd}</th>
            </tr>
            <tr>
                <td>${team.played}</td>
                <td>${team.wins}</td>
                <td>${team.gf}</td>
                <td>${team.ga}</td>
                <td>${team.gd}</td>
            </tr>
        </table>
        <p>${translations[currentLang].notes} ${team.notes}</p>
    `;
}

// =======================
// HELPER: RENDER MATCH HISTORY
// =======================
function renderMatchHistory(teamName, cupName, data) {
    let html = `<h3>${translations[currentLang][cupName.toLowerCase() + 'Matches'] || cupName + ' Matches'}</h3>`;

    if (cupName !== 'Friendlies') {
        data.rounds?.forEach(round => {
            html += `<h4>${translations[currentLang].round} ${round.round || ''} - ${translations[currentLang].deadline}: ${round.deadline || '-'}</h4>`;
            html += `<table>
                <tr>
                    <th>${translations[currentLang].home}</th>
                    <th>${translations[currentLang].hScore}</th>
                    <th>${translations[currentLang].aScore}</th>
                    <th>${translations[currentLang].away}</th>
                    <th>${translations[currentLang].winner}</th>
                    <th>${translations[currentLang].date}</th>
                    <th>${translations[currentLang].matchNotes}</th>
                </tr>`;
            round.games?.forEach(game => {
                if (game.home === teamName || game.away === teamName) {
                    html += `<tr>
                        <td>${game.home}</td>
                        <td>${game.h_score ?? '-'}</td>
                        <td>${game.a_score ?? '-'}</td>
                        <td>${game.away}</td>
                        <td>${game.winner ?? '-'}</td>
                        <td>${game.date ?? '-'}</td>
                        <td>${game.notes ?? ''}</td>
                    </tr>`;
                }
            });
            html += `</table>`;
        });
    } else {
        data.games?.forEach(game => {
            if (game.home === teamName || game.away === teamName) {
                html += `<table>
                    <tr>
                        <td>${game.home}</td>
                        <td>${game.h_score ?? '-'}</td>
                        <td>${game.a_score ?? '-'}</td>
                        <td>${game.away}</td>
                        <td>${game.winner ?? '-'}</td>
                        <td>${game.date ?? '-'}</td>
                        <td>${game.notes ?? ''}</td>
                    </tr>
                </table>`;
            }
        });
    }

    return html;
}

// =======================
// RENDER MATCH TABLES PAGE
// =======================
function renderMatches() {
    if (!competitionSelect || !matchesDisplay) return;
    const competition = competitionSelect.value;
    matchesDisplay.innerHTML = '';
    if (!competition) return;

    const data = competition === 'Welsh' ? welshData : competition === 'Cardiff' ? cardiffData : friendliesData;
    let html = `<h2>${competition} ${translations[currentLang].matchTable}</h2>`;

    if (competition !== 'Friendlies') {
        data.rounds?.forEach(round => {
            html += `<h3>${translations[currentLang].round} ${round.round || ''} - ${translations[currentLang].deadline}: ${round.deadline || '-'}</h3>`;
            html += `<table>
                <tr>
                    <th>${translations[currentLang].home}</th>
                    <th>${translations[currentLang].hScore}</th>
                    <th>${translations[currentLang].aScore}</th>
                    <th>${translations[currentLang].away}</th>
                    <th>${translations[currentLang].winner}</th>
                    <th>${translations[currentLang].date}</th>
                    <th>${translations[currentLang].matchNotes}</th>
                </tr>`;
            round.games?.forEach(game => {
                html += `<tr>
                    <td>${game.home}</td>
                    <td>${game.h_score ?? '-'}</td>
                    <td>${game.a_score ?? '-'}</td>
                    <td>${game.away}</td>
                    <td>${game.winner ?? '-'}</td>
                    <td>${game.date ?? '-'}</td>
                    <td>${game.notes ?? ''}</td>
                </tr>`;
            });
            html += `</table>`;
        });
    } else {
        html += `<table>
            <tr>
                <th>${translations[currentLang].home}</th>
                <th>${translations[currentLang].hScore}</th>
                <th>${translations[currentLang].aScore}</th>
                <th>${translations[currentLang].away}</th>
                <th>${translations[currentLang].winner}</th>
                <th>${translations[currentLang].date}</th>
                <th>${translations[currentLang].matchNotes}</th>
            </tr>`;
        data.games?.forEach(game => {
            html += `<tr>
                <td>${game.home}</td>
                <td>${game.h_score ?? '-'}</td>
                <td>${game.a_score ?? '-'}</td>
                <td>${game.away}</td>
                <td>${game.winner ?? '-'}</td>
                <td>${game.date ?? '-'}</td>
                <td>${game.notes ?? ''}</td>
            </tr>`;
        });
        html += `</table>`;
    }

    matchesDisplay.innerHTML = html;
}

// =======================
// RENDER BRACKETS
// =======================
function renderBracket(cupName, data, container) {
    if (!container) return;
    container.innerHTML = '';

    data.rounds?.forEach(round => {
        const roundDiv = document.createElement('div');
        roundDiv.className = 'round';

        const roundTitle = document.createElement('h3');
        roundTitle.textContent = `${translations[currentLang].round} ${round.round} - ${translations[currentLang].deadline}: ${round.deadline || '-'}`;
        roundDiv.appendChild(roundTitle);

        const gamesDiv = document.createElement('div');
        gamesDiv.className = 'games';

        round.games?.forEach(game => {
            const gameDiv = document.createElement('div');
            gameDiv.className = 'game';
            gameDiv.innerHTML = `
                <span class="team ${game.winner === game.home ? 'winner' : ''}">${game.home}</span>
                <span class="score">${game.h_score ?? '-'}</span> -
                <span class="score">${game.a_score ?? '-'}</span>
                <span class="team ${game.winner === game.away ? 'winner' : ''}">${game.away}</span>
            `;
            gamesDiv.appendChild(gameDiv);
        });

        roundDiv.appendChild(gamesDiv);
        container.appendChild(roundDiv);
    });
}

// =======================
// LANGUAGE BUTTONS
// =======================
document.getElementById('lang-en')?.addEventListener('click', () => switchLanguage('en'));
document.getElementById('lang-cy')?.addEventListener('click', () => switchLanguage('cy'));

// =======================
// INITIALIZE
// =======================
loadAllData();