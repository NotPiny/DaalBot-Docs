<script>
    import { onMount } from "svelte";

    /** @type {any[]}
     */
    let docs = [];
    
    let loading = true;
    let error = null;

    onMount(async () => {
        try {
            const res = await fetch('https://cdn.jsdelivr.net/gh/DaalBot/API/docs.json');
            let fetchedDocs = await res.json();
            
            // Routes starting with /dashboard/ use "Dashboard" auth instead of "None"
            docs = fetchedDocs.map(doc => {
                if (doc.meta.authorization === 'None' && doc.route.startsWith('/dashboard/')) {
                    return {
                        ...doc,
                        meta: {
                            ...doc.meta,
                            authorization: 'Dashboard'
                        }
                    };
                }
                return doc;
            });
            
            loading = false;
        } catch (err) {
            error = err.message;
            loading = false;
        }
    });

    // expanded route keys use "[METHOD]:[ROUTE]" format
    let expandedRoutes = [];
    let expandedLast = 0;

    let activeFilters = ['None', 'Guild', 'User', 'Dashboard'];
    const availableAuthTypes = ['None', 'Guild', 'Locked', 'User', 'CI', 'Dashboard'];

    function getAuthorizationTooltip(authorization) {
        switch (authorization) {
            case "User":
                return 'This route requires an authorization header with a discord OAuth2 token ("User <token>")';
            case "Guild":
                return 'This route requires an authorization header with a guild key (you still need to provide a guild ID query, "Guild <key>")';
            case "Locked":
                return 'This route is only intended to be called by the bot itself, you cannot use this route';
            case "CI":
                return 'This route is used for CI/CD and can only be triggered by pushing to the master branch of the API repository';
            case "None":
                return 'This route does not require additional authorization. If you see this on a dashboard route, it means that you can use any kind of dashboard token';
            case "Dashboard":
                return 'This route is for dashboard use and does not require additional authorization (See "Using Dashboard Routes" above for more information)';
            default:
                return 'Something went wrong, we could not find the description for this authorization type';
        }
    }

    function toggleRoute(method, route) {
        const routeKey = method.toUpperCase() + ':' + route;
        if (expandedRoutes.includes(routeKey)) {
            expandedRoutes = expandedRoutes.filter(r => r !== routeKey);
        } else {
            expandedRoutes = [...expandedRoutes, routeKey];
        }
    }

    function handleHeaderKeyDown(event, method, route) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleRoute(method, route);
        }
    }

    function toggleFilter(authType) {
        if (activeFilters.includes(authType)) {
            activeFilters = activeFilters.filter(f => f !== authType);
        } else {
            activeFilters = [...activeFilters, authType];
        }
    }

    $: filteredDocs = docs.filter(route => activeFilters.includes(route.meta.authorization));
</script>

