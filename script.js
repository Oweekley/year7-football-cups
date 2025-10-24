// Elements
const welshTeamSelect = document.getElementById('welsh-team');
const welshDataSelect = document.getElementById('welsh-data');
const welshDisplay = document.getElementById('welsh-display');

const cardiffTeamSelect = document.getElementById('cardiff-team');
const cardiffDataSelect = document.getElementById('cardiff-data');
const cardiffDisplay = document.getElementById('cardiff-display');

let teamsData = [];
let welshData = {};
let cardiffData = {};

// Load JSONs
async function loadData() {
    teamsData = await fetch('teams.json').then(r => r.json()).then(d => d.teams);
    welshData = await fetch('welsh.json').then(r => r.json());
    cardiffData = await fetch('cardiff.json').then(r => r.json());

    populateDropdowns();
}

function populateDropdowns() {
    [welshTeamSelect, cardiffTeamSelect].forEach(select => {
        teamsData.forEach(team => {
            const opt = document.createElement('option');
            opt.value = team.name;
            opt.text = team.name;
            select.appendChild(opt);
        });
    });

    [welshDataSelect, cardiffDataSelect].forEach(select => {
        ["Team Stats", "Match History"].forEach(type => {
            const opt = document.createElement('option');
            opt.value = type;
            opt.text = type;
            select.appendChild(opt);
        });
    });
}

// Event listeners
welshTeamSelect.addEventListener('change', () => updateDisplay('Welsh'));
welshDataSelect.addEventListener('change', () => updateDisplay('Welsh'));
cardiffTeamSelect.addEventListener('change', () => updateDisplay('Cardiff'));
cardiffDataSelect.addEventListener('change', () => updateDisplay('Cardiff'));

// Display logic
function updateDisplay(cup) {
    const teamSelect = cup === 'Welsh' ? welshTeamSelect : cardiffTeamSelect;
    const dataSelect = cup === 'Welsh' ? welshDataSelect : cardiffDataSelect;
    const displayArea = cup === 'Welsh' ? welshDisplay : cardiffDisplay;
    const cupData = cup === 'Welsh' ? welshData : cardiffData;

    const teamName = teamSelect.value;
    const dataType = dataSelect.value;
    if (!teamName || !dataType) return;

    displayArea.innerHTML = '';

    const team = teamsData.find(t => t.name === teamName);
    if (!team) return;

    if (dataType === "Team Stats") {
        displayArea.innerHTML = `
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
        let html = `<h3>${cup} Cup - Match History</h3>`;
        cupData.rounds.forEach(round => {
            html += `<h4>Round ${round.round} (Deadline: ${round.deadline})</h4>`;
            html += `<table><tr><th>Home</th><th>H Score</th><th>A Score</th><th>Away</th><th>Winner</th><th>Date</th></tr>`;
            round.games.forEach(game => {
                if (game.home === teamName || game.away === teamName) {
                    html += `<tr>
                        <td>${game.home}</td>
                        <td>${game.h_score ?? ''}</td>
                        <td>${game.a_score ?? ''}</td>
                        <td>${game.away}</td>
                        <td>${game.winner ?? ''}</td>
                        <td>${game.date ?? ''}</td>
                    </tr>`;
                }
            });
            html += `</table>`;
        });
        displayArea.innerHTML = html;
    }
}

// Init
loadData();
