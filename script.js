// file contains code for results webpage for now

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-input');
    const searchButton = document.querySelector('.search-button');
    const searchPage = document.querySelector('.search-page');
    const resultsPage = document.querySelector('.results-page');
    
    // Search on button click
    searchButton.addEventListener('click', function() {
        performSearch();
    });
    
    // Search on Enter key
    searchInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });
    
    function performSearch() {
        const searchTerm = searchInput.value.trim();
        
        if (searchTerm) {
            // Clear the search page
            searchPage.classList.add('hidden');
            
            // Show the results page
            resultsPage.classList.remove('hidden');
            
            // Optional: Show what was searched
            // document.querySelector('.result-text').textContent = `Result: "${searchTerm}"`;
        } else {
            // Shake animation for empty input
            searchInput.style.animation = 'shake 0.5s';
            setTimeout(() => {
                searchInput.style.animation = '';
            }, 500);
        }
    }
    
    // Optional: Add shake animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);
});