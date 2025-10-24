// Load JSON bracket data
let welshBracketData = {};
let cardiffBracketData = {};

// Containers
const welshContainer = document.getElementById('welsh-bracket-container');
const cardiffContainer = document.getElementById('cardiff-bracket-container');

// Fetch data from JSON
async function loadBracketData() {
    welshBracketData = await fetch('welsh.json').then(res => res.json());
    cardiffBracketData = await fetch('cardiff.json').then(res => res.json());

    renderBracket('Welsh', welshBracketData, welshContainer);
    renderBracket('Cardiff', cardiffBracketData, cardiffContainer);
}

// Render bracket function
function renderBracket(cupName, data, container) {
    container.innerHTML = ''; // clear previous

    data.rounds.forEach(round => {
        const roundDiv = document.createElement('div');
        roundDiv.className = 'round';

        const roundTitle = document.createElement('h3');
        roundTitle.textContent = `Round ${round.round} - Deadline: ${round.deadline}`;
        roundDiv.appendChild(roundTitle);

        const gamesDiv = document.createElement('div');
        gamesDiv.className = 'games';

        round.games.forEach(game => {
            const gameDiv = document.createElement('div');
            gameDiv.className = 'game';

            gameDiv.innerHTML = `
                <span class="team ${game.winner === game.home ? 'winner' : ''}">${game.home}</span>
                <span class="score">${game.h_score !== undefined ? game.h_score : '-'}</span>
                -
                <span class="score">${game.a_score !== undefined ? game.a_score : '-'}</span>
                <span class="team ${game.winner === game.away ? 'winner' : ''}">${game.away}</span>
            `;

            gamesDiv.appendChild(gameDiv);
        });

        roundDiv.appendChild(gamesDiv);
        container.appendChild(roundDiv);
    });
}

// Initialize
loadBracketData();