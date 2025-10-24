// Global JSON variables
let teamsData = [];
let welshData = {};
let cardiffData = {};
let friendliesData = {};

// DOM Elements
const teamSelect = document.getElementById('team-select');
const dataSelect = document.getElementById('data-select');
const teamDisplay = document.getElementById('team-display');

// Load JSON data
async function loadTeamData() {
    teamsData = await fetch('teams.json').then(res => res.json()).then(data => data.teams);
    welshData = await fetch('welsh.json').then(res => res.json());
    cardiffData = await fetch('cardiff.json').then(res => res.json());
    friendliesData = await fetch('friendlies.json').then(res => res.json());

    populateTeamDropdown();
    populateDataDropdown();
}

// Populate team dropdown
function populateTeamDropdown() {
    teamsData.forEach(team => {
        const option = document.createElement('option');
        option.value = team.name;
        option.textContent = team.name;
        teamSelect.appendChild(option);
    });
}

// Populate data dropdown
function populateDataDropdown() {
    const options = ["Team Stats", "Match History"];
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        dataSelect.appendChild(option);
    });
}

// Event listeners
teamSelect.addEventListener('change', updateTeamDisplay);
dataSelect.addEventListener('change', updateTeamDisplay);

// Update display area
function updateTeamDisplay() {
    const teamName = teamSelect.value;
    const dataType = dataSelect.value;

    if (!teamName || !dataType) {
        teamDisplay.innerHTML = '';
        return;
    }

    const team = teamsData.find(t => t.name === teamName);
    if (!team) return;

    teamDisplay.innerHTML = '';

    if (dataType === "Team Stats") {
        const statsHTML = `
            <h2>${team.name} - Overall Stats</h2>
            <table>
                <tr>
                    <th>Played</th><th>Wins</th><th>GF</th><th>GA</th><th>GD</th>
                </tr>
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
        teamDisplay.innerHTML = statsHTML;

    } else if (dataType === "Match History") {
        renderMatchHistory('Welsh', welshData);
        renderMatchHistory('Cardiff', cardiffData);
        renderMatchHistory('Friendlies', friendliesData);
    }
}

// Render match history for a competition
function renderMatchHistory(cupName, data) {
    let html = `<h3>${cupName} Matches</h3>`;
    
    data.rounds?.forEach(round => {
        html += `<h4>Round ${round.round || ''} - Deadline: ${round.deadline || ''}</h4>`;
        html += `<table>
            <tr><th>Home</th><th>H Score</th><th>A Score</th><th>Away</th><th>Winner</th><th>Date</th><th>Notes</th></tr>`;
        
        round.games?.forEach(game => {
            if (game.home === teamSelect.value || game.away === teamSelect.value) {
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

    // For friendlies, might not have rounds
    if (cupName === 'Friendlies') {
        data.games?.forEach(game => {
            if (game.home === teamSelect.value || game.away === teamSelect.value) {
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

    teamDisplay.innerHTML += html;
}

// Initialize
loadTeamData();// JavaScript Document