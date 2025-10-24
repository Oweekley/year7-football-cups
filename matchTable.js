// JSON Data
let welshData = {};
let cardiffData = {};
let friendliesData = {};

// DOM Elements
const competitionSelect = document.getElementById('competition-select');
const matchesDisplay = document.getElementById('matches-display');

// Load JSON data
async function loadMatchData() {
    welshData = await fetch('data/welsh.json').then(res => res.json());
    cardiffData = await fetch('data/cardiff.json').then(res => res.json());
    friendliesData = await fetch('data/friendlies.json').then(res => res.json());
}

// Render matches
function renderMatches() {
    const competition = competitionSelect.value;
    matchesDisplay.innerHTML = '';
    if (!competition) return;

    let data = competition === 'Welsh' ? welshData : competition === 'Cardiff' ? cardiffData : friendliesData;

    let html = `<h2>${competition} Matches</h2>`;

    if (competition !== 'Friendlies') {
        data.rounds?.forEach(round => {
            html += `<h3>Round ${round.round} - Deadline: ${round.deadline || '-'}</h3>`;
            html += `<table>
                <tr>
                    <th>Home</th><th>H Score</th><th>A Score</th><th>Away</th><th>Winner</th><th>Date</th><th>Notes</th>
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
        // Friendlies may not have rounds
        html += `<table>
            <tr>
                <th>Home</th><th>H Score</th><th>A Score</th><th>Away</th><th>Winner</th><th>Date</th><th>Notes</th>
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

// Event listener
competitionSelect.addEventListener('change', renderMatches);

// Initialize
loadMatchData();// JavaScript Document