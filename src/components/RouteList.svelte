<script>
    import { onMount } from "svelte";

    /**
     * @typedef {{ description: string, type: string, required: boolean }} RouteInput
    */

    /**
     * JSON representation of the documentation
     * @type {Array<
     * {
     * method: string,
     * route: string,
     * meta: {
        description: string;
        body: Record<string, { description: string, type: string, required: boolean, example?: string }> | null;
        query: Record<string, { description: string, type: string, required: boolean, example?: string }> | null;
        authorization: 'None' | 'Guild' | 'Locked' | 'User' | 'CI' | 'Dashboard';
        returns: Record<number, { type: string, example: string | null }[]> | null;
        comment: string | null;
      }
     * }
     * >}
     */
    let docs = [];
    
    let loading = true;
    let error = null;

    // Fetch and transform docs on component mount
    onMount(async () => {
        try {
            const res = await fetch('https://cdn.jsdelivr.net/gh/DaalBot/API/docs.json');
            let fetchedDocs = await res.json();
            
            // Transform docs to use "Dashboard" auth type for None routes that start with /dashboard/
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

    /**
     * Format: "[METHOD]:[ROUTE]"
     * @type {string[]}
     */
    let expandedRoutes = [];

    let expandedLast = 0;

    /**
     * Active filters - all auth types except Locked & CI
     * @type {string[]}
     */
    let activeFilters = ['None', 'Guild', 'User', 'Dashboard'];

    /**
     * All available auth types
     * @type {string[]}
     */
    const availableAuthTypes = ['None', 'Guild', 'Locked', 'User', 'CI', 'Dashboard'];

    /**
     * @type {{ [key: string]: string }}
     */
    const methodVarient = {
        GET: 'primary',
        POST: 'success',
        PUT: 'warning',
        DELETE: 'danger'
    };

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

    /**
     * Toggle a filter on or off
     * @param {string} authType
     */
    function toggleFilter(authType) {
        if (activeFilters.includes(authType)) {
            activeFilters = activeFilters.filter(f => f !== authType);
        } else {
            activeFilters = [...activeFilters, authType];
        }
    }

    /**
     * Get filtered routes based on active filters
     */
    $: filteredDocs = docs.filter(route => activeFilters.includes(route.meta.authorization));
</script>

<div class="route-list">
    {#if loading}
        <div class="loading-state">
            <p>Loading API documentation...</p>
        </div>
    {:else if error}
        <div class="error-state">
            <p>Error loading documentation: {error}</p>
        </div>
    {:else}
        <div class="filters">
            <h3>Filter by Authorization Type:</h3>
            <div class="filter-buttons">
                {#each availableAuthTypes as authType (authType)}
                    <button
                        class="filter-button {activeFilters.includes(authType) ? 'active' : ''}"
                        on:click={() => toggleFilter(authType)}
                        title={getAuthorizationTooltip(authType)}
                    >
                        {authType}
                    </button>
                {/each}
            </div>
        </div>
        {#each filteredDocs as route}
        <div class="card">
            <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
            <div class="card-header" on:click={() => {
                if (expandedLast - Date.now() > 500) return;
                if (expandedRoutes.includes(route.method.toUpperCase() + ':' + route.route)) {
                    expandedRoutes = expandedRoutes.filter(r => r !== route.method.toUpperCase() + ':' + route.route);
                } else {
                    expandedRoutes.push(route.method.toUpperCase() + ':' + route.route);

                    expandedRoutes = JSON.parse(JSON.stringify(expandedRoutes)); // Force Svelte to re-render the component
                }
                expandedLast = Date.now();
            }}>
                <div class="card-title">
                    <span class="method-tag {route.method.toUpperCase()}">{route.method.toUpperCase()}</span>
                    <a href="https://github.com/DaalBot/API/blob/master/src/routes/{route.route.includes('/dashboard') ? 'dashboard/' : ''}{route.method}{route.route.replace('dashboard/', '')}.ts" target="_blank">
                        <b>
                            <code>{route.route}</code>
                        </b>
                    </a>
                    <p style="font-size: 0.9rem; color: var(--sl-color-text);">
                        {route.meta.description}
                    </p>
                </div>
                <div class="card-extra">
                    <sl-visually-hidden>
                        <button>
                            Click to {expandedRoutes.includes(route.method.toUpperCase() + ':' + route.route) ? 'collapse' : 'expand'} the route
                        </button>
                    </sl-visually-hidden>
                    <span class="auth-tag" title={getAuthorizationTooltip(route.meta.authorization)}>
                        Authorization: {route.meta.authorization}
                    </span>
                </div>
            </div>
            <div class="card-contents" class:expanded={expandedRoutes.includes(route.method.toUpperCase() + ':' + route.route)}>
                Description: {route.meta.description}<br/>
                {#if route.route.startsWith('/dashboard') && route.method != 'get'}
                    Comment (Logged when route is called): {route.meta.comment}
                {/if}
                <div class="card-body">
                    <h3>Body</h3>
                    {#if route.meta.body}
                        <table class="param-table">
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
                                            <td>
                                                <code>{key}</code>
                                            </td>
                                            <td>
                                                {value.description}
                                            </td>
                                            <td>
                                                {value.type}
                                            </td>
                                            <td>
                                                {value.required ? 'Yes' : 'No'}
                                            </td>
                                            <td>
                                                {#if value.example}
                                                    <code>{value.example}</code>
                                                {:else}
                                                    No example
                                                {/if}
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                    {:else}
                        <p>No body required</p>
                    {/if}
                    <h3>Query</h3>
                    {#if route.meta.query}
                        <table class="param-table">
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
                                        <td>
                                            <code>{key}</code>
                                        </td>
                                        <td>
                                            {value.description}
                                        </td>
                                        <td>
                                            {value.type}
                                        </td>
                                        <td>
                                            {value.required ? 'Yes' : 'No'}
                                        </td>
                                        <td>
                                            {#if value.example}
                                                <code>{value.example}</code>
                                            {:else}
                                                No example
                                            {/if}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    {:else}
                        <p>No query required</p>
                    {/if}
                    
                    <h3>
                        Returns
                    </h3>
                    {#if Object.entries(route.meta.returns ?? {}).length > 0}
                        <table class="param-table">
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
                                            <td><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/{key}"><code>{key}</code></a></td>
                                            <td>{v.type}</td>
                                            <td>{v.description ? v.description : 'No description'}</td>
                                            <td>{v.example ? v.example : 'No example'}</td>
                                        </tr>
                                    {/each}
                                {/each}
                            </tbody>
                        </table>
                    {:else}
                        <p>This route doesn't have documentation for the return type yet, Want to help fix this? Open a PR for the file found by clicking the underlined route above!</p>
                    {/if}
                </div>
            </div>
        </div>
        {/each}
    {/if}
</div>

<style>
    .method-tag {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.4rem 0.8rem;
        border-radius: 999px;
        font-weight: 600;
        font-size: 0.85rem;
        white-space: nowrap;
        min-width: 60px;
        color: white;
    }

    .method-tag.GET {
        background-color: #4a90e2;
    }

    .method-tag.POST {
        background-color: #2ecc71;
    }

    .method-tag.PUT {
        background-color: #f39c12;
    }

    .method-tag.DELETE {
        background-color: #e74c3c;
    }

    .auth-tag {
        display: inline-flex;
        align-items: center;
        padding: 0.4rem 0.8rem;
        border-radius: 999px;
        font-weight: 600;
        font-size: 0.85rem;
        background-color: #3498db;
        color: white;
        white-space: nowrap;
        cursor: help;
    }

    .card {
        padding: 1rem;
        border-radius: 0.5rem;
        background-color: var(--sl-color-bg-nav);
        border: 1px solid var(--sl-color-hairline-shade);
        margin-bottom: 1rem;
        transition: all 0.3s ease;
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        cursor: pointer;
        gap: 1rem;
    }

    .card-header:hover {
        opacity: 0.9;
    }

    @media (max-width: 1600px) {
        .card-header {
            flex-direction: column;
            gap: 0.5rem;
        }

        code {
            white-space: normal;
        }
    }

    .card-title {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex: 1;
        flex-wrap: wrap;
    }

    .card-title p {
        margin: 0;
        font-size: 0.9rem;
    }

    .card-extra {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .card:hover {
        transition: background-color border 0.25s;
        border: 1px solid var(--sl-color-hairline);
    }

    /* Hate that starlight doesn't have a native hover colour */
    :global([data-theme="dark"]) .card:hover {
        background-color: #272a38 !important;
    }

    :global([data-theme="light"]) .card:hover {
        background-color: #f9f9f9;
    }

    .route-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .card-contents {
        display: none;
        padding: 1.5rem;
        border-top: 1px solid var(--sl-color-hairline-shade);
        margin-top: 1rem;
        color: var(--sl-color-text);
    }

    .card-contents.expanded {
        display: block;
    }

    .card-body {
        margin-top: 1.5rem;
    }

    .card-body h3 {
        font-size: 1.1rem;
        margin-top: 1.5rem;
        margin-bottom: 0.75rem;
    }

    .card-body h3:first-child {
        margin-top: 0;
    }

    .param-table {
        width: 100%;
        max-width: 100%;
        border-collapse: collapse;
        background-color: var(--sl-color-bg-panel);
        border: 1px solid #3a3a3a;
        border-radius: 0.3rem;
        margin-bottom: 1rem;
        display: table;
        table-layout: fixed;
        overflow-wrap: break-word;
        word-wrap: break-word;
    }

    .param-table thead {
        width: 100%;
    }

    .param-table tbody {
        width: 100%;
    }

    .param-table tr {
        width: 100%;
    }

    th {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 2px solid #3a3a3a;
        background-color: var(--sl-color-bg-nav);
        font-weight: 600;
        color: var(--sl-color-text);
        overflow-wrap: break-word;
        word-wrap: break-word;
    }

    td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #3a3a3a;
        color: var(--sl-color-text);
        overflow-wrap: break-word;
        word-wrap: break-word;
        max-width: 0;
    }

    td code {
        background-color: var(--sl-color-bg-inline-code);
        padding: 0.2rem 0.4rem;
        border-radius: 0.2rem;
    }

    .filters {
        margin-bottom: 2rem;
        padding: 1.5rem;
        background-color: var(--sl-color-bg-nav);
        border-radius: 0.5rem;
        border: 1px solid var(--sl-color-hairline-shade);
    }

    .filters h3 {
        margin-top: 0;
        margin-bottom: 1rem;
        font-size: 1.1rem;
        color: var(--sl-color-text);
    }

    .filter-buttons {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-start;
        align-content: center;
        gap: 0.75rem;
    }

    .filter-button {
        padding: 0.4rem 1rem;
        border: 2px solid #3a3a3a;
        background-color: #1f1f1f;
        color: #e0e0e0;     
        border-radius: 999px;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 90px;
        text-align: center;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        height: 36px;
        box-sizing: border-box;
        margin: 0;
        vertical-align: middle;
    }

    .filter-button:hover {
        border-color: #4a9eff;
        color: #4a9eff;
    }

    .filter-button.active {
        background-color: #4a9eff;
        border-color: #4a9eff;
        color: white;
    }

    .filter-button:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.3);
    }

    .loading-state, .error-state {
        padding: 2rem;
        text-align: center;
        background-color: #2a2a2a;
        border-radius: 0.5rem;
        border: 1px solid #3a3a3a;
    }

    .error-state {
        border-color: #e74c3c;
        color: #e74c3c;
    }

    .loading-state p, .error-state p {
        margin: 0;
        font-size: 1.1rem;
    }
</style>
