// ===== Browser Back Button Management =====
// This script prevents users from exiting the app when pressing the back button
// It automatically redirects to the dashboard instead

(function () {
    'use strict';

    // Push initial state when the script loads
    function initHistoryState() {
        // Only push if we don't have an app state yet
        if (!window.history.state || !window.history.state.isAppState) {
            window.history.pushState({
                isAppState: true,
                view: 'dashboard'
            }, '', window.location.href);
        }
    }

    // Handle back button presses
    window.addEventListener('popstate', function (event) {
        // If user tries to go back beyond the app
        if (!event.state || !event.state.isAppState) {
            // Push them back into the app
            window.history.pushState({
                isAppState: true,
                view: 'dashboard'
            }, '', window.location.href);

            // Show dashboard
            returnToDashboard();
        } else if (event.state.view !== 'dashboard') {
            // If they're in a section, go back to dashboard
            returnToDashboard();
        }
    });

    // Function to return to dashboard
    function returnToDashboard() {
        const mainContent = document.getElementById('main-content');
        const dashboardView = document.getElementById('dashboard-view');
        const sectionsContainer = document.getElementById('sections-container');

        if (mainContent) {
            mainContent.innerHTML = '';
        }

        if (sectionsContainer) {
            sectionsContainer.innerHTML = '';
        }

        if (dashboardView) {
            dashboardView.classList.remove('hidden');
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHistoryState);
    } else {
        initHistoryState();
    }

    // Also push state when navigating to sections
    // We'll intercept dashboard card clicks
    document.addEventListener('click', function (e) {
        const card = e.target.closest('.dashboard-card');
        if (card) {
            const section = card.dataset.section;
            if (section) {
                // Push a new state for this section
                window.history.pushState({
                    isAppState: true,
                    view: 'section',
                    section: section
                }, '', window.location.href);
            }
        }
    }, true); // Use capture phase to ensure we catch it first

})();
