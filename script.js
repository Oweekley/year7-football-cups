// Load JSON files using fetch
let teamsData = [];
let welshData = {};
let cardiffData = {};

// Elements
const teamSelect = document.getElementById('teamSelect'); // e.g., D6
const dataSelect = document.getElementById('dataSelect'); // e.g., H6
const displayArea = document.getElementById('displayArea'); // area to show stats

// Load all JSONs
async function loadData() {
    teamsData = await fetch('data/teams.json').then(res => res.json()).then(data => data.teams);
    welshData = await fetch('data/welsh.json').then(res => res.json());
    cardiffData = await fetch('data/cardiff.json').then(res => res.json());

    populateTeamDropdown();
    populateDataDropdown();
}

// Populate team dropdown
function populateTeamDropdown() {
    teamsData.forEach(team => {
        const option = document.createElement('option');
        option.value = team.name;
        option.text = team.name;
        teamSelect.appendChild(option);
    });
}

// Populate data dropdown
function populateDataDropdown() {
    const options = ["Team Stats", "Match History"];
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.text = opt;
        dataSelect.appendChild(option);
    });
}

// Event listeners
teamSelect.addEventListener('change', updateDisplay);
dataSelect.addEventListener('change', updateDisplay);

// Update display area
function updateDisplay() {
    const teamName = teamSelect.value;
    const dataType = dataSelect.value;

    if (!teamName || !dataType) return;

    displayArea.innerHTML = ''; // clear previous display

    const team = teamsData.find(t => t.name === teamName);
    if (!team) return;

    if (dataType === "Team Stats") {
        // Display overall stats
        const statsHTML = `
            <h3>${team.name} - Stats</h3>
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
        displayArea.innerHTML = statsHTML;

    } else if (dataType === "Match History") {
        // Display matches from Welsh and Cardiff
        const competitions = ["Welsh", "Cardiff"];
        competitions.forEach(cup => {
            const cupData = cup === "Welsh" ? welshData : cardiffData;
            let html = `<h3>${cup} Cup - Match History</h3>`;
            cupData.rounds.forEach(round => {
                html += `<h4>Round ${round.round} (Deadline: ${round.deadline})</h4>`;
                html += `<table>
                    <tr><th>Home</th><th>H Score</th><th>A Score</th><th>Away</th><th>Winner</th><th>Date</th></tr>`;
                round.games.forEach(game => {
                    if (game.home === teamName || game.away === teamName) {
                        html += `<tr>
                            <td>${game.home}</td>
                            <td>${game.h_score !== undefined ? game.h_score : ""}</td>
                            <td>${game.a_score !== undefined ? game.a_score : ""}</td>
                            <td>${game.away}</td>
                            <td>${game.winner !== null ? game.winner : ""}</td>
                            <td>${game.date !== null ? game.date : ""}</td>
                        </tr>`;
                    }
                });
                html += `</table>`;
            });
            displayArea.innerHTML += html;
        });
    }
}

// Initialize
loadData();