<div class="route-list">
    {#if loading}
        <div class="loading-state">
            <span class="spinner"></span>
            <p>Loading API documentation...</p>
        </div>
    {:else if error}
        <div class="error-state">
            <p>Error loading documentation: {error}</p>
        </div>
    {:else}
        <div class="filters">
            <h3>Filter by Authorization Type</h3>
            <div class="filter-buttons">
                {#each availableAuthTypes as authType (authType)}
                    <button
                        class="filter-button"
                        class:active={activeFilters.includes(authType)}
                        on:click={() => toggleFilter(authType)}
                        title={getAuthorizationTooltip(authType)}
                    >
                        {#if activeFilters.includes(authType)}
                            <svg class="chip-icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                        {/if}
                        {authType}
                    </button>
                {/each}
            </div>
        </div>
        
        {#each filteredDocs as route}
        <div class="card" class:expanded={expandedRoutes.includes(route.method.toUpperCase() + ':' + route.route)}>
            <div 
                class="card-header" 
                role="button" 
                tabindex="0"
                aria-expanded={expandedRoutes.includes(route.method.toUpperCase() + ':' + route.route)}
                on:click={() => {
                    if (expandedLast - Date.now() > 500) return;
                    toggleRoute(route.method, route.route);
                    expandedLast = Date.now();
                }}
                on:keydown={(e) => handleHeaderKeyDown(e, route.method, route.route)}
            >
                <div class="card-title">
                    <span class="method-tag {route.method.toUpperCase()}">{route.method.toUpperCase()}</span>
                    <a class="route-link" href="https://github.com/DaalBot/API/blob/master/src/routes/{route.route.includes('/dashboard') ? 'dashboard/' : ''}{route.method}{route.route.replace('dashboard/', '')}.ts" target="_blank" on:click|stopPropagation>
                        <code>{route.route}</code>
                    </a>
                    <p class="route-desc">{route.meta.description}</p>
                </div>
                <div class="card-extra">
                    <span class="auth-tag {route.meta.authorization.toUpperCase()}" title={getAuthorizationTooltip(route.meta.authorization)}>
                        {route.meta.authorization}
                    </span>
                    <div class="expand-arrow-wrapper">
                        <svg class="expand-arrow" viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
                    </div>
                </div>
            </div>
            
            <div class="card-contents" class:expanded={expandedRoutes.includes(route.method.toUpperCase() + ':' + route.route)}>
                {#if route.meta.comment || (route.route.startsWith('/dashboard') && route.method != 'get')}
                    <div class="comment-banner">
                        <svg viewBox="0 0 24 24" class="banner-icon"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z"/></svg>
                        <span>Logged execution comment: <code>{route.meta.comment || 'No contextual telemetry logged'}</code></span>
                    </div>
                {/if}
                
                <div class="card-body">
                    {#if route.meta.body}
                        <div class="table-section">
                            <h3>Body Parameters</h3>
                            <div class="table-scroll-wrapper">
                                <table class="param-table">
                                    <colgroup>
                                        <col style="width: 16%">
                                        <col style="width: 36%">
                                        <col style="width: 14%">
                                        <col style="width: 14%">
                                        <col style="width: 20%">
                                    </colgroup>
                                    <thead>
                                        <tr>
                                            <th>Parameter</th>
                                            <th>Description</th>
                                            <th>Type</th>
                                            <th>Required</th>
                                            <th>Example</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {#each Object.entries(route.meta.body) as [key, value]}
                                            <tr>
                                                <td><code class="param-name">{key}</code></td>
                                                <td>{value.description}</td>
                                                <td><span class="type-pill">{value.type}</span></td>
                                                <td>
                                                    <span class="req-badge" class:required={value.required}>
                                                        {value.required ? '🗸' : '✗'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {#if value.example}
                                                        <code class="example-code">{value.example}</code>
                                                    {:else}
                                                        <span class="muted-text">None</span>
                                                    {/if}
                                                </td>
                                            </tr>
                                        {/each}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    {/if}
                    
                    {#if route.meta.query}
                        <div class="table-section">
                            <h3>Query Parameters</h3>
                            <div class="table-scroll-wrapper">
                                <table class="param-table">
                                    <colgroup>
                                        <col style="width: 16%">
                                        <col style="width: 36%">
                                        <col style="width: 14%">
                                        <col style="width: 14%">
                                        <col style="width: 20%">
                                    </colgroup>
                                    <thead>
                                        <tr>
                                            <th>Parameter</th>
                                            <th>Description</th>
                                            <th>Type</th>
                                            <th>Required</th>
                                            <th>Example</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {#each Object.entries(route.meta.query) as [key, value]}
                                            <tr>
                                                <td><code class="param-name">{key}</code></td>
                                                <td>{value.description}</td>
                                                <td><span class="type-pill">{value.type}</span></td>
                                                <td>
                                                    <span class="req-badge" class:required={value.required}>
                                                        {value.required ? '🗸' : '✗'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {#if value.example}
                                                        <code class="example-code">{value.example}</code>
                                                    {:else}
                                                        <span class="muted-text">None</span>
                                                    {/if}
                                                </td>
                                            </tr>
                                        {/each}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    {/if}
                    
                    <div class="table-section">
                        <h3>Response Schema</h3>
                        {#if Object.entries(route.meta.returns ?? {}).length > 0}
                            <div class="table-scroll-wrapper">
                                <table class="param-table">
                                    <colgroup>
                                        <col style="width: 12%">
                                        <col style="width: 24%">
                                        <col style="width: 44%">
                                        <col style="width: 20%">
                                    </colgroup>
                                    <thead>
                                        <tr>
                                            <th>Code</th>
                                            <th>Type</th>
                                            <th>Description</th>
                                            <th>Example</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {#each Object.entries(route.meta.returns ?? {}) as [key, value]}
                                            {#each value as v}
                                                <tr>
                                                    <td>
                                                        <a class="status-link code-{key.startsWith('2') ? 'success' : key.startsWith('3') ? 'redirect' : 'error'}" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/{key}" on:click|stopPropagation>
                                                            <code>{key}</code>
                                                        </a>
                                                    </td>
                                                    <td><span class="type-pill">{v.type}</span></td>
                                                    <td>{v.description ? v.description : 'No descriptive payload document.'}</td>
                                                    <td>
                                                        {#if v.example}
                                                            <code class="example-code">{v.example}</code>
                                                        {:else}
                                                            <span class="muted-text">None</span>
                                                        {/if}
                                                    </td>
                                                </tr>
                                            {/each}
                                        {/each}
                                    </tbody>
                                </table>
                            </div>
                        {:else}
                            <div class="empty-returns-banner">
                                <p>This route doesn't have documentation for the return type yet. Want to help fix this? Open a PR for the file found by clicking the underlined route above!</p>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
        {/each}
    {/if}
</div>

<style>
    .route-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        font-family: var(--sl-font, system-ui, sans-serif);
    }

    code {
        font-family: var(--sl-font-mono, monospace) !important;
        font-size: 0.9em;
    }

    .filters {
        margin-bottom: 12px;
        padding: 20px;
        background-color: var(--md-sys-color-surface-container, var(--sl-color-bg-nav));
        border-radius: 24px; 
        border: 1px solid var(--md-sys-color-outline-variant, var(--sl-color-gray-4));
    }

    .filters h3 {
        margin-top: 0;
        margin-bottom: 16px;
        font-size: 0.875rem;
        font-weight: 500;
        letter-spacing: 0.1px;
        color: var(--md-sys-color-on-surface-variant, var(--sl-color-text));
        text-transform: uppercase;
    }

    .filter-buttons {
        display: flex !important;
        flex-wrap: wrap !important;
        align-items: center !important;     
        justify-content: flex-start !important;
        gap: 0.75rem !important;
        font-size: 0 !important;
        line-height: 0 !important;
    }

    .filter-button {
        display: inline-flex !important;
        align-items: center !important;     
        justify-content: center !important;
        gap: 8px;
        height: 32px !important;            
        padding-inline: 16px !important;
        background-color: transparent;
        color: var(--md-sys-color-on-surface-variant, var(--sl-color-text));
        border: 1px solid var(--md-sys-color-outline, var(--sl-color-gray-3));
        border-radius: 8px;
        font-size: 0.875rem !important;
        font-weight: 500 !important;
        line-height: 1 !important;          
        cursor: pointer;
        box-sizing: border-box !important;
        margin: 0 !important;
        transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
    }

    .filter-button.active {
        padding-inline: 12px 16px !important; 
        background-color: var(--md-sys-color-secondary-container, var(--sl-color-accent-low)) !important;
        color: var(--md-sys-color-on-secondary-container, var(--sl-color-white)) !important;
        border-color: transparent !important;
    }

    .filter-button:hover {
        background-color: rgba(var(--sl-color-gray-2), 0.08);
    }
    
    .filter-button.active:hover {
        box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.3);
    }

    .filter-button:active {
        transform: scale(0.97); 
    }

    .chip-icon {
        width: 18px !important;
        height: 18px !important;
        fill: currentColor !important;
        display: block !important;          
        flex-shrink: 0 !important;
        margin: 0 !important;
    }

    .card {
        border-radius: 16px !important; 
        background-color: var(--md-sys-color-surface-container-low, var(--sl-color-bg-sidebar)) !important;
        border: 1px solid var(--md-sys-color-outline-variant, var(--sl-color-gray-4)) !important;
        margin-bottom: 0;
        overflow: hidden;
        transition: all 0.25s cubic-bezier(0.2, 0, 0, 1);
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        cursor: pointer;
        gap: 16px;
        user-select: none;
        outline: none;
    }
    
    .card-header:focus-visible {
        box-shadow: inset 0 0 0 2px var(--md-sys-color-primary, var(--sl-color-accent));
    }

    .card:hover {
        background-color: var(--md-sys-color-surface-container, var(--sl-color-bg-nav)) !important;
        border-color: var(--md-sys-color-outline, var(--sl-color-gray-3)) !important;
        box-shadow: 0px 1px 3px 1px rgba(0, 0, 0, 0.15);
    }

    .card.expanded {
        border-radius: 24px !important; 
        background-color: var(--md-sys-color-surface-container-high, var(--sl-color-bg-nav)) !important;
        box-shadow: 0px 2px 6px 2px rgba(0, 0, 0, 0.15);
    }

    .card-title {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
        flex-wrap: wrap;
    }

    .route-link {
        text-decoration: none;
    }
    .route-link code {
        color: var(--md-sys-color-on-surface, var(--sl-color-white)) !important;
        font-size: 1.15rem;
        font-weight: 700;
        background: transparent !important;
        padding: 0 !important;
    }
    .route-link:hover code {
        color: var(--md-sys-color-primary, var(--sl-color-accent)) !important;
        text-decoration: underline;
    }

    .route-desc {
        margin: 0;
        font-size: 0.925rem;
        color: var(--md-sys-color-on-surface-variant, var(--sl-color-text));
        flex-basis: 100%; 
        padding-left: 4px;
        margin-top: 4px;
        text-align: left;
    }

    .card-extra {
        display: flex;
        gap: 12px;
        align-items: center;
    }

    .expand-arrow-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 9999px;
        transition: background-color 0.2s;
    }
    .card-header:hover .expand-arrow-wrapper {
        background-color: rgba(var(--sl-color-gray-1), 0.08);
    }
    .expand-arrow {
        width: 24px;
        height: 24px;
        fill: var(--md-sys-color-on-surface-variant, var(--sl-color-text));
        transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1);
    }
    .card.expanded .expand-arrow {
        transform: rotate(180deg);
    }

    @media (max-width: 50rem) {
        .card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
        }
        .card-extra {
            width: 100%;
            justify-content: space-between;
            border-top: 1px solid var(--md-sys-color-outline-variant, var(--sl-color-gray-4));
            padding-top: 12px;
        }
    }

    .method-tag, .auth-tag {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 24px;
        padding-inline: 12px;
        border-radius: 9999px; 
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        white-space: nowrap;
    }

    .method-tag.GET {
        background-color: var(--md-sys-color-primary-container, var(--sl-color-accent-low)) !important;
        color: var(--md-sys-color-on-primary-container, var(--sl-color-white)) !important;
    }
    .method-tag.POST {
        background-color: var(--md-sys-color-success-container, #d1e7dd) !important;
        color: var(--md-sys-color-on-success-container, #0f5132) !important;
    }
    .method-tag.PUT {
        background-color: var(--md-sys-color-tertiary-container, #fff3cd) !important;
        color: var(--md-sys-color-on-tertiary-container, #664d03) !important;
    }
    .method-tag.DELETE {
        background-color: var(--md-sys-color-error-container, #f8d7da) !important;
        color: var(--md-sys-color-on-error-container, #842029) !important;
    }

    .auth-tag {
        background-color: var(--md-sys-color-surface-variant, var(--sl-color-gray-4)) !important;
        color: var(--md-sys-color-on-surface-variant, var(--sl-color-text)) !important;
        border: 1px solid var(--md-sys-color-outline, var(--sl-color-gray-3));
    }
    .auth-tag.NONE {
        background-color: var(--md-sys-color-surface-container-highest, var(--sl-color-gray-5)) !important;
    }
    .auth-tag.LOCKED, .auth-tag.CI {
        background-color: var(--md-sys-color-error-container, #f8d7da) !important;
        color: var(--md-sys-color-on-error-container, #842029) !important;
    }
    .auth-tag.USER, .auth-tag.GUILD, .auth-tag.DASHBOARD {
        background-color: var(--md-sys-color-secondary-container, var(--sl-color-accent-low)) !important;
        color: var(--md-sys-color-on-secondary-container, var(--sl-color-white)) !important;
    }

    .card-contents {
        display: none;
        padding: 24px;
        border-top: 1px solid var(--md-sys-color-outline-variant, var(--sl-color-gray-4));
        background-color: var(--md-sys-color-surface-container-lowest, var(--sl-color-bg)) !important;
    }

    .card-contents.expanded {
        display: block;
    }

    .comment-banner {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background-color: var(--md-sys-color-surface-container-high, var(--sl-color-gray-5));
        border-radius: 12px;
        font-size: 0.9rem;
        margin-bottom: 20px;
        border: 1px solid var(--md-sys-color-outline-variant, var(--sl-color-gray-4));
        text-align: left;
    }
    .banner-icon {
        width: 20px;
        height: 20px;
        fill: var(--md-sys-color-primary, var(--sl-color-accent));
        flex-shrink: 0;
    }

    .table-section {
        margin-bottom: 24px;
    }
    .table-section:last-child {
        margin-bottom: 0;
    }

    .card-body h3 {
        font-size: 1rem;
        font-weight: 500;
        margin-top: 0;
        margin-bottom: 12px;
        color: var(--md-sys-color-primary, var(--sl-color-accent));
        letter-spacing: 0.15px;
        text-align: left;
    }

    /* overrides Starlight's global table width defaults */
    .route-list .card .table-section,
    .route-list .card .table-scroll-wrapper,
    .route-list .card .param-table {
        width: 100% !important;
        min-width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
    }

    .route-list .card .table-scroll-wrapper {
        display: block !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
        border-radius: 12px !important;
        border: 1px solid var(--md-sys-color-outline-variant, var(--sl-color-gray-4)) !important;
    }

    .route-list .card .table-scroll-wrapper .param-table {
        display: table !important;
        border-collapse: collapse !important;
        background-color: var(--md-sys-color-surface-container-low, var(--sl-color-bg-sidebar)) !important;
        text-align: left !important;
        font-size: 0.9rem !important;
        table-layout: fixed !important; /* required for overflow-wrap to work correctly */
        margin: 0 !important;
    }

    th {
        padding: 12px 16px;
        background-color: var(--md-sys-color-surface-container, var(--sl-color-bg-nav));
        font-weight: 500;
        color: var(--md-sys-color-on-surface, var(--sl-color-white));
        border-bottom: 1px solid var(--md-sys-color-outline, var(--sl-color-gray-3));
        font-size: 0.85rem;
    }

    td {
        padding: 14px 16px;
        border-bottom: 1px solid var(--md-sys-color-outline-variant, var(--sl-color-gray-4));
        color: var(--md-sys-color-on-surface-variant, var(--sl-color-text));
        vertical-align: middle;
        overflow-wrap: break-word;
        word-wrap: break-word;
        max-width: 0; /* required for overflow-wrap with table-layout: fixed */
    }
    
    tr:last-child td {
        border-bottom: none; 
    }

    .param-name {
        font-weight: 700;
        color: var(--md-sys-color-on-surface, var(--sl-color-white)) !important;
        background-color: transparent !important;
        padding: 0 !important;
    }

    .type-pill {
        display: inline-flex;
        padding: 2px 8px;
        background-color: var(--md-sys-color-surface-container-highest, var(--sl-color-gray-5));
        color: var(--md-sys-color-on-surface-variant, var(--sl-color-text));
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 500;
        white-space: normal;
        word-break: break-word;
    }

    .req-badge {
        text-align: center;

        font-size: 1.5rem;
        font-weight: 500;
        color: var(--md-sys-color-error, #dc3545);
    }
    .req-badge.required {
        color: var(--md-sys-color-success-container, #00ad5f);
        font-weight: 600;
    }

    .example-code {
        background-color: var(--md-sys-color-surface-container, var(--sl-color-bg-nav)) !important;
        color: var(--md-sys-color-secondary, var(--sl-color-text)) !important;
        padding: 4px 8px !important;
        border-radius: 6px !important;
        border: 1px solid var(--md-sys-color-outline-variant, var(--sl-color-gray-4));
    }

    .muted-text {
        color: var(--md-sys-color-outline, var(--sl-color-gray-2));
        font-size: 0.85rem;
        font-style: italic;
    }

    .status-link {
        text-decoration: none;
    }
    .status-link code {
        display: inline-flex;
        padding: 2px 8px;
        border-radius: 6px;
        font-weight: 700;
        transition: filter 0.2s;
    }
    .status-link:hover code {
        filter: brightness(1.1);
    }
    .status-link.code-success code { background-color: rgba(46, 204, 113, 0.15); color: #2ecc71 !important; }
    .status-link.code-redirect code { background-color: rgba(243, 156, 18, 0.15); color: #f39c12 !important; }
    .status-link.code-error code { background-color: rgba(231, 76, 60, 0.15); color: #e74c3c !important; }

    .empty-returns-banner {
        padding: 16px;
        background-color: var(--md-sys-color-surface-container-low, var(--sl-color-bg-sidebar));
        border-radius: 12px;
        border: 1px dashed var(--md-sys-color-outline, var(--sl-color-gray-3));
        font-size: 0.9rem;
        color: var(--md-sys-color-on-surface-variant, var(--sl-color-text));
        text-align: left;
    }

    .loading-state, .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        padding: 40px;
        background-color: var(--md-sys-color-surface-container-low, var(--sl-color-bg-sidebar));
        border-radius: 24px;
        border: 1px solid var(--md-sys-color-outline-variant, var(--sl-color-gray-4));
        text-align: center;
    }

    .error-state {
        border-color: var(--md-sys-color-error, #e74c3c);
        color: var(--md-sys-color-error, #e74c3c);
    }

    .spinner {
        width: 28px;
        height: 28px;
        border: 3px solid var(--md-sys-color-surface-container-highest, var(--sl-color-gray-5));
        border-top-color: var(--md-sys-color-primary, var(--sl-color-accent));
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
</style>