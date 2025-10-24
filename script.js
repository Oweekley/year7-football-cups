let teamsData = [];
let welshData = {};
let cardiffData = {};
let friendliesData = {};

// Elements
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

// Load all JSON data
async function loadData() {
    teamsData = await fetch('teams.json').then(r => r.json()).then(d => d.teams);
    welshData = await fetch('welsh.json').then(r => r.json());
    cardiffData = await fetch('cardiff.json').then(r => r.json());
    friendliesData = await fetch('friendlies.json').then(r s=> r.json());

    ["Welsh", "Cardiff", "Friendlies"].forEach(cup => populateDropdowns(cup));
    updateTeamsLeft();
}

function populateDropdowns(cup) {
    const teamSelect = dropdowns[cup].team;
    const dataSelect = dropdowns[cup].data;
    teamsData.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.name;
        opt.text = t.name;
        teamSelect.appendChild(opt);
    });
    ["Team Stats", "Match History"].forEach(type => {
        const opt = document.createElement('option');
        opt.value = type;
        opt.text = type;
        dataSelect.appendChild(opt);
    });

    // Add listeners
    teamSelect.addEventListener('change', () => updateDisplay(cup));
    dataSelect.addEventListener('change', () => updateDisplay(cup));
}

function updateTeamsLeft() {
    const countLeft = (cupData) => {
        let left = 0;
        cupData.rounds.forEach(round => {
            round.games.forEach(g => {
                if (!g.winner) left++;
            });
        });
        return left;
    };
    dropdowns.Welsh.left.textContent = countLeft(welshData);
    dropdowns.Cardiff.left.textContent = countLeft(cardiffData);
}

function updateDisplay(cup) {
    const teamSelect = dropdowns[cup].team;
    const dataSelect = dropdowns[cup].data;
    const display = dropdowns[cup].display;
    const teamName = teamSelect.value;
    const dataType = dataSelect.value;
    if (!teamName || !dataType) return;

    display.innerHTML = '';
    const team = teamsData.find(t => t.name === teamName);
    if (!team) return;

    if (dataType === "Team Stats") {
        display.innerHTML = `
            <h3>${team.name} - Stats</h3>
            <table>
                <tr><th>Played</th><th>Wins</th><th>GF</th><th>GA</th><th>GD</th></tr>
                <tr>
                    <td>${team.played}</td>
                    <td>${team.wins}</td>
                    <td>${team.gf}</td>
                    <td>${team.ga}</td>
                    <td>${team.gd}</td>
                </tr>
            </table>
            <p>Notes: ${team.notes}</p>
        `;
    } else if (dataType === "Match History") {
        let cupData = cup === "Welsh" ? welshData : cup === "Cardiff" ? cardiffData : friendliesData;
        let html = `<h3>${cup} Cup - Match History</h3>`;
        cupData.rounds.forEach(round => {
            html += `<h4>Round ${round.round} (Deadline: ${round.deadline})</h4>`;
            html += `<table>
                        <tr><th>Home</th><th>H Score</th><th>A Score</th><th>Away</th><th>Winner</th><th>Date</th></tr>`;
            round.games.forEach(g => {
                if (g.home === teamName || g.away === teamName) {
                    html += `<tr>
                        <td>${g.home}</td>
                        <td>${g.h_score ?? ''}</td>
                        <td>${g.a_score ?? ''}</td>
                        <td>${g.away}</td>
                        <td>${g.winner ?? ''}</td>
                        <td>${g.date ?? ''}</td>
                    </tr>`;
                }
            });
            html += `</table>`;
        });
        display.innerHTML = html;
    }
}

// Init
loadData();